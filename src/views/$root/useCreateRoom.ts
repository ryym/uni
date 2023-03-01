import { addDoc, setDoc } from "firebase/firestore";
import { useAtomValue } from "jotai";
import { useCallback } from "react";
import { roomCollectionRef, roomCreatorDocRef } from "~/backend/db";
import { log } from "~/lib/logger";
import { firebaseAtom } from "~/views/store/firebase";
import { useSignIn } from "~/views/store/session";

export type CreateRoom = (masterPassword: string) => Promise<NewRoomInfo>;

export type NewRoomInfo = {
  readonly id: string;
};

export const useCreateRoom = (): CreateRoom => {
  const { db } = useAtomValue(firebaseAtom);
  const signIn = useSignIn();

  const createRoom: CreateRoom = useCallback(
    async (masterPassword) => {
      const user = await signIn();

      log.debug("registering room creator");
      await setDoc(roomCreatorDocRef(db, user.uid), {
        password: masterPassword,
        registeredAt: Date.now(),
      });

      log.debug("creating room");
      const roomRef = await addDoc(roomCollectionRef(db), {
        createdAt: Date.now(),
        ownerUid: user.uid,
        members: {},
      });

      return { id: roomRef.id };
    },
    [db, signIn],
  );

  return createRoom;
};
