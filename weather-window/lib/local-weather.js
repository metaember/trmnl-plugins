const weatherCodes = {
  0: ["Clear", "clear"], 1: ["Mostly clear", "clear"],
  2: ["Partly cloudy", "cloudy", 0.3], 3: ["Overcast", "cloudy", 0.9],
  45: ["Fog", "fog", 0.62], 48: ["Freezing fog", "fog", 0.75],
  51: ["Light drizzle", "drizzle", 0.13], 53: ["Drizzle", "drizzle", 0.2], 55: ["Heavy drizzle", "drizzle", 0.3],
  56: ["Freezing drizzle", "drizzle", 0.17], 57: ["Freezing drizzle", "drizzle", 0.32],
  61: ["Light rain", "rain", 0.32], 63: ["Rain", "rain", 0.62], 65: ["Heavy rain", "rain", 0.95],
  66: ["Freezing rain", "rain", 0.32], 67: ["Freezing rain", "rain", 0.8],
  71: ["Light snow", "snow", 0.2], 73: ["Snow", "snow", 0.61], 75: ["Heavy snow", "snow", 0.99],
  77: ["Snow grains", "snow", 0.13], 80: ["Light showers", "rain", 0.36], 81: ["Showers", "rain", 0.66],
  82: ["Heavy showers", "rain", 0.95], 85: ["Snow showers", "snow", 0.42], 86: ["Heavy snow showers", "snow", 0.95],
  95: ["Thunderstorms", "storm", 0.78], 96: ["Thunderstorms", "storm", 0.85], 99: ["Thunderstorms", "storm", 1],
};

const unknownWeather = ["Conditions unavailable", "cloudy", 0.4];
const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });

async function request(endpoint, params, signal) {
  const response = await fetch(`${endpoint}?${new URLSearchParams(params)}`, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]),
  });
  if (!response.ok) throw new Error(`Weather request returned ${response.status}`);
  return response.json();
}

export async function searchPlaces(name, signal) {
  const data = await request("https://geocoding-api.open-meteo.com/v1/search", { name, count: 6 }, signal);
  return (data.results ?? []).filter(place => place.timezone).map(place => ({
    id: place.id,
    label: [...new Set([place.name, place.admin1, place.country].filter(Boolean))].join(", "),
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone,
  }));
}

export async function fetchForecast(place, signal) {
  const data = await request("https://api.open-meteo.com/v1/forecast", {
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone || "auto",
    timeformat: "unixtime",
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    current: "temperature_2m,is_day,weather_code,wind_speed_10m",
    hourly: "temperature_2m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    forecast_days: 7,
  }, signal);
  return parseForecast(data, place);
}

export function parseForecast(data, place = {}) {
  const { current, hourly, daily } = data;
  if (!Number.isFinite(current?.time) || !Number.isFinite(current.temperature_2m)
      || !Array.isArray(hourly?.time) || !daily?.time?.length
      || !Array.isArray(hourly.temperature_2m) || !Array.isArray(hourly.weather_code)
      || !Array.isArray(daily.weather_code) || !Array.isArray(daily.temperature_2m_max)
      || !Array.isArray(daily.temperature_2m_min) || !Array.isArray(daily.precipitation_probability_max)) {
    throw new Error("Incomplete weather forecast");
  }
  const timezone = data.timezone || place.timezone || "UTC";
  const isNight = current.is_day === 0;
  const [condition, effect, amount] = weatherCodes[current.weather_code] ?? unknownWeather;
  const label = isNight && current.weather_code === 0 ? "Clear night" : condition;
  const timeFormat = new Intl.DateTimeFormat("en-US", {
    hour: "numeric", timeZone: timezone,
  });
  const firstHour = hourly.time.findIndex(time => time > current.time);
  const upcoming = firstHour < 0 ? [] : hourly.time.slice(firstHour, firstHour + 3).map((time, offset) => {
    const index = firstHour + offset;
    return {
      time: timeFormat.format(time * 1000).toLowerCase(),
      temperature: hourly.temperature_2m[index],
      condition: weatherCodes[hourly.weather_code[index]]?.[0] ?? "Unavailable",
    };
  });
  const change = upcoming.find(hour => hour.condition !== condition);
  return {
    label,
    timezone,
    isNight,
    effect: isNight && effect === "clear" ? "night" : effect,
    temperature: current.temperature_2m,
    wind: current.wind_speed_10m,
    amount,
    next: change ? `${change.condition} by ${change.time}` : "Steady next few hours",
    summary: change
      ? `${label} now, with ${change.condition.toLowerCase()} by ${change.time}.`
      : `${label} now, with little change over the next few hours.`,
    hourly: upcoming,
    weekly: daily.time.map((time, index) => {
      const [condition, effect] = weatherCodes[daily.weather_code[index]] ?? ["Unavailable", ""];
      // Daily timestamps use the API's fixed offset, including across a DST change.
      return {
        day: index === 0 ? "Today" : weekday.format((time + data.utc_offset_seconds) * 1000),
        condition, effect,
        high: daily.temperature_2m_max[index],
        low: daily.temperature_2m_min[index],
      };
    }),
    high: daily.temperature_2m_max[0],
    low: daily.temperature_2m_min[0],
    precipitation: daily.precipitation_probability_max[0],
    time: current.time * 1000,
  };
}

export function formatTemperature(fahrenheit, unit, showUnit = true) {
  if (!Number.isFinite(fahrenheit)) return "—";
  const value = unit === "C" ? (fahrenheit - 32) * 5 / 9 : fahrenheit;
  return `${Math.round(value)}°${showUnit ? unit : ""}`;
}

export function formatWind(mph, unit) {
  if (!Number.isFinite(mph)) return "—";
  return `${Math.round(unit === "km/h" ? mph * 1.609344 : mph)} ${unit}`;
}
