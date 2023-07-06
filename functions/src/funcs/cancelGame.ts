import { app } from "firebase-admin";
import { CancelGameParams, CancelGameResult } from "../../../shared/functions";
import { RoomState } from "../../../shared/room";
import { CallHandler } from "../lib/firebaseFunctions";

export const cancelGameHandler = (
  app: app.App,
): CallHandler<CancelGameParams, Promise<CancelGameResult>> => {
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

    await firestore.recursiveDelete(firestore.doc(`games/${params.roomId}`));

    return { error: null };
  };
};
