import { Meta, StoryObj } from "@storybook/react";
import { buildDeck } from "~shared/cards";
import { MyHand } from "../MyHand";

const allCards = buildDeck();
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const card = (id: string) => allCards.find((c) => id === c.id)!;

export default {
  title: "MyHand",
  args: {
    canDraw: false,
    canPlay: true,
    canPass: false,
  },
  component: (args) => (
    <div style={{ maxWidth: "1200px" }}>
      <MyHand {...args} />
    </div>
  ),
} as Meta<typeof MyHand>;

type Story = StoryObj<typeof MyHand>;

export const Empty: Story = {
  args: {
    cards: [],
  },
};

export const Base: Story = {
  args: {
    cards: [
      card("num-r-0-0"),
      card("num-r-3-0"),
      card("num-r-9-0"),
      card("num-b-4-0"),
      card("num-g-4-0"),
      card("num-g-5-0"),
      card("rev-r-0"),
      card("skip-y-0"),
      card("draw2-g-0"),
      card("draw4-0"),
      card("wild-0"),
    ],
  },
};

export const MyTurn: Story = {
  args: {
    isTurn: true,
    cards: [
      card("num-r-0-0"),
      card("num-r-3-0"),
      card("num-r-9-0"),
      card("num-b-4-0"),
      card("num-g-4-0"),
      card("num-g-5-0"),
      card("rev-r-0"),
      card("skip-y-0"),
      card("draw2-g-0"),
      card("draw4-0"),
      card("wild-0"),
    ],
  },
};

export const ManyCards: Story = {
  args: {
    cards: allCards.slice(10, 40),
  },
};

export const CannotDrawPlay: Story = {
  args: {
    cards: allCards.slice(0, 3),
    isTurn: true,
    canDraw: false,
    canPlay: false,
    canPass: true,
  },
};
