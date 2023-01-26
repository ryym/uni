import { app } from "firebase-admin";
import { COLORS, Card, buildDeck } from "../../../shared/cards";
import { GameConfig, GameSnapshot, GameState } from "../../../shared/game";
import { CallHandler } from "../lib/firebaseFunctions";
import { Mutable } from "../lib/mutable";
import { randomInt } from "../lib/random";

export const initGameHandler = (app: app.App): CallHandler<unknown, Promise<null>> => {
  return async (_data, ctx) => {
    if (ctx.auth == null) {
      return null;
    }

    const firestore = app.firestore();

    const cards = buildDeck();
    shuffleCards(cards);

    const playerUids = [
      "OY7hfWeGKJZfzkFf4QShzeCmVnn2",
      "HxImD58lt4OMIgkQ7mOsMx3DPmn1",
      "RU1N3xxK7YTHoybGitUkm907sDU2",
    ];
    const handNum = 3;

    const playerMap: Mutable<GameState["playerMap"]> = {};
    playerUids.forEach((uid, i) => {
      playerMap[uid] = {
        hand: [...Array(handNum)].map((_, j) => handNum * i + j),
        wonAt: null,
      };
    });

    const deckTopIdx = playerUids.length * handNum + 1;
    const discardPile = buildDiscardPile(cards[playerUids.length * handNum]);

    const gameConfig: GameConfig = {
      deck: cards.map((c) => c.id),
      playerUids,
    };
    const gameSnapshot: GameSnapshot = {
      state: {
        turn: 1,
        currentPlayerUid: playerUids[0],
        clockwise: true,
        deckTopIdx,
        playerMap,
        discardPile,
        lastUpdate: null,
      },
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

const buildDiscardPile = (topCard: Card): GameState["discardPile"] => {
  const color = "color" in topCard ? topCard.color : COLORS[randomInt(COLORS.length)];
  return {
    topCards: [topCard.id],
    color,
    attackTotal: null,
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
