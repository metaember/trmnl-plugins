import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { setTimeout as sleep } from "node:timers/promises";
import { createFeed, manifest } from "../lib/feed.js";
import { generationCache } from "../lib/generation-cache.js";

const publicUrl = "https://weather.example/";
const time = new Date("2026-11-12T20:00:00Z");
const now = () => time;

test("built-in artwork and sample weather need no provider key", async () => {
  const feed = createFeed({ publicUrl, now, generation: { get: () => assert.fail("Generated without opt-in") } });
  const { weather_window: defaults } = await feed();
  assert.ok(manifest.some(scene => scene.name === defaults.scene.name && scene.collection === "Quiet views"));
  assert.deepEqual((await feed({ collection: "Quiet views", landscape: "@newer" })).weather_window.scene, defaults.scene);
  assert.equal(defaults.weather.label, "Snow");
  assert.match(defaults.status, /Set a location/);
  assert.equal(defaults.frame, "none");
  assert.equal(defaults.finish, "dark");
  assert.equal(defaults.footer, "current");
  assert.equal((await feed({ landscape: "night-market", frame: "picture" })).weather_window.scene.name, "Night Market");

  const settings = { collection: "Cyberpunk", landscape: "night-market", weather: "drizzle",
    footer: "weekly", frame: "none", temperature_unit: "C", wind_unit: "km/h" };
  const { weather_window: scene } = await feed(settings, "unused-key");
  assert.equal(scene.scene.src, "https://weather.example/scenes/night-market-v3.webp");
  assert.equal(scene.overlay.effect, "drizzle");
  assert.equal(scene.overlay.skyX, null);
  assert.equal(scene.overlay.nightLit, true);
  assert.equal(scene.weather.temperature, "11°C");
  assert.equal(scene.weather.week[0].condition, "Drizzle");
  assert.equal(scene.weather.week.length, 7);
  assert.equal(scene.frame, "none");
  assert.equal(scene.footer, "weekly");
  assert.ok(JSON.stringify(scene).length < 5000);
  assert.ok(manifest.length >= 40);
});

test("native coordinate picker drives live weather and supports keyless fallback", async t => {
  t.mock.method(globalThis, "fetch", async url => {
    assert.match(url, /api\.open-meteo\.com/);
    assert.equal(new URL(url).searchParams.get("timezone"), "auto");
    return Response.json({
      timezone: "America/New_York", utc_offset_seconds: -18_000,
      current: { time: 1794513600, is_day: 0, weather_code: 53, temperature_2m: 50, wind_speed_10m: 5 },
      hourly: { time: [], temperature_2m: [], weather_code: [] },
      daily: { time: [1794513600], weather_code: [53], temperature_2m_max: [55], temperature_2m_min: [45],
        precipitation_probability_max: [50] },
    });
  });
  const feed = createFeed({ publicUrl, now });
  const { weather_window: data } = await feed({ location: "40.71,-74.01" });
  assert.equal(data.weather.label, "Drizzle");
  assert.equal(data.overlay.isNight, true);
  assert.equal(data.weather.week[0].condition, "Drizzle");
  const { weather_window: invalid } = await feed({ location: "999,-74.01", weather: "auto" });
  assert.equal(invalid.weather.label, "Snow");
  assert.match(invalid.status, /Weather unavailable/);
});

