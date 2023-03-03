import { Result } from "~/lib/types";
import { COLORS, Card, Color, buildDeck } from "~shared/cards";

export type {
  Color,
  Card,
  NumberCard,
  NumberValue,
  ReverseCard,
  SkipCard,
  Draw2Card,
  Draw4Card,
  WildCard,
} from "~shared/cards";

const cardMap = buildDeck().reduce((m, card) => {
  m[card.id] = card;
  return m;
}, {} as Record<string, Card>);

export const MAX_PLAY_CARDS = 50;

export const cardById = (id: string): Card => {
  if (cardMap[id] == null) {
    throw new Error(`[uni] unknown card id: ${id}`);
  }
  return cardMap[id];
};

export const parseColor = (value: unknown): Result<Color> => {
  if (typeof value === "string" && COLORS.includes(value as Color)) {
    return { ok: true, value: value as Color };
  }
  return { ok: false, error: `invalid color: ${value}` };
};
