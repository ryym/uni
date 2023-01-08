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
};

export type GameAction =
  | {
      readonly type: "Start";
    }
  | {
      readonly type: "Draw";
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

    case "Draw": {
      return {
        ok: true,
        state: {
          ...state,
          currentPlayerUid: determineNextPlayer(config.playerUids, state.currentPlayerUid),
          deckTopIdx: state.deckTopIdx + 1,
          hands: {
            ...state.hands,
            [state.currentPlayerUid]: [...state.hands[state.currentPlayerUid], state.deckTopIdx],
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
