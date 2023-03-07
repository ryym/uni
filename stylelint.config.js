/* eslint-env node */

// https://stylelint.io/user-guide/configure
module.exports = {
  plugins: [
    // https://github.com/hudochenkov/stylelint-order
    "stylelint-order",
  ],
  extends: [
    // https://github.com/stylelint/stylelint-config-standard
    "stylelint-config-standard",
  ],
  rules: {
    "custom-property-empty-line-before": null,
    "declaration-no-important": true,
    "declaration-block-no-redundant-longhand-properties": null,
    "property-no-unknown": [true, { ignoreProperties: ["composes"] }],
    "selector-class-pattern": [
      "^[a-z]([a-zA-Z0-9]*)*$",
      {
        message: (selector) => `Expected class selector "${selector}" to be camelCase`,
      },
    ],
    "value-keyword-case": ["lower", { ignoreProperties: ["composes"] }],

    "order/properties-order": [
      buildPropertiesOrder(),
      {
        unspecified: "bottomAlphabetical",
        emptyLineBeforeUnspecified: "always",
      },
    ],
  },
};

// Add properties as needed.
function buildPropertiesOrder() {
  const dirs = ["top", "right", "bottom", "left"];
  const borderProps = (infix) => [
    `border${infix}`,
    `border${infix}-width`,
    `border${infix}-style`,
    `border${infix}-color`,
    `border${infix}-radius`,
  ];

  return [
    "composes",

    "all",
    "content",
    "position",
    ...dirs,
    "z-index",
    "box-sizing",

    "grid-area",
    "display",
    "grid-template-areas",
    "grid-template-columns",
    "grid-template-rows",
    "place-items",
    "flex",
    "flex-direction",
    "flex-grow",
    "flex-shrink",
    "flex-wrap",
    "gap",
    "column-gap",
    "row-gap",

    "align-content",
    "align-items",
    "justify-content",
    "appearance",
    "width",
    "min-width",
    "max-width",
    "height",
    "min-height",
    "max-height",

    "padding",
    ...dirs.map((d) => `padding-${d}`),
    "margin",
    ...dirs.map((d) => `margin-${d}`),

    ...borderProps(""),
    ...dirs.flatMap((d) => borderProps(`-${d}`)),

    "font-family",
    "font-size",
    "font-weight",
    "color",
    "text-shadow",
    "background-color",
    "box-shadow",
    "opacity",
  ];
}
