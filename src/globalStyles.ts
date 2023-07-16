import { Color } from "~shared/cards";

export const cardColorClasses = Object.freeze({
  Red: "cardRed",
  Blue: "cardBlue",
  Green: "cardGreen",
  Yellow: "cardYellow",
}) satisfies Record<Color, string>;
