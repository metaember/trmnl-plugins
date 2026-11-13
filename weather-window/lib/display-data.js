import { createHash } from "node:crypto";
import { formatTemperature, formatWind } from "./local-weather.js";
import { moonAppearance } from "./moon.js";
import { choicePool, pickFrom } from "./random-choice.js";
import { forecasts, sampleWeek, shortConditions } from "./weather.js";

const frames = ["picture", "sash", "panes", "none"];
const finishes = ["dark", "slate", "light", "outline"];
const footers = ["current", "minimal", "words", "hourly", "weekly", "details", "none"];
export const first = (value, options, fallback) => options.includes(value) ? value : fallback;

function selection(value, options, fallback, roll) {
  return value === "random" ? options[Math.floor(roll * options.length)] : first(value, options, fallback);
}

export function timezoneFor(value) {
  try {
    return new Intl.DateTimeFormat("en", { timeZone: String(value || "UTC") }).resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

function rollFor(seed, category) {
  return createHash("sha256").update(seed).update(category).digest().readUInt32BE() / 2 ** 32;
}

export function chooseScene(entries, collection, landscape, roll) {
  const matching = entries.filter(scene => scene.collection === collection);
  const pool = matching.length ? matching : entries;
  if (landscape === "random" || landscape === "@newer") {
    const choices = Object.fromEntries(pool.map((scene, order) => [scene.id, { order, scene }]));
    return choices[pickFrom(choicePool(choices, landscape === "@newer"), roll)].scene;
  }
  return pool.find(scene => scene.id === landscape) ?? pool[0];
}

export function displayChoices(settings, date, location) {
  const seed = `${String(settings.instance ?? location).slice(0, 100)}|${Math.floor(date.getTime() / 21_600_000)}`;
  const roll = category => rollFor(seed, category);
  const weatherMode = settings.weather === "random"
    ? selection("random", Object.keys(forecasts), "snow", roll("weather"))
    : first(settings.weather, ["live", ...Object.keys(forecasts)], "live");
  const temperatureUnit = first(settings.temperature_unit, ["F", "C"], "F");
  const windUnit = first(settings.wind_unit, ["mph", "km/h"], "mph");
  const frame = selection(settings.frame, frames, "none", roll("frame"));
  const finish = selection(settings.finish, finishes, "dark", roll("finish"));
  const footer = selection(settings.footer, footers, "current", roll("footer"));
  return { roll, weatherMode, temperatureUnit, windUnit, frame, finish, footer };
}

export function displayData({ date, location, live, forecast, choices, timezone, scene, fallback,
  status = "", generated = false, imageHasWeather = false }) {
  const { weatherMode, temperatureUnit, windUnit, frame, finish, footer } = choices;
  const effect = forecast.effect ?? (weatherMode === "live" ? "snow" : weatherMode);
  if (weatherMode === "live" && !location && footer !== "none") status ||= "Set a location · sample weather";

  const temp = value => formatTemperature(value, temperatureUnit);
  const week = (forecast.weekly ?? sampleWeek(forecast, effect, timezone)).map(day => ({
    day: day.day, condition: shortConditions[day.effect] ?? "—",
    high: formatTemperature(day.high, temperatureUnit, false), low: formatTemperature(day.low, temperatureUnit, false),
  }));
  const moon = effect === "night" ? moonAppearance(date, live?.place, Boolean(live)) : null;
  const skyX = Object.hasOwn(scene, "skyX") && scene.skyX !== undefined ? scene.skyX : 0.77;
  return { weather_window: {
    frame, finish, footer, status, generated,
    place: live?.place.label ?? "",
    scene: { name: scene.name, src: scene.src, focus: scene.focus, fallback },
    overlay: generated || imageHasWeather ? null : { effect, amount: forecast.amount ?? 0, wind: forecast.wind ?? 0,
      isNight: effect === "night" || Boolean(forecast.isNight), nightLit: Boolean(scene.nightLit), moon, skyX },
    weather: { label: forecast.label, temperature: temp(forecast.temperature), next: forecast.next, summary: forecast.summary,
      high: temp(forecast.high), low: temp(forecast.low), wind: formatWind(forecast.wind, windUnit),
      precipitation: Number.isFinite(forecast.precipitation) ? `${forecast.precipitation}%` : "—",
      hourly: forecast.hourly.map(hour => ({ time: hour.time, temperature: temp(hour.temperature), condition: hour.condition })),
      week,
    },
  } };
}
