/* eslint-env node */

import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import fullReload from "vite-plugin-full-reload";

// https://vitejs.dev/config/
// eslint-disable-next-line import/no-default-export
export default defineConfig((env) => {
  return {
    server: {
      port: 5183,
    },
    plugins: [react(), fullReload(["src/**/*"])],
    resolve: {
      alias: {
        "~": path.join(__dirname, "src"),
      },
    },
    define: {
      __FIREBASE_EMULATOR__: env.mode === "development" && process.env.CONNECT_FIREBASE !== "true",
    },
  };
});
