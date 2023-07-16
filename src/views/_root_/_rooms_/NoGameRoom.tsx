import { useAtomValue } from "jotai";
import { Fragment, ReactElement, useState } from "react";
import { globalStyles } from "~/globalStyles";
import { userAtom } from "~/views/store/session";
import { RoomState } from "~shared/room";
import styles from "./styles/NoGameRoom.module.css";

export type NoGameRoomProps = {
  readonly room: RoomState;
  readonly onStartGame: () => unknown;
};

export function NoGameRoom(props: NoGameRoomProps): ReactElement {
  const user = useAtomValue(userAtom);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const onStartGame = () => {
    setIsGameStarted(true);
    props.onStartGame();
  };
  return (
    <div className={styles.root}>
      <div>
        <p>ゲームはまだ始まっていません。</p>
        <button className={globalStyles.btn} onClick={onStartGame} disabled={isGameStarted}>
          ゲームを始める
        </button>
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
