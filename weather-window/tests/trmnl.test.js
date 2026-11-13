import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";

const bundle = readFileSync(new URL("../src/transform.js", import.meta.url), "utf8");
const forecast = JSON.parse(readFileSync(new URL("./fixtures/open-meteo-drizzle.json", import.meta.url)));
const fixtureDate = new Date("2026-11-12T20:00:00Z");
const run = runInNewContext(`${bundle}\nrun`, {
  require: createRequire(import.meta.url), URL,
  Date: class extends Date {
    constructor(...args) { super(...(args.length ? args : [fixtureDate.getTime()])); }
  },
});
const plugin = fields => ({ trmnl: { plugin_settings: { id: 42, custom_fields_values: fields } } });

test("the shipped defaults render a lighthouse and sample weather with no forecast or credentials", () => {
  const { weather_window: result } = run({});
  assert.match(result.scene.src, /lighthouse-headland\.webp$/);
  assert.equal(result.weather.label, "Snow");
  assert.match(result.status, /Set a location/);
  assert.equal(run(null).weather_window.status, result.status);
});

test("the transform uses TRMNL's polled forecast for all footer data", () => {
  const settings = plugin({ location: "40.71,-74.01", collection: "Cyberpunk", landscape: "night-market", temperature_unit: "C" });
  const { weather_window: result } = run({ ...settings, ...forecast });
  assert.equal(result.weather.temperature, "10°C");
  assert.equal(result.weather.label, "Drizzle");
  assert.equal(result.weather.week.length, 7);
  assert.equal(result.weather.hourly.length, 3);
  assert.equal(result.overlay.isNight, true);
  assert.equal(result.overlay.nightLit, true);
  assert.match(result.scene.src, /night-market-v3\.webp$/);
  assert.equal(result.status, "");
  assert.match(run(settings).weather_window.status, /Weather unavailable/);
});

test("a separate polling response supplies a GitHub gallery, with stock art on failure", () => {
  const settings = plugin({ location: "40.71,-74.01", source: "gallery", scene_url: "https://github.com/example/art/blob/main/scenes.json" });
  const gallery = { version: 1, scenes: [{ id: "a", name: "Alpha", image: "art/alpha.webp" }] };
  const { weather_window: result } = run({ ...settings, IDX_0: forecast, IDX_1: gallery });
  assert.equal(result.weather.label, "Drizzle");
  assert.equal(result.scene.src, "https://raw.githubusercontent.com/example/art/main/art/alpha.webp");
  assert.match(run({ ...settings, ...forecast }).weather_window.status, /Custom artwork unavailable/);
});

test("a custom image can keep its painted weather while displaying the forecast", () => {
  const settings = plugin({ source: "image", scene_url: "https://example.com/snow.webp", scene_has_weather: true });
  const { weather_window: result } = run(settings);
  assert.equal(result.scene.src, "https://example.com/snow.webp");
  assert.equal(result.overlay, null);
});
