import { ReactElement, useState } from "react";
import { globalStyles } from "~/globalStyles";
import styles from "./styles/InvalidGame.module.css";

export type InvalidGameProps = {
  readonly message: string;
  readonly cancelGame: () => unknown;
};

export function InvalidGame(props: InvalidGameProps): ReactElement {
  const [gameCancelled, setGameCancelled] = useState(false);
  const onCancelGame = () => {
    setGameCancelled(true);
    props.cancelGame();
  };
  return (
    <div className={styles.root}>
      <div>ERROR: 予期しないゲーム状態になりました</div>
      <div>internal error: {props.message}</div>
      <button
        className={`${globalStyles.btn} ${styles.cancelBtn}`}
        disabled={gameCancelled}
        onClick={onCancelGame}
      >
        Cancel Game
      </button>
    </div>
  );
}
