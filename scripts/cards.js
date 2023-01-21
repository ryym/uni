/* eslint-env node */

const fs = require("fs");
const path = require("path");

const makeDeck = () => {
  const num = (id, color, value) => ({ id: `num-${id}`, type: "Number", color, value });
  const reverse = (id, color) => ({ id: `reverse-${id}`, type: "Reverse", color });
  const draw2 = (id, color) => ({ id: `draw2-${id}`, type: "Draw2", color });
  const draw4 = (id) => ({ id: `draw4-${id}`, type: "Draw4" });
  const wild = (id) => ({ id: `wild-${id}`, type: "Wild" });

  const colors = ["Red", "Blue", "Green", "Yellow"];
  const range = (start, end) => [...Array(end + 1)].map((_, i) => start + i);

  return [
    ...colors.flatMap((color, ci) => [
      num(`${ci}-0-0`, color, 0),
      ...[1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap((n) => [
        num(`${ci}-${n}-0`, color, n),
        num(`${ci}-${n}-1`, color, n),
      ]),

      ...range(0, 1).map((i) => reverse(`${ci}-${i}`, color)),
      ...range(0, 1).map((i) => draw2(`${ci}-${i}`, color)),
    ]),

    ...range(0, 3).map((i) => draw4(i)),
    ...range(0, 3).map((i) => wild(i)),
  ];
};

const main = () => {
  const deck = makeDeck();
  const outPath = path.join(__dirname, "..", "cards.json");
  fs.writeFileSync(outPath, JSON.stringify(deck, null, 2));
};

main();
