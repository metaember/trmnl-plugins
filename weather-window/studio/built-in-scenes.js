import manifest from "../assets/scenes/manifest.json";
import { readManifest } from "../lib/scene-library.js";

const assets = import.meta.glob("../assets/scenes/*.{webp,png,jpg,jpeg,avif}", {
  eager: true, query: "?url", import: "default",
});

export const builtInScenes = Object.fromEntries(readManifest(manifest).map(({ id, name, image, collection, focus, skyX, nightLit }, index) => [
  id, { label: name, src: assets[`../assets/scenes/${image}`], collection, focus, skyX, nightLit, order: index },
]));
