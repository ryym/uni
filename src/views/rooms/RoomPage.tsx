import { ReactElement } from "react";
import { InitAtoms } from "../_lib/InitAtoms";
import { Entrance } from "./Entrance";
import { RoomView } from "./RoomView";
import { roomAtomInitializers } from "./_store/room";
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
      return <Entrance joinRoom={joinRoom} joining={sync.joining} />;
    }
    case "synced": {
      return (
        <InitAtoms initialValues={roomAtomInitializers(sync.room)}>
          <RoomView room={sync.state} />
        </InitAtoms>
      );
    }
  }
}
