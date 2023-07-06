import { FormEvent, ReactElement, useState } from "react";
import { useLocation } from "wouter";
import styles from "./styles/HomePage.module.css";
import { useCreateRoom } from "./useCreateRoom";

export function HomePage(): ReactElement {
  const [, navigate] = useLocation();
  const createRoom = useCreateRoom();

  const [submitted, setSubmitted] = useState(false);
  const [masterPassword, setMasterPassword] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    const newRoom = await createRoom(masterPassword);
    navigate(`/rooms/${newRoom.id}`);
  };

  return (
    <div className={styles.root}>
      <section>
        <div className={styles.head}>合流する</div>
        <p>部屋のオーナーに URL を聞いてアクセスしてください。</p>
      </section>
      <section>
        <div className={styles.head}>部屋を作る</div>
        <form className={styles.newRoomForm} onSubmit={handleSubmit}>
          <label htmlFor="master-password">マスターパスワード</label>
          <input
            id="master-password"
            type="password"
            required
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
          />
          <button type="submit" disabled={submitted}>
            作成
          </button>
        </form>
        <p className={styles.limitNote}>
          ※ この Web アプリは限定されたユーザーにのみ公開されています。
        </p>
      </section>
    </div>
  );
}
