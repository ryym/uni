import { app } from "firebase-admin";
import { Card, buildDeck } from "../../../shared/cards";
import { GameConfig, GameSnapshot, initializeGameState } from "../../../shared/game";
import { randomInt } from "../../../shared/random";
import { CallHandler } from "../lib/firebaseFunctions";

export const initGameHandler = (app: app.App): CallHandler<unknown, Promise<null>> => {
  return async (_data, ctx) => {
    if (ctx.auth == null) {
      return null;
    }

    const firestore = app.firestore();

    const playerUids = [
      "OY7hfWeGKJZfzkFf4QShzeCmVnn2",
      "HxImD58lt4OMIgkQ7mOsMx3DPmn1",
      "RU1N3xxK7YTHoybGitUkm907sDU2",
    ];

    const cards = buildDeck();
    shuffleCards(cards);

    const gameState = initializeGameState({ cards, playerUids, handCardsNum: 7 });

    const gameConfig: GameConfig = {
      deck: cards.map((c) => c.id),
      playerUids,
    };
    const gameSnapshot: GameSnapshot = {
      state: gameState,
      lastAction: {
        type: "Start",
      },
    };

    const batch = firestore.batch();
    batch.set(firestore.doc("games/poc"), gameConfig);
    batch.set(firestore.doc("games/poc/states/current"), gameSnapshot);
    await batch.commit();

    return null;
  };
};

const shuffleCards = (cards: Card[]): void => {
  // Fisher-Yates shuffle (https://stackoverflow.com/a/2450976)
  let i = cards.length;
  while (i > 0) {
    const r = randomInt(i);
    i -= 1;
    [cards[i], cards[r]] = [cards[r], cards[i]];
  }
};
