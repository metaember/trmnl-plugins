import { builtInScenes } from "./built-in-scenes.js";
import { scenesInCollection } from "../lib/scene-library.js";

const collection = document.querySelector("#collection");
const search = document.querySelector("#search");
const sort = document.querySelector("#sort");
const count = document.querySelector("#scene-count");
const grid = document.querySelector("#scene-grid");

for (const name of new Set(Object.values(builtInScenes).map(scene => scene.collection))) {
  collection.add(new Option(name, name));
}

function sceneCard({ label, collection, src }) {
  const item = document.createElement("li");
  const link = document.createElement("a");
  link.className = "scene-card";
  link.href = src;
  link.target = "_blank";
  link.rel = "noopener";
  link.setAttribute("aria-label", `Open ${label} at full size, ${collection} (new tab)`);

  const image = document.createElement("img");
  image.alt = "";
  image.loading = "lazy";
  image.decoding = "async";
  image.src = src;

  const caption = document.createElement("div");
  caption.className = "scene-caption";
  const title = document.createElement("strong");
  title.textContent = label;
  const category = document.createElement("span");
  category.textContent = collection;
  caption.append(title, category);
  link.append(image, caption);
  item.append(link);
  return item;
}

const sortBy = {
  catalog: (a, b) => a.order - b.order,
  newest: (a, b) => b.order - a.order,
  name: (a, b) => a.label.localeCompare(b.label),
};

function render() {
  const query = search.value.trim().toLowerCase();
  const scenes = Object.values(scenesInCollection(builtInScenes, collection.value))
    .filter(scene => scene.label.toLowerCase().includes(query))
    .sort(sortBy[sort.value]);
  grid.replaceChildren(...scenes.map(sceneCard));
  count.textContent = scenes.length ? `${scenes.length} ${scenes.length === 1 ? "scene" : "scenes"}` : "No scenes match these filters.";
}

collection.addEventListener("change", render);
search.addEventListener("input", render);
sort.addEventListener("change", render);
render();
