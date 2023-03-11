import { Meta, StoryObj } from "@storybook/react";
import { cardById } from "~/app/uni/cards";
import { HandCardMap } from "~/app/uni/game";
import { Card, buildDeck } from "~shared/cards";
import { initializeGame } from "~shared/game";
import { Mutable } from "~shared/mutable";
import { MyHand } from "../MyHand";

export default {
  title: "MyHand",
  args: {},
  argTypes: {
    runAction: { action: "action" },
  },
  component: (args) => (
    <div style={{ maxWidth: "1200px" }}>
      <MyHand {...args} />
    </div>
  ),
} as Meta<typeof MyHand>;

type Story = StoryObj<typeof MyHand>;

const allCards = buildDeck().map((c) => cardById(c.id));

const buildHandCardMap = (cardHashes: readonly string[], cards: readonly Card[]) => {
  return cardHashes.reduce((map, hash, i) => {
    map[hash] = { type: "got", card: cards[i] };
    return map;
  }, {} as Mutable<HandCardMap>);
};

export const CardUnrevealed: Story = (() => {
  const [gameConfig, gameState] = initializeGame({
    cards: allCards,
    playerUids: ["p1", "p2"],
    handCardsNum: 3,
  });
  return {
    args: {
      user: { uid: "p1" },
      gameConfig,
      gameState,
      handCardMap: {},
    },
  };
})();

export const SomeCardRevealed: Story = (() => {
  const [gameConfig, gameState] = initializeGame({
    cards: allCards,
    playerUids: ["p1", "p2"],
    handCardsNum: 3,
  });
  return {
    args: {
      user: { uid: "p1" },
      gameConfig,
      gameState,
      handCardMap: buildHandCardMap(gameState.playerMap["p1"].hand.slice(0, 2), allCards),
    },
  };
})();

export const NotMyTurn: Story = (() => {
  const [gameConfig, gameState] = initializeGame({
    cards: allCards,
    playerUids: ["p1", "p2"],
    handCardsNum: 3,
  });
  return {
    args: {
      user: { uid: "p2" },
      gameConfig,
      gameState,
      handCardMap: buildHandCardMap(gameState.playerMap["p2"].hand, allCards),
    },
  };
})();

export const ManyCards: Story = (() => {
  const cards = buildDeck().map((c) => cardById(c.id));
  const [gameConfig, gameState] = initializeGame({ cards, playerUids: ["p1"], handCardsNum: 40 });
  const handCardMap = buildHandCardMap(gameState.playerMap["p1"].hand, cards);
  return {
    args: {
      user: { uid: "p1" },
      gameConfig,
      gameState,
      handCardMap,
    },
  };
})();
