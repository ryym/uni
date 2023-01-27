import { range } from "./array";

export const COLORS = ["Red", "Blue", "Green", "Yellow"] as const;

export type Color = typeof COLORS[number];

export type NumberValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type Card = NumberCard | ReverseCard | SkipCard | Draw2Card | WildCard | Draw4Card;

export type NumberCard = {
  readonly id: string;
  readonly type: "Number";
  readonly color: Color;
  readonly value: NumberValue;
};

export type ReverseCard = {
  readonly id: string;
  readonly type: "Reverse";
  readonly color: Color;
};

export type SkipCard = {
  readonly id: string;
  readonly type: "Skip";
  readonly color: Color;
};

export type Draw2Card = {
  readonly id: string;
  readonly type: "Draw2";
  readonly color: Color;
};

export type WildCard = {
  readonly id: string;
  readonly type: "Wild";
};

export type Draw4Card = {
  readonly id: string;
  readonly type: "Draw4";
};

/**
 * Create a deck which consists of 108 cards:
 *   - Number0 * 4
 *   - Number1~Number9 * 2 * 4
 *   - Skip * 2 * 4
 *   - Reverse * 2 * 4
 *   - Draw2 * 2 * 4
 *   - Draw4 * 4
 *   - Wild * 4
 * Cards are not shuffled.
 */
export const buildDeck = (): Card[] => {
  const colors = ["Red", "Blue", "Green", "Yellow"] as const;
  const num1to9 = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

  return [
    ...colors.flatMap((color, ci) => [
      num(`${ci}-0-0`, color, 0),
      ...num1to9.flatMap((n) => [num(`${ci}-${n}-0`, color, n), num(`${ci}-${n}-1`, color, n)]),

      ...range(0, 2).map((i) => reverse(`${ci}-${i}`, color)),
      ...range(0, 2).map((i) => skip(`${ci}-${i}`, color)),
      ...range(0, 2).map((i) => draw2(`${ci}-${i}`, color)),
    ]),

    ...range(0, 4).map((i) => draw4(i)),
    ...range(0, 4).map((i) => wild(i)),
  ];
};

const num = (id: string, color: Color, value: NumberValue): NumberCard => {
  return {
    id: `num-${id}`,
    type: "Number",
    color,
    value,
  };
};
const reverse = (id: string, color: Color): ReverseCard => {
  return {
    id: `reverse-${id}`,
    type: "Reverse",
    color,
  };
};
const skip = (id: string, color: Color): SkipCard => {
  return {
    id: `skip-${id}`,
    type: "Skip",
    color,
  };
};
const draw2 = (id: string, color: Color): Draw2Card => {
  return {
    id: `draw2-${id}`,
    type: "Draw2",
    color,
  };
};
const draw4 = (id: number): Draw4Card => {
  return {
    id: `draw4-${id}`,
    type: "Draw4",
  };
};
const wild = (id: number): WildCard => {
  return {
    id: `wild-${id}`,
    type: "Wild",
  };
};
