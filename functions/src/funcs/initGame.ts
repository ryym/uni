import { app } from "firebase-admin";
import { Card, buildDeck } from "../../../shared/cards";
import { InitGameParams, InitGameResult } from "../../../shared/functions";
import { initializeGame } from "../../../shared/game";
import { randomInt } from "../../../shared/random";
import { RoomState } from "../../../shared/room";
import { CallHandler } from "../lib/firebaseFunctions";

export const initGameHandler = (
  app: app.App,
): CallHandler<InitGameParams, Promise<InitGameResult>> => {
  return async (params, ctx) => {
    if (ctx.auth == null) {
      return { error: "invalid call" };
    }

    const firestore = app.firestore();

    const roomRef = await firestore.doc(`rooms/${params.roomId}`).get();
    const room = roomRef.data() as RoomState | undefined;

    if (room == null) {
      return { error: "room not found" };
    }
    if (room.ownerUid !== ctx.auth.uid) {
      return { error: "non-owner call not allowed" };
    }

    const playerUids = Object.keys(room.members).sort((uid1, uid2) => {
      return room.members[uid1].joinedAt - room.members[uid2].joinedAt;
    });
    const cards = buildDeck();
    shuffleCards(cards);

    const [gameConfig, gameState, idHashMap] = initializeGame({
      cards,
      playerUids,
      handCardsNum: 7,
    });

    const batch = firestore.batch();
    batch.set(firestore.doc(`games/${params.roomId}`), gameConfig);
    batch.set(firestore.doc(`games/${params.roomId}/states/current`), gameState);

    cards.forEach((c) => {
      batch.set(firestore.doc(`games/${params.roomId}/cards/${idHashMap[c.id]}`), { cardId: c.id });
    });

    await batch.commit();

    return { error: null };
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
