/* eslint-env node */

// A script to do some useful operations during development.
// This assumes that the emulator is already launched.

const dotenv = require("dotenv");
const { initFirebaseAdminForEmulator, seedBaseData } = require("./lib/firebase");

const main = async () => {
  dotenv.config({ path: ".env.development" });

  const app = initFirebaseAdminForEmulator();
  const db = app.database();
  const firestore = app.firestore();
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
      case "init-game": {
        await tmpInitGameState(firestore);
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

/**
 * @param {FirebaseFirestore.Firestore} firestore
 */
const tmpInitGameState = async (firestore) => {
  const uid1 = "OY7hfWeGKJZfzkFf4QShzeCmVnn2";
  const uid2 = "HxImD58lt4OMIgkQ7mOsMx3DPmn1";
  const uid3 = "RU1N3xxK7YTHoybGitUkm907sDU2";

  const batch = firestore.batch();
  batch.set(firestore.doc("games/poc"), {
    deck: ["Red-0", "Green-0", "Blue-0", "Yellow-0", "Red-1", "Green-1", "Blue-1", "Yellow-1"],
    playerUids: [uid1, uid2, uid3],
  });
  batch.set(firestore.doc("games/poc/states/current"), {
    state: {
      turn: 1,
      currentPlayerUid: uid1,
      deckTopIdx: 4,
      playerMap: {
        [uid1]: {
          hand: [0],
          wonAt: null,
        },
        [uid2]: {
          hand: [1],
          wonAt: null,
        },
        [uid3]: {
          hand: [2],
          wonAt: null,
        },
      },
      discardPile: {
        topCards: ["Yellow-0"],
        color: "Yellow",
      },
    },
    lastAction: {
      type: "Start",
    },
  });
  const results = await batch.commit();
  console.log("game state initialized", results);
};

main().catch((err) => {
  err != null && console.error(err);
  process.exit(1);
});
