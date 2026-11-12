const API = "https://openrouter.ai/api/v1";
const MAX_KEYS = 6;
const DAY_MS = 86400000;
const PRESETS = ["overview", "models", "keys", "tokens"];
const METRICS = { spend: "Spend", tokens: "Tokens", requests: "Requests" };
const CAP_PERIODS = { daily: "Daily key cap", weekly: "Weekly key cap", monthly: "Monthly key cap" };

function isAmount(value) {
  return Number.isFinite(value) && value >= 0;
}

function usd(value) {
  if (value > 0 && value < 0.01) return "<$0.01";
  return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function compact(value) {
  return value.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 });
}

function formatMetric(metric, value) {
  return metric === "spend" ? usd(value) : compact(value);
}

function list(value) {
  return String(value || "").split(/[,\n]/).map(item => item.trim()).filter(Boolean);
}

function safeName(value, fallback) {
  // Provider fallback labels can contain a fragment of the credential.
  const name = String(value || "").trim();
  return name && !/sk-or-/i.test(name) ? name.slice(0, 56) : fallback;
}

async function get(path, credential, signal) {
  try {
    const response = await fetch(API + path, {
      headers: { Authorization: "Bearer " + credential },
      redirect: "error",
      signal
    });
    return response.ok ? (await response.json()).data : null;
  } catch {
    return null;
  }
}

function keyUsage(data, name) {
  if (!data || ![data.usage_daily, data.usage_weekly, data.usage_monthly, data.usage].every(isAmount)) {
    return null;
  }

  const budget = isAmount(data.limit) && Number.isFinite(data.limit_remaining) ? {
    limit: usd(data.limit),
    remaining: usd(Math.max(0, data.limit_remaining)),
    used_percent: data.limit > 0 ?
      Math.max(0, Math.min(100, Math.round(100 * (data.limit - data.limit_remaining) / data.limit))) : null,
    label: Object.hasOwn(CAP_PERIODS, data.limit_reset) ? CAP_PERIODS[data.limit_reset] : "Key cap"
  } : null;

  return {
    name, budget, hash: data.hash, selector: String(data.name || data.label || "").toLowerCase(),
    today: data.usage_daily, week: data.usage_weekly,
    month: data.usage_monthly, lifetime: data.usage
  };
}

function keySummary(keys, preset, notice) {
  const sum = field => usd(keys.reduce((total, key) => total + key[field], 0));
  const rows = [...keys].sort((a, b) => b.month - a.month).map(key => ({
    name: key.name, month: usd(key.month), today: usd(key.today), week: usd(key.week),
    lifetime: usd(key.lifetime), budget: key.budget
  }));

  return {
    preset, notice,
    spend_available: keys.length > 0,
    today: sum("today"), week: sum("week"), month: sum("month"), lifetime: sum("lifetime"),
    budget: keys.length === 1 ? keys[0].budget : null,
    key_count: keys.length, key_rows: rows
  };
}

async function regularKeys(fields, preset, signal) {
  const unique = new Map();
  const entries = [...list(fields.openrouter_api_key), ...list(fields.openrouter_extra_keys)];
  for (const entry of entries) {
    const separator = entry.indexOf("=");
    const credential = (separator < 0 ? entry : entry.slice(separator + 1)).trim();
    const label = separator < 0 ? "" : entry.slice(0, separator);
    if (credential) unique.set(credential, safeName(label, unique.get(credential) || ""));
  }

  if (unique.size > MAX_KEYS) return { notice: "Enter up to six regular API keys." };
  if (!unique.size) return { notice: "Add an OpenRouter key in plugin settings." };

  const results = await Promise.all([...unique].map(async ([credential, label], index) => {
    const data = await get("/key", credential, signal);
    return keyUsage(data, label || safeName(data?.label, "Key " + (index + 1)));
  }));
  const keys = results.filter(Boolean);
  const notice = keys.length < unique.size ? `${unique.size - keys.length} key(s) unavailable` :
    ["models", "tokens"].includes(preset) ? "Add a Management key for detailed activity." : "";
  return keySummary(keys, preset, notice);
}

async function managedKeys(credential, signal) {
  const keys = [];
  let page;
  do {
    const suffix = keys.length ? `&offset=${keys.length}` : "";
    page = await get("/keys?include_disabled=true" + suffix, credential, signal);
    if (!Array.isArray(page) || page.some(key => typeof key?.hash !== "string")) return null;
    keys.push(...page);
  } while (page.length === 100 && !signal.aborted);
  return signal.aborted ? null : keys;
}

