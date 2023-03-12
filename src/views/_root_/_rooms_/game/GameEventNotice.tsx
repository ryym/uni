import { ReactElement, ReactNode } from "react";
import { cardById } from "~/app/uni/cards";
import { GameUpdate } from "~shared/game";
import { CardView } from "./CardView";
import styles from "./styles/GameEventNotice.module.css";

export type GameEventNoticeProps = {
  readonly event: GameUpdate;
  readonly playerName: (uid: string) => string;
};

export function GameEventNotice(props: GameEventNoticeProps): ReactElement | null {
  switch (props.event.action.type) {
    case "Start": {
      return null;
    }
    case "Play": {
      return (
        <GameEventLayout {...props}>
          <div>Play</div>
          <div className={styles.playedCards}>
            {props.event.action.cardIds.map((id) => (
              <CardView key={id} size="sm" card={cardById(id)} floating />
            ))}
          </div>
        </GameEventLayout>
      );
    }
    case "Draw": {
      return (
        <GameEventLayout {...props}>
          <div>Draw</div>
        </GameEventLayout>
      );
    }
    case "Pass": {
      return (
        <GameEventLayout {...props}>
          <div>Pass</div>
        </GameEventLayout>
      );
    }
  }
}

function GameEventLayout(props: GameEventNoticeProps & { readonly children: ReactNode }) {
  return (
    <div className={styles.root}>
      <div className={styles.actor}>{props.playerName(props.event.playerUid)}</div>
      <div className={styles.detail}>{props.children}</div>
    </div>
  );
}
