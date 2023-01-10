/* eslint-env node */

const fs = require("fs");
const path = require("path");

const makeDeck = () => {
  const num = (id, color, value) => ({ id: `num-${id}`, type: "Number", color, value });

  const colors = ["Red", "Blue", "Green", "Yellow"];

  return [
    ...colors.flatMap((color, ci) => [
      num(`${ci}-0-0`, color, 0),
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap((n) => [
        num(`${ci}-${n}-0`, color, n),
        num(`${ci}-${n}-1`, color, n),
      ]),
    ]),
  ];
};

const main = () => {
  const deck = makeDeck();
  const outPath = path.join(__dirname, "..", "cards.json");
  fs.writeFileSync(outPath, JSON.stringify(deck, null, 2));
};

main();