test("external gallery uses approved URLs and stable collection picks", async t => {
  t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(url, "https://raw.githubusercontent.com/example/art/main/manifest.json");
    assert.equal(init.redirect, "error");
    return Response.json({ version: 1, scenes: [
      { id: "a", name: "Alpha", collection: "Test", image: "alpha.webp", skyX: null },
      { id: "b", name: "Beta", collection: "Test", image: "beta.webp" },
    ] });
  });
  const feed = createFeed({ publicUrl, now });
  const settings = { source: "gallery", scene_url: "https://github.com/example/art/blob/main/manifest.json", collection: "Test", landscape: "@newer" };
  const first = await feed(settings);
  assert.deepEqual(await feed(settings), first);
  assert.match(first.weather_window.scene.src, /^https:\/\/raw\.githubusercontent\.com/);
  const { weather_window: fallback } = await feed({ source: "gallery", scene_url: "https://unsupported.example/gallery.json" });
  assert.match(fallback.status, /Gallery unavailable/);
  assert.deepEqual(fallback.scene, (await feed()).weather_window.scene);
  const { weather_window: imported } = await feed({ source: "image", scene_has_weather: true,
    scene_url: "https://raw.githubusercontent.com/example/art/main/alpha.webp", weather: "drizzle" });
  assert.equal(imported.overlay, null);
  assert.equal(imported.weather.label, "Drizzle");
});

test("generated mode renders a filled prompt and suppresses procedural weather only when art is ready", async () => {
  let ready = false;
  const generation = { get: async ({ config, key, prompt, minutes }) => {
    assert.equal(config.model, "google/gemini-3.1-flash-image");
    assert.equal(minutes, 360);
    assert.equal(key, "fixture-key");
    assert.match(prompt, /Drizzle in Cyberpunk/);
    assert.doesNotMatch(prompt, /{{/);
    return ready ? { image: "fixture.webp", status: "" } : { status: "Generating background…" };
  } };
  const feed = createFeed({ publicUrl, now, generation });
  const settings = { source: "generated", image_provider: "openrouter", weather: "drizzle", collection: "Cyberpunk",
    prompt: "{{weather}} in {{collection}} at {{time}}" };
  const { weather_window: pending } = await feed(settings, "fixture-key");
  assert.equal(pending.generated, false);
  assert.equal(pending.overlay.effect, "drizzle");
  ready = true;
  const { weather_window: data } = await feed(settings, "fixture-key");
  assert.equal(data.scene.src, "https://weather.example/generated/fixture.webp");
  assert.equal(data.overlay, null);
  assert.equal(data.weather.label, "Drizzle");
  assert.doesNotMatch(JSON.stringify(data), /fixture-key/);
});

test("generation is deduplicated, durable and preserves the last good image on failure", async () => {
  const directory = await mkdtemp(join(tmpdir(), "weather-window-test-"));
  try {
    const bytes = await readFile(new URL("../assets/scenes/winter-hills.webp", import.meta.url));
    let calls = 0;
    let timestamp = time.getTime();
    const requestImage = async () => {
      calls++;
      if (calls > 1) throw new Error("sensitive provider error");
      return `data:image/webp;base64,${bytes.toString("base64")}`;
    };
    const options = { directory, clock: () => timestamp, requestImage };
    const input = { config: { provider: "openai", model: "fixture" }, key: "fixture-key",
      identity: ["fixture"], prompt: "fixture prompt", minutes: 360 };
    const cache = generationCache(options);
    await Promise.all(Array.from({ length: 5 }, () => cache.get(input)));
    async function settled(get, condition) {
      for (let i = 0; i < 100; i++) {
        const result = await get();
        if (condition(result)) return result;
        await sleep(10);
      }
      assert.fail("Image job did not settle");
    }
    const first = await settled(() => cache.get(input), state => state.image);
    assert.equal(calls, 1);
    assert.deepEqual(await readFile(cache.imagePath(first.image)), bytes);
    const restarted = generationCache(options);
    assert.equal((await restarted.get(input)).image, first.image);
    assert.equal(calls, 1);
    timestamp += 360 * 60_000;
    const failed = await settled(() => restarted.get(input), state => state.status.includes("failed"));
    assert.equal(calls, 2);
    assert.equal(failed.image, first.image);
    const [metadata] = (await readdir(directory)).filter(name => name.endsWith(".json"));
    assert.doesNotMatch(await readFile(join(directory, metadata), "utf8"), /fixture-key|fixture prompt/);
    await assert.rejects(restarted.get({ ...input, config: { provider: "custom", base: "https://unapproved.example/v1" } }), /has not enabled/);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});
