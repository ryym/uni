/* eslint-env node */

module.exports = {
  roots: ["src", "shared"],
  verbose: true,
  moduleFileExtensions: ["js", "ts", "tsx"],
  testMatch: ["**/*.test.ts?(x)"],
  moduleNameMapper: {
    "~/(.*)": "<rootDir>/src/$1",
    "~shared/(.*)": "<rootDir>/shared/$1",
  },
  preset: "ts-jest",
  testEnvironment: "node",
  globals: {
    __ENV_TEST__: true,
  },
};
