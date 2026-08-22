// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

const isVercel = process.env.VERCEL === "1";

export default defineConfig({
  cloudflare: isVercel ? false : undefined,
  plugins: isVercel ? [nitro()] : undefined,
  // Superadmin UI on 5174; API gateway on 8080 (VITE_API_BASE_URL in .env).
  vite: {
    server: {
      port: 5174,
      strictPort: false,
      proxy: {
        "/api": {
          target: "http://localhost:8080",
          changeOrigin: true,
          timeout: 60_000,
          proxyTimeout: 60_000,
        },
        "/ws": {
          target: "http://localhost:8080",
          ws: true,
          changeOrigin: true,
        },
      },
    },
  },
  tanstackStart: isVercel
    ? {}
    : {
        server: { entry: "server" },
      },
});
