import { useEffect, useRef, useState } from "react";
import { generateScene, generationDefaults, presetPrompt, promptPresets, providers, renderPrompt, weatherPromptValues } from "../lib/generated-scene.js";

const maxMinutes = 7 * 24 * 60;

export function GeneratedSceneSettings({ config, onChange, context, hasImage, generatedImage, showGenerated, onToggle, onImage }) {
  const settings = { ...generationDefaults, ...config };
  const { provider, model, format, base, preset, prompt, minutes } = settings;
  const [key, setKey] = useState("");
  const [auto, setAuto] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const request = useRef(null);
  const generateLatest = useRef(null);
  const interval = Number(minutes);
  const validInterval = Number.isInteger(interval) && interval >= 1 && interval <= maxMinutes;

  function change(fields) {
    onChange({ ...settings, ...fields });
  }

  function resetConnection() {
    setKey("");
    setAuto(false);
    setStatus("");
  }

  async function generate(startAuto = false) {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setStatus("Generating background…");

    try {
      if (startAuto && !validInterval) throw new Error(`Enter a refresh interval from 1 to ${maxMinutes} minutes.`);
      if (!context.forecast) throw new Error("Wait for live weather to load or choose sample weather.");
      const promptText = renderPrompt(prompt, weatherPromptValues(context));
      const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(240_000)]);
      const src = await generateScene(settings, key, promptText, signal);
      const image = new Image();
      image.referrerPolicy = "no-referrer";
      const cancelDecode = () => image.removeAttribute("src");
      signal.throwIfAborted();
      signal.addEventListener("abort", cancelDecode, { once: true });
      try {
        image.src = src;
        await image.decode();
      } catch {
        signal.throwIfAborted();
        throw new Error("The returned image couldn’t be opened.");
      } finally {
        signal.removeEventListener("abort", cancelDecode);
      }
      signal.throwIfAborted();
      onImage(src);
      setStatus(`Background updated at ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.`);
    } catch (error) {
      if (!controller.signal.aborted) {
        setAuto(false);
        setStatus(error.name === "TimeoutError" ? "The image request timed out."
          : error instanceof TypeError ? "Couldn’t reach the image API. Check the URL and whether it allows browser requests."
            : error instanceof SyntaxError ? "The image API returned an unreadable response." : error.message);
      }
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  useEffect(() => {
    generateLatest.current = generate;
  });

  useEffect(() => {
    if (!auto || busy || !validInterval) return;
    const timer = setTimeout(() => generateLatest.current(), interval * 60_000);
    return () => clearTimeout(timer);
  }, [auto, busy, validInterval, interval]);

  useEffect(() => () => request.current?.abort(), []);

  return (
    <details className="scene-library">
      <summary>Generate weather backgrounds (BYOK){auto && " · Auto-refresh on"}</summary>
      <p className="setting-status">Use your own image API key. The preview sends the filled prompt to the selected provider.
        Your key stays in this tab’s memory. Generation can incur provider charges.</p>
      <form className="generation-form" autoComplete="off" noValidate onSubmit={event => { event.preventDefault(); generate(); }}>
        <label className="choice">
          <span>Provider</span>
          <select value={provider} disabled={busy} onChange={event => {
            const next = event.target.value;
            resetConnection();
            change({ provider: next, model: providers[next].model });
          }}>
            {Object.entries(providers).map(([id, option]) => <option key={id} value={id}>{option.label}</option>)}
          </select>
        </label>
        {provider === "custom" && <>
          <label className="choice">
            <span>API base URL</span>
            <input type="url" placeholder="https://provider.example/v1" value={base} disabled={busy}
              onChange={event => { resetConnection(); change({ base: event.target.value }); }} />
          </label>
          <label className="choice">
            <span>API format</span>
            <select value={format} disabled={busy} onChange={event => { resetConnection(); change({ format: event.target.value }); }}>
              <option value="images">Images API</option>
              <option value="chat">Chat Completions with image output</option>
            </select>
          </label>
        </>}
        <label className="choice">
          <span>Image model</span>
          <input value={model} onChange={event => {
            setAuto(false);
            change({ model: event.target.value });
          }} spellCheck={false} />
        </label>
        <label className="choice">
          <span>API key</span>
          <input type="password" autoComplete="off" value={key} disabled={busy} onChange={event => {
            setAuto(false);
            setStatus("");
            setKey(event.target.value);
          }} />
        </label>
        <label className="choice">
          <span>Refresh interval (minutes)</span>
          <input type="number" min="1" max={maxMinutes} step="1" value={minutes}
            onChange={event => {
              setAuto(false);
              change({ minutes: event.target.value });
            }} />
        </label>
        <label className="choice">
          <span>Prompt preset</span>
          <select value={preset} onChange={event => change({ preset: event.target.value, prompt: presetPrompt(event.target.value) })}>
            {Object.entries(promptPresets).map(([id, option]) => <option key={id} value={id}>{option.label}</option>)}
            {preset === "custom" && <option value="custom" disabled>Custom</option>}
          </select>
        </label>
        <label className="choice generation-prompt">
          <span>Prompt template</span>
          <textarea rows="7" value={prompt} onChange={event => change({ preset: "custom", prompt: event.target.value })} />
        </label>
        <p className="setting-status generation-prompt">Prompt fields{" "}
          {Object.keys(weatherPromptValues(context)).map(name => <code key={name}>{`{{${name}}}`}</code>)}
        </p>
        <div className="generation-actions generation-prompt">
          <button className="settings-button" type="submit" disabled={busy}>Generate now</button>
          {auto ? <button className="settings-button" type="button" onClick={() => setAuto(false)}>Pause auto-refresh</button>
            : <button className="settings-button" type="button" disabled={busy} onClick={() => {
              if (validInterval) setAuto(true);
              generate(true);
            }}>Start auto-refresh</button>}
          {hasImage && <label>
            <input type="checkbox" checked={showGenerated} disabled={busy}
              onChange={event => { if (!event.target.checked) setAuto(false); onToggle(event.target.checked); }} />
            {" "}Use generated background
          </label>}
          {generatedImage?.startsWith("data:image/") && <a className="settings-button" href={generatedImage}
            download={`weather-window.${generatedImage.split(/[\/;]/)[1]}`}>Download image</a>}
        </div>
      </form>
      <p className="setting-status">Auto-refresh generates once immediately and repeats while this tab is open.</p>
      <p className="setting-status" role="status">{status}</p>
    </details>
  );
}
