import {
  DocumentReference,
  Firestore,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { useAtomValue } from "jotai";
import { ReactElement, useEffect, useRef, useState } from "react";
import { GameAction, GameConfig, GameState, updateGameState } from "~/app/douno/game";
import { deepStrictEqual } from "~/lib/deepEqual";
import { log } from "~/lib/logger";
import { firebaseAtom } from "../_store/firebase";
import { userAtom } from "../_store/session";

type GameSnapshot = {
  readonly state: GameState;
  readonly lastAction: GameAction;
};

type SyncedGameState =
  | {
      readonly type: "unset";
    }
  | {
      readonly type: "valid";
      readonly gameState: GameState;
    }
  | {
      readonly type: "invalid";
      readonly errors: readonly string[];
    };

const gameSnapDocRef = (db: Firestore) => {
  return doc(db, "games/poc/states/current") as DocumentReference<GameSnapshot>;
};
const gameConfigDocRef = (db: Firestore) => {
  return doc(db, "games/poc") as DocumentReference<GameConfig>;
};

export function ProtoRoomPage(): ReactElement {
  const { db } = useAtomValue(firebaseAtom);
  const user = useAtomValue(userAtom);

  const gameConfigRef = useRef<GameConfig | null>(null);
  const [synced, setSynced] = useState<SyncedGameState>({ type: "unset" });

  useEffect(() => {
    return onSnapshot(gameSnapDocRef(db), async (d) => {
      const snapshot = d.data();
      if (snapshot == null) {
        return;
      }
      if (gameConfigRef.current == null) {
        log.debug("fetching game config");
        const config = (await getDoc(gameConfigDocRef(db))).data();
        if (config == null) {
          throw new Error("[douno] game state exists without game config");
        }
        gameConfigRef.current = config;
      }
      log.debug("game snapshot broadcasted", snapshot);
      setSynced((current) => syncGameState(gameConfigRef.current, current, snapshot));
    });
  }, [db]);

  const publishNextGameState = (action: GameAction) => {
    if (synced.type !== "valid" || synced.gameState.currentPlayerUid !== user.uid) {
      return;
    }
    const result = updateGameStateIfPossible(gameConfigRef.current, synced.gameState, action);
    log.debug("updated game state locally", result);
    if (result.ok) {
      updateDoc(gameSnapDocRef(db), { state: result.state, lastAction: action });
    } else {
      setSynced({ type: "invalid", errors: result.errors });
    }
  };

  if (synced.type === "unset") {
    return <div>no game</div>;
  }
  if (synced.type === "invalid") {
    return (
      <div>
        <div>unexpected game state</div>
        <div>{JSON.stringify(synced.errors)}</div>
      </div>
    );
  }
  return (
    <div>
      <h1>proto room page</h1>
      {gameConfigRef.current == null ? null : (
        <GameStateView
          gameConfig={gameConfigRef.current}
          gameState={synced.gameState}
          update={publishNextGameState}
        />
      )}
    </div>
  );
}

function GameStateView(props: {
  readonly gameConfig: GameConfig;
  readonly gameState: GameState;
  readonly update: (action: GameAction) => void;
}): ReactElement {
  const user = useAtomValue(userAtom);
  const canPlay = user.uid === props.gameState.currentPlayerUid;
  const myHand = props.gameState.hands[user.uid];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <div>my turn?: {canPlay ? "yes" : "no"}</div>
        <div>deck top: {props.gameState.deckTopIdx}</div>
      </div>
      <div>
        <div>discard pile (color: {props.gameState.discardPile.color})</div>
        <div>
          top cards:{" "}
          {props.gameState.discardPile.topCards.map((i) => props.gameConfig.deck[i]).join(", ")}
        </div>
      </div>
      <div>
        {props.gameConfig.playerUids.map((uid) => (
          <div key={uid}>
            <div>hand of {uid}</div>
            <ul>
              {props.gameState.hands[uid]?.map((cardIdx) => (
                <li key={cardIdx}>{props.gameConfig.deck[cardIdx]}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div>
        <button disabled={!canPlay} onClick={() => props.update({ type: "Draw" })}>
          Draw 1
        </button>
        <button
          disabled={!canPlay}
          onClick={() => props.update({ type: "Play", cardIdx: myHand[0] })}
        >
          Play 1
        </button>
      </div>
    </div>
  );
}

const syncGameState = (
  config: GameConfig | null,
  current: SyncedGameState,
  remote: GameSnapshot,
): SyncedGameState => {
  switch (current.type) {
    case "unset": {
      return { type: "valid", gameState: remote.state };
    }
    case "invalid": {
      return current;
    }
    case "valid": {
      const result = updateGameStateIfPossible(config, current.gameState, remote.lastAction);
      if (!result.ok) {
        return { type: "invalid", errors: result.errors };
      }
      if (!deepStrictEqual(result.state, remote.state)) {
        log.debug("local and remote state mismatch", result.state, remote.state);
        return {
          type: "invalid",
          errors: [
            "予期しないゲーム状態になりました。リロードしても直らない場合はゲームを中断してください。",
          ],
        };
      }
      return { type: "valid", gameState: result.state };
    }
  }
};

const updateGameStateIfPossible = (
  config: GameConfig | null,
  state: GameState,
  action: GameAction,
): ReturnType<typeof updateGameState> => {
  if (config == null) {
    throw new Error("[douno] cannot update game state if game config is null");
  }
  return updateGameState(config, state, action);
};
