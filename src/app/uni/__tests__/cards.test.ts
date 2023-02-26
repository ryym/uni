import { describe, expect, it } from "@jest/globals";
import { cardById } from "../cards";

describe("cardById", () => {
  it("returns identical Card object for same id", () => {
    const card1 = cardById("num-r-0-0");
    const card2 = cardById("num-r-0-0");
    expect(card1).toBe(card2);
  });
});
