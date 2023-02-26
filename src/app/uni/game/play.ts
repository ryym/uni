import { Result } from "~/lib/types";
import {
  Color,
  Draw2Card,
  Draw4Card,
  MAX_PLAY_CARDS,
  NumberCard,
  ReverseCard,
  SkipCard,
  WildCard,
  cardById,
  parseColor,
} from "../cards";

export type Play =
  | {
      readonly type: "NumberCards";
      readonly cards: readonly NumberCard[];
    }
  | {
      readonly type: "ReverseCards";
      readonly cards: readonly ReverseCard[];
    }
  | {
      readonly type: "SkipCards";
      readonly cards: readonly SkipCard[];
    }
  | {
      readonly type: "Draw2Cards";
      readonly cards: readonly Draw2Card[];
    }
  | {
      readonly type: "WildCards";
      readonly cards: readonly WildCard[];
      readonly color: Color;
    }
  | {
      readonly type: "Draw4Cards";
      readonly cards: readonly Draw4Card[];
      readonly color: Color;
    };

export const parsePlay = (
  cardIds: readonly string[],
  selectedColor: string | null,
): Result<Play> => {
  if (cardIds.length === 0) {
    return { ok: false, error: "played cards empty" };
  }
  if (cardIds.length > MAX_PLAY_CARDS) {
    return { ok: false, error: "played cards too many" };
  }

  const cards = cardIds.map((id) => cardById(id));
  if (cards.length > 1 && cards.some((c) => c.type !== cards[0].type)) {
    return { ok: false, error: "multiple type cards played" };
  }

  switch (cards[0].type) {
    case "Number": {
      const numCards = cards as NumberCard[];
      if (numCards.length > 1 && numCards.some((c) => c.value !== numCards[0].value)) {
        return { ok: false, error: "multiple number values played" };
      }
      return {
        ok: true,
        value: { type: "NumberCards", cards: numCards },
      };
    }

    case "Reverse": {
      const reverseCards = cards as ReverseCard[];
      return {
        ok: true,
        value: { type: "ReverseCards", cards: reverseCards },
      };
    }

    case "Skip": {
      const skipCards = cards as SkipCard[];
      return {
        ok: true,
        value: { type: "SkipCards", cards: skipCards },
      };
    }

    case "Draw2": {
      const draw2Cards = cards as Draw2Card[];
      return {
        ok: true,
        value: { type: "Draw2Cards", cards: draw2Cards },
      };
    }

    case "Wild": {
      const colorResult = parseColor(selectedColor);
      if (!colorResult.ok) {
        return { ok: false, error: `must specify valid color: ${colorResult.error}` };
      }
      const wildCards = cards as WildCard[];
      return {
        ok: true,
        value: { type: "WildCards", cards: wildCards, color: colorResult.value },
      };
    }

    case "Draw4": {
      const colorResult = parseColor(selectedColor);
      if (!colorResult.ok) {
        return { ok: false, error: `must specify valid color: ${colorResult.error}` };
      }
      const draw4Cards = cards as Draw4Card[];
      return {
        ok: true,
        value: { type: "Draw4Cards", cards: draw4Cards, color: colorResult.value },
      };
    }
  }
};
