import { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { User } from "~/app/models";
import { cardById } from "~/app/uni/cards";
import { HandCardMap, updateGameState } from "~/app/uni/game";
import { buildDeck } from "~shared/cards";
import { GameAction, InitializeGameResult, initializeGame } from "~shared/game";
import { Mutable } from "~shared/mutable";
import { OngoingGame, OngoingGameProps } from "../OngoingGame";

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

const interactiveStory = (
  [gameConfig, gameState, hashById]: InitializeGameResult,
  storyConfig: {
    readonly memberMap: OngoingGameProps["memberMap"];
  },
): Story => {
  const idByHash = Object.keys(hashById).reduce((map, id) => {
    map[hashById[id]] = id;
    return map;
  }, {} as Mutable<Record<string, string>>);

  const buildHandCardMap = (uid: string, state: typeof gameState) => {
    const { hand } = state.playerMap[uid];
    return hand.reduce((map, h) => {
      map[h] = { type: "got", card: cardById(idByHash[h]) };
      return map;
    }, {} as Mutable<HandCardMap>);
  };

  return {
    render: function LocalOngoingGame() {
      const [state, setState] = useState(gameState);
      const user: User = { uid: state.currentPlayerUid };
      const handCardMap = buildHandCardMap(user.uid, state);
      const runAction = (action: GameAction) => {
        const result = updateGameState(gameConfig, state, action);
        if (result.ok) {
          setState(result.value);
        } else {
          throw new Error(result.error);
        }
      };
      return (
        <OngoingGame
          user={user}
          memberMap={storyConfig.memberMap}
          gameConfig={gameConfig}
          gameState={state}
          handCardMap={handCardMap}
          runAction={runAction}
        />
      );
    },
  };
};

export const Base: Story = (() => {
  const [gameConfig, gameState] = initializeGame({
    cards: allCards,
    playerUids: ["p1", "p2"],
    handCardsNum: 3,
  });
  return {
    args: {
      user: { uid: "p1" },
      memberMap: {
        p1: { name: "プレイヤー1", joinedAt: 1 },
        p2: { name: "プレイヤー2", joinedAt: 2 },
      },
      gameConfig,
      gameState,
      handCardMap: {
        [gameConfig.deck[0]]: { type: "fetching" },
        [gameConfig.deck[1]]: { type: "fetching" },
        [gameConfig.deck[2]]: { type: "fetching" },
      },
    },
  };
})();

export const Interactive: Story = (() => {
  const initialGame = initializeGame({
    cards: allCards,
    playerUids: ["p1", "p2"],
    handCardsNum: 3,
  });
  return interactiveStory(initialGame, {
    memberMap: {
      p1: { name: "プレイヤー1", joinedAt: 1 },
      p2: { name: "プレイヤー2", joinedAt: 2 },
    },
  });
})();

export const ConecutiveAttacks: Story = (() => {
  const initialGame = initializeGame({
    cards: [
      cardById("draw2-r-0"),
      cardById("draw2-b-0"),
      cardById("draw2-g-0"),
      cardById("draw2-y-0"),
      cardById("draw4-0"),
      cardById("num-r-0-0"),
      cardById("num-b-0-0"),
      cardById("num-g-0-0"),
      cardById("num-y-0-0"),
      cardById("num-r-1-0"),
      cardById("num-b-1-0"),
      cardById("num-g-1-0"),
      cardById("num-y-1-0"),
      cardById("num-r-2-0"),
      cardById("num-b-2-0"),
      cardById("num-g-2-0"),
      cardById("num-y-2-0"),
      cardById("wild-0"),
    ],
    playerUids: ["p1"],
    handCardsNum: 5,
  });
  return interactiveStory(initialGame, {
    memberMap: { p1: { name: "プレイヤー1", joinedAt: 1 } },
  });
})();

export const ColorSelection: Story = (() => {
  const initialGame = initializeGame({
    cards: [
      cardById("draw4-0"),
      cardById("wild-0"),
      cardById("num-r-0-0"),
      cardById("num-b-0-0"),
      cardById("num-g-0-0"),
      cardById("num-y-0-0"),
    ],
    playerUids: ["p1"],
    handCardsNum: 2,
  });
  return interactiveStory(initialGame, {
    memberMap: { p1: { name: "プレイヤー1", joinedAt: 1 } },
  });
})();
