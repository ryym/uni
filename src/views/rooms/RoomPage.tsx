import { useAtomValue } from "jotai";
import { ReactElement } from "react";
import { sessionAtom } from "../_store/session";
import { GameView } from "./GameView";

export type RoomPageProps = {
  readonly params: {
    readonly roomId: string;
  };
};

export function RoomPage(props: RoomPageProps): ReactElement | null {
  const session = useAtomValue(sessionAtom);
  if (!session.signedIn) {
    return null;
  }
  return (
    <div>
      <h2>Room {props.params.roomId}</h2>
      <GameView />
    </div>
  );
}
