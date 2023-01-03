import { useAtomValue } from "jotai";
import { ReactElement } from "react";
import { userAtom } from "../_store/session";
import { useProtoGameState } from "./_store/protogameState";

export function ProtoRoomPage(): ReactElement {
  const user = useAtomValue(userAtom);
  const isUser2 = user.uid[0] === "H";
  const [gameState, dispatch] = useProtoGameState(user.uid, !isUser2);

  return (
    <div>
      <h1>proto room page</h1>
      <h2>game state:</h2>
      <div>{JSON.stringify(gameState)}</div>
      <hr />

      <button
        onClick={() => {
          dispatch({
            type: "Init",
            playerUid: user.uid,
            deck: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
          });
        }}
      >
        init
      </button>
      <button
        onClick={() => {
          dispatch({
            type: "Draw",
            playerUid: user.uid,
            numOfCards: isUser2 ? 2 : 1,
          });
        }}
      >
        draw
      </button>
    </div>
  );
}
