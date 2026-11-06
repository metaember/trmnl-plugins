const LEADERBOARDS = {
  browsecomp_score: {
    label: "BrowseComp",
    short_label: "BC",
    capability: "Web Research",
    short_capability: "Web"
  },
  hle_score: {
    label: "Humanity's Last Exam",
    short_label: "HLE",
    capability: "Expert Knowledge and Reasoning",
    short_capability: "Knowledge"
  },
  swe_bench_pro_score: {
    label: "SWE-bench Pro",
    short_label: "SWE",
    capability: "Software Engineering",
    short_capability: "Coding"
  },
  toolathlon_score: {
    label: "Toolathlon",
    short_label: "Tool",
    capability: "Tool Use",
    short_capability: "Tools"
  },
  frontiermath_score: {
    label: "FrontierMath",
    short_label: "FM",
    capability: "Advanced Mathematics",
    short_capability: "Math"
  },
  mmmu_pro_score: {
    label: "MMMU-Pro",
    short_label: "MMMU",
    capability: "Multimodal Reasoning",
    short_capability: "Multimodal"
  },
  gpqa_score: {
    label: "GPQA Diamond",
    short_label: "GPQA",
    capability: "Graduate-Level Reasoning",
    short_capability: "Reasoning"
  },
  mcp_atlas_score: {
    label: "MCP Atlas",
    short_label: "MCP",
    capability: "MCP Tool Use",
    short_capability: "MCP Tools"
  },
  arc_agi_v2_score: {
    label: "ARC-AGI v2",
    short_label: "ARC",
    capability: "Abstract Reasoning",
    short_capability: "Reasoning"
  },
  mrcr_v2_score: {
    label: "MRCR v2",
    short_label: "MRCR",
    capability: "Long-Context Retrieval",
    short_capability: "Long Context"
  }
};

const DAILY_ROTATION = [
  "gpqa_score",
  "swe_bench_pro_score",
  "browsecomp_score",
  "frontiermath_score",
  "mmmu_pro_score",
  "toolathlon_score"
];

function dailyRotationKey(timestamp) {
  const numericTimestamp = Number(timestamp);
  const milliseconds = timestamp !== "" && Number.isFinite(numericTimestamp)
    ? numericTimestamp < 100000000000
      ? numericTimestamp * 1000
      : numericTimestamp
    : Date.parse(timestamp);

  if (!Number.isFinite(milliseconds)) return "gpqa_score";

  const utcDay = Math.floor(milliseconds / 86400000);
  const index = ((utcDay % DAILY_ROTATION.length) + DAILY_ROTATION.length)
    % DAILY_ROTATION.length;
  return DAILY_ROTATION[index];
}

function transform(input) {
  const rawData = input && input.data;
  const models = Array.isArray(rawData)
    ? rawData
    : rawData && Array.isArray(rawData.models)
      ? rawData.models
      : null;

  if (!models) return input;

  const customFields = input.trmnl
    && input.trmnl.plugin_settings
    && input.trmnl.plugin_settings.custom_fields_values;
  const requestedKey = customFields && customFields.leaderboard;
  const rotating = requestedKey === "rotate_daily";
  const suppliedTimestamp = input.trmnl
    && input.trmnl.system
    && input.trmnl.system.timestamp_utc;
  const timestamp = suppliedTimestamp == null ? Date.now() : suppliedTimestamp;

  let key = rotating
    ? dailyRotationKey(timestamp)
    : Object.prototype.hasOwnProperty.call(LEADERBOARDS, requestedKey)
      ? requestedKey
      : "gpqa_score";
  let leaderboard = LEADERBOARDS[key];
  let scoredModels = models.filter(model => model && model[key] != null);

  if (rotating && scoredModels.length === 0) {
    key = "gpqa_score";
    leaderboard = LEADERBOARDS[key];
    scoredModels = models.filter(model => model && model[key] != null);
  }

  const data = scoredModels
    .sort((left, right) => right[key] - left[key])
    .slice(0, 20)
    .map(model => ({
      name: model.name,
      organization: model.organization,
      release_date: model.release_date,
      score: model[key],
      score_display: `${(model[key] * 100).toFixed(1)}%`,
      context: model.context,
      input_price: model.input_price,
      output_price: model.output_price
    }));

  return {
    data,
    leaderboard: {
      key,
      label: leaderboard.label,
      short_label: leaderboard.short_label,
      capability: leaderboard.capability,
      short_capability: leaderboard.short_capability,
      rotating
    }
  };
}

// Support the serverless runner as well as the default transform runtime.
function run(input) {
  return transform(input);
}
