import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") }, conditions: ["source"] },
  server: { proxy: { "/api": { target: "http://127.0.0.1:7474", ws: true } } },
});
