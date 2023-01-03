export type ProtoGameAction =
  | {
      readonly type: "Init";
      readonly playerUid: string;
      readonly deck: readonly number[];
    }
  | {
      readonly type: "Draw";
      readonly playerUid: string;
      readonly numOfCards: number;
    }
  | {
      readonly type: "Pass";
      readonly playerUid: string;
    };

export type ProtoGameState = {
  readonly deck: readonly number[];
  readonly deckIndex: number;
  readonly drawnCards: readonly number[];
};

export const updateProtoGameState = (
  state: ProtoGameState | null,
  action: ProtoGameAction,
): ProtoGameState => {
  if (action.type === "Init") {
    return {
      deck: action.deck,
      deckIndex: 0,
      drawnCards: [],
    };
  }
  if (state == null) {
    throw new Error("game not initialized");
  }
  switch (action.type) {
    case "Draw": {
      const nextIndex = state.deckIndex + action.numOfCards;
      return {
        deck: state.deck,
        deckIndex: nextIndex,
        drawnCards: [...state.drawnCards, ...state.deck.slice(state.deckIndex, nextIndex)],
      };
    }
    case "Pass": {
      return state;
    }
  }
};
