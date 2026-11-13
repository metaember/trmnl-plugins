import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  root: fileURLToPath(new URL("./", import.meta.url)),
  plugins: [react()],
  server: { fs: { allow: [fileURLToPath(new URL("../", import.meta.url))] } },
  build: {
    rollupOptions: {
      input: {
        studio: fileURLToPath(new URL("index.html", import.meta.url)),
        gallery: fileURLToPath(new URL("gallery.html", import.meta.url)),
      },
    },
  },
});
