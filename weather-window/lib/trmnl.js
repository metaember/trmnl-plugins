import manifest from "../assets/scenes/manifest.json";
import { chooseScene, displayChoices, displayData, timezoneFor } from "./display-data.js";
import { parseForecast } from "./local-weather.js";
import { readManifest, sceneUrl } from "./scene-library.js";
import { forecasts } from "./weather.js";

const artworkBase = "https://raw.githubusercontent.com/metaember/trmnl-plugins/main/weather-window/assets/scenes/";
const stock = readManifest(manifest).map(scene => ({ ...scene, src: new URL(scene.image, artworkBase).href }));
const cover = stock.find(scene => scene.id === "lighthouse-headland");

function coordinates(location) {
  const parts = location.split(",").map(value => value.trim());
  if (parts.length !== 2 || parts.some(value => !/^-?\d+(?:\.\d+)?$/.test(value))) return null;
  const [latitude, longitude] = parts.map(Number);
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

function polledGallery(url, responses) {
  const base = new URL(sceneUrl(url));
  if (base.origin !== "https://raw.githubusercontent.com") throw new Error("Use a public GitHub gallery");
  const manifest = responses.find(response => response?.version === 1 && Array.isArray(response.scenes));
  return readManifest(manifest).map(scene => ({ ...scene, src: sceneUrl(scene.image, null, base) }));
}

export function weatherWindow(input = {}, date = new Date()) {
  const plugin = input.trmnl?.plugin_settings;
  const settings = { ...plugin?.custom_fields_values, instance: plugin?.id };
  const location = String(settings.location ?? "").trim();
  const choices = displayChoices(settings, date, location);
  const { weatherMode, roll } = choices;
  // TRMNL flattens a single polling result and indexes multiple results.
  const responses = [input, input.IDX_0, input.IDX_1];
  let live;
  let status = "";
  if (location && weatherMode === "live") {
    try {
      const place = coordinates(location);
      if (!place) throw new Error("Invalid location");
      const forecast = parseForecast(responses.find(response => response?.current));
      live = { place, forecast };
    } catch {
      status = "Weather unavailable · sample shown";
    }
  }

  const collection = settings.collection || "Quiet views";
  const landscape = settings.landscape || "@newer";
  const defaultScene = !location && collection === "Quiet views" && landscape === "@newer"
    ? cover : chooseScene(stock, collection, landscape, roll("scene"));
  let scene = defaultScene;
  let imageHasWeather = false;
  try {
    if (settings.source === "image") {
      scene = { name: "Custom scene", src: sceneUrl(settings.scene_url), focus: "center", skyX: null };
      imageHasWeather = [true, "true"].includes(settings.scene_has_weather);
    } else if (settings.source === "gallery") {
      scene = chooseScene(polledGallery(settings.scene_url, responses), collection, landscape, roll("scene"));
    }
  } catch {
    status ||= "Custom artwork unavailable · built-in scene shown";
  }

  const forecast = live?.forecast ?? forecasts[weatherMode] ?? forecasts.snow;
  const timezone = live?.forecast.timezone ?? timezoneFor(input.trmnl?.user?.time_zone_iana);
  return displayData({ date, location, live, forecast, choices, timezone, scene, fallback: cover.src,
    status, imageHasWeather });
}
