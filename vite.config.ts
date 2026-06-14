import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { airshipProxy } from "./airship-proxy";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load ALL env vars (prefix "") for server-side use. Vite still only exposes
  // VITE_-prefixed vars to the browser, so AIRSHIP_API_TOKEN stays server-side.
  const env = loadEnv(mode, process.cwd(), "");
  return {
  // Relative base so the built assets resolve under a GitHub Pages subpath
  // (e.g. /airship-actions/) as well as at a domain root.
  base: "./",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger(), airshipProxy(env)].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  };
});
