import { Firestore, onSnapshot, runTransaction } from "firebase/firestore";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { User } from "~/app/models";
import { RoomConfig, RoomSync } from "~/app/room";
import { roomDocRef, updateDoc } from "~/backend/db";
import { log } from "~/lib/logger";
import { firebaseAtom } from "~/views/store/firebase";
import { sessionAtom, useSignIn } from "~/views/store/session";
import { RoomMemberMap } from "~shared/room";

export type JoinAndSubscribeRoom = (userName: string) => Promise<void>;

type MemberCache = {
  readonly roomId: string;
};

type JoinState =
  | {
      readonly joined: false;
    }
  | {
      readonly joined: true;
      readonly user: User;
    };

export const useRoomSync = (roomId: string): readonly [RoomSync, JoinAndSubscribeRoom] => {
  const { db } = useAtomValue(firebaseAtom);
  const signIn = useSignIn();
  const session = useAtomValue(sessionAtom);
  const [memberCache, setMemberCache] = useMemberCache();

  const [joinState, setJoinState] = useState<JoinState>(() => {
    if (session.signedIn && memberCache?.roomId === roomId) {
      return { joined: true, user: session.user };
    }
    return { joined: false };
  });

  const [room, setRoom] = useState<RoomSync>({ status: "unsynced", syncing: joinState.joined });
  const [roomConfig] = useState<RoomConfig>({ id: roomId });

  const joinRoom: JoinAndSubscribeRoom = useCallback(
    async (userName) => {
      setRoom({ status: "unsynced", syncing: true });
      const user = await signIn();
      log.debug("joining room", user.uid, userName);
      await registerAsRoomMember(db, roomId, user, userName);
      setMemberCache({ roomId });
      setJoinState({ joined: true, user });
    },
    [db, signIn, setMemberCache, roomId],
  );

  useEffect(() => {
    if (!joinState.joined) {
      return;
    }
    return onSnapshot(roomDocRef(db, roomConfig.id), (d) => {
      const state = d.data();
      if (state == null) {
        throw new Error("room not found (in subscription)");
      }
      if (state.members[joinState.user.uid] == null) {
        throw new Error("user not in room members");
      }
      setRoom({ status: "synced", config: roomConfig, state });
    });
  }, [db, roomConfig, joinState]);

  return [room, joinRoom];
};

const registerAsRoomMember = (db: Firestore, roomId: string, user: User, userName: string) => {
  return runTransaction(db, async (tx) => {
    const roomRef = await tx.get(roomDocRef(db, roomId));
    const room = roomRef.data();
    if (room == null) {
      throw new Error("'room not found (on join)'");
    }
    const members: RoomMemberMap = {
      ...room.members,
      [user.uid]: {
        name: userName,
        joinedAt: Date.now(),
      },
    };
    await updateDoc(tx, roomDocRef(db, roomId), { members });
  });
};

const MEMBER_CACHE_KEY = "room-member-cache";

const useMemberCache = () => {
  const [memberCache, setMemberCacheState] = useState<MemberCache | null>(() => {
    const cache = window.localStorage.getItem(MEMBER_CACHE_KEY);
    return cache == null ? null : (JSON.parse(cache) as MemberCache);
  });
  const setMemberCache = (cache: MemberCache) => {
    window.localStorage.setItem(MEMBER_CACHE_KEY, JSON.stringify(cache));
    setMemberCacheState(cache);
  };
  return [memberCache, setMemberCache] as const;
};
