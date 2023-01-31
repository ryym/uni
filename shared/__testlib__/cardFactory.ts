import { Card, buildDeck } from "../cards";

export type CardFactory = {
  readonly allCards: readonly Card[];
  readonly card: (id: string) => Card;
};

export const makeCardFactory = (): CardFactory => {
  const allCards = buildDeck();
  const cardMap = allCards.reduce((m, card) => {
    m.set(card.id, card);
    return m;
  }, new Map<string, Card>());

  return {
    allCards,
    card: (id) => {
      const c = cardMap.get(id);
      if (c == null) {
        throw new Error(`card ${id} not found`);
      }
      return c;
    },
  };
};
