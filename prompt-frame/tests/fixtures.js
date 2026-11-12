const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const fields = {
  api_key: "test-key",
  preset: "daily",
  city: "Brooklyn, NY",
  web: "preset",
  layout: "auto",
};

function fixtureContent(name) {
  const body = JSON.parse(readFileSync(join(__dirname, "fixtures", `${name}.json`)));
  return JSON.parse(body.choices[0].message.content);
}

const events = fixtureContent("events");
const answer = fixtureContent("answer");

function completion(value, urls = [], overrides = {}, state = {}) {
  return {
    created: 1794492600,
    choices: [{
      finish_reason: "stop",
      message: {
        content: JSON.stringify({ value: "", ...value }),
        annotations: urls.map((url) => ({ type: "url_citation", url_citation: { url } })),
      },
    }],
    trmnl: { plugin_settings: { custom_fields_values: { ...fields, ...overrides } }, state },
  };
}


module.exports = { answer, completion, events, fields };
