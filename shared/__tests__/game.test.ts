import { describe, expect, it } from "@jest/globals";
import { makeCardFactory } from "../__testlib__/cardFactory";
import { GameState, initializeGame } from "../game";

describe("initializeGame", () => {
  const { card } = makeCardFactory();

  it("builds initial game config and state", () => {
    const cards = [
      card("num-r-1-0"),
      card("num-b-1-0"),
      card("num-g-1-0"),
      card("num-r-2-0"),
      card("num-b-2-0"),
      card("num-g-2-0"),
      card("num-r-3-0"),
      card("num-b-3-0"),
      card("num-g-3-0"),
      card("num-y-9-0"),
    ];
    const [config, state] = initializeGame({ cards, playerUids: ["a", "b", "c"], handCardsNum: 3 });
    expect([config.deck.length, config.playerUids]).toStrictEqual([cards.length, ["a", "b", "c"]]);
    expect(state).toStrictEqual({
      turn: 1,
      clockwise: true,
      currentPlayerUid: "a",
      playerMap: {
        a: { hand: ["num-r-1-0-hash", "num-b-1-0-hash", "num-g-1-0-hash"], wonAt: null },
        b: { hand: ["num-r-2-0-hash", "num-b-2-0-hash", "num-g-2-0-hash"], wonAt: null },
        c: { hand: ["num-r-3-0-hash", "num-b-3-0-hash", "num-g-3-0-hash"], wonAt: null },
      },
      discardPile: {
        topCardIds: ["num-y-9-0"],
        color: "Yellow",
        attackTotal: null,
      },
      deckTopIdx: 10,
      lastUpdate: null,
    } satisfies GameState);
  });
});
