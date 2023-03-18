import { getDoc, onSnapshot } from "firebase/firestore";
import { useAtomValue } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import { GameAction, GameConfig, updateGameState } from "~/app/uni/game";
import { SyncedGameSnapshot, syncGame } from "~/app/uni/game/sync";
import { gameConfigDocRef, gameSnapDocRef, updateDoc } from "~/backend/db";
import { callInitGameFunction } from "~/backend/functions";
import { log } from "~/lib/logger";
import { firebaseAtom } from "~/views/store/firebase";
import { roomAtom } from "./store/room";

export type SyncedGameOperations = {
  readonly startGame: () => Promise<void>;
  readonly updateAndSync: UpdateAndSyncGame;
};

export type UpdateAndSyncGame = (
  userUid: string,
  game: SyncedGameSnapshot,
  action: GameAction,
) => Promise<void>;

export const useSyncedGame = (): readonly [SyncedGameSnapshot, SyncedGameOperations] => {
  const { db, functions } = useAtomValue(firebaseAtom);

  const room = useAtomValue(roomAtom);
  const gameConfigRef = useRef<GameConfig | null>(null);
  const [game, setGame] = useState<SyncedGameSnapshot>({ status: "unsynced" });

  useEffect(() => {
    return onSnapshot(gameSnapDocRef(db, room.id), { includeMetadataChanges: true }, async (d) => {
      const snapshot = d.data();
      if (snapshot == null) {
        gameConfigRef.current = null;
        setGame({ status: "nogame" });
        return;
      }
      log.debug("game snapshot broadcasted", snapshot);

      if (gameConfigRef.current == null) {
        log.debug("fetching game config");
        const remoteConfig = (await getDoc(gameConfigDocRef(db, room.id))).data();
        if (remoteConfig == null) {
          throw new Error("[uni] game state exists without game config");
        }
        gameConfigRef.current = remoteConfig;
      }

      const config = gameConfigRef.current;
      setGame((game) => {
        return syncGame(config, game, snapshot, !d.metadata.hasPendingWrites);
      });
    });
  }, [db, room]);

  const ops: SyncedGameOperations = useMemo(() => {
    return {
      startGame: async () => {
        const result = await callInitGameFunction(functions, { roomId: room.id });
        if (result.error != null) {
          setGame({ status: "invalid", error: result.error });
        }
      },
      updateAndSync: async (userUid, game, action) => {
        if (game.status !== "valid" || game.snapshot.state.currentPlayerUid !== userUid) {
          return;
        }
        log.debug("updating game state", game.snapshot.state, action);
        const result = updateGameState(game.config, game.snapshot.state, action);
        log.debug("local game state update result", result);
        if (result.ok) {
          await updateDoc(null, gameSnapDocRef(db, room.id), {
            state: result.value,
            lastAction: action,
          });
        } else {
          setGame({ status: "invalid", error: result.error });
        }
      },
    };
  }, [db, functions, room]);

  return [game, ops];
};
