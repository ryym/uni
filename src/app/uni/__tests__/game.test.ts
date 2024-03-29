import { describe, expect, test } from "@jest/globals";
import { Result } from "~/lib/types";
import { makeCardFactory } from "~shared/__testlib__/cardFactory";
import { range } from "~shared/array";
import { GameAction, GameState, initializeGame } from "~shared/game";
import { updateGameState } from "../game";

describe("updateGameState", () => {
  const { allCards, card } = makeCardFactory();

  const playAction = (cardIds: readonly string[], color: string | null = null): GameAction => {
    return { type: "Play", cardIds, color };
  };

  const mustOk = <T>(result: Result<T>): T => {
    if (!result.ok) {
      throw new Error(`[mustOk] result is not ok: ${result.error}`);
    }
    return result.value;
  };

  test("[pass] player can pass after draw", () => {
    let [conf, state] = initializeGame({
      cards: allCards,
      playerUids: ["a", "b"],
      handCardsNum: 1,
    });
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
    const cards = [
      // a's hand
      card("num-r-1-0"),
      // b's hand
      card("num-b-1-0"),
      // others
      card("num-g-2-0"),
      card("num-y-3-0"),
    ];
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
          a: { hand: ["num-r-1-0-hash", "num-y-3-0-hash"], wonAt: null },
          b: { hand: ["num-b-1-0-hash"], wonAt: null },
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
    expect(updateGameState(conf, state, playAction(["num-r-3-0"])).ok).toBe(true);
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
    state = mustOk(updateGameState(conf, state, playAction(["num-g-3-0", "num-r-3-1"])));
    expect([state.playerMap["a"].hand, state.currentPlayerUid, state.discardPile]).toStrictEqual([
      ["num-r-4-0-hash"],
      "b",
      {
        topCardIds: ["num-r-3-1", "num-g-3-0", "num-b-3-0"],
        color: "Red",
        attackTotal: null,
      } satisfies GameState["discardPile"],
    ]);

    // b's turn
    state = mustOk(updateGameState(conf, state, playAction(["num-r-6-1", "num-r-6-0"])));
    expect([state.playerMap["b"].hand, state.currentPlayerUid, state.discardPile]).toStrictEqual([
      ["num-r-5-0-hash"],
      "a",
      {
        topCardIds: ["num-r-6-0", "num-r-6-1", "num-r-3-1", "num-g-3-0", "num-b-3-0"],
        color: "Red",
        attackTotal: null,
      } satisfies GameState["discardPile"],
    ]);
  });

  test("[play] player cannot play cards that do not exist in their hand", () => {
    const cards = [
      // a's hand
      card("num-r-1-0"),
      card("num-r-1-1"),
      // b's hand
      card("num-b-1-0"),
      card("num-b-1-1"),
      // others
      card("num-r-3-0"),
    ];
    let [conf, state] = initializeGame({ cards, playerUids: ["a", "b"], handCardsNum: 2 });

    // a's turn
    expect(updateGameState(conf, state, playAction(["num-r-9-0"])).ok).toBe(false);
    expect(updateGameState(conf, state, playAction(["num-b-1-0"])).ok).toBe(false);
    state = mustOk(updateGameState(conf, state, playAction(["num-r-1-0"])));

    // b's turn
    expect(updateGameState(conf, state, playAction(["num-b-9-0"])).ok).toBe(false);
    expect(updateGameState(conf, state, playAction(["num-r-1-1"])).ok).toBe(false);
    mustOk(updateGameState(conf, state, playAction(["num-b-1-1"])));
  });

  test("[attack] player cannot play non-attack cards during attack", () => {
    const cards = [
      // a's hand
      card("draw2-g-0"),
      card("num-b-5-0"),
      // b's hand
      card("num-g-1-0"),
      card("num-g-2-0"),
      // others
      card("num-g-0-0"),
      card("num-y-3-0"),
      card("num-y-4-0"),
    ];
    let [conf, state] = initializeGame({ cards, playerUids: ["a", "b"], handCardsNum: 2 });

    // a's turn
    state = mustOk(updateGameState(conf, state, playAction(["draw2-g-0"])));
    expect([state.discardPile.attackTotal, state.currentPlayerUid]).toStrictEqual([2, "b"]);
    // b's turn: cannot play a green card on green Draw2 since the attack is active.
    expect(updateGameState(conf, state, playAction(["num-g-1-0"])).ok).toBe(false);
    state = mustOk(updateGameState(conf, state, { type: "Draw" }));
    expect([
      state.discardPile.attackTotal,
      state.playerMap["b"].hand.length,
      state.currentPlayerUid,
    ]).toStrictEqual([null, 4, "a"]);

    // a's turn
    state = mustOk(updateGameState(conf, state, { type: "Draw" }));
    state = mustOk(updateGameState(conf, state, { type: "Pass" }));
    // b's turn: now can play a green card on the same green Draw2.
    expect(updateGameState(conf, state, playAction(["num-g-1-0"])).ok).toBe(true);
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
    state = mustOk(updateGameState(conf, state, playAction(["draw2-y-0"])));
    expect(state.discardPile.attackTotal).toBe(2);
    // b's turn
    state = mustOk(updateGameState(conf, state, playAction(["draw4-0"], "Blue")));
    expect(state.discardPile.attackTotal).toBe(6);
    // c's turn
    state = mustOk(updateGameState(conf, state, playAction(["draw2-b-0"])));
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
        a: {
          hand: ["num-r-1-0-hash", /* attacked */ ...range(1, 9).map((i) => `num-y-${i}-0-hash`)],
          wonAt: null,
        },
        b: { hand: ["num-r-1-1-hash"], wonAt: null },
        c: { hand: ["num-b-1-0-hash"], wonAt: null },
      },
      discardPile: {
        topCardIds: ["draw2-b-0", "draw4-0", "draw2-y-0", "num-y-0-0"],
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
    state = mustOk(updateGameState(conf, state, playAction(["num-r-1-0"])));
    expect(state.playerMap["a"]).toStrictEqual({ hand: ["num-r-1-1-hash"], wonAt: null });
    // b's turn: win
    state = mustOk(updateGameState(conf, state, playAction(["num-r-2-0", "num-r-2-1"])));
    expect(state.playerMap["b"]).toStrictEqual({ hand: [], wonAt: 2 });
    // c's turn
    state = mustOk(updateGameState(conf, state, { type: "Draw" }));
    state = mustOk(updateGameState(conf, state, { type: "Pass" }));
    expect(state.playerMap["c"]).toStrictEqual({
      hand: ["num-b-1-0-hash", "num-b-1-1-hash", "num-r-9-1-hash"],
      wonAt: null,
    });
    // a's turn: win
    state = mustOk(updateGameState(conf, state, playAction(["num-r-1-1"])));
    expect(state.playerMap["a"]).toStrictEqual({ hand: [], wonAt: 5 });
  });
});
