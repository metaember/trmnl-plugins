import { readFile, writeFile } from "node:fs/promises";
import { build } from "esbuild";

const template = await readFile(new URL("./shared.liquid", import.meta.url), "utf8");
const result = await build({ entryPoints: ["lib/overlay.js"], bundle: true, minify: true, target: "chrome110",
  format: "iife", write: false, legalComments: "none" });
const overlay = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const lighthouse = await readFile(new URL("../assets/preview/lighthouse.webp", import.meta.url));
const shared = template.replace("/* weather overlay */", () => overlay)
  .replace("/* lighthouse preview */", lighthouse.toString("base64"));
await writeFile(new URL("../src/shared.liquid", import.meta.url), shared);
