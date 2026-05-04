// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        // Disable in dev so SW never runs inside Lovable preview iframe
        devOptions: { enabled: false },
        includeAssets: [
          "favicon.ico",
          "apple-touch-icon.png",
          "placeholder.svg",
        ],
        manifest: {
          name: "Agenda Prestasi",
          short_name: "Agenda Prestasi",
          description:
            "Temukan beasiswa, lomba, dan latihan tryout SNBT di satu tempat.",
          theme_color: "#2563eb",
          background_color: "#ffffff",
          display: "standalone",
          start_url: "/",
          scope: "/",
          lang: "id",
          icons: [
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "/pwa-maskable-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          // Don't try to cache TanStack Start server routes / OAuth callbacks
          navigateFallbackDenylist: [/^\/api\//, /^\/~oauth/, /^\/auth\//],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === "navigate",
              handler: "NetworkFirst",
              options: { cacheName: "html", networkTimeoutSeconds: 3 },
            },
          ],
        },
      }),
    ],
  },
});
