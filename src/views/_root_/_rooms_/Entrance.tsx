import { ReactElement, useState } from "react";
import { globalStyles } from "~/globalStyles";
import styles from "./styles/Entrance.module.css";

export type EntranceProps = {
  readonly joinRoom: (userName: string) => unknown;
  readonly joining: boolean;
};

export function Entrance(props: EntranceProps): ReactElement {
  const [userName, setUserName] = useState("");
  return (
    <div className={styles.root}>
      <form
        className={styles.memberForm}
        onSubmit={(e) => {
          e.preventDefault();
          props.joinRoom(userName);
        }}
      >
        <label htmlFor="username">ユーザー名</label>
        <input
          id="username"
          type="text"
          disabled={props.joining}
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
        <button type="submit" className={globalStyles.btn} disabled={props.joining}>
          {props.joining ? "入室中..." : "入室"}
        </button>
      </form>
    </div>
  );
}
