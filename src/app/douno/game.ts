import { range } from "~/lib/array";
import { Result } from "~/lib/types";
import {
  Card,
  Color,
  Draw2Card,
  Draw4Card,
  NumberCard,
  ReverseCard,
  SkipCard,
  WildCard,
  cardById,
  parseColor,
} from "./cards";
import { DiscardPile, GameAction, GameConfig, GameState } from "~shared/game";

export type { GameAction, GameConfig, GameSnapshot, GameState } from "~shared/game";

export class ImpossibleGameStateError extends Error {
  constructor(message: string) {
    super(`[douno] impossible game state: ${message}`);
  }
}

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
  readonly clockwise: boolean;
};

const buildPatch = (
  config: GameConfig,
  state: GameState,
  action: GameAction,
): Result<GameStatePatch> => {
  switch (action.type) {
    case "Start": {
      return { ok: false, error: '"Start" action can be used only at game initialization' };
    }

    case "Pass": {
      if (state.discardPile.attackTotal != null) {
        return { ok: false, error: "must play or draw during attack" };
      }
      return {
        ok: true,
        value: {
          deckTopIdx: state.deckTopIdx,
          discardPile: state.discardPile,
          playerHand: state.playerMap[state.currentPlayerUid].hand,
          playerMove: { step: 1, clockwise: state.clockwise },
        },
      };
    }

    case "Draw": {
      if (hasDrawnLastTime(state, state.currentPlayerUid)) {
        return { ok: false, error: "cannot draw twice" };
      }
      if (state.discardPile.attackTotal == null) {
        return {
          ok: true,
          value: {
            deckTopIdx: state.deckTopIdx + 1,
            discardPile: state.discardPile,
            playerHand: [...state.playerMap[state.currentPlayerUid].hand, state.deckTopIdx],
            playerMove: { step: 0, clockwise: state.clockwise },
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
            playerMove: { step: 1, clockwise: state.clockwise },
          },
        };
      }
    }

    case "Play": {
      const player = state.playerMap[state.currentPlayerUid];
      if (action.cardIndice.some((i) => !player.hand.includes(i))) {
        return { ok: false, error: "played cards not in hand" };
      }

      const playedCardIds = action.cardIndice.map((idx) => config.deck[idx]);

      const playResult = parsePlay(playedCardIds, action.color);
      if (!playResult.ok) {
        return { ok: false, error: `failed to parse play: ${playResult.error}` };
      }
      const play = playResult.value;

      const color = "color" in play ? play.color : play.cards[play.cards.length - 1].color;
      const discardPile: typeof state["discardPile"] = {
        ...state.discardPile,
        topCards: [...playedCardIds.reverse(), ...state.discardPile.topCards].slice(0, 5),
        color,
      };

      const playerHand = state.playerMap[state.currentPlayerUid].hand.filter((i) => {
        return !action.cardIndice.includes(i);
      });

      if (!canPlayOn(state.discardPile, play.cards[0])) {
        const pileTopId = state.discardPile.topCards[0];
        return { ok: false, error: `cannot play ${play.cards[0].id} on ${pileTopId}` };
      }

      switch (play.type) {
        case "NumberCards":
        case "WildCards": {
          return {
            ok: true,
            value: {
              deckTopIdx: state.deckTopIdx,
              discardPile,
              playerHand,
              playerMove: { step: 1, clockwise: state.clockwise },
            },
          };
        }
        case "ReverseCards": {
          const clockwise = play.cards.length % 2 === 1 ? !state.clockwise : state.clockwise;
          return {
            ok: true,
            value: {
              deckTopIdx: state.deckTopIdx,
              discardPile,
              playerHand,
              playerMove: { step: 1, clockwise },
            },
          };
        }
        case "SkipCards": {
          const step = play.cards.length * 2;
          return {
            ok: true,
            value: {
              deckTopIdx: state.deckTopIdx,
              discardPile,
              playerHand,
              playerMove: { step, clockwise: state.clockwise },
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
              playerMove: { step: 1, clockwise: state.clockwise },
            },
          };
        }
        case "Draw4Cards": {
          const attackTotal = (discardPile.attackTotal || 0) + play.cards.length * 4;
          return {
            ok: true,
            value: {
              deckTopIdx: state.deckTopIdx,
              discardPile: { ...discardPile, attackTotal },
              playerHand,
              playerMove: { step: 1, clockwise: state.clockwise },
            },
          };
        }
      }
    }
  }
};

