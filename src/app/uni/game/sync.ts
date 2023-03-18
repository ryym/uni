import { deepStrictEqual } from "~/lib/deepEqual";
import { log } from "~/lib/logger";
import { GameConfig, GameState, updateGameState } from "../game";

export type SyncedGameSnapshot =
  | {
      readonly status: "unsynced";
    }
  | {
      readonly status: "nogame";
    }
  | {
      readonly status: "valid";
      readonly config: GameConfig;
      readonly state: GameState;
      /** This becomes false when the state is updated locally but not yet in the backend. */
      readonly syncFinished: boolean;
    }
  | {
      readonly status: "invalid";
      readonly error: string;
    };

export const syncGame = (
  config: GameConfig,
  lastSynced: SyncedGameSnapshot,
  remoteState: GameState,
  syncFinished: boolean,
): SyncedGameSnapshot => {
  switch (lastSynced.status) {
    case "unsynced":
    case "nogame": {
      log.debug("no last synced game state so use remote data without verification");
      return { status: "valid", config, state: remoteState, syncFinished };
    }

    case "invalid": {
      return lastSynced;
    }

    case "valid": {
      if (lastSynced.state.turn === remoteState.turn) {
        return { ...lastSynced, syncFinished };
      }
      if (remoteState.lastUpdate == null) {
        return unexpectedGameStateResult();
      }

      const result = updateGameState(config, lastSynced.state, remoteState.lastUpdate.action);
      if (!result.ok) {
        return { status: "invalid", error: result.error };
      }
      if (!deepStrictEqual(result.value, remoteState)) {
        log.debug("local and remote state mismatch", lastSynced.state, remoteState, result.value);
        return unexpectedGameStateResult();
      }

      return { status: "valid", config, state: remoteState, syncFinished };
    }
  }
};

const unexpectedGameStateResult = (): SyncedGameSnapshot => {
  return {
    status: "invalid",
    error: "予期しないゲーム状態です。リロードしても直らない場合は中断してください。",
  };
};
