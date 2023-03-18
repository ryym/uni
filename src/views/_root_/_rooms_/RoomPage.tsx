import { ReactElement } from "react";
import { InitAtoms } from "~/views/lib/InitAtoms";
import { Entrance } from "./Entrance";
import { GameView } from "./GameView";
import { roomConfigAtomInitializers } from "./store/room";
import styles from "./styles/RoomPage.module.css";
import { useRoomSync } from "./useRoomSync";

export type RoomPageProps = {
  readonly params: {
    readonly roomId: string;
  };
};

export function RoomPage(props: RoomPageProps): ReactElement {
  return (
    <div className={styles.root}>
      <RoomPageBody key={props.params.roomId} params={props.params} />
    </div>
  );
}

function RoomPageBody(props: RoomPageProps): ReactElement {
  const [room, joinRoom] = useRoomSync(props.params.roomId);
  switch (room.status) {
    case "unsynced": {
      return <Entrance joinRoom={joinRoom} joining={room.syncing} />;
    }
    case "synced": {
      return (
        <InitAtoms initialValues={roomConfigAtomInitializers(room.config)}>
          <GameView room={room.state} />
        </InitAtoms>
      );
    }
  }
}
