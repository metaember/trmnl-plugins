var WeatherWindow = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // lib/trmnl.js
  var trmnl_exports = {};
  __export(trmnl_exports, {
    weatherWindow: () => weatherWindow
  });

  // assets/scenes/manifest.json
  var manifest_default = {
    version: 1,
    scenes: [
      { id: "hills", name: "Winter hills", image: "winter-hills.webp", collection: "Quiet views" },
      { id: "coast", name: "Rocky coast", image: "rocky-coast.webp", collection: "Quiet views" },
      { id: "lake", name: "Alpine lake", image: "alpine-lake.webp", collection: "Quiet views" },
      { id: "desert", name: "Desert mesas", image: "desert-mesas.webp", collection: "Quiet views" },
      { id: "city", name: "City rooftops", image: "city-rooftops.webp", collection: "Quiet views", focus: "bottom" },
      { id: "grove", name: "Redwood grove", image: "redwood-grove.webp", collection: "Quiet views" },
      { id: "harbor", name: "Harbor village", image: "harbor-village.webp", collection: "Quiet views" },
      { id: "farmland", name: "Rolling farmland", image: "rolling-farmland-v2.webp", collection: "Quiet views" },
      { id: "basalt-falls", name: "Basalt falls", image: "basalt-falls.webp", collection: "Quiet views" },
      { id: "highland-moor", name: "Highland moor", image: "highland-moor.webp", collection: "Quiet views" },
      { id: "salt-flats", name: "Salt flats", image: "salt-flats.webp", collection: "Quiet views" },
      { id: "cypress-marsh", name: "Cypress marsh", image: "cypress-marsh.webp", collection: "Quiet views" },
      { id: "glacier-valley", name: "Glacier valley", image: "glacier-valley.webp", collection: "Quiet views" },
      { id: "volcanic-plateau", name: "Volcanic plateau", image: "volcanic-plateau.webp", collection: "Quiet views" },
      { id: "stone-bridge", name: "Stone bridge", image: "stone-bridge.webp", collection: "Quiet views" },
      { id: "canal-towpath", name: "Canal towpath", image: "canal-towpath.webp", collection: "Quiet views" },
      { id: "lighthouse-headland", name: "Lighthouse headland", image: "lighthouse-headland.webp", collection: "Quiet views" },
      { id: "orchard-rows", name: "Orchard rows", image: "orchard-rows.webp", collection: "Quiet views" },
      { id: "floating-isles", name: "Floating Isles", image: "floating-isles.webp", collection: "Fantasy" },
      { id: "moonstone-ruins", name: "Moonstone Ruins", image: "moonstone-ruins.webp", collection: "Fantasy" },
      { id: "skyrail-district", name: "Skyrail District", image: "skyrail-district.webp", collection: "Cyberpunk", focus: "top" },
      { id: "neon-canal", name: "Neon Canal", image: "neon-canal.webp", collection: "Cyberpunk" },
      { id: "paris-eiffel-tower", name: "Paris \xB7 Eiffel Tower", image: "paris-eiffel-tower.webp", collection: "Real places", focus: "top" },
      { id: "golden-gate-bridge", name: "Golden Gate Bridge", image: "golden-gate-bridge.webp", collection: "Real places", focus: "top" },
      { id: "lanternwood", name: "Lanternwood", image: "lanternwood.webp", collection: "Fantasy" },
      { id: "wyvern-pass", name: "Wyvern Pass", image: "wyvern-pass.webp", collection: "Fantasy" },
      { id: "crystal-basin", name: "Crystal Basin", image: "crystal-basin.webp", collection: "Fantasy" },
      { id: "drowned-palace", name: "Drowned Palace", image: "drowned-palace.webp", collection: "Fantasy" },
      { id: "megablock-courtyard", name: "Megablock Courtyard", image: "megablock-courtyard.webp", collection: "Cyberpunk" },
      { id: "corporate-spire", name: "Corporate Spire", image: "corporate-spire.webp", collection: "Cyberpunk", focus: "top" },
      { id: "badlands-relay", name: "Badlands Relay", image: "badlands-relay.webp", collection: "Cyberpunk", focus: "top" },
      { id: "tokyo-shibuya", name: "Tokyo \xB7 Shibuya Crossing", image: "tokyo-shibuya.webp", collection: "Real places", focus: "bottom", skyX: 0.42 },
      { id: "new-york-midtown", name: "New York \xB7 Midtown", image: "new-york-midtown.webp", collection: "Real places" },
      { id: "sydney-harbour", name: "Sydney \xB7 Opera House", image: "sydney-harbour.webp", collection: "Real places" },
      { id: "rio-sugarloaf", name: "Rio \xB7 Sugarloaf", image: "rio-sugarloaf.webp", collection: "Real places" },
      { id: "rush-hour-concourse", name: "Rush Hour Concourse", image: "rush-hour-concourse-v2.webp", collection: "Cyberpunk", focus: "bottom", skyX: null },
      { id: "megablock-block-party", name: "Megablock Block Party", image: "megablock-block-party-v2.webp", collection: "Cyberpunk", focus: "bottom", skyX: null, nightLit: true },
      { id: "arcade-strip", name: "Arcade Strip", image: "arcade-strip-v2.webp", collection: "Cyberpunk", focus: "bottom", skyX: null, nightLit: true },
      { id: "shift-change", name: "Shift Change", image: "shift-change-v2.webp", collection: "Cyberpunk", focus: "bottom", skyX: null },
      { id: "kite-festival", name: "Kite Festival", image: "kite-festival-v2.webp", collection: "Fantasy" },
      { id: "guild-docks", name: "Guild Docks", image: "guild-docks-v2.webp", collection: "Fantasy", focus: "bottom", skyX: null },
      { id: "istanbul-eminonu", name: "Istanbul \xB7 Emin\xF6n\xFC Ferries", image: "istanbul-eminonu-v2.webp", collection: "Real places", skyX: 0.88 },
      { id: "night-market", name: "Night Market", image: "night-market-v3.webp", collection: "Cyberpunk", focus: "top", skyX: null, nightLit: true }
    ]
  };

  // lib/display-data.js
  var import_node_crypto = __require("node:crypto");

  // lib/local-weather.js
  var weatherCodes = {
    0: ["Clear", "clear"],
    1: ["Mostly clear", "clear"],
    2: ["Partly cloudy", "cloudy", 0.3],
    3: ["Overcast", "cloudy", 0.9],
    45: ["Fog", "fog", 0.62],
    48: ["Freezing fog", "fog", 0.75],
    51: ["Light drizzle", "drizzle", 0.13],
    53: ["Drizzle", "drizzle", 0.2],
    55: ["Heavy drizzle", "drizzle", 0.3],
    56: ["Freezing drizzle", "drizzle", 0.17],
    57: ["Freezing drizzle", "drizzle", 0.32],
    61: ["Light rain", "rain", 0.32],
    63: ["Rain", "rain", 0.62],
    65: ["Heavy rain", "rain", 0.95],
    66: ["Freezing rain", "rain", 0.32],
    67: ["Freezing rain", "rain", 0.8],
    71: ["Light snow", "snow", 0.2],
    73: ["Snow", "snow", 0.61],
    75: ["Heavy snow", "snow", 0.99],
    77: ["Snow grains", "snow", 0.13],
    80: ["Light showers", "rain", 0.36],
    81: ["Showers", "rain", 0.66],
    82: ["Heavy showers", "rain", 0.95],
    85: ["Snow showers", "snow", 0.42],
    86: ["Heavy snow showers", "snow", 0.95],
    95: ["Thunderstorms", "storm", 0.78],
    96: ["Thunderstorms", "storm", 0.85],
    99: ["Thunderstorms", "storm", 1]
  };
  var unknownWeather = ["Conditions unavailable", "cloudy", 0.4];
  var weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });
  function parseForecast(data, place = {}) {
    const { current, hourly, daily } = data;
    if (!Number.isFinite(current?.time) || !Number.isFinite(current.temperature_2m) || !Array.isArray(hourly?.time) || !daily?.time?.length || !Array.isArray(hourly.temperature_2m) || !Array.isArray(hourly.weather_code) || !Array.isArray(daily.weather_code) || !Array.isArray(daily.temperature_2m_max) || !Array.isArray(daily.temperature_2m_min) || !Array.isArray(daily.precipitation_probability_max)) {
      throw new Error("Incomplete weather forecast");
    }
    const timezone = data.timezone || place.timezone || "UTC";
    const isNight = current.is_day === 0;
    const [condition, effect, amount] = weatherCodes[current.weather_code] ?? unknownWeather;
    const label = isNight && current.weather_code === 0 ? "Clear night" : condition;
    const timeFormat = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      timeZone: timezone
    });
    const firstHour = hourly.time.findIndex((time) => time > current.time);
    const upcoming = firstHour < 0 ? [] : hourly.time.slice(firstHour, firstHour + 3).map((time, offset) => {
      const index = firstHour + offset;
      return {
        time: timeFormat.format(time * 1e3).toLowerCase(),
        temperature: hourly.temperature_2m[index],
        condition: weatherCodes[hourly.weather_code[index]]?.[0] ?? "Unavailable"
      };
    });
    const change = upcoming.find((hour) => hour.condition !== condition);
    return {
      label,
      timezone,
      isNight,
      effect: isNight && effect === "clear" ? "night" : effect,
      temperature: current.temperature_2m,
      wind: current.wind_speed_10m,
      amount,
      next: change ? `${change.condition} by ${change.time}` : "Steady next few hours",
      summary: change ? `${label} now, with ${change.condition.toLowerCase()} by ${change.time}.` : `${label} now, with little change over the next few hours.`,
      hourly: upcoming,
      weekly: daily.time.map((time, index) => {
        const [condition2, effect2] = weatherCodes[daily.weather_code[index]] ?? ["Unavailable", ""];
        return {
          day: index === 0 ? "Today" : weekday.format((time + data.utc_offset_seconds) * 1e3),
          condition: condition2,
          effect: effect2,
          high: daily.temperature_2m_max[index],
          low: daily.temperature_2m_min[index]
        };
      }),
      high: daily.temperature_2m_max[0],
      low: daily.temperature_2m_min[0],
      precipitation: daily.precipitation_probability_max[0],
      time: current.time * 1e3
    };
  }
  function formatTemperature(fahrenheit, unit, showUnit = true) {
    if (!Number.isFinite(fahrenheit)) return "\u2014";
    const value = unit === "C" ? (fahrenheit - 32) * 5 / 9 : fahrenheit;
    return `${Math.round(value)}\xB0${showUnit ? unit : ""}`;
  }
  function formatWind(mph, unit) {
    if (!Number.isFinite(mph)) return "\u2014";
    return `${Math.round(unit === "km/h" ? mph * 1.609344 : mph)} ${unit}`;
  }

  // node_modules/suncalc/index.js
  var { PI, sin, cos, tan, asin, atan2: atan, acos, sqrt, abs, round } = Math;
  var rad = PI / 180;
  var dayMs = 1e3 * 60 * 60 * 24;
  var J1970 = 2440588;
  var J2000 = 2451545;
  var earthRadius = 6378.14;
  function toDays(date) {
    return date.valueOf() / dayMs - 0.5 + J1970 - J2000;
  }
  function deltaT(d) {
    const y = 2e3 + d / 365.2425;
    let t;
    if (y < 1920) {
      t = y - 1900;
      return -2.79 + t * (1.494119 + t * (-0.0598939 + t * (61966e-7 - t * 197e-6)));
    }
    if (y < 1941) {
      t = y - 1920;
      return 21.2 + t * (0.84493 + t * (-0.0761 + t * 20936e-7));
    }
    if (y < 1961) {
      t = y - 1950;
      return 29.07 + t * (0.407 + t * (-1 / 233 + t / 2547));
    }
    if (y < 1986) {
      t = y - 1975;
      return 45.45 + t * (1.067 + t * (-1 / 260 - t / 718));
    }
    if (y < 2005) {
      t = y - 2e3;
      return 63.86 + t * (0.3345 + t * (-0.060374 + t * (17275e-7 + t * (651814e-9 + t * 2373599e-11))));
    }
    if (y < 2050) {
      t = y - 2e3;
      return 62.92 + t * (0.32217 + t * 5589e-6);
    }
    t = (y - 1820) / 100;
    return -20 + 32 * t * t - 0.5628 * (2150 - y);
  }
  function toDaysTT(d) {
    return d + deltaT(d) / 86400;
  }
  function azimuth(H, phi, dec) {
    return (atan(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi)) / rad + 540) % 360;
  }
  function altitude(H, phi, dec) {
    return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H));
  }
  function siderealTime(d, lw) {
    return rad * (280.46061837 + 360.98564736629 * d) - lw;
  }
  function astroRefraction(h) {
    if (h < 0) h = 0;
    return 2967e-7 / tan(h + 312536e-8 / (h + 0.08901179));
  }
  function sunCoords(d) {
    const t = d / 36525;
    const L0 = rad * (280.46646 + t * (36000.76983 + t * 3032e-7));
    const M = rad * (357.52911 + t * (35999.05029 - t * 1537e-7));
    const sinM = sin(M);
    const cosM = cos(M);
    const C = rad * ((1.914602 - t * (4817e-6 + t * 14e-6)) * sinM + // equation of center
    (0.019993 - 101e-6 * t) * 2 * sinM * cosM + 289e-6 * sinM * (3 - 4 * sinM * sinM));
    const Om = rad * (125.04 - 1934.136 * t);
    const L = L0 + C - rad * (569e-5 + 478e-5 * sin(Om));
    const e = rad * (23.439291 - t * (0.0130042 + t * (16e-8 - t * 504e-9))) + rad * 256e-5 * cos(Om);
    return {
      ra: atan(cos(e) * sin(L), cos(L)),
      // 25.6
      dec: asin(sin(e) * sin(L))
      // 25.7
    };
  }
  function nutationObliquity(t) {
    const om = rad * (125.04452 - 1934.136261 * t);
    const ls = rad * (280.4665 + 36000.7698 * t);
    const lm = rad * (218.3165 + 481267.8813 * t);
    const dpsi = (-17.2 * sin(om) - 1.32 * sin(2 * ls) - 0.23 * sin(2 * lm) + 0.21 * sin(2 * om)) / 3600;
    const deps = (9.2 * cos(om) + 0.57 * cos(2 * ls) + 0.1 * cos(2 * lm) - 0.09 * cos(2 * om)) / 3600;
    const eps0 = 23.439291 - t * (0.0130042 + t * (16e-8 - t * 504e-9));
    return { dpsi, eps: rad * (eps0 + deps) };
  }
  var moonLon = new Int32Array([
    0,
    0,
    1,
    0,
    6288774,
    -20905355,
    2,
    0,
    -1,
    0,
    1274027,
    -3699111,
    2,
    0,
    0,
    0,
    658314,
    -2955968,
    0,
    0,
    2,
    0,
    213618,
    -569925,
    0,
    1,
    0,
    0,
    -185116,
    48888,
    0,
    0,
    0,
    2,
    -114332,
    -3149,
    2,
    0,
    -2,
    0,
    58793,
    246158,
    2,
    -1,
    -1,
    0,
    57066,
    -152138,
    2,
    0,
    1,
    0,
    53322,
    -170733,
    2,
    -1,
    0,
    0,
    45758,
    -204586,
    0,
    1,
    -1,
    0,
    -40923,
    -129620,
    1,
    0,
    0,
    0,
    -34720,
    108743,
    0,
    1,
    1,
    0,
    -30383,
    104755,
    2,
    0,
    0,
    -2,
    15327,
    10321,
    0,
    0,
    1,
    2,
    -12528,
    0,
    0,
    0,
    1,
    -2,
    10980,
    79661,
    4,
    0,
    -1,
    0,
    10675,
    -34782,
    0,
    0,
    3,
    0,
    10034,
    -23210,
    4,
    0,
    -2,
    0,
    8548,
    -21636,
    2,
    1,
    -1,
    0,
    -7888,
    24208,
    2,
    1,
    0,
    0,
    -6766,
    30824,
    1,
    0,
    -1,
    0,
    -5163,
    -8379,
    1,
    1,
    0,
    0,
    4987,
    -16675,
    2,
    -1,
    1,
    0,
    4036,
    -12831,
    2,
    0,
    2,
    0,
    3994,
    -10445,
    4,
    0,
    0,
    0,
    3861,
    -11650,
    2,
    0,
    -3,
    0,
    3665,
    14403,
    0,
    1,
    -2,
    0,
    -2689,
    -7003,
    2,
    0,
    -1,
    2,
    -2602,
    0,
    2,
    -1,
    -2,
    0,
    2390,
    10056,
    1,
    0,
    1,
    0,
    -2348,
    6322,
    2,
    -2,
    0,
    0,
    2236,
    -9884,
    0,
    1,
    2,
    0,
    -2120,
    5751,
    0,
    2,
    0,
    0,
    -2069,
    0,
    2,
    -2,
    -1,
    0,
    2048,
    -4950,
    2,
    0,
    1,
    -2,
    -1773,
    4130,
    2,
    0,
    0,
    2,
    -1595,
    0,
    4,
    -1,
    -1,
    0,
    1215,
    -3958,
    0,
    0,
    2,
    2,
    -1110,
    0,
    3,
    0,
    -1,
    0,
    -892,
    3258,
    2,
    1,
    1,
    0,
    -810,
    2616,
    4,
    -1,
    -2,
    0,
    759,
    -1897,
    0,
    2,
    -1,
    0,
    -713,
    -2117,
    2,
    2,
    -1,
    0,
    -700,
    2354,
    2,
    1,
    -2,
    0,
    691,
    0,
    2,
    -1,
    0,
    -2,
    596,
    0,
    4,
    0,
    1,
    0,
    549,
    -1423,
    0,
    0,
    4,
    0,
    537,
    -1117,
    4,
    -1,
    0,
    0,
    520,
    -1571,
    1,
    0,
    -2,
    0,
    -487,
    -1739,
    2,
    1,
    0,
    -2,
    -399,
    0,
    0,
    0,
    2,
    -2,
    -381,
    -4421,
    1,
    1,
    1,
    0,
    351,
    0,
    3,
    0,
    -2,
    0,
    -340,
    0,
    4,
    0,
    -3,
    0,
    330,
    0,
    2,
    -1,
    2,
    0,
    327,
    0,
    0,
    2,
    1,
    0,
    -323,
    1165,
    1,
    1,
    -1,
    0,
    299,
    0,
    2,
    0,
    3,
    0,
    294,
    0,
    2,
    0,
    -1,
    -2,
    0,
    8752
  ]);
  var moonLat = new Int32Array([
    0,
    0,
    0,
    1,
    5128122,
    0,
    0,
    1,
    1,
    280602,
    0,
    0,
    1,
    -1,
    277693,
    2,
    0,
    0,
    -1,
    173237,
    2,
    0,
    -1,
    1,
    55413,
    2,
    0,
    -1,
    -1,
    46271,
    2,
    0,
    0,
    1,
    32573,
    0,
    0,
    2,
    1,
    17198,
    2,
    0,
    1,
    -1,
    9266,
    0,
    0,
    2,
    -1,
    8822,
    2,
    -1,
    0,
    -1,
    8216,
    2,
    0,
    -2,
    -1,
    4324,
    2,
    0,
    1,
    1,
    4200,
    2,
    1,
    0,
    -1,
    -3359,
    2,
    -1,
    -1,
    1,
    2463,
    2,
    -1,
    0,
    1,
    2211,
    2,
    -1,
    -1,
    -1,
    2065,
    0,
    1,
    -1,
    -1,
    -1870,
    4,
    0,
    -1,
    -1,
    1828,
    0,
    1,
    0,
    1,
    -1794,
    0,
    0,
    0,
    3,
    -1749,
    0,
    1,
    -1,
    1,
    -1565,
    1,
    0,
    0,
    1,
    -1491,
    0,
    1,
    1,
    1,
    -1475,
    0,
    1,
    1,
    -1,
    -1410,
    0,
    1,
    0,
    -1,
    -1344,
    1,
    0,
    0,
    -1,
    -1335,
    0,
    0,
    3,
    1,
    1107,
    4,
    0,
    0,
    -1,
    1021,
    4,
    0,
    -1,
    1,
    833,
    0,
    0,
    1,
    -3,
    777,
    4,
    0,
    -2,
    1,
    671,
    2,
    0,
    0,
    -3,
    607,
    2,
    0,
    2,
    -1,
    596,
    2,
    -1,
    1,
    -1,
    491,
    2,
    0,
    -2,
    1,
    -451,
    0,
    0,
    3,
    -1,
    439,
    2,
    0,
    2,
    1,
    422,
    2,
    0,
    -3,
    -1,
    421,
    2,
    1,
    -1,
    1,
    -366,
    2,
    1,
    0,
    1,
    -351,
    4,
    0,
    0,
    1,
    331,
    2,
    -1,
    1,
    1,
    315,
    2,
    -2,
    0,
    -1,
    302,
    0,
    0,
    1,
    3,
    -283,
    2,
    1,
    1,
    -1,
    -229,
    1,
    1,
    0,
    -1,
    223,
    1,
    1,
    0,
    1,
    223,
    0,
    1,
    -2,
    -1,
    -220,
    2,
    1,
    -1,
    -1,
    -220,
    1,
    0,
    1,
    1,
    -185,
    2,
    -1,
    -2,
    -1,
    181,
    0,
    1,
    2,
    1,
    -177,
    4,
    0,
    -2,
    -1,
    176,
    4,
    -1,
    -1,
    -1,
    166,
    1,
    0,
    1,
    -1,
    -164,
    4,
    0,
    1,
    -1,
    132,
    1,
    0,
    -1,
    -1,
    -119,
    4,
    -1,
    0,
    -1,
    115,
    2,
    -2,
    0,
    1,
    107
  ]);
  function moonCoords(d) {
    const t = d / 36525;
    const Lp = 218.3164477 + t * (481267.88123421 + t * (-15786e-7 + t * (1 / 538841 - t / 65194e3)));
    const D = 297.8501921 + t * (445267.1114034 + t * (-18819e-7 + t * (1 / 545868 - t / 113065e3)));
    const M = 357.5291092 + t * (35999.0502909 + t * (-1536e-7 + t / 2449e4));
    const Mp = 134.9633964 + t * (477198.8675055 + t * (87414e-7 + t * (1 / 69699 - t / 14712e3)));
    const F = 93.272095 + t * (483202.0175233 + t * (-36539e-7 + t * (-1 / 3526e3 + t / 86331e4)));
    const A1 = 119.75 + 131.849 * t;
    const A2 = 53.09 + 479264.29 * t;
    const A3 = 313.45 + 481266.484 * t;
    const E = 1 - t * (2516e-6 + t * 74e-7);
    const Dr = rad * D, Mr = rad * M, Mpr = rad * Mp, Fr = rad * F;
    let sl = 0, sr = 0, sb = 0;
    for (let i = 0; i < moonLon.length; i += 6) {
      const m = moonLon[i + 1];
      const arg = moonLon[i] * Dr + m * Mr + moonLon[i + 2] * Mpr + moonLon[i + 3] * Fr;
      const f = m === 1 || m === -1 ? E : m === 2 || m === -2 ? E * E : 1;
      sl += moonLon[i + 4] * f * sin(arg);
      sr += moonLon[i + 5] * f * cos(arg);
    }
    for (let i = 0; i < moonLat.length; i += 5) {
      const m = moonLat[i + 1];
      const arg = moonLat[i] * Dr + m * Mr + moonLat[i + 2] * Mpr + moonLat[i + 3] * Fr;
      const f = m === 1 || m === -1 ? E : m === 2 || m === -2 ? E * E : 1;
      sb += moonLat[i + 4] * f * sin(arg);
    }
    const A1r = rad * A1, Lpr = rad * Lp;
    sl += 3958 * sin(A1r) + 1962 * sin(Lpr - Fr) + 318 * sin(rad * A2);
    sb += -2235 * sin(Lpr) + 382 * sin(rad * A3) + 175 * sin(A1r - Fr) + 175 * sin(A1r + Fr) + 127 * sin(Lpr - Mpr) - 115 * sin(Lpr + Mpr);
    const { dpsi, eps } = nutationObliquity(t);
    const l = rad * (Lp + sl / 1e6 + dpsi);
    const b = rad * (sb / 1e6);
    return {
      ra: atan(sin(l) * cos(eps) - tan(b) * sin(eps), cos(l)),
      // 13.3
      dec: asin(sin(b) * cos(eps) + cos(b) * sin(eps) * sin(l)),
      // 13.4
      dist: 385000.56 + sr / 1e3
      // distance to the Moon in km
    };
  }
  function getMoonPosition(date, lat, lng) {
    const lw = rad * -lng;
    const phi = rad * lat;
    const d = toDays(date);
    const c = moonCoords(toDaysTT(d));
    const H = siderealTime(d, lw) - c.ra;
    const hGeo = altitude(H, phi, c.dec);
    const h = hGeo - asin(earthRadius / c.dist * cos(hGeo));
    const pa = atan(sin(H), tan(phi) * cos(c.dec) - sin(c.dec) * cos(H));
    return {
      azimuth: azimuth(H, phi, c.dec),
      // apparent (refraction-corrected) altitude in degrees
      altitude: (h + astroRefraction(h)) / rad,
      distance: c.dist,
      parallacticAngle: pa / rad
    };
  }
  function getMoonIllumination(date = /* @__PURE__ */ new Date()) {
    const d = toDaysTT(toDays(date));
    const s = sunCoords(d);
    const m = moonCoords(d);
    const sdist = 149598e3;
    const phi = acos(sin(s.dec) * sin(m.dec) + cos(s.dec) * cos(m.dec) * cos(s.ra - m.ra));
    const inc = atan(sdist * sin(phi), m.dist - sdist * cos(phi));
    const angle = atan(cos(s.dec) * sin(s.ra - m.ra), sin(s.dec) * cos(m.dec) - cos(s.dec) * sin(m.dec) * cos(s.ra - m.ra));
    const waxing = angle < 0;
    return {
      // illuminated fraction, 0 (new) → 1 (full); reaches the exact extrema only at perfect
      // syzygy (eclipses), so a "full" moon typically peaks a hair under 1 — this is correct
      fraction: (1 + cos(inc)) / 2,
      // phase, 0 → 1: 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter (waxing for phase < 0.5)
      phase: 0.5 + 0.5 * inc * (waxing ? -1 : 1) / PI,
      // position angle of the bright limb, degrees (v2: all angles emitted in degrees) — subtract
      // getMoonPosition().parallacticAngle, also degrees, to get the zenith-relative tilt
      angle: angle / rad,
      waxing
      // true while the Moon is waxing (new → full), false while waning (full → new)
    };
  }

  // lib/moon.js
  var phaseNames = [
    "New moon",
    "Waxing crescent",
    "First quarter",
    "Waxing gibbous",
    "Full moon",
    "Waning gibbous",
    "Last quarter",
    "Waning crescent"
  ];
  function moonAppearance(date, place, checkHorizon) {
    const { fraction, phase, angle } = getMoonIllumination(date);
    const position = place && getMoonPosition(date, place.latitude, place.longitude);
    const waxing = phase < 0.5;
    const rotation = position ? -(90 + angle - position.parallacticAngle) * Math.PI / 180 : waxing ? 0 : Math.PI;
    const aboveHorizon = !position || position.altitude > 0;
    return {
      fraction,
      phase: phaseNames[Math.round(phase * 8) % 8],
      rotation,
      aboveHorizon,
      visible: fraction >= 0.01 && (!checkHorizon || aboveHorizon)
    };
  }

  // lib/random-choice.js
  function choicePool(options, favorNew = false) {
    const keys = Object.keys(options);
    if (favorNew) keys.sort((a, b) => options[a].order - options[b].order);
    let total = 0;
    return keys.map((key, index) => {
      const start = total;
      const weight = favorNew && keys.length > 1 ? 1 + 2 * index / (keys.length - 1) : 1;
      total += weight;
      return { key, weight, start, end: total };
    });
  }
  function pickFrom(pool, roll) {
    const last = pool.at(-1);
    return pool.find(({ end }) => roll * last.end < end)?.key ?? last.key;
  }

  // lib/weather.js
  var samples = {
    snow: {
      label: "Snow",
      temperature: 29,
      next: "Heavier after 3 pm",
      amount: 0.61,
      wind: 5,
      summary: "Light snow now, turning heavier after 3 pm.",
      hourly: [
        { time: "2 pm", temperature: 30, condition: "Snow" },
        { time: "3 pm", temperature: 29, condition: "Snow" },
        { time: "4 pm", temperature: 28, condition: "Heavy snow" }
      ],
      high: 31,
      low: 24,
      precipitation: 90
    },
    clear: {
      label: "Clear",
      temperature: 63,
      next: "Sunny through 2 pm",
      wind: 7,
      summary: "Sunny through 2 pm, then a few clouds.",
      hourly: [
        { time: "1 pm", temperature: 64, condition: "Sunny" },
        { time: "2 pm", temperature: 65, condition: "Sunny" },
        { time: "3 pm", temperature: 64, condition: "Partly cloudy" }
      ],
      high: 65,
      low: 47,
      precipitation: 0
    },
    rain: {
      label: "Light rain",
      temperature: 52,
      next: "Clearing around 4 pm",
      amount: 0.32,
      wind: 12,
      summary: "Light rain should ease around 4 pm.",
      hourly: [
        { time: "2 pm", temperature: 53, condition: "Light rain" },
        { time: "3 pm", temperature: 53, condition: "Light rain" },
        { time: "4 pm", temperature: 54, condition: "Cloudy" }
      ],
      high: 55,
      low: 46,
      precipitation: 80
    },
    fog: {
      label: "Fog",
      temperature: 43,
      next: "Lifting around 10 am",
      amount: 0.62,
      wind: 3,
      summary: "Fog lifts around 10 am, leaving a cloudy sky.",
      hourly: [
        { time: "8 am", temperature: 44, condition: "Fog" },
        { time: "9 am", temperature: 46, condition: "Fog" },
        { time: "10 am", temperature: 48, condition: "Cloudy" }
      ],
      high: 52,
      low: 41,
      precipitation: 10
    },
    night: {
      label: "Clear night",
      temperature: 38,
      next: "Clouds by dawn",
      wind: 4,
      summary: "Mostly clear overnight, with clouds by dawn.",
      hourly: [
        { time: "3 am", temperature: 37, condition: "Clear" },
        { time: "4 am", temperature: 36, condition: "Clear" },
        { time: "5 am", temperature: 36, condition: "Cloudy" }
      ],
      high: 46,
      low: 36,
      precipitation: 5
    }
  };
  function variant(base, { label, effect, amount, next, wind = base.wind, precipitation = base.precipitation }) {
    return {
      ...base,
      label,
      effect,
      amount,
      next,
      wind,
      precipitation,
      summary: `${label} now. ${next}.`,
      hourly: base.hourly.map((hour, index) => index < 2 ? { ...hour, condition: label } : hour)
    };
  }
  var forecasts = {
    clear: samples.clear,
    partlyCloudy: variant(samples.clear, {
      label: "Partly cloudy",
      effect: "cloudy",
      amount: 0.3,
      next: "Clouds increase by 3 pm"
    }),
    overcast: variant(samples.clear, {
      label: "Overcast",
      effect: "cloudy",
      amount: 0.9,
      next: "Still cloudy at 3 pm"
    }),
    drizzle: variant(samples.rain, {
      label: "Drizzle",
      effect: "drizzle",
      amount: 0.13,
      next: "Easing around 4 pm",
      wind: 5,
      precipitation: 55
    }),
    rain: samples.rain,
    steadyRain: variant(samples.rain, {
      label: "Steady rain",
      effect: "rain",
      amount: 0.62,
      next: "Easing around 4 pm",
      wind: 14,
      precipitation: 95
    }),
    heavyRain: variant(samples.rain, {
      label: "Heavy rain",
      effect: "rain",
      amount: 0.97,
      next: "Tapering around 4 pm",
      wind: 20,
      precipitation: 100
    }),
    storm: variant(samples.rain, {
      label: "Thunderstorm",
      effect: "storm",
      amount: 0.85,
      next: "Storms ease around 4 pm",
      wind: 24,
      precipitation: 100
    }),
    flurries: variant(samples.snow, {
      label: "Flurries",
      effect: "snow",
      amount: 0.14,
      next: "Heavier after 3 pm",
      precipitation: 65
    }),
    snow: samples.snow,
    heavySnow: variant(samples.snow, {
      label: "Heavy snow",
      effect: "snow",
      amount: 1,
      next: "Heavy snow through 4 pm",
      wind: 17,
      precipitation: 100
    }),
    mist: variant(samples.fog, {
      label: "Light mist",
      effect: "fog",
      amount: 0.28,
      next: "Lifting around 10 am"
    }),
    fog: samples.fog,
    denseFog: variant(samples.fog, {
      label: "Dense fog",
      effect: "fog",
      amount: 1,
      next: "Lifting slowly by 10 am"
    }),
    night: samples.night
  };
  var shortConditions = {
    clear: "Clear",
    night: "Clear",
    cloudy: "Clouds",
    drizzle: "Drizzle",
    rain: "Rain",
    snow: "Snow",
    fog: "Fog",
    storm: "Storm"
  };
  function sampleWeek(forecast, effect, timeZone) {
    const weekday2 = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone });
    const week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const start = week.indexOf(weekday2.format(Date.now()));
    const following = forecast.high <= 36 ? ["snow", "cloudy", "clear", "snow", "cloudy", "clear"] : ["cloudy", "clear", "clear", "rain", "cloudy", "clear"];
    const highOffsets = [0, 2, 4, 6, 1, 3, 5];
    const lowOffsets = [0, 1, 0, 3, 2, 2, 4];
    return [effect, ...following].map((dailyEffect, index) => ({
      day: index === 0 ? "Today" : week[(start + index) % 7],
      condition: index === 0 ? forecast.label : shortConditions[dailyEffect],
      effect: dailyEffect,
      high: forecast.high + highOffsets[index],
      low: forecast.low + lowOffsets[index]
    }));
  }

  // lib/display-data.js
  var frames = ["picture", "sash", "panes", "none"];
  var finishes = ["dark", "slate", "light", "outline"];
  var footers = ["current", "minimal", "words", "hourly", "weekly", "details", "none"];
  var first = (value, options, fallback) => options.includes(value) ? value : fallback;
  function selection(value, options, fallback, roll) {
    return value === "random" ? options[Math.floor(roll * options.length)] : first(value, options, fallback);
  }
  function timezoneFor(value) {
    try {
      return new Intl.DateTimeFormat("en", { timeZone: String(value || "UTC") }).resolvedOptions().timeZone;
    } catch {
      return "UTC";
    }
  }
  function rollFor(seed, category) {
    return (0, import_node_crypto.createHash)("sha256").update(seed).update(category).digest().readUInt32BE() / 2 ** 32;
  }
  function chooseScene(entries, collection, landscape, roll) {
    const matching = entries.filter((scene) => scene.collection === collection);
    const pool = matching.length ? matching : entries;
    if (landscape === "random" || landscape === "@newer") {
      const choices = Object.fromEntries(pool.map((scene, order) => [scene.id, { order, scene }]));
      return choices[pickFrom(choicePool(choices, landscape === "@newer"), roll)].scene;
    }
    return pool.find((scene) => scene.id === landscape) ?? pool[0];
  }
  function displayChoices(settings, date, location) {
    const seed = `${String(settings.instance ?? location).slice(0, 100)}|${Math.floor(date.getTime() / 216e5)}`;
    const roll = (category) => rollFor(seed, category);
    const weatherMode = settings.weather === "random" ? selection("random", Object.keys(forecasts), "snow", roll("weather")) : first(settings.weather, ["live", ...Object.keys(forecasts)], "live");
    const temperatureUnit = first(settings.temperature_unit, ["F", "C"], "F");
    const windUnit = first(settings.wind_unit, ["mph", "km/h"], "mph");
    const frame = selection(settings.frame, frames, "none", roll("frame"));
    const finish = selection(settings.finish, finishes, "dark", roll("finish"));
    const footer = selection(settings.footer, footers, "current", roll("footer"));
    return { roll, weatherMode, temperatureUnit, windUnit, frame, finish, footer };
  }
  function displayData({
    date,
    location,
    live,
    forecast,
    choices,
    timezone,
    scene,
    fallback,
    status = "",
    generated = false,
    imageHasWeather = false
  }) {
    const { weatherMode, temperatureUnit, windUnit, frame, finish, footer } = choices;
    const effect = forecast.effect ?? (weatherMode === "live" ? "snow" : weatherMode);
    if (weatherMode === "live" && !location && footer !== "none") status ||= "Set a location \xB7 sample weather";
    const temp = (value) => formatTemperature(value, temperatureUnit);
    const week = (forecast.weekly ?? sampleWeek(forecast, effect, timezone)).map((day) => ({
      day: day.day,
      condition: shortConditions[day.effect] ?? "\u2014",
      high: formatTemperature(day.high, temperatureUnit, false),
      low: formatTemperature(day.low, temperatureUnit, false)
    }));
    const moon = effect === "night" ? moonAppearance(date, live?.place, Boolean(live)) : null;
    const skyX = Object.hasOwn(scene, "skyX") && scene.skyX !== void 0 ? scene.skyX : 0.77;
    return { weather_window: {
      frame,
      finish,
      footer,
      status,
      generated,
      place: live?.place.label ?? "",
      scene: { name: scene.name, src: scene.src, focus: scene.focus, fallback },
      overlay: generated || imageHasWeather ? null : {
        effect,
        amount: forecast.amount ?? 0,
        wind: forecast.wind ?? 0,
        isNight: effect === "night" || Boolean(forecast.isNight),
        nightLit: Boolean(scene.nightLit),
        moon,
        skyX
      },
      weather: {
        label: forecast.label,
        temperature: temp(forecast.temperature),
        next: forecast.next,
        summary: forecast.summary,
        high: temp(forecast.high),
        low: temp(forecast.low),
        wind: formatWind(forecast.wind, windUnit),
        precipitation: Number.isFinite(forecast.precipitation) ? `${forecast.precipitation}%` : "\u2014",
        hourly: forecast.hourly.map((hour) => ({ time: hour.time, temperature: temp(hour.temperature), condition: hour.condition })),
        week
      }
    } };
  }

  // lib/scene-library.js
  var sceneId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  function readManifest(data) {
    if (data?.version !== 1 || !Array.isArray(data.scenes) || !data.scenes.length) {
      throw new Error("Use a version 1 scene manifest with at least one scene.");
    }
    const ids = /* @__PURE__ */ new Set();
    return data.scenes.map((entry) => {
      if (typeof entry?.id !== "string" || !sceneId.test(entry.id) || entry.id === "random" || ids.has(entry.id) || typeof entry.name !== "string" || !entry.name.trim() || typeof entry.image !== "string" || !entry.image.trim()) {
        throw new Error("Each scene needs a unique lowercase ID, a name, and an image path.");
      }
      if (entry.collection !== void 0 && (typeof entry.collection !== "string" || !entry.collection.trim())) {
        throw new Error("A scene collection must have a name.");
      }
      if (entry.focus !== void 0 && !["top", "center", "bottom"].includes(entry.focus)) {
        throw new Error("A scene\u2019s focus must be top, center, or bottom.");
      }
      if (entry.skyX != null && (!Number.isFinite(entry.skyX) || entry.skyX < 0 || entry.skyX > 1)) {
        throw new Error("A scene\u2019s skyX must be null or a number between 0 and 1.");
      }
      if (entry.nightLit !== void 0 && typeof entry.nightLit !== "boolean") {
        throw new Error("A scene\u2019s nightLit value must be true or false.");
      }
      ids.add(entry.id);
      return {
        id: entry.id,
        name: entry.name.trim(),
        image: entry.image.trim(),
        collection: entry.collection?.trim() ?? "Other",
        focus: entry.focus ?? "center",
        skyX: entry.skyX,
        nightLit: entry.nightLit
      };
    });
  }
  function sceneUrl(value, origin, base) {
    let url;
    try {
      url = new URL(value, base);
    } catch {
      throw new Error("Enter a full URL.");
    }
    if (url.protocol !== "https:" && !(url.protocol === "http:" && url.origin === origin) || url.username || url.password) {
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

  // lib/trmnl.js
  var artworkBase = "https://raw.githubusercontent.com/metaember/trmnl-plugins/main/weather-window/assets/scenes/";
  var stock = readManifest(manifest_default).map((scene) => ({ ...scene, src: new URL(scene.image, artworkBase).href }));
  var cover = stock.find((scene) => scene.id === "lighthouse-headland");
  function coordinates(location) {
    const parts = location.split(",").map((value) => value.trim());
    if (parts.length !== 2 || parts.some((value) => !/^-?\d+(?:\.\d+)?$/.test(value))) return null;
    const [latitude, longitude] = parts.map(Number);
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
    return { latitude, longitude };
  }
  function polledGallery(url, responses) {
    const base = new URL(sceneUrl(url));
    if (base.origin !== "https://raw.githubusercontent.com") throw new Error("Use a public GitHub gallery");
    const manifest = responses.find((response) => response?.version === 1 && Array.isArray(response.scenes));
    return readManifest(manifest).map((scene) => ({ ...scene, src: sceneUrl(scene.image, null, base) }));
  }
  function weatherWindow(input, date = /* @__PURE__ */ new Date()) {
    if (!input || typeof input !== "object" || Array.isArray(input)) input = {};
    const plugin = input.trmnl?.plugin_settings;
    const settings = { ...plugin?.custom_fields_values, instance: plugin?.id };
    const location = String(settings.location ?? "").trim();
    const choices = displayChoices(settings, date, location);
    const { weatherMode, roll } = choices;
    const responses = [input, input.IDX_0, input.IDX_1];
    let live;
    let status = "";
    if (location && weatherMode === "live") {
      try {
        const place = coordinates(location);
        if (!place) throw new Error("Invalid location");
        const forecast2 = parseForecast(responses.find((response) => response?.current));
        live = { place, forecast: forecast2 };
      } catch {
        status = "Weather unavailable \xB7 sample shown";
      }
    }
    const collection = settings.collection || "Quiet views";
    const landscape = settings.landscape || "@newer";
    const defaultScene = !location && collection === "Quiet views" && landscape === "@newer" ? cover : chooseScene(stock, collection, landscape, roll("scene"));
    let scene = defaultScene;
    let imageHasWeather = false;
    try {
      if (settings.source === "image") {
        scene = { name: "Custom scene", src: sceneUrl(settings.scene_url), focus: "center", skyX: null };
        imageHasWeather = [true, "true"].includes(settings.scene_has_weather);
      } else if (settings.source === "gallery") {
        scene = chooseScene(polledGallery(settings.scene_url, responses), collection, landscape, roll("scene"));
      }
    } catch {
      status ||= "Custom artwork unavailable \xB7 built-in scene shown";
    }
    const forecast = live?.forecast ?? forecasts[weatherMode] ?? forecasts.snow;
    const timezone = live?.forecast.timezone ?? timezoneFor(input.trmnl?.user?.time_zone_iana);
    return displayData({
      date,
      location,
      live,
      forecast,
      choices,
      timezone,
      scene,
      fallback: cover.src,
      status,
      imageHasWeather
    });
  }
  return __toCommonJS(trmnl_exports);
})();
function run(input) { return WeatherWindow.weatherWindow(input); }
