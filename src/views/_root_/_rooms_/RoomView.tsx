import { ReactElement } from "react";
import { RoomState } from "~shared/room";
import { GameView } from "./GameView";

export type RoomViewProps = {
  readonly room: RoomState;
};

export function RoomView(props: RoomViewProps): ReactElement {
  return (
    <div>
      <h2>Room</h2>

      <p>members</p>
      <ul>
        {Object.entries(props.room.members).map(([uid, m]) => (
          <div key={uid}>
            {m.name}
            {uid === props.room.ownerUid ? " [owner]" : ""} ({uid})
          </div>
        ))}
      </ul>
      <hr />

      <GameView />
    </div>
  );
}
