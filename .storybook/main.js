/* eslint-env node */

/**
 * @type import("@storybook/react-vite").StorybookConfig
 */
export default {
  stories: ["../src/**/*.stories.tsx"],
  addons: ["@storybook/addon-essentials"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
};
