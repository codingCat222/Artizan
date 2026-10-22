import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Forward API calls to the backend so the browser sees a single origin.
    // This keeps the httpOnly refresh-token cookie working without CORS setup.
    proxy: {
      "/api": { target: "http://localhost:4000", changeOrigin: true },
    },
  },
});