import { Meta, StoryObj } from "@storybook/react";
import { Card, buildDeck, cardDigest } from "~shared/cards";
import { CardView } from "../CardView";

const uniqueCards = (() => {
  const digests = new Set<string>();
  return buildDeck().reduce((cs, c) => {
    const d = cardDigest(c);
    if (!digests.has(d)) {
      cs.push(c);
      digests.add(d);
    }
    return cs;
  }, [] as Card[]);
})();

export default {
  title: "Card",
  component: CardView,
} as Meta<typeof CardView>;

type CardStory = StoryObj<typeof CardView>;

export const Cards: CardStory = {
  args: { card: "hidden" },
  render: (args) => {
    return (
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <CardView {...args} card="hidden" />
        {uniqueCards.map((c) => (
          <CardView {...args} key={c.id} card={c} />
        ))}
      </div>
    );
  },
};
