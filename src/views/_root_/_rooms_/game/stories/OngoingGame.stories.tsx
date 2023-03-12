import { Meta, StoryObj } from "@storybook/react";
import { cardById } from "~/app/uni/cards";
import { buildDeck } from "~shared/cards";
import { initializeGame } from "~shared/game";
import { OngoingGame } from "../OngoingGame";

export default {
  title: "OngoingGame",
  args: {},
  argTypes: {
    runAction: { action: "action" },
  },
  component: OngoingGame,
} as Meta<typeof OngoingGame>;

type Story = StoryObj<typeof OngoingGame>;

const allCards = buildDeck().map((c) => cardById(c.id));

export const Base: Story = (() => {
  const [gameConfig, gameState] = initializeGame({
    cards: allCards,
    playerUids: ["p1", "p2"],
    handCardsNum: 3,
  });
  return {
    args: {
      user: { uid: "p1" },
      memberMap: { p1: { name: "プレイヤー1" }, p2: { name: "プレイヤー2" } },
      gameConfig,
      gameState,
      handCardMap: {},
    },
  };
})();
