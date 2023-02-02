import { range } from "./array";
import { COLORS, Card, Color } from "./cards";
import { Mutable } from "./mutable";
import { randomInt } from "./random";

export type GameConfig = {
  /** An array of card hashes. */
  readonly deck: readonly string[];
  readonly playerUids: readonly string[];
  readonly protection: {
    readonly salt: string;
  };
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
  /** An array of card hashes. */
  readonly hand: readonly string[];
  readonly wonAt: number | null;
};

export type DiscardPile = {
  readonly topCardIds: readonly string[];
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

export type CardIdHashMap = {
  readonly [cardId: string]: string;
};

export const initializeGame = (
  params: InitializeGameParams,
): [GameConfig, GameState, CardIdHashMap] => {
  const salt = "";

  const idHashMap = params.cards.reduce((m, c) => {
    m[c.id] = cardIdHash(c.id, salt);
    return m;
  }, {} as Mutable<CardIdHashMap>);

  if (new Set(Object.values(idHashMap)).size !== params.cards.length) {
    throw new Error(`[douno] id hash collision detected. salt: ${salt}`);
  }

  const config: GameConfig = {
    deck: params.cards.map((c) => idHashMap[c.id]),
    playerUids: params.playerUids,
    protection: { salt },
  };
  const state = initializeGameState(params, config.deck);
  return [config, state, idHashMap];
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
    topCardIds: [topCard.id],
    color,
    attackTotal: null,
  };
};

export const cardIdHash = (cardId: string, salt: string): string => {
  if (__ENV_TEST__) {
    return `${cardId}-hash`;
  }

  const value = `${cardId}${salt}`;

  // I copy pasted this logic from https://stackoverflow.com/a/7616484/7222928.
  // And I generated hashes more than 120000 times but no collision has occurred in a deck
  // so it seems work fine for our use case.
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const chr = value.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }

  return hash.toString();
};
