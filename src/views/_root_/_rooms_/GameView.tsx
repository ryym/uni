import { useAtomValue } from "jotai";
import { ReactElement } from "react";
import { userAtom } from "~/views/store/session";
import { InvalidGame } from "./InvalidGame";
import { NoGame } from "./NoGame";
import { OngoingGame } from "./OngoingGame";
import { useHandCardMap } from "./useHandCardMap";
import { useSyncedGame } from "./useSyncedGame";

export function GameView(): ReactElement {
  const user = useAtomValue(userAtom);
  const [game, ops] = useSyncedGame();
  const handCardMap = useHandCardMap(user.uid, game);

  switch (game.status) {
    case "unsynced": {
      return <div>connecting...</div>;
    }
    case "nogame": {
      return <NoGame onStartGame={ops.startGame} />;
    }
    case "invalid": {
      return <InvalidGame message={game.error} />;
    }
    case "valid": {
      return (
        <OngoingGame
          user={user}
          gameConfig={game.config}
          gameState={game.snapshot.state}
          update={(action) => ops.updateAndSync(user.uid, game, action)}
          handCardMap={handCardMap}
        />
      );
    }
  }
}
