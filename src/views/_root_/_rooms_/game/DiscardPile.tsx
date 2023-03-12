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
  readonly pileIndex: number;
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
    placements[pos] = { card, pileIndex: hiddenCardCount + idx + 1 };
  });

  const cardPlacements = [
    {
      top: "65px",
      left: "80px",
      transform: "rotate(32deg)",
    },
    {
      top: "140px",
      left: "91px",
      transform: "rotate(-47deg)",
    },
    {
      top: "60px",
      left: "160px",
      transform: "rotate(8deg)",
    },
    {
      top: "196px",
      left: "125px",
      transform: "rotate(80deg)",
    },
    {
      top: "130px",
      left: "208px",
      transform: "rotate(-20deg)",
    },
  ];

  const newest = oldToNew[oldToNew.length - 1];
  return (
    <div className={[styles.root, colorClasses[props.color]].join(" ")}>
      {placements.map((p, i) => (
        <div
          key={p.card.id}
          className={initialTopCards.has(p.card) ? "" : styles.newCard}
          style={{
            position: "absolute",
            ...cardPlacements[i],
            zIndex: p.pileIndex,
          }}
        >
          <CardView card={p.card} floating={oldToNew.length > 1 && p.card === newest} />
        </div>
      ))}
    </div>
  );
}
