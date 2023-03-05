import { ReactElement } from "react";
import { range } from "~shared/array";
import { CardView } from "./CardView";
import styles from "./styles/Deck.module.css";

export type DeckProps = {
  readonly cardCount: number;
};

export function Deck(props: DeckProps): ReactElement | null {
  if (props.cardCount <= 0) {
    return null;
  }
  const card = <CardView card="hidden" />;
  const cardCount = Math.min(props.cardCount, 8);
  const tailPos = (cardCount - 1) * 2;
  return (
    <div className={styles.root} style={{ "--max-shift": `${tailPos}px` }}>
      {range(0, cardCount).map((n) => (
        <div key={n} className={styles.card} style={{ "--shift": `${tailPos - n * 2}px` }}>
          {card}
        </div>
      ))}
      {/*
       * An invisible card just exists for reserving the Deck space.
       * Without this, the Deck height becomes shorter than its content since
       * all elements inside it are placed in absolute position.
       */}
      <div className={styles.cardForSpace}>{card}</div>
    </div>
  );
}
