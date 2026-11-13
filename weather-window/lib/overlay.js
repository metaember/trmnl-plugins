import { drawWeather } from "./weather.js";

function mount() {
  for (const glass of document.querySelectorAll(".ww-glass:not([data-ww-ready])")) {
    glass.dataset.wwReady = "true";
    const img = glass.querySelector("img");
    const fallback = () => {
      if (!img.dataset.fallback || img.src === img.dataset.fallback) return;
      img.src = img.dataset.fallback;
      img.dataset.fallback = "";
    };
    img.addEventListener("error", fallback);
    if (img.complete && !img.naturalWidth) fallback();

    const canvas = glass.querySelector("canvas");
    if (!canvas) continue;
    const forecast = JSON.parse(canvas.dataset.weather);
    function render() {
      if (!canvas.clientWidth || !canvas.clientHeight) return;
      const width = 800;
      const height = Math.round(width * canvas.clientHeight / canvas.clientWidth);
      if (canvas.height !== height) canvas.height = height;
      drawWeather(canvas.getContext("2d"), forecast.effect, forecast, forecast.moon, width, height, forecast.skyX);
    }
    render();
    const observer = new ResizeObserver(render);
    observer.observe(canvas);
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
else mount();
