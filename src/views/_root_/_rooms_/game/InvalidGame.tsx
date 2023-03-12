import { ReactElement } from "react";
import styles from "./styles/InvalidGame.module.css";

export type InvalidGameProps = {
  readonly message: string;
};

export function InvalidGame(props: InvalidGameProps): ReactElement {
  return (
    <div className={styles.root}>
      <div>ERROR: 予期しないゲーム状態になりました</div>
      <div>{props.message}</div>
    </div>
  );
}
