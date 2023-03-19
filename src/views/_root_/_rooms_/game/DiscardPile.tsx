import { ReactElement, useEffect, useState } from "react";
import { Card, Color } from "~shared/cards";
import { CardView } from "./CardView";
import styles from "./styles/DiscardPile.module.css";

export type DiscardPileProps = {
  readonly cardCount: number;
  /** Top N cards in the discard pile in newest to oldest order. */
  readonly topCards: readonly Card[];
  readonly color: Color;
  readonly attackTotal: number | null;
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
  const cardPositions = [
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

  const [backgroundCards] = useState(() => new Set(props.topCards.slice(1)));
  const [placements, newestCard] = useCardPlacements(props.topCards, props.cardCount);
  const attackState = useAttackState(props.attackTotal || 0);

  return (
    <div className={[styles.root, colorClasses[props.color]].join(" ")}>
      {placements.map((p, i) => (
        <div
          key={p.card.id}
          className={backgroundCards.has(p.card) ? "" : styles.newCard}
          data-hoge={p.index}
          style={{
            position: "absolute",
            ...cardPositions[i],
            zIndex: p.indexInPile,
          }}
        >
          <CardView card={p.card} floating={p.card === newestCard} />
        </div>
      ))}
      {attackState.cardsToDraw > 0 && (
        <div
          className={[
            styles.nextDraw,
            attackState.attackFinished ? styles.attackFinished : "",
          ].join(" ")}
        >
          <div>Next draw</div>
          <div className={styles.nextDrawValue}>+{attackState.cardsToDraw}</div>
        </div>
      )}
    </div>
  );
}

// DiscardPile component represents a discard pile by displaying most recently played N cards (= topCards).
// Card positions are fixed so put cards in correct order there.
//   topCards: [1,2,3,4,5] -> placements: [1,2,3,4,5]
//   topCards: [2,3,4,5,6] -> placements: [6,2,3,4,5]
//   topCards: [3,4,5,6,7] -> placements: [6,7,3,4,5]
//   ...
const useCardPlacements = (topCards: readonly Card[], cardCount: number) => {
  const oldToNew = [...topCards].reverse();
  const lowestTopCardIdx = cardCount % oldToNew.length;
  const hiddenCardCount = cardCount - topCards.length;
  const newest = oldToNew[oldToNew.length - 1];

  const placements: CardPlacement[] = new Array(oldToNew.length);
  oldToNew.forEach((card, idx) => {
    const pos = (idx + lowestTopCardIdx) % oldToNew.length;
    placements[pos] = { card, index: idx, indexInPile: hiddenCardCount + idx + 1 };
  });

  return [placements, newest] as const;
};

// Manage attack state (Draw2/Draw4 pile) just for animating the attack finish.
const useAttackState = (attackTotal: number) => {
  const [attackState, setAttackState] = useState({
    cardsToDraw: 0,
    attackFinished: false,
  });
  if (attackTotal !== attackState.cardsToDraw) {
    if (attackTotal > 0) {
      setAttackState({ cardsToDraw: attackTotal, attackFinished: false });
    } else if (!attackState.attackFinished) {
      setAttackState((s) => ({ ...s, attackFinished: true }));
    }
  }

  useEffect(() => {
    if (!attackState.attackFinished) {
      return;
    }
    const timer = setTimeout(() => {
      setAttackState({ cardsToDraw: 0, attackFinished: false });
    }, 1000);
    return () => clearTimeout(timer);
  }, [attackState]);

  return attackState;
};
