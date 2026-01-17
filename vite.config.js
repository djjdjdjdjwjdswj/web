import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["vite.svg"],
      manifest: {
        name: "Chat Web",
        short_name: "Chat",
        description: "Messenger + posts",
        theme_color: "#0b1014",
        background_color: "#0b1014",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          { src: "/vite.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }
        ]
      },
      workbox: {
        navigateFallback: "/index.html"
      }
    })
  ],
  server: {
    host: true
  }
});
