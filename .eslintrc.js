/* eslint-env node */

// https://eslint.org/docs/user-guide/configuring
module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  env: {
    browser: true,
    es2020: true,
  },
  plugins: [
    // https://github.com/benmosher/eslint-plugin-import
    "eslint-plugin-import",
  ],
  extends: ["eslint:recommended", "plugin:react-hooks/recommended", "prettier"],
  rules: {
    camelcase: "error",
    curly: "error",
    "no-proto": "error",
    "no-sequences": "error",
    "no-void": "error",
    // Enforce const declarations but relax the rule about destructuring.
    // https://eslint.org/docs/latest/rules/prefer-const
    "prefer-const": ["error", { destructuring: "all" }],
    // Enforce an alphabetical order to imported members.
    // https://eslint.org/docs/rules/sort-imports
    "sort-imports": ["error", { ignoreDeclarationSort: true }],
    // Enforce an alphabetical and group-based order to import statements.
    // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/order.md
    "import/order": [
      "error",
      {
        groups: [["builtin", "external"], "internal", "parent", "sibling"],
        pathGroups: [{ pattern: "~/**", group: "internal" }],
        alphabetize: { order: "asc" },
      },
    ],
    "import/no-default-export": "error",
    "import/no-duplicates": "error",
  },
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      parser: "@typescript-eslint/parser",
      plugins: [
        // https://github.com/typescript-eslint/typescript-eslint
        "@typescript-eslint",
      ],
      extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
      rules: {
        "@typescript-eslint/explicit-module-boundary-types": "error",
        "@typescript-eslint/method-signature-style": "error",
        "@typescript-eslint/no-confusing-non-null-assertion": "error",
        "@typescript-eslint/no-duplicate-imports": "error",
        "@typescript-eslint/no-invalid-void-type": "error",
        "@typescript-eslint/prefer-function-type": "error",
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-unused-vars": [
          "warn",
          { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
        ],
      },
    },
  ],
};
