export const sceneId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function readManifest(data) {
  if (data?.version !== 1 || !Array.isArray(data.scenes) || !data.scenes.length) {
    throw new Error("Use a version 1 scene manifest with at least one scene.");
  }
  const ids = new Set();
  return data.scenes.map(entry => {
    if (typeof entry?.id !== "string" || !sceneId.test(entry.id) || entry.id === "random" || ids.has(entry.id)
      || typeof entry.name !== "string" || !entry.name.trim() || typeof entry.image !== "string" || !entry.image.trim()) {
      throw new Error("Each scene needs a unique lowercase ID, a name, and an image path.");
    }
    if (entry.collection !== undefined && (typeof entry.collection !== "string" || !entry.collection.trim())) {
      throw new Error("A scene collection must have a name.");
    }
    if (entry.focus !== undefined && !["top", "center", "bottom"].includes(entry.focus)) {
      throw new Error("A scene’s focus must be top, center, or bottom.");
    }
    if (entry.skyX != null && (!Number.isFinite(entry.skyX) || entry.skyX < 0 || entry.skyX > 1)) {
      throw new Error("A scene’s skyX must be null or a number between 0 and 1.");
    }
    if (entry.nightLit !== undefined && typeof entry.nightLit !== "boolean") {
      throw new Error("A scene’s nightLit value must be true or false.");
    }
    ids.add(entry.id);
    return {
      id: entry.id, name: entry.name.trim(), image: entry.image.trim(),
      collection: entry.collection?.trim() ?? "Other", focus: entry.focus ?? "center",
      skyX: entry.skyX, nightLit: entry.nightLit,
    };
  });
}

export function scenesInCollection(scenes, collection) {
  return collection
    ? Object.fromEntries(Object.entries(scenes).filter(([, scene]) => scene.collection === collection))
    : scenes;
}

export function sceneUrl(value, origin, base) {
  let url;
  try {
    url = new URL(value, base);
  } catch {
    throw new Error("Enter a full URL.");
  }
  if ((url.protocol !== "https:" && !(url.protocol === "http:" && url.origin === origin)) || url.username || url.password) {
    throw new Error("Use an HTTPS URL without a username or password.");
  }
  if (url.hostname === "github.com") {
    const [owner, repo, view, ...path] = url.pathname.split("/").filter(Boolean);
    if (view !== "blob" || path.length < 2) {
      throw new Error("Paste the GitHub link to the manifest or image file.");
    }
    return new URL([owner, repo, ...path].join("/"), "https://raw.githubusercontent.com/").href;
  }
  url.hash = "";
  return url.href;
}

export async function fetchGallery(source, origin, signal) {
  if (source.kind === "image") {
    return { "external-image": { label: "Custom image", src: source.url, collection: "Custom", focus: "center", order: 0 } };
  }

  const response = await fetch(source.url, {
    credentials: "omit",
    referrerPolicy: "no-referrer",
    cache: "no-cache",
    signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]),
  });
  if (!response.ok) throw new Error(`The gallery returned HTTP ${response.status}.`);
  const entries = readManifest(await response.json());
  return Object.fromEntries(entries.map(({ id, name, image, collection, focus, skyX, nightLit }, index) => [
    `external-${id}`, { label: name, src: sceneUrl(image, origin, response.url || source.url), collection, focus, skyX, nightLit, order: index },
  ]));
}
