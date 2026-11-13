import { useEffect, useRef, useState } from "react";
import { searchPlaces } from "../lib/local-weather.js";

export function LocationSettings({ place, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("");
  const request = useRef(null);

  useEffect(() => () => request.current?.abort(), []);

  async function search(event) {
    event.preventDefault();
    const name = query.trim();
    if (name.length < 2) {
      setStatus("Enter at least two characters.");
      return;
    }
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setResults([]);
    setStatus("Searching…");

    try {
      const matches = await searchPlaces(name, controller.signal);
      if (controller.signal.aborted) return;
      setResults(matches);
      setStatus(matches.length ? "" : "No matches. Try a nearby city or postal code.");
    } catch {
      if (!controller.signal.aborted) setStatus("Place search is unavailable. Try again.");
    }
  }

  function updateQuery(event) {
    request.current?.abort();
    setQuery(event.target.value);
    setResults([]);
    setStatus("");
  }

  return (
    <div className="location">
      <form className="choice" onSubmit={search}>
        <label htmlFor="location-search">Location</label>
        <div className="location-input">
          <input id="location-search" type="search" value={query} onChange={updateQuery}
            placeholder={place?.label ?? "City or postal code"} autoComplete="off" />
          <button type="submit">Search</button>
        </div>
      </form>
      {status && <p className="setting-status" role="status">{status}</p>}
      {results.length > 0 && (
        <ul className="location-results" aria-label="Matching locations">
          {results.map(match => (
            <li key={match.id}>
              <button type="button" onClick={() => {
                onSelect(match);
                setResults([]);
                setQuery("");
              }}>{match.label}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
