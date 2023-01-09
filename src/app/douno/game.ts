const COLORS = ["Red", "Blue", "Green", "Yellow"] as const;

export type Color = typeof COLORS[number];

export type GameConfig = {
  readonly deck: readonly string[];
  readonly playerUids: readonly string[];
};

export type GameState = {
  readonly currentPlayerUid: string;
  readonly deckTopIdx: number;
  readonly playerMap: {
    readonly [uid: string]: PlayerState;
  };
  readonly discardPile: DiscardPile;
};

export type PlayerState = {
  readonly hand: readonly number[];
};

export type DiscardPile = {
  readonly topCards: readonly number[];
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
  const buildPatchResult = buildPatch(config, state, action);
  if (!buildPatchResult.ok) {
    return { ok: false, errors: [buildPatchResult.message] };
  }

  const nextState = applyPatch(config, state, buildPatchResult.patch);
  return { ok: true, state: nextState };
};

type BuildPatchResult =
  | {
      readonly ok: true;
      readonly patch: GameStatePatch;
    }
  | {
      readonly ok: false;
      readonly message: string;
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

const buildPatch = (config: GameConfig, state: GameState, action: GameAction): BuildPatchResult => {
  switch (action.type) {
    case "Start": {
      throw new Error('[douno] "Start" action is fired during game');
    }

    case "Pass": {
      return {
        ok: true,
        patch: {
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
        patch: {
          deckTopIdx: state.deckTopIdx + 1,
          discardPile: state.discardPile,
          playerHand: [...state.playerMap[state.currentPlayerUid].hand, state.deckTopIdx],
          playerMove: { step: 0 },
        },
      };
    }

    case "Play": {
      return {
        ok: true,
        patch: {
          deckTopIdx: state.deckTopIdx,
          discardPile: {
            topCards: [action.cardIdx, ...state.discardPile.topCards].slice(0, 5),
            color: findCardColor(config.deck[action.cardIdx]),
          },
          playerHand: state.playerMap[state.currentPlayerUid].hand.filter(
            (i) => i !== action.cardIdx,
          ),
          playerMove: { step: 1 },
        },
      };
    }
  }
};

const applyPatch = (config: GameConfig, state: GameState, patch: GameStatePatch): GameState => {
  return {
    currentPlayerUid:
      patch.playerMove.step === 1
        ? determineNextPlayer(config.playerUids, state.currentPlayerUid)
        : state.currentPlayerUid,
    deckTopIdx: patch.deckTopIdx,
    discardPile: patch.discardPile,
    playerMap: {
      ...state.playerMap,
      [state.currentPlayerUid]: {
        ...state.playerMap[state.currentPlayerUid],
        hand: patch.playerHand,
      },
    },
  };
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
