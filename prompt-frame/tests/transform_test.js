const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const { runInNewContext } = require("node:vm");
const { answer, completion, events, fields } = require("./fixtures.js");

const source = readFileSync(join(__dirname, "../src/transform.js"), "utf8");
const run = runInNewContext(source + "\nrun", { URL });
const eventSources = events.items.map((item) => item.source_url);
const layouts = JSON.parse(readFileSync(join(__dirname, "fixtures/layouts.json")));

function layoutCompletion(mode, overrides = {}) {
  return { mode, value: "", answer: "", source_url: "", items: [], ...layouts[mode], ...overrides };
}

test("filters uncorroborated picks and attaches provider source URLs in priority order", () => {
  const result = run(completion(events, [eventSources[2], eventSources[0] + "?utm_source=search"]));
  assert.deepEqual(
    Array.from(result.brief.items, (item) => [item.title, item.source.url]),
    [[events.items[0].title, eventSources[0]], [events.items[2].title, eventSources[2]]],
  );
  assert.equal(result.trmnl_state.brief.generated_at, 1794492600);
});

test("an unsourced web answer cannot replace the previous brief", () => {
  const good = run(completion(events, eventSources));
  const fresh = { ...answer, source_url: "https://uncited.example/" };
  const result = run(completion(fresh, ["https://other.example/"], {}, good.trmnl_state));
  assert.equal(result.brief, good.brief);
  assert.equal(result.stale, true);
});

test("uses saved state after fetch failures, malformed JSON, and truncated completions", () => {
  const good = run(completion(events, eventSources));
  const malformed = completion(events, eventSources, {}, good.trmnl_state);
  malformed.choices[0].message.content = "{";
  const truncated = completion(events, eventSources, {}, good.trmnl_state);
  truncated.choices[0].finish_reason = "length";
  for (const payload of [{ trmnl: malformed.trmnl }, malformed, truncated]) {
    assert.equal(run(payload).brief, good.brief);
    assert.equal(run(payload).stale, true);
  }
});

test("Custom defaults to offline and respects a pinned layout", () => {
  const settings = { preset: "custom", city: "", prompt: "Why does bread brown?", layout: "answer" };
  const result = run(completion(answer, [], settings));
  assert.equal(result.brief.answer, answer.answer);
  assert.equal(result.brief.source, undefined);
  assert.equal(run(completion(events, eventSources, settings)).brief, undefined);
});

test("a valid no-results response is a fresh brief even with a pinned list", () => {
  const value = {
    mode: "no_results",
    headline: "No confirmed events",
    answer: "I couldn't verify any remaining events for tonight.",
    source_url: "",
    items: [],
  };
  const result = run(completion(value, [], { layout: "list" }));
  assert.equal(result.brief.mode, "no_results");
  assert.equal(result.stale, undefined);
});

test("setup and provider errors produce useful notices without exposing the key", () => {
  const input = (overrides) => ({ trmnl: { plugin_settings: { custom_fields_values: { ...fields, ...overrides } } } });
  assert.match(run(input({ api_key: "" })).notice, /API key/);
  assert.match(run(null).notice, /API key/);
  assert.match(run(input({ preset: "custom" })).notice, /prompt/);
  assert.match(run(input({ city: "" })).notice, /city/);
  const result = run({ ...input({}), error: { code: 402, message: fields.api_key } });
  assert.match(result.notice, /credit or spend limit/);
  assert.doesNotMatch(JSON.stringify(result), /test-key/);
});

test("a big number requires a numeric value and keeps its supporting citation", () => {
  const url = "https://city.example/report";
  const value = { ...answer, mode: "metric", headline: "Parkland", value: "1,140 acres", source_url: url };
  assert.equal(run(completion(value, [url], { layout: "metric" })).brief.source.url, url);
  assert.equal(run(completion({ ...value, value: "Lots" }, [url], { layout: "metric" })).brief, undefined);
});

test("a sourced comparison needs two alternatives, each with a matching citation", () => {
  const value = { ...events, mode: "compare", items: events.items.slice(0, 2) };
  assert.equal(run(completion(value, eventSources)).brief.items.length, 2);
  assert.equal(run(completion(value, eventSources.slice(0, 1))).brief, undefined);
});

test("image mode renders only the configured public URL", () => {
  const value = { ...answer, mode: "image", answer: "", image_url: "https://model.example/invented.png" };
  const image_url = "https://images.example/poster.png";
  assert.equal(run(completion(value, [], { image_url })).brief.image_url, image_url);
  assert.equal(run(completion(value)).brief, undefined);
  for (const url of ["http://images.example/poster.png", "https://127.0.0.1/x.png", "https://token@images.example/x.png"]) {
    assert.match(run(completion(value, [], { layout: "image", image_url: url })).notice, /HTTPS image URL/);
  }
});

test("charts retain numeric order and units and reject malformed or inappropriate values", () => {
  const settings = { web: "off" };
  for (const mode of ["bar", "line", "area"]) {
    const result = run(completion(layoutCompletion(mode), [], settings));
    assert.deepEqual(Array.from(result.brief.points, ({ value }) => value), layouts[mode].points.map(({ value }) => value));
    assert.equal(result.brief.value, layouts[mode].value);
  }
  const area = layoutCompletion("area");
  area.points = [{ label: "First", value: -2 }, { label: "Second", value: 7 }];
  assert.equal(run(completion(area, [], settings)).brief, undefined);
  const line = layoutCompletion("line", { points: [{ label: "A", value: "12" }, { label: "B", value: 3 }] });
  assert.equal(run(completion(line, [], settings)).brief, undefined);
});

test("a web table needs a citation and preserves matching header and cell counts", () => {
  const url = "https://library.example/holds";
  const table = layoutCompletion("table", { source_url: url });
  assert.equal(run(completion(table, [url])).brief.rows.length, 6);
  assert.equal(run(completion(table)).brief, undefined);
  assert.equal(run(completion({ ...table, rows: [["Missing cells"]] }, [url])).brief, undefined);
});

test("articles preserve paragraphs and bullets do not require a detail", () => {
  const settings = { web: "off" };
  const article = run(completion(layoutCompletion("article"), [], settings)).brief;
  assert.equal(article.paragraphs.length, 3);
  assert.equal(article.answer, undefined);
  const bullets = run(completion(layoutCompletion("bullets"), [], settings)).brief;
  assert.equal(bullets.items.length, 5);
  assert.equal(bullets.items[0].detail, "");
});
