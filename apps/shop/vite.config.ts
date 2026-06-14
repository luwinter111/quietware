import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
const API_PORT = process.env.API_PORT ?? "8794";
export default defineConfig({
  plugins: [react()],
  server: { port: 5180, proxy: { "/api": `http://localhost:${API_PORT}` } },
});
