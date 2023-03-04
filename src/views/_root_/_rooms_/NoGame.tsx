import { useAtomValue } from "jotai";
import { Fragment, ReactElement } from "react";
import { userAtom } from "~/views/store/session";
import { RoomState } from "~shared/room";
import styles from "./styles/NoGame.module.css";

export type NoGameProps = {
  readonly room: RoomState;
  readonly onStartGame: () => unknown;
};

export function NoGame(props: NoGameProps): ReactElement {
  const user = useAtomValue(userAtom);
  return (
    <div className={styles.root}>
      <div>
        <p>ゲームはまだ始まっていません。</p>
        <button onClick={props.onStartGame}>ゲームを始める</button>
      </div>
      <div>
        <div className={styles.head}>メンバー</div>
        <div className={styles.members}>
          {Object.entries(props.room.members).map(([uid, m]) => {
            const isOwner = uid === props.room.ownerUid;
            return (
              <Fragment key={uid}>
                <div className={`${styles.memberType} ${isOwner ? styles.isOwner : ""}`}>
                  {isOwner ? "オーナー" : "メンバー"}
                </div>
                <div>
                  {m.name}
                  <span className={styles.isYou}>{uid === user.uid ? "(You)" : ""}</span>
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
