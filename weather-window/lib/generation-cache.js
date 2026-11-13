import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generateScene } from "./generated-scene.js";

const imageName = /^[a-f0-9-]{36}\.(png|jpg|webp|gif|avif)$/;

function rasterFormat(buffer) {
  if (buffer.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) return "png";
  if (buffer.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex"))) return "jpg";
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (/^GIF8[79]a$/.test(buffer.toString("ascii", 0, 6))) return "gif";
  if (buffer.toString("ascii", 4, 12) === "ftypavif") return "avif";
  throw new Error("Unsupported image data");
}

export function generationCache({ directory, compatibleBases = [], requestImage = generateScene, clock = Date.now }) {
  const allowed = new Set(compatibleBases.map(base => base.replace(/\/+$/, "")));
  const pending = new Map();
  const ready = mkdir(directory, { recursive: true, mode: 0o700 });

  async function store(path, record) {
    const temporary = `${path}.${randomUUID()}.tmp`;
    await writeFile(temporary, JSON.stringify(record), { mode: 0o600 });
    await rename(temporary, path);
  }

  function readRecord(path) {
    return readFile(path, "utf8").then(JSON.parse).catch(error => {
      if (error.code === "ENOENT") return {};
      throw new Error("Image cache is unavailable");
    });
  }

  function isDue(record, minutes) {
    return record.started === undefined || clock() - record.started >= minutes * 60_000;
  }

  async function run(path, options) {
    const previous = await readRecord(path);
    if (!isDue(previous, options.minutes)) return;
    const record = { ...previous, started: clock(), failed: true };
    await store(path, record);
    try {
      const source = await requestImage(options.config, options.key, options.prompt, AbortSignal.timeout(240_000));
      const match = /^data:image\/(?:png|jpeg|webp|gif|avif);base64,([A-Za-z0-9+/]+=*)$/.exec(source);
      if (!match || match[1].length > 16_000_000) throw new Error("Expected a raster image encoded as base64");
      const bytes = Buffer.from(match[1], "base64");
      const image = `${randomUUID()}.${rasterFormat(bytes)}`;
      await writeFile(join(directory, image), bytes, { flag: "wx", mode: 0o600 });
      await store(path, { image, previous: previous.image, started: record.started, failed: false });
      if (imageName.test(previous.previous ?? "")) await rm(join(directory, previous.previous), { force: true });
    } catch {
      // Provider responses and keys stay out of logs and returned status.
    }
  }

  return {
    imagePath(name) {
      return imageName.test(name) ? join(directory, name) : null;
    },
    async get(options) {
      await ready;
      const { config, key, identity, minutes } = options;
      if (config.provider === "custom") {
        const base = config.base.replace(/\/+$/, "");
        if (!base.startsWith("https://") || !allowed.has(base)) throw new Error("This feed has not enabled that custom API base URL.");
      }
      const digest = createHash("sha256").update(JSON.stringify([config, key, identity])).digest("hex");
      const path = join(directory, `${digest}.json`);
      const record = await readRecord(path);
      const image = imageName.test(record.image ?? "") ? record.image : undefined;
      const due = isDue(record, minutes);
      if (due && !pending.has(digest) && pending.size < 3) {
        const job = run(path, options).catch(() => {}).finally(() => pending.delete(digest));
        pending.set(digest, job);
      }
      return { image, status: pending.has(digest) ? "Generating background…"
        : due ? "Image generation is queued for the next refresh"
          : record.failed ? "Image generation failed · check your key, model or provider" : "" };
    },
  };
}
