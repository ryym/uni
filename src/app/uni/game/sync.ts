import { deepStrictEqual } from "~/lib/deepEqual";
import { log } from "~/lib/logger";
import { GameConfig, GameState, updateGameState } from "../game";

export type GameSync =
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
  lastSync: GameSync,
  remoteState: GameState,
  syncFinished: boolean,
): GameSync => {
  switch (lastSync.status) {
    case "unsynced":
    case "nogame": {
      log.debug("no last synced game state so use remote data without verification");
      return { status: "valid", config, state: remoteState, syncFinished };
    }

    case "invalid": {
      return lastSync;
    }

    case "valid": {
      if (lastSync.state.turn === remoteState.turn) {
        return { ...lastSync, syncFinished };
      }
      if (remoteState.lastUpdate == null) {
        return unexpectedGameStateResult();
      }

      const result = updateGameState(config, lastSync.state, remoteState.lastUpdate.action);
      if (!result.ok) {
        return { status: "invalid", error: result.error };
      }
      if (!deepStrictEqual(result.value, remoteState)) {
        log.debug("local and remote state mismatch", lastSync.state, remoteState, result.value);
        return unexpectedGameStateResult();
      }

      return { status: "valid", config, state: remoteState, syncFinished };
    }
  }
};

const unexpectedGameStateResult = (): GameSync => {
  return {
    status: "invalid",
    error: "予期しないゲーム状態です。リロードしても直らない場合は中断してください。",
  };
};
