import { build } from "esbuild";

await build({
  entryPoints: ["lib/trmnl.js"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "iife",
  globalName: "WeatherWindow",
  footer: { js: "function run(input) { return WeatherWindow.weatherWindow(input); }" },
  outfile: "src/transform.js",
});
