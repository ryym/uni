/* eslint-env node */

// A script to do some useful operations during development.
// This assumes that the emulator is already launched.

const dotenv = require("dotenv");
const fs = require("fs/promises");
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
  const cards = JSON.parse(await fs.readFile("./cards.json"));

  const shuffleCards = (cards) => {
    // Fisher-Yates shuffle (https://stackoverflow.com/a/2450976)
    let i = cards.length;
    while (i > 0) {
      const r = randomInt(i);
      i -= 1;
      [cards[i], cards[r]] = [cards[r], cards[i]];
    }
  };
  const randomInt = (maxExclusive) => {
    return Math.floor(Math.random() * maxExclusive);
  };
  shuffleCards(cards);

  const playerUids = [
    "OY7hfWeGKJZfzkFf4QShzeCmVnn2",
    "HxImD58lt4OMIgkQ7mOsMx3DPmn1",
    "RU1N3xxK7YTHoybGitUkm907sDU2",
  ];
  const handNum = 3;
  const playerMap = {};
  playerUids.forEach((uid, i) => {
    playerMap[uid] = {
      hand: [...Array(handNum)].map((_, j) => handNum * i + j),
      wonAt: null,
    };
  });
  const discardPileTop = cards[playerUids.length * handNum];
  const deckTopIdx = playerUids.length * handNum + 1;

  const batch = firestore.batch();
  batch.set(firestore.doc("games/poc"), {
    deck: cards.map((c) => c.id),
    playerUids,
  });
  batch.set(firestore.doc("games/poc/states/current"), {
    state: {
      turn: 1,
      currentPlayerUid: playerUids[0],
      deckTopIdx,
      playerMap,
      discardPile: {
        topCards: [discardPileTop.id],
        // The color should be random if the top card is Wild or Draw4.
        color: discardPileTop.color || "Red",
        attackTotal: null,
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
