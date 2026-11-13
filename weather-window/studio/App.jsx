import { useEffect, useRef, useState } from "react";
import { builtInScenes } from "./built-in-scenes.js";
import { GeneratedSceneSettings } from "./GeneratedSceneSettings.jsx";
import { LocationSettings } from "./LocationSettings.jsx";
import { SceneLibrarySettings } from "./SceneLibrarySettings.jsx";
import { fetchForecast, formatTemperature, formatWind } from "../lib/local-weather.js";
import { moonAppearance } from "../lib/moon.js";
import { choicePool, pickFrom, rollAgain } from "../lib/random-choice.js";
import { fetchGallery, scenesInCollection } from "../lib/scene-library.js";
import { drawWeather, forecasts, sampleWeek, shortConditions } from "../lib/weather.js";

const frames = {
  picture: { label: "Picture window" },
  sash: { label: "Double-hung" },
  panes: { label: "Four-pane window" },
  none: { label: "Frameless" },
};

const sillFinishes = {
  dark: { label: "Charcoal" },
  slate: { label: "Slate" },
  light: { label: "Limestone" },
  outline: { label: "Outline" },
};

const footerLayouts = {
  current: { label: "Now + outlook" },
  minimal: { label: "Minimal" },
  words: { label: "In words" },
  hourly: { label: "Hourly" },
  weekly: { label: "Weekly" },
  details: { label: "Weather details" },
  none: { label: "Hidden" },
};

const temperatures = { F: { label: "Fahrenheit (°F)" }, C: { label: "Celsius (°C)" } };
const windSpeeds = { mph: { label: "mph" }, "km/h": { label: "km/h" } };
const settingsKey = "weather-window-settings";
const appearanceFields = ["landscape", "frame", "finish", "footer", "weather"];
const randomNewer = "@newer";
const defaultChoices = { collection: "Quiet views", landscape: randomNewer, frame: "none", finish: "dark", footer: "current", weather: "live" };

function isRandom(value) {
  return value === "random" || value === randomNewer;
}

function loadSettings() {
  const defaults = { place: null, temperatureUnit: "F", windUnit: "mph" };
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(settingsKey)) };
  } catch {
    return defaults;
  }
}

function Choice({ label, options, groups, value, onChange, random = false, favorNew = false }) {
  const renderOptions = entries => Object.entries(entries).map(([key, option]) => (
    <option key={key} value={key} disabled={option.disabled}>{option.label}</option>
  ));
  return (
    <label className="choice">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {random && <option value="random">Random</option>}
        {favorNew && <option value={randomNewer}>Random · newer</option>}
        {groups ? groups.map(([name, entries]) => (
          <optgroup key={name} label={name}>{renderOptions(entries)}</optgroup>
        )) : renderOptions(options)}
      </select>
    </label>
  );
}

function WeatherLayer({ weather, forecast, moon, skyX }) {
  const canvas = useRef(null);

  useEffect(() => {
    const element = canvas.current;
    function render() {
      const { clientWidth, clientHeight, width } = element;
      if (!clientWidth || !clientHeight) return;
      const height = Math.round(width * clientHeight / clientWidth);
      if (element.height !== height) element.height = height;
      drawWeather(element.getContext("2d"), weather, forecast, moon, width, height, skyX);
    }
    render();
    const observer = new ResizeObserver(render);
    observer.observe(element);
    return () => observer.disconnect();
  }, [weather, forecast, moon, skyX]);

  return <canvas ref={canvas} width={800} className="weather-layer" aria-hidden="true" />;
}

