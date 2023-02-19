import { ReactElement } from "react";
import { Entrance } from "./Entrance";
import { RoomView } from "./RoomView";
import { useSyncedRoom } from "./useSyncedRoom";

export type RoomPageProps = {
  readonly params: {
    readonly roomId: string;
  };
};

export function RoomPage(props: RoomPageProps): ReactElement {
  const [room, joinRoom] = useSyncedRoom(props.params.roomId);
  switch (room.status) {
    case "unsynced": {
      return <Entrance joinRoom={joinRoom} />;
    }
    case "synced": {
      return <RoomView roomId={props.params.roomId} room={room.state} />;
    }
  }
}
