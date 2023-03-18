import { Result } from "~/lib/types";
import { GameAction, GameConfig, GameState } from "~shared/game";
import { Card } from "./cards";
import { applyGameStatePatch, buildGameStatePatch } from "./game/patch";

export type { GameAction, GameConfig, GameState } from "~shared/game";

export const updateGameState = (
  config: GameConfig,
  state: GameState,
  action: GameAction,
): Result<GameState> => {
  const patchResult = buildGameStatePatch(config, state, action);
  if (!patchResult.ok) {
    return { ok: false, error: patchResult.error };
  }

  const nextState = applyGameStatePatch(config, state, action, patchResult.value);
  return { ok: true, value: nextState };
};

export type HandCardMap = {
  readonly [hash: string]: HandCardState;
};

export type HandCardState =
  | {
      readonly type: "fetching";
    }
  | {
      readonly type: "got";
      readonly card: Card;
    };
