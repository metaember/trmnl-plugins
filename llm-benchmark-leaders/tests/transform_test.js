const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, "../src/transform.js"), "utf8"), context);
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures/models.json"), "utf8"));

test("each benchmark selects its own factual scores in descending order", () => {
  for (const key of Object.keys(vm.runInContext("LEADERBOARDS", context))) {
    const input = { data: fixture, trmnl: { plugin_settings: { custom_fields_values: { leaderboard: key } } } };
    const output = context.run(input);
    assert.equal(output.leaderboard.key, key);
    assert.ok(output.data.length > 0);
    assert.ok(output.data.every(m => typeof m.score === "number"));
    assert.ok(output.data.every((m, i, rows) => i === 0 || rows[i - 1].score >= m.score));
  }
});

test("daily rotation accepts UTC epoch seconds and date strings consistently", () => {
  const instant = "2026-11-06T12:00:00Z";
  assert.equal(context.dailyRotationKey(instant), context.dailyRotationKey(Date.parse(instant) / 1000));
  assert.notEqual(context.dailyRotationKey(instant), context.dailyRotationKey("2026-11-07T12:00:00Z"));
});

test("unrecognized settings and unsupported input keep the documented fallback", () => {
  assert.equal(context.run({ data: fixture }).leaderboard.key, "gpqa_score");
  const input = { error: "Feed unavailable" };
  assert.equal(context.run(input), input);
});

test("transform does not mutate the original model list", () => {
  const before = JSON.stringify(fixture);
  context.run({ data: fixture });
  assert.equal(JSON.stringify(fixture), before);
});
