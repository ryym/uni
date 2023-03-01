/* eslint-env node */

const path = require("path");

const rootDir = path.resolve(__dirname, "..");

module.exports = {
  stories: ["../src/**/*.stories.tsx"],
  addons: ["@storybook/addon-essentials"],
  framework: "@storybook/react",
  features: {
    storyStoreV7: true,
  },
  webpackFinal: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "~": path.join(rootDir, "src"),
      "~shared": path.join(rootDir, "shared"),
    };
    return config;
  },
};
