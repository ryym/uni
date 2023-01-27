import { describe, expect, it } from "@jest/globals";
import { buildDeck } from "../cards";

describe("buildDeck", () => {
  it("generates all cards", () => {
    const cards = buildDeck();
    expect(cards.length).toEqual(108);

    const numCards = cards.filter((c) => c.type === "Number");
    const reverseCards = cards.filter((c) => c.type === "Reverse");
    const skipCards = cards.filter((c) => c.type === "Skip");
    const draw2Cards = cards.filter((c) => c.type === "Draw2");
    const draw4Cards = cards.filter((c) => c.type === "Draw4");
    const wildCards = cards.filter((c) => c.type === "Wild");

    expect([
      numCards.length,
      reverseCards.length,
      skipCards.length,
      draw2Cards.length,
      draw4Cards.length,
      wildCards.length,
    ]).toStrictEqual([76, 8, 8, 8, 4, 4]);
  });
});
