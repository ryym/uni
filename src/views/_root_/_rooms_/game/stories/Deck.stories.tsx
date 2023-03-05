import { Meta, StoryObj } from "@storybook/react";
import { Deck } from "../Deck";

export default {
  title: "Deck",
  component: Deck,
} as Meta<typeof Deck>;

type Story = StoryObj<typeof Deck>;

export const Base: Story = {
  args: { cardCount: 100 },
};

export const Few: Story = {
  args: { cardCount: 3 },
};