export const canPlayOn = (pile: DiscardPile, card: Card): boolean => {
  const pileTop = cardById(pile.topCards[0]);
  switch (card.type) {
    case "Number": {
      return (
        pile.attackTotal == null &&
        (card.color === pile.color || (pileTop.type === "Number" && pileTop.value === card.value))
      );
    }
    case "Reverse":
    case "Skip": {
      return pile.attackTotal == null && (card.color === pile.color || card.type === pileTop.type);
    }
    case "Draw2": {
      return card.color === pile.color || card.type === pileTop.type;
    }
    case "Wild": {
      return pile.attackTotal == null;
    }
    case "Draw4": {
      return true;
    }
  }
};

export const canPlayWith = (firstCard: Card, nextCard: Card): boolean => {
  switch (firstCard.type) {
    case "Number": {
      return firstCard.type === nextCard.type && firstCard.value === nextCard.value;
    }
    case "Reverse":
    case "Skip":
    case "Draw2":
    case "Wild":
    case "Draw4": {
      return firstCard.type === nextCard.type;
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
    clockwise: patch.playerMove.clockwise,
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
    throw new ImpossibleGameStateError("current player not listed in remaining players");
  }
  let nextIdx: number;
  if (move.clockwise) {
    nextIdx = (idx + move.step) % playerUids.length;
  } else if (move.step <= idx) {
    nextIdx = idx - move.step;
  } else {
    nextIdx = playerUids.length - move.step - idx;
  }
  return playerUids[nextIdx];
};

type Play =
  | {
      readonly type: "NumberCards";
      readonly cards: readonly NumberCard[];
    }
  | {
      readonly type: "ReverseCards";
      readonly cards: readonly ReverseCard[];
    }
  | {
      readonly type: "SkipCards";
      readonly cards: readonly SkipCard[];
    }
  | {
      readonly type: "Draw2Cards";
      readonly cards: readonly Draw2Card[];
    }
  | {
      readonly type: "WildCards";
      readonly cards: readonly WildCard[];
      readonly color: Color;
    }
  | {
      readonly type: "Draw4Cards";
      readonly cards: readonly Draw4Card[];
      readonly color: Color;
    };

const parsePlay = (cardIds: readonly string[], selectedColor: string | null): Result<Play> => {
  if (cardIds.length === 0) {
    return { ok: false, error: "played cards empty" };
  }

  const cards = cardIds.map((id) => cardById(id));
  if (cards.some((c) => c.type !== cards[0].type)) {
    return { ok: false, error: "multiple type cards played" };
  }

  switch (cards[0].type) {
    case "Number": {
      const numCards = cards as NumberCard[];
      if (numCards.some((c) => c.value !== numCards[0].value)) {
        return { ok: false, error: "multiple number values played" };
      }
      return {
        ok: true,
        value: { type: "NumberCards", cards: numCards },
      };
    }

    case "Reverse": {
      const reverseCards = cards as ReverseCard[];
      return {
        ok: true,
        value: { type: "ReverseCards", cards: reverseCards },
      };
    }

    case "Skip": {
      const skipCards = cards as SkipCard[];
      return {
        ok: true,
        value: { type: "SkipCards", cards: skipCards },
      };
    }

    case "Draw2": {
      const draw2Cards = cards as Draw2Card[];
      return {
        ok: true,
        value: { type: "Draw2Cards", cards: draw2Cards },
      };
    }

    case "Wild": {
      const colorResult = parseColor(selectedColor);
      if (!colorResult.ok) {
        return { ok: false, error: `must specify valid color: ${colorResult.error}` };
      }
      const wildCards = cards as WildCard[];
      return {
        ok: true,
        value: { type: "WildCards", cards: wildCards, color: colorResult.value },
      };
    }

    case "Draw4": {
      const colorResult = parseColor(selectedColor);
      if (!colorResult.ok) {
        return { ok: false, error: `must specify valid color: ${colorResult.error}` };
      }
      const draw4Cards = cards as Draw4Card[];
      return {
        ok: true,
        value: { type: "Draw4Cards", cards: draw4Cards, color: colorResult.value },
      };
    }
  }
};
