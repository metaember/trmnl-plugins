function tokenRate(value) {
  if ((typeof value !== "string" && typeof value !== "number") || String(value).trim() === "") return null;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

function priceDisplay(value) {
  const price = tokenRate(value);
  if (price === null) return "Not listed";
  const perMillion = price * 1000000;
  if (perMillion > 0 && perMillion < 0.001) return "<$0.001";
  return "$" + Number(perMillion.toFixed(3));
}

function contextValue(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
}

function contextDisplay(value) {
  if (!contextValue(value)) return "Not listed";
  if (value >= 1000000) return Number((value / 1000000).toFixed(1)) + "M";
  if (value >= 1000) return Math.round(value / 1000) + "k";
  return String(value);
}

const SORTS = {
  newest: { label: "Newest", heading: "LATEST DROP" },
  cost: { label: "Lowest blend", heading: "LOWEST BLEND" },
  context: { label: "Largest context", heading: "LARGEST CONTEXT" }
};
const TYPES = {
  all: "All types", text: "Text only", vision: "Vision chat",
  image: "Image generation", audio: "Audio", video: "Video generation"
};
const MIXES = { "3to1": 3, "1to1": 1, "9to1": 9 };

function matchesType(model, type) {
  if (type === "all") return true;
  const architecture = model.architecture || {};
  const inputs = Array.isArray(architecture.input_modalities) ? architecture.input_modalities : [];
  const outputs = Array.isArray(architecture.output_modalities) ? architecture.output_modalities : [];
  const textOutput = outputs.length === 1 && outputs[0] === "text";
  if (type === "text") return textOutput && inputs.length === 1 && inputs[0] === "text";
  if (type === "vision") return textOutput && inputs.includes("image");
  if (type === "audio") return inputs.includes("audio") || outputs.includes("audio");
  return outputs.includes(type);
}

function blendedRate(model, inputRatio) {
  const outputs = model.architecture && model.architecture.output_modalities;
  if (!Array.isArray(outputs) || outputs.length !== 1 || outputs[0] !== "text") return null;
  const input = tokenRate(model.pricing && model.pricing.prompt);
  const output = tokenRate(model.pricing && model.pricing.completion);
  return input === null || output === null ? null : (inputRatio * input + output) / (inputRatio + 1);
}

function transform(input) {
  if (!input || !Array.isArray(input.data)) return input;
  const fields = input.trmnl && input.trmnl.plugin_settings && input.trmnl.plugin_settings.custom_fields_values || {};
  const sort = Object.prototype.hasOwnProperty.call(SORTS, fields.sort_by) ? fields.sort_by : "newest";
  const type = Object.prototype.hasOwnProperty.call(TYPES, fields.model_type) ? fields.model_type : "all";
  const mix = Object.prototype.hasOwnProperty.call(MIXES, fields.token_mix) ? fields.token_mix : "3to1";
  const days = ["7", "30", "90"].includes(String(fields.added_within)) ? Number(fields.added_within) : 0;
  const inputRatio = MIXES[mix];
  const now = Date.now() / 1000;
  const cutoff = days ? (Math.floor(now / 86400) - days + 1) * 86400 : 0;
  const valid = input.data.filter(model => model
    && typeof model.id === "string" && model.id.includes("/")
    && !model.id.startsWith("openrouter/")
    && typeof model.name === "string" && model.name.trim()
    && Number.isInteger(model.created) && model.created > 0 && model.created <= now);
  const baseIds = new Set(valid.filter(model => !model.id.includes(":")).map(model => model.id));
  const seen = new Set();
  const selected = valid
    .filter(model => sort === "cost" || !model.id.includes(":") || !baseIds.has(model.id.split(":")[0]))
    .filter(model => model.created >= cutoff && matchesType(model, type))
    .map(model => ({ model, blend: blendedRate(model, inputRatio) }))
    .filter(entry => sort !== "cost" || entry.blend !== null)
    .sort((a, b) => {
      const primary = sort === "cost" ? a.blend - b.blend : sort === "context"
        ? contextValue(b.model.context_length) - contextValue(a.model.context_length)
        : 0;
      return primary || b.model.created - a.model.created || a.model.id.localeCompare(b.model.id);
    })
    .filter(({ model }) => {
      const id = sort === "cost" ? model.id.split(":")[0] : model.id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  const models = selected.slice(0, 16).map(({ model, blend }) => ({
      id: model.id,
      name: model.name,
      added_date: new Date(model.created * 1000).toISOString().slice(0, 10),
      context: contextDisplay(model.context_length),
      input_price: priceDisplay(model.pricing && model.pricing.prompt),
      output_price: priceDisplay(model.pricing && model.pricing.completion),
      blended_price: blend === null ? "Not comparable" : priceDisplay(blend),
      blend_available: blend !== null,
      modality: model.architecture && typeof model.architecture.modality === "string"
        ? model.architecture.modality : "Modality not listed"
    }));
  return { drops: {
    available: models.length > 0, latest: models[0] || null, models,
    count: selected.length, cost_mode: sort === "cost", sort_label: SORTS[sort].label,
    heading: SORTS[sort].heading, other_heading: sort === "newest" ? "ALSO NEW" : "MORE MODELS",
    type_label: TYPES[type], age_label: days ? "Last " + days + " days" : "All dates",
    mix_label: inputRatio + ":1 in/out", mix_description: inputRatio === 1 ? "50% input / 50% output"
      : inputRatio === 3 ? "75% input / 25% output" : "90% input / 10% output",
    price_caption: sort === "cost" ? "USD/1M · " + inputRatio + ":1" : "USD / 1M",
    empty_message: sort === "cost" ? "No matching models with comparable token prices. Change filters or choose Newest."
      : "No models match these filters. Try another model type or a wider date range."
  } };
}

// Serverless uses run; the default transform runtime uses transform.
function run(input) {
  return transform(input);
}
