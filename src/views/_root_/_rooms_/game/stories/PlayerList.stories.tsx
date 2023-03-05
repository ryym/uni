import { Meta, StoryObj } from "@storybook/react";
import { range } from "~shared/array";
import { PlayerList, PlayerListProps } from "../PlayerList";

export default {
  title: "PlayerList",
  component: (args) => (
    <div style={{ maxWidth: "400px" }}>
      <PlayerList {...args} />
    </div>
  ),
} as Meta<typeof PlayerList>;

type Story = StoryObj<typeof PlayerList>;

export const Empty: Story = {
  args: {
    userUid: "player1-uid",
    currentPlayerUid: "player1-uid",
    players: [],
  },
};

const genHand = (n: number) => range(0, n).map((n) => `card-${n}`);

const players: PlayerListProps["players"] = [
  {
    uid: "player1-uid",
    name: "たろう",
    hand: genHand(3),
  },
  {
    uid: "player2-uid",
    name: "長谷川五右衛門",
    hand: genHand(11),
  },
  {
    uid: "player3-uid",
    name: "Player3-desu",
    hand: genHand(6),
  },
];

export const MyTurn: Story = {
  args: {
    userUid: "player1-uid",
    currentPlayerUid: "player1-uid",
    players,
  },
};

export const NotMyTurn: Story = {
  args: {
    userUid: "player3-uid",
    currentPlayerUid: "player2-uid",
    players,
  },
};

export const TooManyHand: Story = {
  args: {
    userUid: "player2-uid",
    currentPlayerUid: "player1-uid",
    players: [
      ...players.slice(0, 2),
      {
        uid: "player3-uid",
        name: "初心者です",
        hand: genHand(31),
      },
    ],
  },
};

export const TooManyHand2: Story = {
  args: {
    userUid: "player2-uid",
    currentPlayerUid: "player1-uid",
    players: [
      ...players.slice(0, 2),
      {
        uid: "player3-uid",
        name: "初心者です",
        hand: genHand(18),
      },
    ],
  },
  render: (args) => (
    <div style={{ maxWidth: "500px" }}>
      <PlayerList {...args} />
    </div>
  ),
};
