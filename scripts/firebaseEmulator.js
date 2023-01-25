/* eslint-env node */

// A script to seed data to Firebase Realtime database emulator on launch.

const { spawn } = require("child_process");

const main = async () => {
  await startEmulatorWithSetup();
};

const startEmulatorWithSetup = async () => {
  spawn("npx", ["firebase", "emulators:start"], { stdio: "inherit" });
};

main().catch((err) => {
  err != null && console.error(err);
  process.exit(1);
});
