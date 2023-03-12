import { ReactElement, useState } from "react";
import { range } from "~shared/array";
import { CardView } from "./CardView";
import styles from "./styles/PlayerList.module.css";

export type Player = {
  readonly uid: string;
  readonly name: string;
  readonly hand: readonly string[];
};

export type PlayerListProps = {
  readonly userUid: string;
  readonly currentPlayerUid: string;
  readonly players: readonly Player[];
};

export function PlayerList(props: PlayerListProps): ReactElement {
  return (
    <div className={styles.root}>
      {props.players.map((p) => (
        <PlayerRow
          key={p.uid}
          player={p}
          isYou={p.uid === props.userUid}
          isCurrent={p.uid === props.currentPlayerUid}
        />
      ))}
    </div>
  );
}

type PlayerRowProps = {
  readonly player: Player;
  readonly isYou: boolean;
  readonly isCurrent: boolean;
};

type CardsInOutEvent = {
  readonly key: number;
  readonly lastCardCount: number;
  readonly cardDiff: number;
};

function PlayerRow(props: PlayerRowProps): ReactElement {
  const cardCount = props.player.hand.length;
  const headCards = props.player.hand.slice(0, 20);
  const omittedCount = props.player.hand.length - headCards.length;

  const [inOutEvent, setInOutEvent] = useState<CardsInOutEvent>({
    key: 0,
    lastCardCount: cardCount,
    cardDiff: 0,
  });
  if (inOutEvent.lastCardCount !== cardCount) {
    setInOutEvent({
      key: inOutEvent.key + 1,
      lastCardCount: cardCount,
      cardDiff: cardCount - inOutEvent.lastCardCount,
    });
  }

  return (
    <div className={styles.player}>
      <div className={[styles.playerHead, props.isCurrent ? styles.isCurrent : ""].join(" ")}>
        {props.player.name}
        {props.isYou ? <span className={styles.isYou}>(You)</span> : ""}
      </div>
      <div className={styles.hand}>
        {headCards.map((v) => (
          <CardView key={v} card="hidden" size="sm" />
        ))}
        {omittedCount > 0 && (
          <div className={styles.omitted}>
            <CardView card="hidden" size="sm" />
            <span className={styles.omittedCount}>+{omittedCount}</span>
          </div>
        )}
        {inOutEvent.key > 0 && (
          <div
            key={inOutEvent.key}
            className={[
              styles.cardsInOut,
              inOutEvent.cardDiff > 0 ? styles.cardsIn : styles.cardsOut,
            ].join(" ")}
          >
            {range(0, Math.abs(inOutEvent.cardDiff)).map((i) => (
              <CardView key={i} card="hidden" size="sm" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
