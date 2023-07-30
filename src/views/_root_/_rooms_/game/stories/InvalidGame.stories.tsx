import { Meta, StoryObj } from "@storybook/react";
import { InvalidGame } from "../InvalidGame";

export default {
  title: "InvalidGame",
  component: InvalidGame,
  argTypes: {
    cancelGame: { action: "cancelGame" },
  },
} as Meta<typeof InvalidGame>;

type Story = StoryObj<typeof InvalidGame>;

export const Base: Story = {
  args: { message: "some error" },
};
