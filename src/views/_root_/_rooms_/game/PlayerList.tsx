import { ReactElement } from "react";
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

function PlayerRow(props: PlayerRowProps): ReactElement {
  const headCards = props.player.hand.slice(0, 12);
  const omittedCount = props.player.hand.length - headCards.length;
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
      </div>
    </div>
  );
}
