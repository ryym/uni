import { deepStrictEqual } from "~/lib/deepEqual";
import { log } from "~/lib/logger";
import { GameConfig, GameSnapshot, updateGameState } from "../game";

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
      readonly snapshot: GameSnapshot;
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
  remote: GameSnapshot,
  syncFinished: boolean,
): SyncedGameSnapshot => {
  switch (lastSynced.status) {
    case "unsynced":
    case "nogame": {
      log.debug("no last synced snapshot so use remote data without verification");
      return { status: "valid", config, snapshot: remote, syncFinished };
    }

    case "invalid": {
      return lastSynced;
    }

    case "valid": {
      if (lastSynced.snapshot.state.turn === remote.state.turn) {
        return { ...lastSynced, syncFinished };
      }
      if (remote.state.lastUpdate == null) {
        return unexpectedGameStateResult();
      }

      const result = updateGameState(
        config,
        lastSynced.snapshot.state,
        remote.state.lastUpdate.action,
      );
      if (!result.ok) {
        return { status: "invalid", error: result.error };
      }
      if (!deepStrictEqual(result.value, remote.state)) {
        log.debug("local and remote state mismatch", lastSynced.snapshot, remote, result.value);
        return unexpectedGameStateResult();
      }

      return { status: "valid", config, snapshot: remote, syncFinished };
    }
  }
};

const unexpectedGameStateResult = (): SyncedGameSnapshot => {
  return {
    status: "invalid",
    error: "予期しないゲーム状態です。リロードしても直らない場合は中断してください。",
  };
};
