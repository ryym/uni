import { ReactElement, useState } from "react";
import { Card, Color } from "~shared/cards";
import { CardView } from "./CardView";
import styles from "./styles/DiscardPile.module.css";

export type DiscardPileProps = {
  readonly cardCount: number;
  /** Top N cards in the discard pile in newest to oldest order. */
  readonly topCards: readonly Card[];
  readonly color: Color;
};

type CardPlacement = {
  readonly card: Card;
  readonly index: number;
  readonly indexInPile: number;
};

const colorClasses = {
  Red: styles.pileRed,
  Blue: styles.pileBlue,
  Green: styles.pileGreen,
  Yellow: styles.pileYellow,
} satisfies Record<Color, string>;

export function DiscardPile(props: DiscardPileProps): ReactElement {
  // This component represents a discard pile by displaying most recently played N cards (= props.topCards).
  // Card placements are fixed so put cards in correct order there.
  //   topCards: [1,2,3,4,5] -> placements: [1,2,3,4,5]
  //   topCards: [2,3,4,5,6] -> placements: [6,2,3,4,5]
  //   topCards: [3,4,5,6,7] -> placements: [6,7,3,4,5]
  //   ...

  const [initialTopCards] = useState(() => new Set(props.topCards));

  const oldToNew = [...props.topCards].reverse();
  const lowestTopCardIdx = props.cardCount % oldToNew.length;
  const hiddenCardCount = props.cardCount - props.topCards.length;

  const placements: CardPlacement[] = new Array(oldToNew.length);
  oldToNew.forEach((card, idx) => {
    const pos = (idx + lowestTopCardIdx) % oldToNew.length;
    placements[pos] = { card, index: idx, indexInPile: hiddenCardCount + idx + 1 };
  });

  const cardPlacements = [
    {
      top: "105px",
      left: "130px",
      transform: "rotate(12deg)",
    },
    {
      top: "140px",
      left: "91px",
      transform: "rotate(-47deg)",
    },
    {
      top: "94px",
      left: "200px",
      transform: "rotate(24deg)",
    },
    {
      top: "36px",
      left: "85px",
      transform: "rotate(50deg)",
    },
    {
      top: "180px",
      left: "188px",
      transform: "rotate(70deg)",
    },
  ];

  const newest = oldToNew[oldToNew.length - 1];
  return (
    <div className={[styles.root, colorClasses[props.color]].join(" ")}>
      {placements.map((p, i) => (
        <div
          key={p.card.id}
          className={initialTopCards.has(p.card) ? "" : styles.newCard}
          data-hoge={p.index}
          style={{
            position: "absolute",
            ...cardPlacements[i],
            zIndex: p.indexInPile,
          }}
        >
          <CardView card={p.card} floating={p.card === newest} />
        </div>
      ))}
    </div>
  );
}
