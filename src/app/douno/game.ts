const COLORS = ["Red", "Blue", "Green", "Yellow"] as const;

export type Color = typeof COLORS[number];

export type GameConfig = {
  readonly deck: readonly string[];
  readonly playerUids: readonly string[];
};

export type GameState = {
  readonly currentPlayerUid: string;
  readonly deckTopIdx: number;
  readonly hands: {
    readonly [uid: string]: readonly number[];
  };
  readonly discardPile: {
    readonly topCards: readonly number[];
    readonly color: Color;
  };
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
      readonly cardIdx: number;
    };

export type UpdateGameResult =
  | {
      readonly ok: true;
      readonly state: GameState;
    }
  | {
      readonly ok: false;
      readonly errors: string[];
    };

export const updateGameState = (
  config: GameConfig,
  state: GameState,
  action: GameAction,
): UpdateGameResult => {
  switch (action.type) {
    case "Start": {
      throw new Error('[douno] "Start" action is fired during game');
    }

    case "Pass": {
      return {
        ok: true,
        state: {
          ...state,
          currentPlayerUid: determineNextPlayer(config.playerUids, state.currentPlayerUid),
        },
      };
    }

    case "Draw": {
      return {
        ok: true,
        state: {
          ...state,
          deckTopIdx: state.deckTopIdx + 1,
          hands: {
            ...state.hands,
            [state.currentPlayerUid]: [...state.hands[state.currentPlayerUid], state.deckTopIdx],
          },
        },
      };
    }

    case "Play": {
      return {
        ok: true,
        state: {
          ...state,
          currentPlayerUid: determineNextPlayer(config.playerUids, state.currentPlayerUid),
          hands: {
            ...state.hands,
            [state.currentPlayerUid]: state.hands[state.currentPlayerUid].filter(
              (i) => i !== action.cardIdx,
            ),
          },
          discardPile: {
            topCards: [action.cardIdx, ...state.discardPile.topCards].slice(0, 5),
            color: findCardColor(config.deck[action.cardIdx]),
          },
        },
      };
    }
  }
};

const determineNextPlayer = (playerUids: readonly string[], currentPlayer: string): string => {
  const idx = playerUids.indexOf(currentPlayer);
  if (idx === -1) {
    return playerUids[0];
  }
  const nextIdx = (idx + 1) % playerUids.length;
  return playerUids[nextIdx];
};

const findCardColor = (cardName: string): Color => {
  for (const color of COLORS) {
    if (cardName.startsWith(color)) {
      return color;
    }
  }
  throw new Error("[douno] failed to detect card color");
};