function WeeklyForecast({ days, unit }) {
  return (
    <dl className="weekly-grid" aria-label={`Seven-day forecast in degrees ${unit === "C" ? "Celsius" : "Fahrenheit"}`}>
      {days.map(({ day, condition, effect, high, low }) => (
        <div key={day}>
          <dt>{day}{day === "Today" && <span className="weekly-unit">°{unit}</span>}</dt>
          <dd>
            <span className="weekly-condition" title={condition} aria-label={condition}>{shortConditions[effect] ?? "—"}</span>
            <span className="weekly-range">
              <strong aria-label={`High ${formatTemperature(high, unit)}`}>{formatTemperature(high, unit, false)}</strong>
              <span aria-label={`Low ${formatTemperature(low, unit)}`}>{formatTemperature(low, unit, false)}</span>
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ForecastFooter({ layout, finish, forecast, effect, settings }) {
  if (layout === "none" || !forecast) return null;
  const { temperatureUnit, windUnit, place } = settings;
  const temperature = value => formatTemperature(value, temperatureUnit);

  if (layout === "weekly") {
    const days = forecast.weekly ?? sampleWeek(forecast, effect, place?.timezone);
    return (
      <figcaption className="sill" data-finish={finish} data-layout={layout}>
        <WeeklyForecast days={days} unit={temperatureUnit} />
      </figcaption>
    );
  }

  let entries;
  if (layout === "hourly") {
    entries = forecast.hourly.map(({ time, temperature: value, condition }) => ({
      label: time, value: temperature(value), condition,
    }));
  }
  if (layout === "details") {
    entries = [
      { label: "High", value: temperature(forecast.high) },
      { label: "Low", value: temperature(forecast.low) },
      { label: "Precip.", value: Number.isFinite(forecast.precipitation) ? `${forecast.precipitation}%` : "—" },
      { label: "Wind", value: formatWind(forecast.wind, windUnit) },
    ];
  }

  return (
    <figcaption className="sill" data-finish={finish} data-layout={layout}>
      {entries ? (
        <dl className="forecast-grid">
          {entries.map(({ label, value, condition }, index) => (
            <div key={`${label}-${index}`}>
              <dt>{label}</dt>
              <dd><strong>{value}</strong>{condition && <span>{condition}</span>}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <>
          <span className="conditions">
            <strong className="temperature">{temperature(forecast.temperature)}</strong>
            {layout !== "words" && <span className="condition">{forecast.label}</span>}
          </span>
          {layout === "current" && <span className="outlook">{forecast.next}</span>}
          {layout === "words" && <span className="summary">{forecast.summary}</span>}
        </>
      )}
    </figcaption>
  );
}

function WindowPreview({ frame, scene, generated, finish, footer, effect, forecast, moon, settings }) {
  const fallback = builtInScenes.hills;
  const isFallback = scene.src === fallback.src;
  const [imageStatus, setImageStatus] = useState(null);
  const loaded = imageStatus?.src === scene.src && imageStatus.loaded;
  const failed = imageStatus?.src === scene.src && !imageStatus.loaded;
  const displayedScene = isFallback || loaded ? scene : fallback;
  const hideFooter = footer === "none" || !forecast;
  const description = [
    generated ? "Generated weather background" : failed ? fallback.label : scene.label, forecast?.label, forecast && formatTemperature(forecast.temperature, settings.temperatureUnit),
    forecast?.next, moon?.phase,
  ].filter(Boolean).join(". ");

  return (
    <>
      <figure className="display" data-footer={hideFooter ? "none" : footer} data-finish={finish} aria-label="Weather Window preview">
        <div className="window" data-frame={frame} data-weather={generated ? undefined : effect}
          data-night={!generated && (effect === "night" || forecast?.isNight)}
          data-night-lit={displayedScene.nightLit}
          style={{ "--weather-intensity": forecast?.amount ?? 0 }}
          role="img" aria-label={description}>
          <div className="glass">
            {generated ? <img className="landscape" src={generated} alt="" referrerPolicy="no-referrer" /> : <>
              <img className="landscape" src={fallback.src} alt="" hidden={!isFallback && loaded} />
              {!isFallback && (
                <img key={scene.src} className="landscape" src={scene.src} alt="" hidden={!loaded} referrerPolicy="no-referrer"
                  style={{ objectPosition: `center ${scene.focus}` }}
                  onLoad={() => setImageStatus({ src: scene.src, loaded: true })}
                  onError={() => setImageStatus({ src: scene.src, loaded: false })} />
              )}
              <WeatherLayer weather={effect} forecast={forecast} moon={moon} skyX={displayedScene.skyX} />
            </>}
          </div>
          <div className="frame" aria-hidden="true" />
        </div>
        <ForecastFooter layout={footer} finish={finish} forecast={forecast} effect={effect} settings={settings} />
      </figure>
      {!generated && failed && <p className="setting-status" role="status">Couldn’t load {scene.label}. Showing Winter hills.</p>}
    </>
  );
}

export function App() {
  const [settings, setSettings] = useState(loadSettings);
  const [rolls, setRolls] = useState(() => Object.fromEntries(appearanceFields.map(field => [field, Math.random()])));
  const [galleryResult, setGalleryResult] = useState(null);
  const [live, setLive] = useState(null);
  const [retry, setRetry] = useState(0);
  const [generated, setGenerated] = useState(null);
  const [showGenerated, setShowGenerated] = useState(false);
  const { place, source } = settings;
  const gallery = galleryResult?.source === source ? galleryResult : null;
  const externalScenes = gallery?.scenes ?? {};
  const scenes = { ...builtInScenes, ...externalScenes };
  const savedChoices = settings.choices ?? {};
  const choices = { ...defaultChoices, collection: savedChoices.landscape ? "" : defaultChoices.collection, ...savedChoices };
  const collectionNames = new Set(Object.values(scenes).map(scene => scene.collection));
  const collection = collectionNames.has(choices.collection) ? choices.collection : "";
  const collectionOptions = Object.fromEntries([["", { label: "All scenes" }],
    ...Array.from(collectionNames, name => [name, { label: name }])]);
  const visibleBuiltIn = scenesInCollection(builtInScenes, collection);
  const visibleExternal = scenesInCollection(externalScenes, collection);
  const visibleScenes = { ...visibleBuiltIn, ...visibleExternal };
  const galleryDefault = Object.keys(visibleExternal)[0];
  const pools = {
    landscape: galleryDefault ? visibleExternal : visibleBuiltIn,
    frame: frames, finish: sillFinishes, footer: footerLayouts, weather: forecasts,
  };
  const randomFields = appearanceFields.filter(field => isRandom(choices[field]));
  const randomPools = Object.fromEntries(randomFields.map(field => [
    field, choicePool(pools[field], choices[field] === randomNewer),
  ]));
  const picks = Object.fromEntries(randomFields.map(field => [field, pickFrom(randomPools[field], rolls[field])]));
  const requestedScene = picks.landscape ?? (choices.landscape === "external-default" ? galleryDefault : choices.landscape);
  const landscape = Object.hasOwn(visibleScenes, requestedScene)
    ? requestedScene : Object.keys(visibleScenes)[0];
  const frame = picks.frame ?? choices.frame;
  const finish = picks.finish ?? choices.finish;
  const footer = picks.footer ?? choices.footer;
  const weather = picks.weather ?? (choices.weather === "live" && !place ? "snow" : choices.weather);

  useEffect(() => {
    try {
      localStorage.setItem(settingsKey, JSON.stringify(settings));
    } catch {
      // Settings remain usable for this session when browser storage is unavailable.
    }
  }, [settings]);

  useEffect(() => {
    if (!source) return;
    const controller = new AbortController();
    fetchGallery(source, window.location.origin, controller.signal).then(scenes => {
      if (!controller.signal.aborted) setGalleryResult({ source, scenes });
    }).catch(error => {
      if (controller.signal.aborted) return;
      const message = error instanceof TypeError || error instanceof SyntaxError || error.name === "TimeoutError"
        ? "Couldn’t load a JSON gallery. Check the file URL and whether the host allows browser access."
        : error.message;
      setGalleryResult({ source, error: message });
    });
    return () => controller.abort();
  }, [source]);

  useEffect(() => {
    if (weather !== "live" || !place) return;
    const controller = new AbortController();

    async function refresh() {
      try {
        const forecast = await fetchForecast(place, controller.signal);
        if (!controller.signal.aborted) setLive({ placeId: place.id, forecast });
      } catch {
        if (!controller.signal.aborted) setLive({ placeId: place.id, failed: true });
      }
    }

    refresh();
    const timer = setInterval(refresh, 15 * 60 * 1000);
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, [place, retry, weather]);

  const liveResult = live?.placeId === place?.id ? live : null;
  const forecast = weather === "live" ? liveResult?.forecast : forecasts[weather];
  const effect = forecast?.effect ?? (weather === "live" ? undefined : weather);
  const moon = effect === "night" ? moonAppearance(new Date(forecast.time ?? Date.now()), place, weather === "live") : null;

  function choosePlace(nextPlace) {
    setSettings(current => ({
      ...current, place: nextPlace, choices: nextPlace ? { ...current.choices, weather: "live" } : current.choices,
    }));
    setLive(null);
  }

  function choose(field, value) {
    if (field !== "collection" && isRandom(value)) {
      const previous = field === "landscape" ? landscape : choices[field];
      const pool = choicePool(pools[field], value === randomNewer);
      setRolls({ ...rolls, [field]: rollAgain(pool, previous) });
    }
    setSettings(current => ({ ...current, choices: { collection, ...current.choices, [field]: value } }));
  }

  function shuffle() {
    const next = randomFields.map(field => [field, rollAgain(randomPools[field], picks[field])]);
    setRolls({ ...rolls, ...Object.fromEntries(next) });
  }

  function changeSource(nextSource) {
    setSettings(current => ({
      ...current,
      source: nextSource,
      choices: {
        ...current.choices,
        collection: nextSource ? "" : collection,
        landscape: isRandom(choices.landscape) ? choices.landscape
          : nextSource ? "external-default" : Object.hasOwn(builtInScenes, landscape) ? landscape : "hills",
      },
    }));
  }

  return (
    <main className="workspace">
      <header className="heading heading-with-link">
        <h1>Weather Window Studio</h1>
        <a className="heading-link" href="./gallery.html">Scene Gallery</a>
      </header>
      <fieldset className="choices" aria-label="Customize the window">
        <Choice label="Collection" options={collectionOptions} value={collection} onChange={value => choose("collection", value)} />
        <Choice label="Landscape" random favorNew options={visibleScenes}
          groups={galleryDefault && [["Connected library", visibleExternal], ["Built-in scenes", visibleBuiltIn]]
            .filter(([, entries]) => Object.keys(entries).length)}
          value={isRandom(choices.landscape) ? choices.landscape : landscape} onChange={value => choose("landscape", value)} />
        <Choice label="Frame" random options={frames} value={choices.frame} onChange={value => choose("frame", value)} />
        <Choice label="Sill finish" random options={sillFinishes} value={choices.finish} onChange={value => choose("finish", value)} />
        <Choice label="Forecast footer" random options={footerLayouts} value={choices.footer} onChange={value => choose("footer", value)} />
        <Choice label="Weather" random options={{ live: { label: "Live weather" }, ...forecasts }}
          value={choices.weather} onChange={value => choose("weather", value)} />
      </fieldset>
      <section className="weather-settings" aria-label="Weather settings">
        <LocationSettings place={place} onSelect={choosePlace} />
        <Choice label="Temperature" options={temperatures} value={settings.temperatureUnit}
          onChange={temperatureUnit => setSettings(current => ({ ...current, temperatureUnit }))} />
        <Choice label="Wind speed" options={windSpeeds} value={settings.windUnit}
          onChange={windUnit => setSettings(current => ({ ...current, windUnit }))} />
      </section>
      {place && (
        <div className="location-status">
          <span>{place.label}</span>
          <button type="button" onClick={() => choosePlace(null)}>Clear location</button>
        </div>
      )}
      <WindowPreview frame={frame} scene={scenes[landscape]} generated={showGenerated ? generated : null} finish={finish} footer={footer}
        effect={effect} forecast={forecast} moon={moon} settings={settings} />
      <div className="preview-status">
        {randomFields.length > 0 && <button type="button" onClick={shuffle}>Shuffle</button>}
        {showGenerated ? <span>Generated background</span>
          : isRandom(choices.landscape) && <span aria-live="polite">{scenes[landscape].label}</span>}
        <span role="status">
          {choices.weather === "live" && !place && "Set a location for live weather. Showing sample snow."}
          {weather === "live" && !forecast && (liveResult?.failed ? "Live weather is unavailable." : "Loading live weather…")}
          {choices.weather === "random" && `Sample weather · ${forecast.label}`}
          {!["random", "live"].includes(choices.weather) && footer === "weekly" && "Sample forecast"}
          {(choices.weather === "random" || (footer === "weekly" && choices.weather !== "live")) && moon && " · "}
          {moon && `${moon.phase} · ${Math.round(moon.fraction * 100)}% illuminated${weather === "live" && !moon.aboveHorizon ? " · Below the horizon" : ""}`}
        </span>
        {weather === "live" && liveResult?.failed && (
          <button type="button" onClick={() => { setLive(null); setRetry(value => value + 1); }}>Retry</button>
        )}
        {weather === "live" && <a href="https://open-meteo.com/">Weather data by Open-Meteo</a>}
      </div>
      <SceneLibrarySettings source={source} gallery={gallery} onChange={changeSource} />
      <GeneratedSceneSettings config={settings.generation} hasImage={Boolean(generated)} generatedImage={generated}
        showGenerated={showGenerated} onToggle={setShowGenerated}
        onChange={generation => setSettings(current => ({ ...current, generation }))}
        context={{ forecast, place, live: weather === "live", temperatureUnit: settings.temperatureUnit,
          windUnit: settings.windUnit, scene: scenes[landscape] }}
        onImage={src => { setGenerated(src); setShowGenerated(true); }} />
    </main>
  );
}
