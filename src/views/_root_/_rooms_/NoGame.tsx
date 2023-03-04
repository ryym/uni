import { ReactElement } from "react";
import { RoomState } from "~shared/room";

export type NoGameProps = {
  readonly room: RoomState;
  readonly onStartGame: () => unknown;
};

export function NoGame(props: NoGameProps): ReactElement {
  return (
    <div>
      <div>no game</div>
      <button onClick={props.onStartGame}>Start Game</button>
      <hr />
      <div>members</div>
      <div>
        {Object.values(props.room.members)
          .map((m) => m.name)
          .join(", ")}
      </div>
    </div>
  );
}
