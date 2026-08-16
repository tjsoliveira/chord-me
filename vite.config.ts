import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "src/client",
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      // Regex requires a trailing slash so this only matches API routes
      // (/api/chords, /api/songs/1) and never the client module /api.ts.
      "^/api/": {
        target: "http://127.0.0.1:3001",
        changeOrigin: false,
      },
    },
  },
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
  },
});
