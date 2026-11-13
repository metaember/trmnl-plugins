import { access, readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { readManifest, sceneId } from "../lib/scene-library.js";

const directory = new URL("../assets/scenes/", import.meta.url);
const usage = 'npm run scene:generate -- <id> "<display name>" "<scene description>" [--collection "<name>"] [--prompt-only]';
const style = [
  "Create one new wide landscape illustration for an e-ink weather display.",
  "The supplied Rocky Coast artwork is a style reference only. Use its restrained grayscale print-illustration style, crisp foreground silhouettes, broad value areas and soft distant textures.",
  "Follow the new scene’s composition. Leave out the reference’s left-edge tree and use only vegetation called for by the scene.",
  "Full-bleed wide landscape near 1.9:1, viewed at normal eye level. Use neutral soft daylight unless the scene calls for other lighting. Leave open sky for procedural weather and keep the foreground readable under a dark night treatment.",
  "When the scene calls for crowds, show people at several depths with distinct poses and legible foreground activity. Leave open walkways and room between groups unless the description calls for a tightly packed crowd.",
  "No text, borders, frames, interface, visible sun or moon, or effects such as rain and fog.",
].join(" ");

async function run() {
  const { values, positionals } = parseArgs({
    options: { help: { type: "boolean" }, "prompt-only": { type: "boolean" }, collection: { type: "string", default: "Quiet views" } },
    allowPositionals: true,
  });
  if (values.help) {
    console.log(usage);
    return;
  }
  const [id, name, description] = positionals.map(value => value.trim());
  const collection = values.collection.trim();
  if (positionals.length !== 3 || !sceneId.test(id) || id === "random" || !name || !description || !collection) {
    throw new Error(usage);
  }
  const prompt = `${style}\n${name}. ${description}`;
  if (values["prompt-only"]) {
    console.log(prompt);
    return;
  }

  const manifest = readManifest(JSON.parse(await readFile(new URL("manifest.json", directory), "utf8")));
  if (manifest.some(entry => entry.id === id)) throw new Error(`Scene ID already exists: ${id}`);
  const image = `${id}.webp`;
  const output = new URL(image, directory);
  try {
    await access(output);
    throw new Error(`Scene file already exists: ${image}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Set OPENAI_API_KEY in the environment, or use --prompt-only.");

  const form = new FormData();
  form.set("model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-2");
  form.set("prompt", prompt);
  form.set("size", "1600x848");
  form.set("quality", "medium");
  form.set("output_format", "webp");
  form.set("output_compression", "90");
  const reference = await readFile(new URL("rocky-coast.webp", directory));
  form.append("image[]", new Blob([reference], { type: "image/webp" }), "rocky-coast.webp");

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(300000),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message ?? `Image API returned HTTP ${response.status}.`);
  const bytes = Buffer.from(result.data?.[0]?.b64_json ?? "", "base64");
  if (bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP") {
    throw new Error("The Image API did not return a WebP image.");
  }
  await writeFile(output, bytes, { flag: "wx" });
  console.log(`Saved assets/scenes/${image}. After reviewing it, add this entry to assets/scenes/manifest.json.`);
  console.log(JSON.stringify({ id, name, image, collection }, null, 2));
}

run().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
