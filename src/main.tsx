import { createRoot } from "react-dom/client";
import { buildFirebaseClient } from "./lib/firebase";
import { Logger, setGlobalLogger } from "./lib/logger";
import { App } from "./views/App";

const main = async () => {
  setGlobalLogger(new Logger(import.meta.env.DEV ? "debug" : "info"));

  const firebase = await buildFirebaseClient();

  const $root = document.getElementById("root");
  if ($root == null) {
    throw new Error("mount target element not found");
  }
  createRoot($root).render(<App firebase={firebase} />);
};

main().catch((err) => {
  console.error(err);
});
