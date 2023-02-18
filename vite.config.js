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
        "~shared": path.join(__dirname, "shared"),
      },
    },
    define: {
      __FIREBASE_EMULATOR__: env.mode === "development" && process.env.CONNECT_FIREBASE !== "true",

      // Constants used in shared/ must be prefixed with "global." since
      // the build for Cloud Function environment does not use Vite, so
      // replacements are not executed. In that case we need to arrange the
      // global variable values at runtime.
      "global.__ENV_TEST__": "true",
    },
  };
});
