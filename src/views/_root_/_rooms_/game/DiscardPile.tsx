import { ReactElement } from "react";
import { Card } from "~shared/cards";
import { CardView } from "./CardView";
import styles from "./styles/DiscardPile.module.css";

export type DiscardPileProps = {
  readonly cardCount: number;
  readonly topCards: readonly Card[];
};

type CardPlacement = {
  readonly card: Card;
  readonly pileIndex: number;
};

export function DiscardPile(props: DiscardPileProps): ReactElement {
  // This component represents a discard pile by displaying most recently played N cards (= props.topCards).
  // Card placements are fixed so put cards in correct order there.
  //   topCards: [1,2,3,4,5] -> placements: [1,2,3,4,5]
  //   topCards: [2,3,4,5,6] -> placements: [6,2,3,4,5]
  //   topCards: [3,4,5,6,7] -> placements: [6,7,3,4,5]
  //   ...

  const topCards = props.topCards.slice(0, Math.min(5, props.topCards.length));
  const lowestTopCardIdx = props.cardCount % topCards.length;
  const hiddenCardCount = props.cardCount - props.topCards.length;

  const placements: CardPlacement[] = new Array(topCards.length);
  topCards.forEach((card, idx) => {
    const pos = (idx + lowestTopCardIdx) % topCards.length;
    placements[pos] = { card, pileIndex: hiddenCardCount + idx + 1 };
  });

  const cardPlacements = [
    {
      top: "15px",
      left: "30px",
      transform: "rotate(32deg)",
    },
    {
      top: "90px",
      left: "41px",
      transform: "rotate(-47deg)",
    },
    {
      top: "10px",
      left: "110px",
      transform: "rotate(8deg)",
    },
    {
      top: "146px",
      left: "75px",
      transform: "rotate(80deg)",
    },
    {
      top: "80px",
      left: "158px",
      transform: "rotate(-20deg)",
    },
  ];

  const latestCard = topCards[topCards.length - 1];
  return (
    <div className={styles.root}>
      {placements.map((p, i) => (
        <div
          key={p.card.id}
          style={{
            position: "absolute",
            ...cardPlacements[i],
            zIndex: p.pileIndex,
          }}
        >
          <CardView card={p.card} floating={topCards.length > 1 && p.card === latestCard} />
        </div>
      ))}
    </div>
  );
}
