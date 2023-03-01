import { Result } from "~/lib/types";
import { DiscardPile, GameConfig, GameState } from "~shared/game";
import { Card, MAX_PLAY_CARDS, cardById } from "../cards";

export const canPlayOn = (pile: DiscardPile, card: Card): boolean => {
  const pileTop = cardById(pile.topCardIds[0]);
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

export const isGameFinished = (config: GameConfig, state: GameState): boolean => {
  const threshhold = config.playerUids.length > 1 ? 1 : 0;
  const nonWinners = config.playerUids.filter((uid) => state.playerMap[uid].wonAt == null);
  return nonWinners.length <= threshhold;
};

export const canAct = (config: GameConfig, state: GameState, uid: string): boolean => {
  return (
    state.currentPlayerUid === uid &&
    state.playerMap[uid].wonAt == null &&
    !isGameFinished(config, state)
  );
};

export const canDraw = (config: GameConfig, state: GameState, uid: string): boolean => {
  return canAct(config, state, uid) && !hasDrawnLastTime(state, uid);
};

export const hasDrawnLastTime = (state: GameState, uid: string): boolean => {
  return state.lastUpdate?.playerUid === uid && state.lastUpdate.action.type === "Draw";
};

export const canPlayCards = (
  config: GameConfig,
  state: GameState,
  uid: string,
  numOfCards: number,
): boolean => {
  return canAct(config, state, uid) && 0 < numOfCards && numOfCards <= MAX_PLAY_CARDS;
};

export const canPass = (config: GameConfig, state: GameState, uid: string): boolean => {
  return canAct(config, state, uid) && checkPassIsAvailable(state, uid).ok;
};

export const checkPassIsAvailable = (state: GameState, uid: string): Result<null> => {
  if (state.discardPile.attackTotal != null) {
    return { ok: false, error: "must play or draw during attack" };
  }
  if (!(state.lastUpdate?.playerUid === uid && state.lastUpdate.action.type === "Draw")) {
    return { ok: false, error: "must draw before pass or play cards" };
  }
  return { ok: true, value: null };
};
