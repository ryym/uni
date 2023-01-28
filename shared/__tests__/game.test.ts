import { describe, expect, it } from "@jest/globals";
import { buildDeck } from "../cards";
import { GameState, initializeGameState } from "../game";

describe("initializeGameState", () => {
  it("builds initial game state", () => {
    const cards = buildDeck();
    const state = initializeGameState({
      cards,
      playerUids: ["a", "b", "c"],
      handCardsNum: 3,
    });
    expect(state).toStrictEqual({
      turn: 1,
      clockwise: true,
      currentPlayerUid: "a",
      playerMap: {
        a: { hand: [0, 1, 2], wonAt: null },
        b: { hand: [3, 4, 5], wonAt: null },
        c: { hand: [6, 7, 8], wonAt: null },
      },
      discardPile: {
        topCards: ["num-r-5-0"],
        color: "Red",
        attackTotal: null,
      },
      deckTopIdx: 10,
      lastUpdate: null,
    } satisfies GameState);
  });
});
