const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
class FixedDate extends Date {
  static now() { return Date.parse("2026-11-06T12:00:00Z"); }
}
const context = vm.createContext({ Date: FixedDate });
vm.runInContext(fs.readFileSync(path.join(__dirname, "../src/transform.js"), "utf8"), context);
const transform = input => JSON.parse(JSON.stringify(context.run(input)));
const model = (id, created = 1700000000, extra = {}) => ({
  id, name: id, created, context_length: 128000,
  architecture: { input_modalities: ["text"], output_modalities: ["text"] },
  pricing: { prompt: "0.0000002", completion: "0.000001" }, ...extra
});

test("real catalog fixture produces dated, priced drops without routing aliases", () => {
  const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/models.json"), "utf8"));
  const result = transform(fixture).drops;
  assert.equal(result.latest.id, "google/gemini-omni-1.2-flash");
  assert.equal(result.latest.added_date, "2026-11-05");
  assert.equal(result.latest.input_price, "$1.5");
  assert.equal(result.models.length, 16);
  assert.ok(result.models.every(m => !m.id.startsWith("openrouter/") && !m.id.includes(":batch")));
});

test("sorts newest first with stable ID tie breaks and removes duplicate IDs", () => {
  const result = transform({ data: [model("x/z"), model("x/b", 1700000001), model("x/a", 1700000001), model("x/a", 1700000001)] });
  assert.deepEqual(result.drops.models.map(m => m.id), ["x/a", "x/b", "x/z"]);
});

test("hides variants when the base exists but retains standalone free listings", () => {
  const result = transform({ data: [model("x/a:free", 1700000002), model("x/a"), model("x/b:free"), model("openrouter/auto")] });
  assert.deepEqual(result.drops.models.map(m => m.id), ["x/a", "x/b:free"]);
});

test("does not mistake missing, negative, or malformed rates for free tokens", () => {
  for (const value of [undefined, null, "", " ", "-1", "NaN", false, [], {}]) assert.equal(context.priceDisplay(value), "Not listed");
  assert.equal(context.priceDisplay("0"), "$0");
  assert.equal(context.priceDisplay("0.000000417"), "$0.417");
  assert.equal(context.priceDisplay("0.0000000001"), "<$0.001");
});

test("formats known context windows and leaves missing context unlisted", () => {
  assert.equal(context.contextDisplay(131072), "131k");
  assert.equal(context.contextDisplay(1048576), "1M");
  for (const value of [null, 0, -1, "128000"]) assert.equal(context.contextDisplay(value), "Not listed");
});

test("skips malformed and future-dated models and keeps explicit empty state", () => {
  const result = transform({ data: [null, {}, model("x/future", 9999999999), model("x/a", null), model("x/b", 1700000000, { name: " " })] });
  assert.equal(result.drops.available, false);
  assert.equal(result.drops.latest, null);
  assert.deepEqual(result.drops.models, []);
});

test("unexpected response passes through so templates can show data unavailable", () => {
  assert.deepEqual(transform({ error: "unavailable" }), { error: "unavailable" });
});

test("does not mutate the upstream response", () => {
  const input = { data: [model("x/b"), model("x/a", 1700000001)] };
  const original = JSON.stringify(input);
  transform(input);
  assert.equal(JSON.stringify(input), original);
});

function withFields(data, fields) {
  return transform({ data, trmnl: { plugin_settings: { custom_fields_values: fields } } }).drops;
}

test("blended cost uses the selected ratio and sorts the whole catalog before limiting", () => {
  const data = [
    model("x/input-cheap", 1700000000, { pricing: { prompt: "0.000001", completion: "0.000009" } }),
    model("x/output-cheap", 1700000000, { pricing: { prompt: "0.000004", completion: "0.000002" } }),
    ...Array.from({ length: 24 }, (_, i) => model("x/new-expensive" + i, 1700000100 + i, { pricing: { prompt: "0.01", completion: "0.01" } }))
  ];
  const three = withFields(data, { sort_by: "cost", token_mix: "3to1" });
  assert.equal(three.latest.id, "x/input-cheap");
  assert.equal(three.latest.blended_price, "$3");
  const equal = withFields(data, { sort_by: "cost", token_mix: "1to1" });
  assert.equal(equal.latest.id, "x/output-cheap");
  assert.equal(equal.latest.blended_price, "$3");
  const nine = withFields(data, { sort_by: "cost", token_mix: "9to1" });
  assert.equal(nine.latest.id, "x/input-cheap");
  assert.equal(nine.latest.blended_price, "$1.8");
  assert.equal(three.count, 26);
  assert.equal(three.models.length, 16);
});

