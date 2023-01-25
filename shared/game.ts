import { Color } from "./cards";

export type GameConfig = {
  readonly deck: readonly string[];
  readonly playerUids: readonly string[];
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
      readonly color: string | null;
    };
