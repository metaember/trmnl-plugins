import { readFileSync } from "node:fs";
import { generationDefaults, presetPrompt, promptPresets, providers, renderPrompt, weatherPromptValues } from "./generated-scene.js";
import { fetchForecast, searchPlaces } from "./local-weather.js";
import { chooseScene, displayChoices, displayData, first, timezoneFor } from "./display-data.js";
import { readManifest, sceneUrl } from "./scene-library.js";
import { forecasts } from "./weather.js";

export const manifest = readManifest(JSON.parse(readFileSync(new URL("../assets/scenes/manifest.json", import.meta.url))));
function ttlCache() {
  const entries = new Map();
  return function cached(key, load) {
    const entry = entries.get(key);
    if (entry?.until > Date.now()) return entry.result;
    if (entries.size >= 128) entries.delete(entries.keys().next().value);
    const next = { until: Date.now() + 10 * 60_000, result: Promise.resolve().then(load) };
    entries.set(key, next);
    next.result.catch(() => { if (entries.get(key) === next) entries.delete(key); });
    return next.result;
  };
}

function assetUrl(value, approved, base) {
  const url = new URL(sceneUrl(value, null, base));
  if (url.port || !approved.has(url.hostname)) throw new Error("Use a gallery on an approved HTTPS host.");
  return url.href;
}

async function fetchGallery(value, approved) {
  const url = assetUrl(value, approved);
  const res = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(2500) });
  if (!res.ok) throw new Error("Gallery unavailable");
  const reader = res.body.getReader();
  let bytes = 0;
  const chunks = [];
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.length;
    if (bytes > 100_000) {
      await reader.cancel();
      throw new Error("Gallery is too large");
    }
    chunks.push(value);
  }
  return readManifest(JSON.parse(Buffer.concat(chunks).toString())).map(scene => ({
    ...scene, src: assetUrl(scene.image, approved, url),
  }));
}

export function createFeed({ publicUrl, assetHosts = [], generation, now = () => new Date() }) {
  const approved = new Set(["raw.githubusercontent.com", ...assetHosts]);
  const stock = manifest.map(scene => ({ ...scene, src: new URL(`scenes/${scene.image}`, publicUrl).href }));
  const weatherCache = ttlCache();
  const galleryCache = ttlCache();

  async function lookupWeather(location) {
    const [city, ...area] = location.split(",").map(part => part.trim());
    const signal = AbortSignal.timeout(4500);
    if (area.length === 1 && /^-?\d+(?:\.\d+)?$/.test(city) && /^-?\d+(?:\.\d+)?$/.test(area[0])) {
      const [latitude, longitude] = [Number(city), Number(area[0])];
      if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw new Error("Invalid coordinates");
      const place = { latitude, longitude, label: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}` };
      const forecast = await fetchForecast(place, signal);
      return { place: { ...place, timezone: forecast.timezone }, forecast };
    }
    const places = await searchPlaces(city, signal);
    const qualifier = area.filter(Boolean).map(part => part.toLowerCase());
    const place = places.find(item => qualifier.every(part => item.label.toLowerCase().includes(part)));
    if (!place) throw new Error("Location not found");
    return { place, forecast: await fetchForecast(place, signal) };
  }

  return async function feed(settings = {}, key = "") {
    const date = now();
    const location = String(settings.location ?? "").trim().slice(0, 100);
    const choices = displayChoices(settings, date, location);
    const { roll, weatherMode, temperatureUnit, windUnit } = choices;

    const weatherTask = location && weatherMode === "live"
      ? weatherCache(location.toLowerCase(), () => lookupWeather(location)).catch(() => null)
      : null;
    const sourceMode = first(settings.source, ["stock", "gallery", "image", "generated"], "stock");
    const sourceUrl = String(settings.scene_url ?? "").trim().slice(0, 2000);
    const galleryTask = sourceMode === "gallery" && sourceUrl
      ? galleryCache(sourceUrl, () => fetchGallery(sourceUrl, approved)).catch(() => null)
      : null;
    const [live, gallery] = await Promise.all([weatherTask, galleryTask]);
    const timezone = live?.place.timezone ?? timezoneFor(settings.timezone);
    const forecast = live?.forecast ?? forecasts[weatherMode] ?? forecasts.snow;
    let status = weatherMode === "live" && location && !live ? "Weather unavailable · sample shown" : "";
    const landscape = String(settings.landscape || "@newer").trim().toLowerCase();
    const collection = String(settings.collection ?? (settings.landscape || gallery ? "" : "Quiet views")).trim();
    let scene = chooseScene(gallery ?? stock, collection, landscape, roll("scene"));
    if (sourceMode === "gallery" && !gallery) status ||= "Gallery unavailable · built-in scene shown";
    let imageHasWeather = false;
    if (sourceMode === "image") {
      try {
        scene = { name: "Custom scene", collection: "Custom", src: assetUrl(sourceUrl, approved), focus: "center", skyX: null };
        imageHasWeather = settings.scene_has_weather === true || settings.scene_has_weather === "true";
      } catch {
        status ||= "Image unavailable · built-in scene shown";
      }
    }

    let generated = false;
    if (sourceMode === "generated") {
      const provider = first(settings.image_provider, Object.keys(providers), generationDefaults.provider);
      const model = String(settings.image_model ?? "").trim().slice(0, 120) || providers[provider].model;
      const preset = first(settings.prompt_preset, Object.keys(promptPresets), generationDefaults.preset);
      const template = String(settings.prompt ?? "").trim().slice(0, 3000) || presetPrompt(preset);
      const minutes = Number(settings.image_minutes || generationDefaults.minutes);
      try {
        if (!key || !model) throw new Error("Enter an image API key and model");
        if (!Number.isInteger(minutes) || minutes < 1 || minutes > 10_080) throw new Error("Set image refresh to 1–10080 minutes");
        if (weatherMode === "live" && location && !live) throw new Error("Waiting for live weather");
        if (!generation) throw new Error("Image generation is unavailable on this feed");
        const context = { forecast, place: live?.place ?? { timezone },
          live: Boolean(live), temperatureUnit, windUnit, scene: { label: scene.name, collection: scene.collection } };
        const prompt = renderPrompt(template, weatherPromptValues(context, date));
        const result = await generation.get({
          config: { provider, model, base: String(settings.image_api_base ?? "").trim(), format: settings.image_api_format === "chat" ? "chat" : "images" },
          key, prompt, minutes,
          // The clock and conditions vary each poll. Keep one cached image for this configuration.
          identity: [settings.instance ?? "", location, weatherMode, temperatureUnit, windUnit, collection, landscape, template],
        });
        if (result.image) {
          scene = { ...scene, src: new URL(`generated/${result.image}`, publicUrl).href, focus: "center", name: "Generated background" };
          generated = true;
        }
        status ||= result.status;
      } catch (error) {
        status ||= error.message;
      }
    }

    return displayData({ date, location, live, forecast, choices, timezone, scene, fallback: stock[0].src,
      status, generated, imageHasWeather });
  };
}
