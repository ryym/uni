import { range } from "~/lib/array";
import { Result } from "~/lib/types";
import { Color, Draw2Card, NumberCard, cardById } from "./cards";

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
  readonly lastUpdate: null | {
    readonly playerUid: string;
    readonly action: GameAction;
  };
};

export type PlayerState = {
  readonly hand: readonly number[];
  readonly wonAt: number | null;
};

export type DiscardPile = {
  readonly topCards: readonly string[];
  readonly color: Color;
  readonly attackTotal: null | number;
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

  const nextState = applyPatch(config, state, action, patchResult.value);
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
      if (hasDrawnLastTime(state, state.currentPlayerUid)) {
        throw new Error("[douno] cannot draw twice");
      }
      if (state.discardPile.attackTotal == null) {
        return {
          ok: true,
          value: {
            deckTopIdx: state.deckTopIdx + 1,
            discardPile: state.discardPile,
            playerHand: [...state.playerMap[state.currentPlayerUid].hand, state.deckTopIdx],
            playerMove: { step: 0 },
          },
        };
      } else {
        const nextDeckTopIdx = state.deckTopIdx + state.discardPile.attackTotal;
        const drawn = range(state.deckTopIdx, nextDeckTopIdx);
        return {
          ok: true,
          value: {
            deckTopIdx: nextDeckTopIdx,
            discardPile: { ...state.discardPile, attackTotal: null },
            playerHand: [...state.playerMap[state.currentPlayerUid].hand, ...drawn],
            playerMove: { step: 1 },
          },
        };
      }
    }

    case "Play": {
      const playedCardIds = action.cardIndice.map((idx) => config.deck[idx]);
      const playResult = parsePlay(playedCardIds);
      if (!playResult.ok) {
        return { ok: false, error: `failed to parse play: ${playResult.error}` };
      }

      const discardPile: typeof state["discardPile"] = {
        ...state.discardPile,
        topCards: [...playedCardIds, ...state.discardPile.topCards].slice(0, 5),
        color: cardById(playedCardIds[0]).color,
      };
      const playerHand = state.playerMap[state.currentPlayerUid].hand.filter((i) => {
        return !action.cardIndice.includes(i);
      });

      const play = playResult.value;
      switch (play.type) {
        case "NumberCards": {
          return {
            ok: true,
            value: {
              deckTopIdx: state.deckTopIdx,
              discardPile,
              playerHand,
              playerMove: { step: 1 },
            },
          };
        }
        case "Draw2Cards": {
          const attackTotal = (discardPile.attackTotal || 0) + play.cards.length * 2;
          return {
            ok: true,
            value: {
              deckTopIdx: state.deckTopIdx,
              discardPile: { ...discardPile, attackTotal },
              playerHand,
              playerMove: { step: 1 },
            },
          };
        }
      }
    }
  }
};

export const hasDrawnLastTime = (state: GameState, uid: string): boolean => {
  return state.lastUpdate?.playerUid === uid && state.lastUpdate.action.type === "Draw";
};

const applyPatch = (
  config: GameConfig,
  state: GameState,
  action: GameAction,
  patch: GameStatePatch,
): GameState => {
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
    lastUpdate: {
      playerUid: state.currentPlayerUid,
      action,
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

type Play =
  | {
      readonly type: "NumberCards";
      readonly cards: readonly NumberCard[];
    }
  | {
      readonly type: "Draw2Cards";
      readonly cards: readonly Draw2Card[];
    };

const parsePlay = (cardIds: readonly string[]): Result<Play> => {
  if (cardIds.length === 0) {
    throw new Error("[douno] played cards empty");
  }

  const cards = cardIds.map((id) => cardById(id));
  if (cards.some((c) => c.type !== cards[0].type)) {
    throw new Error("[douno] multiple type cards played");
  }

  switch (cards[0].type) {
    case "Number": {
      const numCards = cards as NumberCard[];
      if (numCards.some((c) => c.value !== numCards[0].value)) {
        throw new Error("[douno] multiple number values played");
      }
      return {
        ok: true,
        value: { type: "NumberCards", cards: numCards },
      };
    }

    case "Draw2": {
      const draw2Cards = cards as Draw2Card[];
      return {
        ok: true,
        value: { type: "Draw2Cards", cards: draw2Cards },
      };
    }
  }
};
