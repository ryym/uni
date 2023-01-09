// Currently we load entire card objects statically for simplicity.
import predefineCards from "../../../cards.json";

const CARDS = predefineCards as readonly Card[];

const COLORS = ["Red", "Blue", "Green", "Yellow"] as const;

export type Color = typeof COLORS[number];

export type NumberValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type Card = NumberCard;

export type NumberCard = {
  readonly id: string;
  readonly type: "Number";
  readonly color: Color;
  readonly value: NumberValue;
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
