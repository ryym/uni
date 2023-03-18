import { ReactElement } from "react";
import { cardById } from "~/app/uni/cards";
import { GameAction, GameUpdate } from "~shared/game";
import { CardView } from "./CardView";
import styles from "./styles/GameEventNotice.module.css";

export type GameEventNoticeProps = {
  readonly lastUpdate: GameUpdate | null;
  readonly playerName: (uid: string) => string;
};

export function GameEventNotice(props: GameEventNoticeProps): ReactElement | null {
  if (props.lastUpdate == null) {
    return (
      <div className={styles.root}>
        <div className={styles.detail}>Game Start!</div>
      </div>
    );
  }
  return (
    <div className={styles.root}>
      <div className={styles.actor}>{props.playerName(props.lastUpdate.playerUid)}</div>
      <div className={styles.detail}>
        <GameUpdateNotice action={props.lastUpdate.action} />
      </div>
    </div>
  );
}

function GameUpdateNotice(props: { readonly action: GameAction }) {
  switch (props.action.type) {
    case "Play": {
      return (
        <div className={styles.detail}>
          <div>Play</div>
          <div className={styles.playedCards}>
            {props.action.cardIds.map((id) => (
              <CardView key={id} size="sm" card={cardById(id)} floating />
            ))}
          </div>
        </div>
      );
    }
    case "Draw": {
      return <div>Draw</div>;
    }
    case "Pass": {
      return <div>Pass</div>;
    }
  }
}
