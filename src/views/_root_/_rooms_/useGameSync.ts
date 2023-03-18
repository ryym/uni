import { getDoc, onSnapshot } from "firebase/firestore";
import { useAtomValue } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import { GameAction, GameConfig, updateGameState } from "~/app/uni/game";
import { GameSync, syncGame } from "~/app/uni/game/sync";
import { gameConfigDocRef, gameStateDocRef, updateDoc } from "~/backend/db";
import { callInitGameFunction } from "~/backend/functions";
import { log } from "~/lib/logger";
import { firebaseAtom } from "~/views/store/firebase";
import { roomAtom } from "./store/room";

export type GameSyncOperations = {
  readonly startGame: () => Promise<void>;
  readonly updateAndSync: UpdateAndSyncGame;
};

export type UpdateAndSyncGame = (
  userUid: string,
  game: GameSync,
  action: GameAction,
) => Promise<void>;

export const useGameSync = (): readonly [GameSync, GameSyncOperations] => {
  const { db, functions } = useAtomValue(firebaseAtom);

  const room = useAtomValue(roomAtom);
  const gameConfigRef = useRef<GameConfig | null>(null);
  const [game, setGame] = useState<GameSync>({ status: "unsynced" });

  useEffect(() => {
    return onSnapshot(gameStateDocRef(db, room.id), { includeMetadataChanges: true }, async (d) => {
      const remoteState = d.data();
      if (remoteState == null) {
        gameConfigRef.current = null;
        setGame({ status: "nogame" });
        return;
      }
      log.debug("game state broadcasted", remoteState);

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
        return syncGame(config, game, remoteState, !d.metadata.hasPendingWrites);
      });
    });
  }, [db, room]);

  const ops: GameSyncOperations = useMemo(() => {
    return {
      startGame: async () => {
        const result = await callInitGameFunction(functions, { roomId: room.id });
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
          await updateDoc(null, gameStateDocRef(db, room.id), result.value);
        } else {
          setGame({ status: "invalid", error: result.error });
        }
      },
    };
  }, [db, functions, room]);

  return [game, ops];
};
