import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createFeed, manifest } from "./lib/feed.js";
import { generationCache } from "./lib/generation-cache.js";

const scenes = new Set(manifest.map(scene => scene.image));
const types = { ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".gif": "image/gif", ".avif": "image/avif", ".json": "application/json" };

function json(res, code, data) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(data));
}

async function sendFile(res, path) {
  const file = await stat(path).catch(() => null);
  if (!file?.isFile()) return json(res, 404, { error: "Not found" });
  res.writeHead(200, { "Content-Type": types[extname(path)], "Content-Length": file.size,
    "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" });
  createReadStream(path).on("error", () => res.destroy()).pipe(res);
}

export function weatherServer({ publicUrl, directory, assetHosts, compatibleBases, ...options }) {
  const root = new URL(publicUrl);
  if (!root.pathname.endsWith("/")) root.pathname += "/";
  const generation = generationCache({ directory, compatibleBases, ...options });
  const feed = createFeed({ publicUrl: root, assetHosts, generation, ...options });
  const scenesDirectory = fileURLToPath(new URL("./assets/scenes/", import.meta.url));
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      const path = url.pathname;
      if (req.method === "GET") {
        if (path === "/health") return json(res, 200, { ok: true });
        const scene = path.slice("/scenes/".length);
        if (path.startsWith("/scenes/") && (scenes.has(scene) || scene === "manifest.json")) {
          return sendFile(res, resolve(scenesDirectory, scene));
        }
        const imagePath = path.startsWith("/generated/") && generation.imagePath(path.slice("/generated/".length));
        if (imagePath) return sendFile(res, imagePath);
      }
      if (req.method !== "POST" || path !== "/feed") return json(res, 404, { error: "Not found" });
      const chunks = [];
      let bytes = 0;
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 16_384) return json(res, 413, { error: "Settings payload is too large" });
        chunks.push(chunk);
      }
      const body = Buffer.concat(chunks).toString();
      let settings;
      try {
        settings = body ? JSON.parse(body) : {};
        if (!settings || typeof settings !== "object" || Array.isArray(settings)) throw new Error();
      } catch {
        return json(res, 400, { error: "Expected a JSON settings object" });
      }
      let key = "";
      if (settings.source === "generated" && typeof req.headers["x-weather-window-key"] === "string") {
        try {
          key = decodeURIComponent(req.headers["x-weather-window-key"].replaceAll("+", "%20")).trim().slice(0, 512);
        } catch {
          return json(res, 400, { error: "Invalid key header" });
        }
      }
      return json(res, 200, await feed(settings, key));
    } catch {
      if (!res.headersSent) json(res, 500, { error: "Weather Window feed is unavailable" });
      else res.destroy();
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4590);
  const publicUrl = process.env.WEATHER_WINDOW_PUBLIC_URL || `http://127.0.0.1:${port}/`;
  const list = name => (process.env[name] ?? "").split(",").map(value => value.trim()).filter(Boolean);
  const server = weatherServer({
    publicUrl,
    directory: resolve(process.env.WEATHER_WINDOW_CACHE || ".cache"),
    assetHosts: list("WEATHER_WINDOW_ASSET_HOSTS"),
    compatibleBases: list("WEATHER_WINDOW_IMAGE_APIS"),
  });
  server.listen(port, process.env.HOST || "127.0.0.1", () => console.log(`Weather Window listening on port ${port}`));
}