test("cost comparisons reject media output and unknown token rates, retaining real zero prices", () => {
  const data = [
    model("x/missing", 1700000000, { pricing: { prompt: null, completion: "0" } }),
    model("x/variable", 1700000000, { pricing: { prompt: "-1", completion: "0" } }),
    model("x/media", 1700000000, { architecture: { output_modalities: ["text", "image"] } }),
    model("x/free", 1700000000, { pricing: { prompt: "0", completion: "0" } })
  ];
  const result = withFields(data, { sort_by: "cost" });
  assert.deepEqual(result.models.map(m => m.id), ["x/free"]);
  assert.equal(result.latest.blended_price, "$0");
  assert.equal(withFields(data, {}).models.find(m => m.id === "x/media").blended_price, "Not comparable");
});

test("cost sorting selects the cheapest variant once per model family", () => {
  const data = [model("x/a"), model("x/a:free", 1700000001, { pricing: { prompt: "0", completion: "0" } }), model("x/a:batch")];
  assert.deepEqual(withFields(data, { sort_by: "cost" }).models.map(m => m.id), ["x/a:free"]);
  assert.deepEqual(withFields(data, {}).models.map(m => m.id), ["x/a"]);
});

test("all model-type filters follow the actual modality arrays", () => {
  const architecture = (inputs, outputs) => ({ input_modalities: inputs, output_modalities: outputs });
  const data = [
    model("x/text"),
    model("x/vision", 1700000000, { architecture: architecture(["text", "image"], ["text"]) }),
    model("x/image", 1700000000, { architecture: architecture(["text"], ["text", "image"]) }),
    model("x/hear", 1700000000, { architecture: architecture(["text", "audio"], ["text"]) }),
    model("x/speak", 1700000000, { architecture: architecture(["text"], ["text", "audio"]) }),
    model("x/video", 1700000000, { architecture: architecture(["text", "image"], ["text", "video"]) })
  ];
  for (const [type, ids] of Object.entries({ text: ["x/text"], vision: ["x/vision"], image: ["x/image"], audio: ["x/hear", "x/speak"], video: ["x/video"] })) {
    assert.deepEqual(withFields(data, { model_type: type }).models.map(m => m.id), ids);
  }
  assert.equal(withFields(data, { model_type: "all" }).count, 6);
});

test("recency includes the UTC start of the selected window and excludes earlier seconds", () => {
  for (const days of [7, 30, 90]) {
    const start = Date.parse("2026-11-06T00:00:00Z") / 1000 - (days - 1) * 86400;
    const result = withFields([model("x/boundary", start), model("x/old", start - 1)], { added_within: String(days) });
    assert.deepEqual(result.models.map(m => m.id), ["x/boundary"]);
  }
});

test("largest-context sort leaves missing and invalid context after real windows", () => {
  const result = withFields([
    model("x/new-small", 1700000002, { context_length: 1000 }),
    model("x/old-large", 1700000000, { context_length: 1000000 }),
    model("x/missing", 1700000001, { context_length: null }),
    model("x/invalid", 1700000000, { context_length: Infinity })
  ], { sort_by: "context" });
  assert.deepEqual(result.models.map(m => m.id), ["x/old-large", "x/new-small", "x/missing", "x/invalid"]);
  assert.equal(result.heading, "LARGEST CONTEXT");
});

test("unknown settings fall back to safe defaults and incompatible filters explain the empty state", () => {
  const defaults = withFields([model("x/a")], { sort_by: "bogus", model_type: "bogus", token_mix: "bogus", added_within: "bogus" });
  assert.equal(defaults.heading, "LATEST DROP");
  assert.equal(defaults.type_label, "All types");
  assert.equal(defaults.mix_label, "3:1 in/out");
  const empty = withFields([model("x/a")], { sort_by: "cost", model_type: "video" });
  assert.equal(empty.available, false);
  assert.match(empty.empty_message, /comparable token prices/);
});
