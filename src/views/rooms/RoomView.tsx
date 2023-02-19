import { ReactElement } from "react";
import { GameView } from "./GameView";
import { RoomState } from "~shared/room";

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
