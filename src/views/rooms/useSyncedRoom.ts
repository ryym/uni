import { Firestore, onSnapshot, runTransaction } from "firebase/firestore";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { User } from "~/app/models";
import { Room, SyncedRoom } from "~/app/room";
import { roomDocRef, updateDoc } from "~/backend/db";
import { log } from "~/lib/logger";
import { firebaseAtom } from "../_store/firebase";
import { sessionAtom, useSignIn } from "../_store/session";

export type JoinAndSubscribeRoom = (userName: string) => Promise<void>;

type MemberCache = {
  readonly roomId: string;
};

type JoinState =
  | {
      readonly joined: false;
      readonly joining: boolean;
    }
  | {
      readonly joined: true;
      readonly user: User;
    };

export const useSyncedRoom = (roomId: string): readonly [SyncedRoom, JoinAndSubscribeRoom] => {
  const { db } = useAtomValue(firebaseAtom);
  const signIn = useSignIn();
  const session = useAtomValue(sessionAtom);

  const [memberCache, setMemberCache] = useMemberCache();
  const hadBeenMember = memberCache?.roomId === roomId;

  const [joinState, setJoinState] = useState<JoinState>(() => {
    const joining = hadBeenMember && (session.signedIn || session.restoring);
    return { joined: false, joining };
  });

  const [sync, setSync] = useState<SyncedRoom>({
    status: "unsynced",
    joining: !joinState.joined && joinState.joining,
  });
  const [room] = useState<Room>({ id: roomId });

  const joinRoom: JoinAndSubscribeRoom = useCallback(
    async (userName) => {
      setJoinState({ joined: false, joining: true });
      const user = await signIn();
      log.debug("joining room", user.uid, userName);
      await registerAsRoomMember(db, roomId, user, userName);
      setMemberCache({ roomId });
      setJoinState({ joined: true, user });
    },
    [db, signIn, setMemberCache, roomId],
  );

  useEffect(() => {
    // Join the room automatically if possible.
    if (!joinState.joined && joinState.joining && session.signedIn && hadBeenMember) {
      setJoinState({ joined: true, user: session.user });
    }
  }, [joinState, session, hadBeenMember]);

  useEffect(() => {
    if (!joinState.joined) {
      return;
    }
    return onSnapshot(roomDocRef(db, room.id), (d) => {
      const state = d.data();
      if (state == null) {
        throw new Error("room not found (in subscription)");
      }
      if (state.members[joinState.user.uid] == null) {
        throw new Error("user not in room members");
      }
      setSync({ status: "synced", room, state });
    });
  }, [db, room, joinState]);

  return [sync, joinRoom];
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
