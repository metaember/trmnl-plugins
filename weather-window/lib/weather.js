import { drawMoon } from "./moon.js";

const samples = {
  snow: {
    label: "Snow", temperature: 29, next: "Heavier after 3 pm", amount: 0.61, wind: 5,
    summary: "Light snow now, turning heavier after 3 pm.",
    hourly: [
      { time: "2 pm", temperature: 30, condition: "Snow" },
      { time: "3 pm", temperature: 29, condition: "Snow" },
      { time: "4 pm", temperature: 28, condition: "Heavy snow" },
    ],
    high: 31, low: 24, precipitation: 90,
  },
  clear: {
    label: "Clear", temperature: 63, next: "Sunny through 2 pm", wind: 7,
    summary: "Sunny through 2 pm, then a few clouds.",
    hourly: [
      { time: "1 pm", temperature: 64, condition: "Sunny" },
      { time: "2 pm", temperature: 65, condition: "Sunny" },
      { time: "3 pm", temperature: 64, condition: "Partly cloudy" },
    ],
    high: 65, low: 47, precipitation: 0,
  },
  rain: {
    label: "Light rain", temperature: 52, next: "Clearing around 4 pm", amount: 0.32, wind: 12,
    summary: "Light rain should ease around 4 pm.",
    hourly: [
      { time: "2 pm", temperature: 53, condition: "Light rain" },
      { time: "3 pm", temperature: 53, condition: "Light rain" },
      { time: "4 pm", temperature: 54, condition: "Cloudy" },
    ],
    high: 55, low: 46, precipitation: 80,
  },
  fog: {
    label: "Fog", temperature: 43, next: "Lifting around 10 am", amount: 0.62, wind: 3,
    summary: "Fog lifts around 10 am, leaving a cloudy sky.",
    hourly: [
      { time: "8 am", temperature: 44, condition: "Fog" },
      { time: "9 am", temperature: 46, condition: "Fog" },
      { time: "10 am", temperature: 48, condition: "Cloudy" },
    ],
    high: 52, low: 41, precipitation: 10,
  },
  night: {
    label: "Clear night", temperature: 38, next: "Clouds by dawn", wind: 4,
    summary: "Mostly clear overnight, with clouds by dawn.",
    hourly: [
      { time: "3 am", temperature: 37, condition: "Clear" },
      { time: "4 am", temperature: 36, condition: "Clear" },
      { time: "5 am", temperature: 36, condition: "Cloudy" },
    ],
    high: 46, low: 36, precipitation: 5,
  },
};

function variant(base, { label, effect, amount, next, wind = base.wind, precipitation = base.precipitation }) {
  return {
    ...base, label, effect, amount, next, wind, precipitation,
    summary: `${label} now. ${next}.`,
    hourly: base.hourly.map((hour, index) => index < 2 ? { ...hour, condition: label } : hour),
  };
}

export const forecasts = {
  clear: samples.clear,
  partlyCloudy: variant(samples.clear, {
    label: "Partly cloudy", effect: "cloudy", amount: 0.3, next: "Clouds increase by 3 pm",
  }),
  overcast: variant(samples.clear, {
    label: "Overcast", effect: "cloudy", amount: 0.9, next: "Still cloudy at 3 pm",
  }),
  drizzle: variant(samples.rain, {
    label: "Drizzle", effect: "drizzle", amount: 0.13, next: "Easing around 4 pm", wind: 5, precipitation: 55,
  }),
  rain: samples.rain,
  steadyRain: variant(samples.rain, {
    label: "Steady rain", effect: "rain", amount: 0.62, next: "Easing around 4 pm", wind: 14, precipitation: 95,
  }),
  heavyRain: variant(samples.rain, {
    label: "Heavy rain", effect: "rain", amount: 0.97, next: "Tapering around 4 pm", wind: 20, precipitation: 100,
  }),
  storm: variant(samples.rain, {
    label: "Thunderstorm", effect: "storm", amount: 0.85, next: "Storms ease around 4 pm", wind: 24, precipitation: 100,
  }),
  flurries: variant(samples.snow, {
    label: "Flurries", effect: "snow", amount: 0.14, next: "Heavier after 3 pm", precipitation: 65,
  }),
  snow: samples.snow,
  heavySnow: variant(samples.snow, {
    label: "Heavy snow", effect: "snow", amount: 1, next: "Heavy snow through 4 pm", wind: 17, precipitation: 100,
  }),
  mist: variant(samples.fog, {
    label: "Light mist", effect: "fog", amount: 0.28, next: "Lifting around 10 am",
  }),
  fog: samples.fog,
  denseFog: variant(samples.fog, {
    label: "Dense fog", effect: "fog", amount: 1, next: "Lifting slowly by 10 am",
  }),
  night: samples.night,
};

