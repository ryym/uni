/* eslint-env node */

module.exports = {
  roots: ["src"],
  verbose: true,
  moduleFileExtensions: ["js", "ts", "tsx"],
  testMatch: ["**/*.test.ts?(x)"],
  moduleNameMapper: {
    "~/(.*)": "<rootDir>/src/$1",
    "~shared/(.*)": "<rootDir>/shared/$1",
  },
  preset: "ts-jest",
  testEnvironment: "node",
};