function utcDays(count) {
  const now = Math.floor(Date.now() / DAY_MS) * DAY_MS;
  return Array.from({ length: count }, (_, index) =>
    new Date(now - (count - index) * DAY_MS).toISOString().slice(0, 10)
  );
}

function historyWindow(fields) {
  const count = Number(fields.history_days);
  return utcDays([7, 14, 30].includes(count) ? count : 14);
}

function activityRows(groups, days) {
  const dates = new Map(days.map((day, index) => [day, index]));
  const rows = [];
  for (const { key, data } of groups) {
    for (const entry of data) {
      if (!dates.has(entry.date)) continue;
      const [spend, input, output, reasoning, requests] = [
        entry.usage, entry.prompt_tokens, entry.completion_tokens, entry.reasoning_tokens, entry.requests
      ].map(value => isAmount(value) ? value : 0);
      rows.push({
        day: dates.get(entry.date), key,
        model: safeName(entry.model || entry.model_permaslug, "Unknown model"),
        spend, input, output, reasoning, requests, tokens: input + output
      });
    }
  }
  return rows;
}

function totals(rows) {
  const result = { spend: 0, tokens: 0, requests: 0, input: 0, output: 0, reasoning: 0 };
  for (const row of rows) {
    for (const metric of Object.keys(result)) result[metric] += row[metric];
  }
  return result;
}

function groupRows(rows, dimension, metric) {
  const groups = new Map();
  for (const row of rows) {
    const name = row[dimension];
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(row);
  }
  return [...groups].map(([name, items]) => ({ name, items, stats: totals(items) }))
    .sort((a, b) => b.stats[metric] - a.stats[metric]);
}

function makeHistory(rows, days, fields, preset, scope) {
  const weekly = fields.time_grouping === "weekly";
  const periods = [];
  const periodForDay = days.map((date, index) => {
    if (!weekly || index === 0 || new Date(date).getUTCDay() === 1) periods.push(date);
    return periods.length - 1;
  });
  const metric = Object.hasOwn(METRICS, fields.chart_metric) ? fields.chart_metric :
    preset === "tokens" ? "tokens" : "spend";
  const stats = totals(rows);
  const dimension = preset === "models" ? "model" : preset === "keys" ? "key" : null;
  const groups = dimension ? groupRows(rows, dimension, metric) : [];
  const breakdown = groups.slice(0, 4).map(({ name, stats: group }) => ({
    name, amount: formatMetric(metric, group[metric]),
    detail: metric === "tokens" ? `${usd(group.spend)} spend` : `${compact(group.tokens)} tokens`
  }));

  function series(name, items, field) {
    const label = dimension === "model" ? name.split("/").at(-1) : name;
    const data = Array(periods.length).fill(0);
    for (const row of items) data[periodForDay[row.day]] += row[field];
    return { name: label.length > 21 ? label.slice(0, 20) + "…" : label, data };
  }

  let seriesList = [series(METRICS[metric], rows, metric)];
  if (groups.length) {
    seriesList = groups.slice(0, 3).map(({ name, items }) => series(name, items, metric));
    if (groups.length > 3) {
      seriesList.push(series("Other", groups.slice(3).flatMap(group => group.items), metric));
    }
  } else if (preset === "tokens" && metric === "tokens") {
    seriesList = [series("Input", rows, "input"), series("Output", rows, "output")];
  }

  const kpis = preset === "tokens" ? [
    { label: "Total tokens", value: compact(stats.tokens) },
    { label: "Input tokens", value: compact(stats.input) },
    { label: "Output tokens", value: compact(stats.output) },
    { label: "Reasoning tokens", value: compact(stats.reasoning) }
  ] : [
    { label: "Spend", value: usd(stats.spend) },
    { label: "Tokens", value: compact(stats.tokens) },
    { label: "Requests", value: compact(stats.requests) }
  ];
  return {
    scope, breakdown, kpis, has_activity: rows.length > 0,
    caption: `${days.length} completed days · UTC`,
    chart_label: `${weekly ? "Weekly" : "Daily"} ${METRICS[metric].toLowerCase()}`,
    chart: {
      dates: periods.map(date => date.slice(5).replace("-", "/")),
      series: seriesList, currency: metric === "spend",
      type: fields.chart_style === "stacked" || (fields.chart_style !== "line" && seriesList.length > 1) ?
        "column" : "line"
    }
  };
}

