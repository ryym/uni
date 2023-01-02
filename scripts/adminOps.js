/* eslint-env node */

// A script to do some useful operations during development.
// This assumes that the emulator is already launched.

const dotenv = require("dotenv");
const { initFirebaseAdminForEmulator, seedBaseData } = require("./lib/firebase");

const main = async () => {
  dotenv.config({ path: ".env.development" });

  const app = initFirebaseAdminForEmulator();
  const db = app.database();
  try {
    const command = process.argv[2];
    switch (command) {
      case "seed": {
        await seedBaseData(db);
        return;
      }
      case "clear-db": {
        await clearDb(db);
        return;
      }
      default:
        throw new Error(`unknown command: ${command}`);
    }
  } finally {
    await app.delete();
  }
};

const clearDb = async (db) => {
  await db.ref("/").set(null);
  await seedBaseData(db);
  const snapshot = await db.ref("/").once("value");
  console.log("DB cleared", snapshot.val());
};

main().catch((err) => {
  err != null && console.error(err);
  process.exit(1);
});
