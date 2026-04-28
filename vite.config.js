import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      // Forward /proxy/ollama/* to the local Express proxy server
      "/proxy/ollama": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/api/ollama": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/api/sami-token": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
