import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const manifest = {
  theme_color: "#ffffff",
  background_color: "#ffffff",
  icons: [
    {
      purpose: "maskable",
      sizes: "512x512",
      src: "icon512_maskable.png",
      type: "image/png",
    },
    {
      purpose: "any",
      sizes: "512x512",
      src: "icon512_rounded.png",
      type: "image/png",
    },
  ],
  screenshots: [
    {
      src: "/screenshots/desktop.png",
      type: "image/png",
      sizes: "1883x903",
      form_factor: "wide",
    },
    {
      src: "/screenshots/mobile.png",
      type: "image/png",
      sizes: "366x795",
      form_factor: "narrow",
    },
  ],
  orientation: "any",
  display: "standalone",
  dir: "auto",
  lang: "en",
  name: "Fitness Tracker",
  short_name: "FTracker",
  start_url: "/workout-plans?showCurrent=true",
};

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",

      registerType: "autoUpdate",
      injectRegister: "auto",
      devOptions: {
        enabled: true,
        type: "module",
        navigateFallback: "index.html",
      },

      includeAssets: [
        "favicon.ico",
        "robots.txt",
        "icon512_maskable.png",
        "icon512_rounded.png",
        "screenshots/desktop.png",
        "screenshots/mobile.png",
      ],

      manifest,
    }),
  ],
  server: {
    proxy: {
      "/api": { target: "http://backend:8080", changeOrigin: true },
    },
  },
});
