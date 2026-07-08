import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    // Only the demo build (GitHub Pages, served from /Calendar-Management/) sets VITE_BASE_PATH —
    // the normal/production build (Firebase Hosting, served from "/") is unaffected.
    base: env.VITE_BASE_PATH || "/",
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon-16x16.png", "favicon-32x32.png", "apple-touch-icon.png"],
        manifest: {
          name: "Gestión de Clases · Profesor ELE",
          short_name: "Clases ELE",
          description: "Gestión de clases, bonos y calendario para profesores de español.",
          lang: "es",
          theme_color: "#2563eb",
          background_color: "#f8fafc",
          display: "standalone",
          start_url: env.VITE_BASE_PATH || "/",
          icons: [
            { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
            { src: "pwa-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
        workbox: {
          // Everything is local-first (IndexedDB) already; just cache the app shell for offline loads.
          globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
        },
      }),
    ],
    server: {
      port: 5173,
      // Allows access through temporary Cloudflare Tunnel URLs (npm run dev tunnel sharing).
      // Each run gets a random *.trycloudflare.com subdomain, so we allow the whole domain.
      allowedHosts: [".trycloudflare.com"],
    },
  };
});
