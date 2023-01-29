import { describe, expect, test } from "@jest/globals";
import { Result } from "~/lib/types";
import { updateGameState } from "../game";
import { range } from "~shared/array";
import { buildDeck } from "~shared/cards";
import { GameAction, GameState, initializeGame } from "~shared/game";

describe("updateGameState", () => {
  const cards = buildDeck();

  const card = (id: string) => {
    const c = cards.find((c) => c.id === id);
    if (c == null) {
      throw new Error(`card ${id} not found`);
    }
    return c;
  };

  const mustOk = <T>(result: Result<T>): T => {
    if (!result.ok) {
      throw new Error(`[mustOk] result is not ok: ${result.error}`);
    }
    return result.value;
  };

  test("[pass] player can pass after draw", () => {
    let [conf, state] = initializeGame({ cards, playerUids: ["a", "b"], handCardsNum: 1 });
    expect(updateGameState(conf, state, { type: "Pass" }).ok).toBe(false);

    state = mustOk(updateGameState(conf, state, { type: "Draw" }));
    expect(state.currentPlayerUid).toBe("a");

    const result = updateGameState(conf, state, { type: "Pass" });
    expect(result).toStrictEqual({
      ok: true,
      value: {
        ...state,
        turn: 3,
        currentPlayerUid: "b",
        lastUpdate: {
          action: { type: "Pass" },
          playerUid: "a",
        },
      },
    } satisfies Result<GameState>);
  });

  test("[draw] player can draw card from deck", () => {
    const [conf, state] = initializeGame({ cards, playerUids: ["a", "b"], handCardsNum: 1 });
    const next = updateGameState(conf, state, { type: "Draw" });
    expect(next).toStrictEqual({
      ok: true,
      value: {
        ...state,
        turn: 2,
        deckTopIdx: 4,
        currentPlayerUid: "a",
        playerMap: {
          a: { hand: [0, 3], wonAt: null },
          b: { hand: [1], wonAt: null },
        },
        lastUpdate: {
          action: { type: "Draw" },
          playerUid: "a",
        },
      },
    } satisfies Result<GameState>);
  });

  test("[draw] player cannot draw twice", () => {
    const cards = [
      // a's hand
      card("num-r-1-0"),
      // b's hand
      card("num-b-1-0"),
      // others
      card("num-b-3-0"),
      card("num-r-3-0"),
    ];
    let [conf, state] = initializeGame({ cards, playerUids: ["a", "b"], handCardsNum: 1 });

    // a's turn
    state = mustOk(updateGameState(conf, state, { type: "Draw" }));
    expect(state.currentPlayerUid).toBe("a");
    // a's turn: cannot draw
    expect(updateGameState(conf, state, { type: "Draw" }).ok).toBe(false);

    // can pass or play
    expect(updateGameState(conf, state, { type: "Pass" }).ok).toBe(true);
    const playAction: GameAction = { type: "Play", cardIndice: [3], color: null };
    expect(updateGameState(conf, state, playAction).ok).toBe(true);
  });

  test("[play] player can play multiple number cards of same value", () => {
    const cards = [
      // a's hand
      card("num-g-3-0"),
      card("num-r-3-1"),
      card("num-r-4-0"),
      // b's hand
      card("num-r-5-0"),
      card("num-r-6-0"),
      card("num-r-6-1"),
      // others
      card("num-b-3-0"),
      card("skip-r-0"),
    ];
    let [conf, state] = initializeGame({ cards, playerUids: ["a", "b"], handCardsNum: 3 });

    // a's turn
    state = mustOk(updateGameState(conf, state, { type: "Play", cardIndice: [0, 1], color: null }));
    expect([state.playerMap["a"].hand, state.currentPlayerUid, state.discardPile]).toStrictEqual([
      [2],
      "b",
      {
        topCards: ["num-r-3-1", "num-g-3-0", "num-b-3-0"],
        color: "Red",
        attackTotal: null,
      } satisfies GameState["discardPile"],
    ]);

    // b's turn
    state = mustOk(updateGameState(conf, state, { type: "Play", cardIndice: [5, 4], color: null }));
    expect([state.playerMap["b"].hand, state.currentPlayerUid, state.discardPile]).toStrictEqual([
      [3],
      "a",
      {
        topCards: ["num-r-6-0", "num-r-6-1", "num-r-3-1", "num-g-3-0", "num-b-3-0"],
        color: "Red",
        attackTotal: null,
      } satisfies GameState["discardPile"],
    ]);
  });

  test("[attack] players can chain draw2/4 attacks", () => {
    const cards = [
      // a's hand
      card("draw2-y-0"),
      card("num-r-1-0"),
      // b's hand
      card("draw4-0"),
      card("num-r-1-1"),
      // c's hand
      card("draw2-b-0"),
      card("num-b-1-0"),
      // others
      ...range(0, 9).map((i) => card(`num-y-${i}-0`)),
    ];
    let [conf, state] = initializeGame({ cards, playerUids: ["a", "b", "c"], handCardsNum: 2 });

    // a's turn
    state = mustOk(updateGameState(conf, state, { type: "Play", cardIndice: [0], color: null }));
    expect(state.discardPile.attackTotal).toBe(2);
    // b's turn
    state = mustOk(updateGameState(conf, state, { type: "Play", cardIndice: [2], color: "Blue" }));
    expect(state.discardPile.attackTotal).toBe(6);
    // c's turn
    state = mustOk(updateGameState(conf, state, { type: "Play", cardIndice: [4], color: null }));
    expect(state.discardPile.attackTotal).toBe(8);
    // a's turn: must draw
    expect(updateGameState(conf, state, { type: "Pass" }).ok).toBe(false);
    state = mustOk(updateGameState(conf, state, { type: "Draw" }));

    expect(state).toStrictEqual({
      turn: 5,
      clockwise: true,
      deckTopIdx: 15,
      currentPlayerUid: "b",
      playerMap: {
        a: { hand: [1, /* attacked */ 7, 8, 9, 10, 11, 12, 13, 14], wonAt: null },
        b: { hand: [3], wonAt: null },
        c: { hand: [5], wonAt: null },
      },
      discardPile: {
        topCards: ["draw2-b-0", "draw4-0", "draw2-y-0", "num-y-0-0"],
        color: "Blue",
        attackTotal: null,
      },
      lastUpdate: { action: { type: "Draw" }, playerUid: "a" },
    } satisfies GameState);
  });

  test("[win] player wins if hand becomes empty", () => {
    const cards = [
      // a's hand
      card("num-r-1-0"),
      card("num-r-1-1"),
      // b's hand
      card("num-r-2-0"),
      card("num-r-2-1"),
      // c's hand
      card("num-b-1-0"),
      card("num-b-1-1"),
      // others
      card("num-r-9-0"),
      card("num-r-9-1"),
    ];
    let [conf, state] = initializeGame({ cards, playerUids: ["a", "b", "c"], handCardsNum: 2 });

    // a's turn
    state = mustOk(updateGameState(conf, state, { type: "Play", cardIndice: [0], color: null }));
    expect(state.playerMap["a"]).toStrictEqual({ hand: [1], wonAt: null });
    // b's turn: win
    state = mustOk(updateGameState(conf, state, { type: "Play", cardIndice: [2, 3], color: null }));
    expect(state.playerMap["b"]).toStrictEqual({ hand: [], wonAt: 2 });
    // c's turn
    state = mustOk(updateGameState(conf, state, { type: "Draw" }));
    state = mustOk(updateGameState(conf, state, { type: "Pass" }));
    expect(state.playerMap["c"]).toStrictEqual({ hand: [4, 5, 7], wonAt: null });
    // a's turn: win
    state = mustOk(updateGameState(conf, state, { type: "Play", cardIndice: [1], color: null }));
    expect(state.playerMap["a"]).toStrictEqual({ hand: [], wonAt: 5 });
  });
});