async function managementDashboard(fields, credential, preset, signal) {
  const filters = [...new Set(list(fields.managed_key_filter).map(name => name.toLowerCase()))];
  if (filters.length > MAX_KEYS) return { notice: "Select up to six managed keys." };
  const days = historyWindow(fields);
  let summary = { preset };
  let selected = [];
  let scope = "Account activity";

  if (preset === "keys" || filters.length) {
    const data = await managedKeys(credential, signal);
    if (!data) return { notice: "Managed keys unavailable. Check the Management key." };
    const keys = data.filter(key => /^[a-f0-9]{64}$/i.test(key.hash)).map((key, index) =>
      keyUsage(key, safeName(key.name || key.label, "Key " + (index + 1)))
    ).filter(Boolean).sort((a, b) => b.month - a.month);
    const matches = (key, filter) => key.selector === filter || key.hash.toLowerCase() === filter;
    if (filters.some(filter => !keys.some(key => matches(key, filter)))) {
      return { notice: "A selected key was not found in the default workspace." };
    }
    selected = filters.length ? keys.filter(key => filters.some(filter => matches(key, filter))) : keys.slice(0, MAX_KEYS);
    if (!selected.length) return { notice: "No API keys found in the default workspace." };
    if (selected.length > MAX_KEYS) return { notice: "Use exact hashes to select up to six keys." };
    // Keep series distinct when two OpenRouter keys share a name.
    const duplicates = new Set(selected.filter((key, index) =>
      selected.findIndex(other => other.name === key.name) !== index).map(key => key.name));
    selected = selected.map(key => duplicates.has(key.name) ?
      { ...key, name: `${key.name.slice(0, 12)} · ${key.hash.slice(0, 6)}` } : key);
    scope = filters.length ? `${selected.length} selected ${selected.length === 1 ? "key" : "keys"}` :
      keys.length > MAX_KEYS ? "Top six keys by monthly spend" : "Default workspace keys";
    summary = keySummary(selected, preset, "");
  }

  const groups = selected.length ? await Promise.all(selected.map(async key => ({
    key: key.name, data: await get("/activity?api_key_hash=" + key.hash, credential, signal)
  }))) : [{ data: await get("/activity", credential, signal) }];
  if (groups.some(({ data }) => !Array.isArray(data) || data.some(entry => typeof entry?.date !== "string"))) {
    return { ...summary, notice: "Activity unavailable. Check the Management key." };
  }
  const rows = activityRows(groups, days);
  return { ...summary, history: makeHistory(rows, days, fields, preset, scope) };
}

function demoDashboard(fields, preset) {
  const days = historyWindow(fields);
  const sample = [
    { model: "anthropic/claude-sonnet-4.6", key: "Production", rate: 0.32 },
    { model: "openai/gpt-5.4", key: "Research", rate: 0.21 },
    { model: "google/gemini-3-flash", key: "Production", rate: 0.12 },
    { model: "deepseek/deepseek-v4", key: "Research", rate: 0.07 }
  ];
  const rows = days.flatMap((_, day) => sample.map(({ model, key, rate }, index) => {
    const volume = 3 + (day * (index + 2) + index * 7) % 14;
    const input = volume * 18000;
    const output = volume * 4500;
    return {
      day, model, key, spend: rate * volume, input, output, tokens: input + output,
      reasoning: volume * 900, requests: volume * 8
    };
  }));
  return { preset, history: makeHistory(rows, days, fields, preset, "Demo data") };
}

async function run(input) {
  const fields = input?.trmnl?.plugin_settings?.custom_fields_values || {};
  const preset = PRESETS.includes(fields.dashboard_preset) ? fields.dashboard_preset : "overview";
  const credential = String(fields.openrouter_management_key || "").trim();
  if (!credential && !list(fields.openrouter_extra_keys).length &&
      String(fields.openrouter_api_key || "").trim() === "demo") {
    return demoDashboard(fields, preset);
  }
  const signal = AbortSignal.timeout(4100);
  return credential ? managementDashboard(fields, credential, preset, signal) : regularKeys(fields, preset, signal);
}
