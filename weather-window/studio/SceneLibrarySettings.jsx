import { useState } from "react";
import { sceneUrl } from "../lib/scene-library.js";

export function SceneLibrarySettings({ source, gallery, onChange }) {
  const [kind, setKind] = useState(source?.kind ?? "manifest");
  const [url, setUrl] = useState(source?.url ?? "");
  const [error, setError] = useState("");
  const status = gallery?.error
    ?? (gallery?.scenes && source?.kind === "manifest" ? `${Object.keys(gallery.scenes).length} gallery scenes loaded.` : "");

  function apply(event) {
    event.preventDefault();
    try {
      const normalized = sceneUrl(url.trim(), window.location.origin);
      setUrl(normalized);
      setError("");
      onChange({ kind, url: normalized });
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <details className="scene-library">
      <summary>{gallery?.error ? "Scene library · unavailable" : "Scene library"}</summary>
      <form className="library-form" onSubmit={apply}>
        <label className="choice">
          <span>Source type</span>
          <select value={kind} onChange={event => { setKind(event.target.value); setError(""); }}>
            <option value="manifest">Gallery manifest</option>
            <option value="image">Single image</option>
          </select>
        </label>
        <label className="choice">
          <span>Scene library URL</span>
          <input type="url" placeholder={kind === "manifest" ? "https://…/manifest.json" : "https://…/landscape.webp"}
            value={url} onChange={event => { setUrl(event.target.value); setError(""); }} required />
        </label>
        <button className="settings-button" type="submit">Apply</button>
        {source && <button className="settings-button" type="button" onClick={() => {
          onChange(null);
          setUrl("");
          setError("");
        }}>Remove source</button>}
      </form>
      <p className="setting-status">Use a public GitHub file link or an HTTPS URL from your own host.</p>
      <p className="setting-status" role="status">
        {error || (source && (!gallery ? "Loading gallery…" : status))}
      </p>
    </details>
  );
}
