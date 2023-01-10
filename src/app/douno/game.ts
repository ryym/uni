import { Result } from "~/lib/types";
import { Color, cardById } from "./cards";

export type GameConfig = {
  readonly deck: readonly string[];
  readonly playerUids: readonly string[];
};

export type GameState = {
  readonly turn: number;
  readonly currentPlayerUid: string;
  readonly deckTopIdx: number;
  readonly playerMap: {
    readonly [uid: string]: PlayerState;
  };
  readonly discardPile: DiscardPile;
};

export type PlayerState = {
  readonly hand: readonly number[];
  readonly wonAt: number | null;
};

export type DiscardPile = {
  readonly topCards: readonly string[];
  readonly color: Color;
};

export type GameAction =
  | {
      readonly type: "Start";
    }
  | {
      readonly type: "Pass";
    }
  | {
      readonly type: "Draw";
    }
  | {
      readonly type: "Play";
      readonly cardIndice: readonly number[];
    };

export const updateGameState = (
  config: GameConfig,
  state: GameState,
  action: GameAction,
): Result<GameState> => {
  const patchResult = buildPatch(config, state, action);
  if (!patchResult.ok) {
    return { ok: false, error: patchResult.error };
  }

  const nextState = applyPatch(config, state, patchResult.value);
  return { ok: true, value: nextState };
};

type GameStatePatch = {
  readonly deckTopIdx: number;
  readonly discardPile: GameState["discardPile"];
  readonly playerHand: readonly number[];
  readonly playerMove: PlayerMove;
};

type PlayerMove = {
  readonly step: number;
};

const buildPatch = (
  config: GameConfig,
  state: GameState,
  action: GameAction,
): Result<GameStatePatch> => {
  switch (action.type) {
    case "Start": {
      throw new Error('[douno] "Start" action is fired during game');
    }

    case "Pass": {
      return {
        ok: true,
        value: {
          deckTopIdx: state.deckTopIdx,
          discardPile: state.discardPile,
          playerHand: state.playerMap[state.currentPlayerUid].hand,
          playerMove: { step: 1 },
        },
      };
    }

    case "Draw": {
      return {
        ok: true,
        value: {
          deckTopIdx: state.deckTopIdx + 1,
          discardPile: state.discardPile,
          playerHand: [...state.playerMap[state.currentPlayerUid].hand, state.deckTopIdx],
          playerMove: { step: 0 },
        },
      };
    }

    case "Play": {
      const playedCardIds = action.cardIndice.map((idx) => config.deck[idx]);
      return {
        ok: true,
        value: {
          deckTopIdx: state.deckTopIdx,
          discardPile: {
            topCards: [...playedCardIds, ...state.discardPile.topCards].slice(0, 5),
            color: cardById(playedCardIds[0]).color,
          },
          playerHand: state.playerMap[state.currentPlayerUid].hand.filter(
            (i) => !action.cardIndice.includes(i),
          ),
          playerMove: { step: 1 },
        },
      };
    }
  }
};

const applyPatch = (config: GameConfig, state: GameState, patch: GameStatePatch): GameState => {
  const remainingPlayerUids = config.playerUids.filter((uid) => state.playerMap[uid].wonAt == null);
  const nextPlayerUid = determineNextPlayer(
    remainingPlayerUids,
    state.currentPlayerUid,
    patch.playerMove,
  );
  return {
    turn: state.turn + 1,
    currentPlayerUid: nextPlayerUid,
    deckTopIdx: patch.deckTopIdx,
    discardPile: patch.discardPile,
    playerMap: {
      ...state.playerMap,
      [state.currentPlayerUid]: {
        ...state.playerMap[state.currentPlayerUid],
        hand: patch.playerHand,
        wonAt: patch.playerHand.length === 0 ? state.turn : null,
      },
    },
  };
};

const determineNextPlayer = (
  playerUids: readonly string[],
  currentPlayer: string,
  move: PlayerMove,
): string => {
  if (move.step === 0) {
    return currentPlayer;
  }
  const idx = playerUids.indexOf(currentPlayer);
  if (idx === -1) {
    throw new Error("[douno] current player not listed in remaining players");
  }
  const nextIdx = (idx + move.step) % playerUids.length;
  return playerUids[nextIdx];
};