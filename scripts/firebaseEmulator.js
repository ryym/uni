/* eslint-env node */

// A script to seed data to Firebase Realtime database emulator on launch.

const { spawn } = require("child_process");
const dotenv = require("dotenv");
const { initFirebaseAdminForEmulator, seedBaseData } = require("./lib/firebase");

const main = async () => {
  dotenv.config({ path: ".env.development" });

  const app = initFirebaseAdminForEmulator();
  try {
    await startEmulatorWithSetup(app);
  } finally {
    await app.delete();
  }
};

const startEmulatorWithSetup = async (app) => {
  spawn("npx", ["firebase", "emulators:start"], { stdio: "inherit" });
  await seedBaseData(app.database());
};

main().catch((err) => {
  err != null && console.error(err);
  process.exit(1);
});