export const shortConditions = {
  clear: "Clear", night: "Clear", cloudy: "Clouds", drizzle: "Drizzle", rain: "Rain", snow: "Snow", fog: "Fog", storm: "Storm",
};

export function sampleWeek(forecast, effect, timeZone) {
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone });
  const week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const start = week.indexOf(weekday.format(Date.now()));
  const following = forecast.high <= 36
    ? ["snow", "cloudy", "clear", "snow", "cloudy", "clear"]
    : ["cloudy", "clear", "clear", "rain", "cloudy", "clear"];
  const highOffsets = [0, 2, 4, 6, 1, 3, 5];
  const lowOffsets = [0, 1, 0, 3, 2, 2, 4];

  return [effect, ...following].map((dailyEffect, index) => ({
    day: index === 0 ? "Today" : week[(start + index) % 7],
    condition: index === 0 ? forecast.label : shortConditions[dailyEffect],
    effect: dailyEffect,
    high: forecast.high + highOffsets[index],
    low: forecast.low + lowOffsets[index],
  }));
}

function randomSequence(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function disk(context, x, y, radius, fill) {
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fillStyle = fill;
  context.fill();
}

function cloudBand(context, x, y, radiusX, radiusY, shade, opacity) {
  context.save();
  context.translate(x, y);
  context.scale(radiusX, radiusY);
  const cloud = context.createRadialGradient(0, 0, 0.15, 0, 0, 1);
  cloud.addColorStop(0, `rgba(${shade},${shade},${shade},${opacity})`);
  cloud.addColorStop(1, `rgba(${shade},${shade},${shade},0)`);
  context.fillStyle = cloud;
  context.fillRect(-1, -1, 2, 2);
  context.restore();
}

function drawClouds(context, width, height, amount, storm, night) {
  if (amount > 0.5 || storm) {
    const sky = context.createLinearGradient(0, 0, 0, height * 0.6);
    sky.addColorStop(0, `rgba(28,28,28,${storm ? 0.65 : amount * 0.38})`);
    sky.addColorStop(1, "rgba(28,28,28,0)");
    context.fillStyle = sky;
    context.fillRect(0, 0, width, height * 0.6);
  }
  const clusters = amount > 0.5 || storm ? 6 : 3;
  const shade = storm || night ? 95 : 239;
  const random = randomSequence(39461);
  for (let i = 0; i < clusters; i++) {
    const x = width * (0.1 + 0.82 * i / (clusters - 1));
    const y = height * (0.08 + 0.16 * random());
    const span = width * (0.13 + 0.07 * random());
    cloudBand(context, x, y, span, height * 0.061, shade, night ? 0.38 : 0.7);
    cloudBand(context, x - span * 0.27, y + height * 0.027, span * 0.8, height * 0.048, shade, night ? 0.29 : 0.58);
  }
}

function drawLightning(context, width, height) {
  const points = [[.67,.10],[.642,.182],[.656,.185],[.627,.265],[.638,.206],[.622,.204]];
  context.beginPath();
  points.forEach(([x, y], index) => index ? context.lineTo(width * x, height * y) : context.moveTo(width * x, height * y));
  context.closePath();
  context.fillStyle = "#f2f2f2";
  context.fill();
  context.beginPath();
  context.moveTo(width * .642, height * .182);
  context.lineTo(width * .608, height * .231);
  context.lineTo(width * .604, height * .255);
  context.strokeStyle = "#e8e8e8";
  context.lineWidth = 1.5;
  context.stroke();
}

export function drawWeather(context, weather, forecast, moon, width, height, skyX = 0.77) {
  context.clearRect(0, 0, width, height);
  const random = randomSequence(18973);

  if (weather === "cloudy" || weather === "storm") {
    drawClouds(context, width, height, forecast.amount, weather === "storm", forecast.isNight);
  }

  if (weather === "snow") {
    const count = Math.round(20 + forecast.amount * 520);
    for (let i = 0; i < count; i++) {
      const x = random() * width + forecast.wind * random();
      const y = random() * height;
      const depth = random();
      const radius = 0.48 + depth ** 4 * (2.6 + forecast.amount * 3.3);
      context.beginPath();
      context.ellipse(x, y, radius, radius * 0.7, -Math.PI / 4, 0, Math.PI * 2);
      context.fillStyle = `rgba(255,255,255,${0.44 + depth * 0.5})`;
      context.fill();
    }
  }

  if (weather === "drizzle") {
    const count = Math.round(58 + forecast.amount * 150);
    const slant = 0.14 + forecast.wind / 65;
    context.lineCap = "round";
    for (let i = 0; i < count; i++) {
      const x = random() * width;
      const y = random() * height;
      const depth = random();
      const length = 5 + 7 * depth;
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x - length * slant, y + length);
      // Give each fine streak an edge so it reads against lights and shadows.
      context.lineWidth = 3 + depth;
      context.strokeStyle = "rgba(20,20,20,0.62)";
      context.stroke();
      context.lineWidth = 1.45 + depth * 0.85;
      context.strokeStyle = `rgba(250,250,250,${0.74 + depth * 0.23})`;
      context.stroke();
    }
  }

  if (weather === "rain" || weather === "storm") {
    context.lineCap = "round";
    for (let i = 0; i < forecast.amount * 345; i++) {
      const x = random() * width;
      const y = random() * height;
      const length = 4 + random() * (8 + 24 * forecast.amount);
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x - length * forecast.wind / 28, y + length);
      context.strokeStyle = i % 4 ? "rgba(246,246,246,0.55)" : "rgba(35,35,35,0.31)";
      context.lineWidth = i % 7 ? 0.58 + 0.42 * forecast.amount : 1 + 0.6 * forecast.amount;
      context.stroke();
    }
  }

  if (weather === "storm") drawLightning(context, width, height);

  if (weather === "fog") {
    const amount = forecast.amount;
    const veil = context.createLinearGradient(0, 0, 0, height);
    const shade = forecast.isNight ? 85 : 239;
    veil.addColorStop(0, `rgba(${shade},${shade},${shade},${0.48 * amount})`);
    veil.addColorStop(0.54, `rgba(${shade},${shade},${shade},${0.94 * amount})`);
    veil.addColorStop(1, `rgba(${shade},${shade},${shade},${0.23 * amount})`);
    context.fillStyle = veil;
    context.fillRect(0, 0, width, height);
  }

  if (weather === "clear" && skyX !== null) {
    disk(context, width * skyX, height * 0.19, 26, "rgba(252,252,252,0.94)");
  }

  if (weather === "night" && skyX !== null) {
    const moonX = width * skyX;
    const moonY = height * 0.19;
    const moonRadius = 19;
    for (let i = 0; i < 36; i++) {
      const x = width * (0.37 + random() * 0.61);
      const y = height * (0.03 + random() * 0.3);
      const radius = 0.55 + random() * 0.95;
      if (!moon?.visible || Math.hypot(x - moonX, y - moonY) > moonRadius + radius) {
        disk(context, x, y, radius, "rgba(244,244,244,0.84)");
      }
    }
    if (moon?.visible) drawMoon(context, moonX, moonY, moonRadius, moon);
  }
}
