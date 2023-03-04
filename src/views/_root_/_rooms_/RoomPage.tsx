import { ReactElement } from "react";
import { InitAtoms } from "~/views/lib/InitAtoms";
import { Entrance } from "./Entrance";
import { GameView } from "./GameView";
import { roomAtomInitializers } from "./store/room";
import { useSyncedRoom } from "./useSyncedRoom";

export type RoomPageProps = {
  readonly params: {
    readonly roomId: string;
  };
};

export function RoomPage(props: RoomPageProps): ReactElement {
  return <RoomPageBody key={props.params.roomId} params={props.params} />;
}

function RoomPageBody(props: RoomPageProps): ReactElement {
  const [sync, joinRoom] = useSyncedRoom(props.params.roomId);
  switch (sync.status) {
    case "unsynced": {
      return <Entrance joinRoom={joinRoom} joining={sync.syncing} />;
    }
    case "synced": {
      return (
        <InitAtoms initialValues={roomAtomInitializers(sync.room)}>
          <GameView room={sync.state} />
        </InitAtoms>
      );
    }
  }
}
