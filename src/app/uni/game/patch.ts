import { range } from "~/lib/array";
import { Result } from "~/lib/types";
import { parsePlay } from "./play";
import { canPlayOn, checkPassIsAvailable, hasDrawnLastTime } from "./readers";
import { DiscardPile, GameAction, GameConfig, GameState, cardIdHash } from "~shared/game";

export type GameStatePatch = {
  readonly deckTopIdx: number;
  readonly discardPile: DiscardPile;
  readonly playerHand: readonly string[];
  readonly playerMove: PlayerMove;
};

export type PlayerMove = {
  readonly step: number;
  readonly clockwise: boolean;
};

export const buildGameStatePatch = (
  config: GameConfig,
  state: GameState,
  action: GameAction,
): Result<GameStatePatch> => {
  switch (action.type) {
    case "Start": {
      return { ok: false, error: '"Start" action can be used only at game initialization' };
    }

    case "Pass": {
      const passResult = checkPassIsAvailable(state, state.currentPlayerUid);
      if (!passResult.ok) {
        return { ok: false, error: `cannot pass: ${passResult.error}` };
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
            playerHand: [
              ...state.playerMap[state.currentPlayerUid].hand,
              config.deck[state.deckTopIdx],
            ],
            playerMove: { step: 0, clockwise: state.clockwise },
          },
        };
      } else {
        const nextDeckTopIdx = state.deckTopIdx + state.discardPile.attackTotal;
        const drawn = range(state.deckTopIdx, nextDeckTopIdx).map((idx) => config.deck[idx]);
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
      const playedCardHashes = action.cardIds.map((id) => {
        return cardIdHash(id, config.protection.salt);
      });

      if (playedCardHashes.some((hash) => !player.hand.includes(hash))) {
        return { ok: false, error: "played cards not in hand" };
      }

      const playResult = parsePlay(action.cardIds, action.color);
      if (!playResult.ok) {
        return { ok: false, error: `failed to parse play: ${playResult.error}` };
      }
      const play = playResult.value;

      const color = "color" in play ? play.color : play.cards[play.cards.length - 1].color;
      const discardPile: typeof state["discardPile"] = {
        ...state.discardPile,
        topCardIds: [...[...action.cardIds].reverse(), ...state.discardPile.topCardIds].slice(0, 5),
        color,
      };

      const playerHand = state.playerMap[state.currentPlayerUid].hand.filter((_, i) => {
        return !playedCardHashes.includes(player.hand[i]);
      });

      if (!canPlayOn(state.discardPile, play.cards[0])) {
        const pileTopId = state.discardPile.topCardIds[0];
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

export const applyGameStatePatch = (
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
    throw new Error("[douno] current player not listed in remaining players");
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
