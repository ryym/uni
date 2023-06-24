// A script to seed data to Firebase Realtime database emulator on launch.

import admin from "firebase-admin";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import dotenv from "dotenv";
import url from "node:url";
import path from "node:path";

dotenv.config({ path: ".env.development" });

const filePath = url.fileURLToPath(import.meta.url);
const firebaseJsonPath = path.resolve(path.dirname(filePath), "../firebase.json");

const initFirebaseAdminForEmulator = (config) => {
  // https://firebase.google.com/docs/emulator-suite/connect_firestore#admin_sdks
  process.env.FIRESTORE_EMULATOR_HOST = `127.0.0.1:${config.emulators.firestore.port}`;
  return admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
};

const seedBaseData = async (db) => {
  await db.doc("passwords/dev").create({});
  console.log("finish seeding");
};

const config = JSON.parse(await fs.readFile(firebaseJsonPath));
const app = initFirebaseAdminForEmulator(config);
try {
  console.log("starting emulator...");
  spawn("npx", ["firebase", "emulators:start"], { stdio: "inherit" });
  await seedBaseData(app.firestore());
} finally {
  await app.delete();
}
