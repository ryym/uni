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

function PlayerRow(props: PlayerRowProps): ReactElement {
  const cardCount = props.player.hand.length;
  const headCards = props.player.hand.slice(0, 20);
  const omittedCount = props.player.hand.length - headCards.length;

  const [handDiff, setHandDiff] = useState({
    lastCardCount: cardCount,
    lastDraw: { key: 0, count: 0 },
    lastPlay: { key: 0, count: 0 },
  });
  if (cardCount !== handDiff.lastCardCount) {
    const added = cardCount - handDiff.lastCardCount;
    setHandDiff({
      lastCardCount: cardCount,
      lastDraw: added > 0 ? { key: handDiff.lastDraw.key + 1, count: added } : handDiff.lastDraw,
      lastPlay: added < 0 ? { key: handDiff.lastPlay.key + 1, count: -added } : handDiff.lastPlay,
    });
  }

  return (
    <div className={styles.player}>
      <div className={[styles.playerHead, props.isCurrent ? styles.isCurrent : ""].join(" ")}>
        <span className={styles.playerName}>{props.player.name}</span>
        {props.isYou ? <span className={styles.isYou}>(You)</span> : ""}
      </div>
      <div className={styles.hand}>
        {headCards.map((v) => (
          <div key={v} className={styles.drawnCard}>
            <CardView card="hidden" size="sm" />
          </div>
        ))}
        {omittedCount > 0 && (
          <div key={handDiff.lastDraw.key} className={[styles.omitted, styles.drawnCard].join(" ")}>
            <CardView card="hidden" size="sm" />
            <span className={styles.omittedCount}>+{omittedCount}</span>
          </div>
        )}
        {handDiff.lastPlay.count > 0 && (
          <div key={handDiff.lastPlay.key} className={styles.playedCards}>
            {range(0, handDiff.lastPlay.count).map((i) => (
              <CardView key={i} card="hidden" size="sm" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
