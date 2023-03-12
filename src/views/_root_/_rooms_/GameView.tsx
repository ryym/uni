import { useAtomValue } from "jotai";
import { ReactElement } from "react";
import { userAtom } from "~/views/store/session";
import { RoomState } from "~shared/room";
import { NoGameRoom } from "./NoGameRoom";
import { InvalidGame } from "./game/InvalidGame";
import { OngoingGame } from "./game/OngoingGame";
import { useHandCardMap } from "./useHandCardMap";
import { useSyncedGame } from "./useSyncedGame";

export type GameViewProps = {
  readonly room: RoomState;
};

export function GameView(props: GameViewProps): ReactElement {
  const user = useAtomValue(userAtom);
  const [game, ops] = useSyncedGame();
  const handCardMap = useHandCardMap(user.uid, game);

  switch (game.status) {
    case "unsynced": {
      return <div>connecting...</div>;
    }
    case "nogame": {
      return <NoGameRoom room={props.room} onStartGame={ops.startGame} />;
    }
    case "invalid": {
      return <InvalidGame message={game.error} />;
    }
    case "valid": {
      return (
        <OngoingGame
          user={user}
          memberMap={props.room.members}
          gameConfig={game.config}
          gameState={game.snapshot.state}
          handCardMap={handCardMap}
          runAction={(action) => ops.updateAndSync(user.uid, game, action)}
        />
      );
    }
  }
}
