import { Firestore, onSnapshot, runTransaction } from "firebase/firestore";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { User } from "~/app/models";
import { SyncedRoom } from "~/app/room";
import { roomDocRef, updateDoc } from "~/backend/db";
import { log } from "~/lib/logger";
import { firebaseAtom } from "../_store/firebase";
import { useSignIn } from "../_store/session";

export type JoinAndSubscribeRoom = (userName: string) => Promise<void>;

export const useSyncedRoom = (roomId: string): readonly [SyncedRoom, JoinAndSubscribeRoom] => {
  const { db } = useAtomValue(firebaseAtom);
  const signIn = useSignIn();

  const [room, setRoom] = useState<SyncedRoom>({ status: "unsynced" });
  const [joined, setJoined] = useState(false);

  const joinRoom: JoinAndSubscribeRoom = useCallback(
    async (userName) => {
      const user = await signIn();
      log.debug("joining room", user.uid, userName);
      await registerAsRoomMember(db, roomId, user, userName);
      setJoined(true);
    },
    [db, signIn, roomId],
  );

  useEffect(() => {
    if (!joined) {
      return;
    }
    return onSnapshot(roomDocRef(db, roomId), (d) => {
      const room = d.data();
      if (room == null) {
        throw new Error("room not found (in subscription)");
      }
      setRoom({ status: "synced", state: room });
    });
  }, [db, roomId, joined]);

  return [room, joinRoom];
};

const registerAsRoomMember = (db: Firestore, roomId: string, user: User, userName: string) => {
  return runTransaction(db, async (tx) => {
    const roomRef = await tx.get(roomDocRef(db, roomId));
    const room = roomRef.data();
    if (room == null) {
      throw new Error("'room not found (on join)'");
    }
    const members = {
      ...room.members,
      [user.uid]: { name: userName },
    };
    await updateDoc(tx, roomDocRef(db, roomId), { members });
  });
};
