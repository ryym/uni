import { Meta, StoryObj } from "@storybook/react";
import { buildDeck } from "~shared/cards";
import { DiscardPile } from "../DiscardPile";

const allCards = buildDeck();
const cards = [
  "num-r-0-0",
  "num-b-0-0",
  "num-y-0-0",
  "num-g-0-0",
  "draw4-0",
  "num-r-1-0",
  "num-b-1-0",
  "num-y-1-0",
  "num-g-1-0",
  "wild-0",
].map((id) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return allCards.find((c) => id === c.id)!;
});

export default {
  title: "DiscardPile",
  component: DiscardPile,
} as Meta<typeof DiscardPile>;

type Story = StoryObj<typeof DiscardPile>;

export const Empty: Story = {
  args: { cardCount: 0, topCards: [] },
};

export const Cards1: Story = {
  args: { cardCount: 1, topCards: cards.slice(0, 1).reverse(), color: "Red" },
};

export const Cards2: Story = {
  args: { cardCount: 2, topCards: cards.slice(0, 2).reverse(), color: "Blue" },
};

export const Cards3: Story = {
  args: { cardCount: 3, topCards: cards.slice(0, 3).reverse(), color: "Yellow" },
};

export const Cards4: Story = {
  args: { cardCount: 4, topCards: cards.slice(0, 4).reverse(), color: "Green" },
};

export const Cards5: Story = {
  args: { cardCount: 5, topCards: cards.slice(0, 5).reverse(), color: "Red" },
};

export const Cards6: Story = {
  args: { cardCount: 6, topCards: cards.slice(1, 6).reverse() },
};

export const Cards7: Story = {
  args: { cardCount: 7, topCards: cards.slice(2, 7).reverse() },
};

export const Cards49: Story = {
  args: { cardCount: 49, topCards: allCards.slice(44, 49) },
};
