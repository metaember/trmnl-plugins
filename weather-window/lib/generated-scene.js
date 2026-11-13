import { formatTemperature, formatWind } from "./local-weather.js";
import { moonAppearance } from "./moon.js";

export const providers = {
  openai: { label: "OpenAI", model: "gpt-image-2", endpoint: "https://api.openai.com/v1/images/generations" },
  openrouter: { label: "OpenRouter", model: "google/gemini-3.1-flash-image", endpoint: "https://openrouter.ai/api/v1/images" },
  custom: { label: "Custom compatible API", model: "" },
};

const conditions = "Local date and time: {{date}} at {{time}} ({{timezone}}). It is {{daylight}}. Conditions ({{weather_source}}): {{weather}}, {{temperature}}, wind {{wind}}. Moon: {{moon}}.";
const composition = "Wide 16:9 outdoor background for a grayscale e-ink weather display. Keep the main subject inside the middle of the image. Show the weather and lighting in the artwork. Use clear silhouettes and separated gray tones. Render only the view outside, with no window frame, text, labels, or forecast graphics.";

export const promptPresets = {
  landscape: {
    label: "Quiet landscape",
    prompt: "Draw a peaceful outdoor vista inspired by {{landscape}}, near {{location}} if a place is specified. Use layered terrain and a strong foreground silhouette.",
  },
  city: {
    label: "Cyberpunk street",
    prompt: "Draw a lived-in futuristic city street with a small noodle stall, a few groups of pedestrians, open walkways, and signage that reads as shapes. Translate neon into crisp luminous gray tones. Adapt the reflections and street activity to the current weather.",
  },
  fantasy: {
    label: "Fantasy vista",
    prompt: "Draw a fantasy valley with an ancient stone bridge and small lanterns on a distant hillside. Use atmospheric depth and keep the silhouette of the bridge readable. Let the local weather shape the fog, foliage, and water.",
  },
};

export function presetPrompt(preset) {
  return [promptPresets[preset].prompt, conditions, composition].join("\n\n");
}

export const generationDefaults = {
  provider: "openai", model: providers.openai.model, format: "images",
  base: "", preset: "landscape", prompt: presetPrompt("landscape"), minutes: 360,
};

export function weatherPromptValues({ forecast, place, live, temperatureUnit, windUnit, scene }, now = new Date()) {
  const timezone = place?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const moon = moonAppearance(now, live ? place : null, live);
  const light = forecast?.isNight || forecast?.effect === "night" ? "night" : "daytime";
  const temperature = value => value == null ? "unavailable" : formatTemperature(value, temperatureUnit);
  return {
    date: new Intl.DateTimeFormat("en-CA", { timeZone: timezone, dateStyle: "medium" }).format(now),
    time: new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit" }).format(now),
    timezone,
    location: place?.label ?? "unspecified",
    daylight: light,
    weather: forecast?.label ?? "unavailable",
    weather_source: live ? "live weather" : "sample weather",
    temperature: temperature(forecast?.temperature),
    wind: forecast?.wind == null ? "unavailable" : formatWind(forecast.wind, windUnit),
    high: temperature(forecast?.high),
    low: temperature(forecast?.low),
    precipitation: forecast?.precipitation == null ? "unavailable" : `${forecast.precipitation}% chance today`,
    outlook: forecast?.summary ?? forecast?.next ?? "unavailable",
    moon: light === "night" && moon.visible
      ? `${moon.phase} (${Math.round(moon.fraction * 100)}% illuminated), if visible through the weather`
      : "out of view",
    landscape: scene.label,
    collection: scene.collection,
  };
}

export function renderPrompt(template, values) {
  if (!template.trim()) throw new Error("Enter a prompt or choose a preset.");
  return template.trim().replace(/{{\s*([^{}]*?)\s*}}/g, (_, name) => {
    if (!Object.hasOwn(values, name)) throw new Error(`Unknown prompt field: {{${name}}}.`);
    return values[name];
  });
}

function trustedUrl(value) {
  try {
    const url = new URL(value);
    const loopback = url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    return !url.username && !url.password && (url.protocol === "https:" || loopback) ? url : null;
  } catch {
    return null;
  }
}

export function generationEndpoint({ provider, base, format }) {
  if (provider !== "custom") return providers[provider].endpoint;
  const url = trustedUrl(base.trim());
  if (!url || url.search || url.hash) throw new Error("Enter a compatible HTTPS API base URL or a local loopback URL.");
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/${format === "chat" ? "chat/completions" : "images/generations"}`;
  return url.href;
}

function imageSource(result, format) {
  const image = result?.data?.[0];
  const chatImage = result?.choices?.[0]?.message?.images?.[0];
  const source = format === "chat" ? chatImage?.image_url?.url ?? chatImage?.imageUrl?.url
    : image?.b64_json ? `data:${image.media_type ?? "image/png"};base64,${image.b64_json}` : image?.url;
  if (typeof source === "string") {
    if (/^data:image\/(?:png|jpeg|webp|gif|avif);base64,[A-Za-z0-9+/]+=*$/i.test(source)) return source;
    const url = trustedUrl(source);
    if (url) return url.href;
  }
  throw new Error("The provider returned no usable image. Check that the model and API format generate raster images.");
}

export async function generateScene(config, apiKey, prompt, signal) {
  const endpoint = generationEndpoint(config);
  const model = config.model.trim();
  if (!model || !apiKey.trim()) throw new Error("Enter an image model and API key.");
  const format = config.provider === "custom" ? config.format : "images";
  const body = format === "chat"
    ? { model, messages: [{ role: "user", content: prompt }], modalities: ["image", "text"] }
    : { model, prompt };
  if (config.provider === "openai" && model === providers.openai.model) {
    Object.assign(body, { size: "1600x848", quality: "medium" });
  }
  if (config.provider === "openrouter" && model === providers.openrouter.model) body.aspect_ratio = "16:9";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey.trim()}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "omit",
    referrerPolicy: "no-referrer",
    redirect: "error",
    signal,
  });
  if (!response.ok) {
    const help = { 401: "Check your API key.", 403: "Check your key’s model access.", 404: "Check the model and endpoint.",
      429: "Check your provider’s rate limits and balance." };
    throw new Error(`Image request failed (HTTP ${response.status}). ${help[response.status] ?? "Check the provider’s dashboard."}`);
  }
  return imageSource(await response.json(), format);
}
