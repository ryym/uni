import { Result } from "~/lib/types";
import { applyGameStatePatch, buildGameStatePatch } from "./game/patch";
import { GameAction, GameConfig, GameState } from "~shared/game";

export type { GameAction, GameConfig, GameSnapshot, GameState } from "~shared/game";

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
