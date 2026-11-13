function cleanText(value, limit) {
  if (typeof value !== "string") return "";
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= limit) return text;
  const excerpt = text.slice(0, limit - 1);
  const space = excerpt.lastIndexOf(" ");
  return (space > limit / 2 ? excerpt.slice(0, space) : excerpt) + "…";
}

function sourceUrl(value) {
  if (typeof value !== "string" || value.length > 500) return null;
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    url.hash = "";
    for (const key of Array.from(url.searchParams.keys())) {
      if (key.startsWith("utm_")) url.searchParams.delete(key);
    }
    return url;
  } catch {
    return null;
  }
}

function collectSources(annotations) {
  const sources = new Map();
  if (!Array.isArray(annotations)) return sources;
  for (const annotation of annotations) {
    if (annotation?.type !== "url_citation") continue;
    const url = sourceUrl(annotation.url_citation?.url ?? annotation.url);
    if (url) {
      sources.set(url.href, {
        url: url.href,
        domain: url.hostname.replace(/^www\./, ""),
      });
    }
  }
  return sources;
}

function configuredImage(value) {
  try {
    const url = new URL(String(value ?? "").trim());
    const host = url.hostname.replace(/\.$/, "");
    if (url.protocol !== "https:" || url.username || url.password || url.href.length > 1000) return null;
    if (!host.includes(".") || /^[\d.]+$/.test(host) || /\.(localhost|local|internal)$/.test(host)) return null;
    return url.href;
  } catch {
    return null;
  }
}

const itemCounts = { list: [1, 3], compare: [2, 2], bullets: [1, 5], timeline: [2, 4] };
const chartModes = ["bar", "line", "area"];
const displayModes = ["answer", "metric", "quote", "image", "no_results", "article", "table",
  ...Object.keys(itemCounts), ...chartModes];

function parseTable(value, brief) {
  if (!Array.isArray(value.columns) || value.columns.length < 2 || value.columns.length > 3) return false;
  if (!Array.isArray(value.rows) || !value.rows.length || value.rows.length > 6) return false;
  brief.columns = value.columns.map((column) => cleanText(column, 24));
  if (!brief.columns.every(Boolean)) return false;
  brief.rows = [];
  for (const row of value.rows) {
    if (!Array.isArray(row) || row.length !== brief.columns.length || row.some((cell) => typeof cell !== "string")) return false;
    brief.rows.push(row.map((cell) => cleanText(cell, 44)));
  }
  return true;
}

function parseChart(value, brief) {
  if (!Array.isArray(value.points) || value.points.length < 2 || value.points.length > 8) return false;
  brief.points = [];
  for (const point of value.points) {
    const label = cleanText(point?.label, 22);
    const number = point?.value;
    if (!label || !Number.isFinite(number) || Math.abs(number) > 1e15) return false;
    if (brief.mode === "area" && number < 0) return false;
    brief.points.push({ label, value: number });
  }
  brief.value = cleanText(value.value, 28);
  return true;
}

function parseBrief(input, layout, webEnabled, image) {
  const choice = input.choices?.[0];
  if (choice?.finish_reason !== "stop" || typeof choice.message?.content !== "string") return null;

  let value;
  try {
    value = JSON.parse(choice.message.content);
  } catch {
    return null;
  }

  const mode = value?.mode;
  if (!displayModes.includes(mode)) return null;
  if (!Array.isArray(value.items) || (mode === "image" && !image)) return null;
  if (typeof value.answer !== "string" || typeof value.source_url !== "string") return null;
  if (mode !== "no_results" && layout !== "auto" && mode !== layout) return null;

  const headline = cleanText(value.headline, 84);
  if (!headline) return null;
  const answer = cleanText(value.answer, 230);
  const sources = webEnabled ? collectSources(choice.message.annotations) : new Map();
  const matchingSource = (url) => sources.get(sourceUrl(url)?.href);
  const brief = { mode, headline };

  if (Object.hasOwn(itemCounts, mode)) {
    const [minimum, maximum] = itemCounts[mode];
    if (value.items.length < minimum || value.items.length > maximum || answer) return null;
    brief.items = [];
    for (const item of value.items) {
      const title = cleanText(item?.title, mode === "bullets" ? 112 : 74);
      const detail = cleanText(item?.detail, 128);
      if (!title || (mode !== "bullets" && !detail) || typeof item.source_url !== "string") return null;
      const source = matchingSource(item.source_url);
      if (!webEnabled || source) brief.items.push({ title, detail, source });
    }
    if (brief.items.length < minimum) return null;
  } else {
    const chart = chartModes.includes(mode);
    const optionalAnswer = chart || mode === "image" || mode === "table";
    if (value.items.length || (!optionalAnswer && !answer)) return null;
    brief.answer = optionalAnswer ? cleanText(value.answer, 128) : answer;
    if (mode === "metric" || mode === "quote") brief.value = cleanText(value.value, 48);
    if (mode === "metric" && !/\p{Number}/u.test(brief.value)) return null;
    if (mode === "image") brief.image_url = image;
    if (mode === "table" && !parseTable(value, brief)) return null;
    if (chart && !parseChart(value, brief)) return null;
    if (mode === "article") {
      brief.paragraphs = value.answer.trim().split(/\r?\n+/).map((text) => cleanText(text, 300)).filter(Boolean);
      if (brief.paragraphs.length < 2 || brief.paragraphs.length > 3) return null;
      delete brief.answer;
    }
    if (mode !== "no_results" && (mode !== "image" || answer) && webEnabled) {
      brief.source = matchingSource(value.source_url);
      if (!brief.source) return null;
    }
  }

  brief.generated_at = Number.isInteger(input.created) && input.created > 0
    ? input.created
    : Math.floor(Date.now() / 1000);
  return brief;
}

function run(input) {
  const settings = input?.trmnl?.plugin_settings?.custom_fields_values ?? {};
  const key = String(settings.api_key ?? "").trim();
  const prompt = String(settings.prompt ?? "").trim();
  const city = String(settings.city ?? "").trim();
  const layout = settings.layout || "auto";
  const image = configuredImage(settings.image_url);
  if (!key || key === "0") return { notice: "Add an OpenRouter API key in plugin settings." };
  if (settings.preset === "custom" && !prompt) return { notice: "Enter a prompt in plugin settings." };
  if ((!prompt || prompt.includes("{{city}}")) && !city) return { notice: "Choose a city in plugin settings." };
  if (layout === "image" && !image) return { notice: "Add a public HTTPS image URL in plugin settings." };

  const webEnabled = settings.web === "on" || (settings.web !== "off" && settings.preset !== "custom");
  const brief = parseBrief(input, layout, webEnabled, image);
  if (brief) return { brief, trmnl_state: { brief } };

  const lastGood = input.trmnl?.state?.brief;
  if (lastGood) return { brief: lastGood, stale: true, trmnl_state: { brief: lastGood } };

  const code = Number(input.error?.code);
  if (code === 401 || code === 403) return { notice: "Check the OpenRouter key in plugin settings." };
  if (code === 402) return { notice: "Check the credit or spend limit on your OpenRouter account." };
  if (code === 404) return { notice: "Choose a model that supports this request." };
  return { notice: "No brief yet. Try refreshing, or check the model and plugin logs." };
}
