/* eslint-env node */

const admin = require("firebase-admin");
const config = require("../../firebase.json");

module.exports = {
  initFirebaseAdminForEmulator: () => {
    // ref: https://firebase.google.com/docs/database/admin/start#node.js
    process.env.FIREBASE_DATABASE_EMULATOR_HOST = `127.0.0.1:${config.emulators.database.port}`;
    return admin.initializeApp({
      databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
    });
  },

  seedBaseData: async (db) => {
    await db.ref("passwords").set({ dev: 0 });
    console.log("finish seeding");
  },
};
