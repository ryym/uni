/* eslint-env node */

const admin = require("firebase-admin");
const config = require("../../firebase.json");

module.exports = {
  initFirebaseAdminForEmulator: () => {
    process.env.FIRESTORE_EMULATOR_HOST = `127.0.0.1:${config.emulators.firestore.port}`;
    return admin.initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    });
  },
};
