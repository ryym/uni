import { ReactElement } from "react";
import { Card } from "~shared/cards";
import { CardView } from "./CardView";
import styles from "./styles/MyHand.module.css";

export type MyHandProps = {
  readonly cards: readonly Card[];
  readonly isTurn: boolean;
  readonly canDraw: boolean;
  readonly canPlay: boolean;
  readonly canPass: boolean;
};

export function MyHand(props: MyHandProps): ReactElement {
  return (
    <div className={styles.root}>
      <div className={`${styles.handHead} ${props.isTurn ? styles.isTurn : ""}`}>手札</div>
      <div className={styles.cards}>
        {props.cards.map((card) => (
          <CardView key={card.id} card={card} />
        ))}
      </div>
      <div className={styles.actions}>
        <button className={styles.actionButton} disabled={!props.isTurn || !props.canDraw}>
          出す
        </button>
        <button className={styles.actionButton} disabled={!props.isTurn || !props.canPlay}>
          引く
        </button>
        <button className={styles.actionButton} disabled={!props.isTurn || !props.canPass}>
          パス
        </button>
      </div>
    </div>
  );
}
