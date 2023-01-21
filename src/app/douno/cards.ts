// Currently we load entire card objects statically for simplicity.
import { Result } from "~/lib/types";
import predefineCards from "../../../cards.json";

const CARDS = predefineCards as readonly Card[];

const COLORS = ["Red", "Blue", "Green", "Yellow"] as const;

export type Color = typeof COLORS[number];

export type NumberValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type Card = NumberCard | Draw2Card | WildCard | Draw4Card | ReverseCard;

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

const cardMap = CARDS.reduce((m, card) => {
  m[card.id] = card;
  return m;
}, {} as Record<string, Card>);

export const cardById = (id: string): Card => {
  if (cardMap[id] == null) {
    throw new Error(`[douno] unknown card id: ${id}`);
  }
  return cardMap[id];
};

export const parseColor = (value: unknown): Result<Color> => {
  if (typeof value === "string" && COLORS.includes(value as Color)) {
    return { ok: true, value: value as Color };
  }
  return { ok: false, error: `invalid color: ${value}` };
};
