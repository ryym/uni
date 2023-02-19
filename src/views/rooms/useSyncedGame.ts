import { getDoc, onSnapshot } from "firebase/firestore";
import { useAtomValue } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import { GameAction, GameConfig, updateGameState } from "~/app/douno/game";
import { SyncedGameSnapshot, syncGame } from "~/app/douno/game/sync";
import { gameConfigDocRef, gameSnapDocRef, updateDoc } from "~/backend/db";
import { callInitGameFunction } from "~/backend/functions";
import { log } from "~/lib/logger";
import { firebaseAtom } from "../_store/firebase";

export type SyncedGameOperations = {
  readonly startGame: (roomId: string) => Promise<void>;
  readonly updateAndSync: UpdateAndSyncGame;
};

export type UpdateAndSyncGame = (
  userUid: string,
  game: SyncedGameSnapshot,
  action: GameAction,
) => Promise<void>;

export const useSyncedGame = (): readonly [SyncedGameSnapshot, SyncedGameOperations] => {
  const { db, functions } = useAtomValue(firebaseAtom);

  const gameConfigRef = useRef<GameConfig | null>(null);
  const [game, setGame] = useState<SyncedGameSnapshot>({ status: "unsynced" });

  useEffect(() => {
    return onSnapshot(gameSnapDocRef(db), { includeMetadataChanges: true }, async (d) => {
      const snapshot = d.data();
      if (snapshot == null) {
        setGame({ status: "nogame" });
        return;
      }
      log.debug("game snapshot broadcasted", snapshot);

      if (gameConfigRef.current == null) {
        log.debug("fetching game config");
        const remoteConfig = (await getDoc(gameConfigDocRef(db))).data();
        if (remoteConfig == null) {
          throw new Error("[douno] game state exists without game config");
        }
        gameConfigRef.current = remoteConfig;
      }

      const config = gameConfigRef.current;
      setGame((game) => {
        return syncGame(config, game, snapshot, !d.metadata.hasPendingWrites);
      });
    });
  }, [db]);

  const ops: SyncedGameOperations = useMemo(() => {
    return {
      startGame: async (roomId) => {
        const result = await callInitGameFunction(functions, { roomId });
        if (result.error != null) {
          setGame({ status: "invalid", error: result.error });
        }
      },
      updateAndSync: async (userUid, game, action) => {
        if (game.status !== "valid" || game.snapshot.state.currentPlayerUid !== userUid) {
          return;
        }
        const result = updateGameState(game.config, game.snapshot.state, action);
        log.debug("updated game state locally", result);
        if (result.ok) {
          await updateDoc(null, gameSnapDocRef(db), { state: result.value, lastAction: action });
        } else {
          setGame({ status: "invalid", error: result.error });
        }
      },
    };
  }, [db, functions]);

  return [game, ops];
};
