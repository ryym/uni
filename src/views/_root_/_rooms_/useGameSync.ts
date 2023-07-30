import { getDoc, onSnapshot } from "firebase/firestore";
import { useAtomValue } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import { GameAction, GameConfig, updateGameState } from "~/app/uni/game";
import { GameSync, syncGame } from "~/app/uni/game/sync";
import { gameConfigDocRef, gameStateDocRef, updateDoc } from "~/backend/db";
import { callCancelGameFunction, callInitGameFunction } from "~/backend/functions";
import { log } from "~/lib/logger";
import { firebaseAtom } from "~/views/store/firebase";
import { roomConfigAtom } from "./store/room";

export type GameSyncOperations = {
  readonly startGame: () => Promise<void>;
  readonly updateAndSync: UpdateAndSyncGame;
  readonly cancelGame: () => Promise<void>;
};

export type UpdateAndSyncGame = (
  userUid: string,
  game: GameSync,
  action: GameAction,
) => Promise<void>;

export const useGameSync = (): readonly [GameSync, GameSyncOperations] => {
  const { db, functions } = useAtomValue(firebaseAtom);

  const roomConfig = useAtomValue(roomConfigAtom);
  const gameConfigRef = useRef<GameConfig | null>(null);
  const [game, setGame] = useState<GameSync>({ status: "unsynced" });

  useEffect(() => {
    const roomConfigRef = gameStateDocRef(db, roomConfig.id);
    return onSnapshot(roomConfigRef, { includeMetadataChanges: true }, async (d) => {
      const remoteState = d.data();
      if (remoteState == null) {
        gameConfigRef.current = null;
        setGame({ status: "nogame" });
        return;
      }
      log.debug("game state broadcasted", remoteState);

      if (gameConfigRef.current == null) {
        log.debug("fetching game config");
        const remoteConfig = (await getDoc(gameConfigDocRef(db, roomConfig.id))).data();
        if (remoteConfig == null) {
          throw new Error("[uni] game state exists without game config");
        }
        gameConfigRef.current = remoteConfig;
      }

      const config = gameConfigRef.current;
      setGame((game) => {
        return syncGame(config, game, remoteState, !d.metadata.hasPendingWrites);
      });
    });
  }, [db, roomConfig]);

  const ops: GameSyncOperations = useMemo(() => {
    return {
      startGame: async () => {
        const result = await callInitGameFunction(functions, { roomId: roomConfig.id });
        if (result.error != null) {
          setGame({ status: "invalid", error: result.error });
        }
      },
      updateAndSync: async (userUid, game, action) => {
        if (game.status !== "valid" || game.state.currentPlayerUid !== userUid) {
          return;
        }
        log.debug("updating game state", game.state, action);
        const result = updateGameState(game.config, game.state, action);
        log.debug("local game state update result", result);
        if (result.ok) {
          await updateDoc(null, gameStateDocRef(db, roomConfig.id), result.value);
        } else {
          setGame({ status: "invalid", error: result.error });
        }
      },
      cancelGame: async () => {
        log.debug("cancelling game");
        const result = await callCancelGameFunction(functions, { roomId: roomConfig.id });
        if (result.error != null) {
          setGame({ status: "invalid", error: result.error });
        }
      },
    };
  }, [db, functions, roomConfig]);

  return [game, ops];
};
