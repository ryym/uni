/* eslint-env node */

const admin = require("firebase-admin");
const config = require("../../firebase.json");

module.exports = {
  initFirebaseAdminForEmulator: () => {
    // ref: https://firebase.google.com/docs/database/admin/start#node.js
    process.env.FIREBASE_DATABASE_EMULATOR_HOST = `127.0.0.1:${config.emulators.database.port}`;
    process.env.FIRESTORE_EMULATOR_HOST = `127.0.0.1:${config.emulators.firestore.port}`;
    return admin.initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
    });
  },
};
