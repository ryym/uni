import { range } from "./array";
import { COLORS, Card, Color } from "./cards";
import { Mutable } from "./mutable";
import { randomInt } from "./random";

export type GameConfig = {
  readonly deck: readonly string[];
  readonly playerUids: readonly string[];
};

export type GameSnapshot = {
  readonly state: GameState;
  readonly lastAction: GameAction;
};

export type GameState = {
  readonly turn: number;
  readonly currentPlayerUid: string;
  readonly clockwise: boolean;
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
  readonly hand: readonly string[];
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
      readonly cardIds: readonly string[];
      readonly color: string | null;
    };

export type InitializeGameParams = {
  readonly cards: readonly Card[];
  readonly playerUids: readonly string[];
  readonly handCardsNum: number;
};

export const initializeGame = (params: InitializeGameParams): [GameConfig, GameState] => {
  const config: GameConfig = {
    deck: params.cards.map((c) => c.id),
    playerUids: params.playerUids,
  };
  const state = initializeGameState(params, config.deck);
  return [config, state];
};

const initializeGameState = (params: InitializeGameParams, deck: readonly string[]): GameState => {
  const playerMap: Mutable<GameState["playerMap"]> = {};
  params.playerUids.forEach((uid, i) => {
    const hand = range(0, params.handCardsNum).map((j) => deck[params.handCardsNum * i + j]);
    playerMap[uid] = { hand, wonAt: null };
  });

  const discardPileTopIdx = params.playerUids.length * params.handCardsNum;
  const discardPile = buildDiscardPile(params.cards[discardPileTopIdx]);

  return {
    turn: 1,
    currentPlayerUid: params.playerUids[0],
    clockwise: true,
    deckTopIdx: discardPileTopIdx + 1,
    playerMap,
    discardPile,
    lastUpdate: null,
  };
};

const buildDiscardPile = (topCard: Card): GameState["discardPile"] => {
  const color = "color" in topCard ? topCard.color : COLORS[randomInt(COLORS.length)];
  return {
    topCards: [topCard.id],
    color,
    attackTotal: null,
  };
};
