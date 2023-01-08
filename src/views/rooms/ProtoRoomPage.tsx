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
  return (
    <div>
      <h1>proto room page</h1>
      <h2>game state:</h2>
      {synced.type === "invalid" ? (
        <div>
          <div>unexpected game state</div>
          <div>{JSON.stringify(synced.errors)}</div>
        </div>
      ) : (
        <GameStateView gameState={synced.gameState} update={publishNextGameState} />
      )}
    </div>
  );
}

function GameStateView(props: {
  readonly gameState: GameState;
  readonly update: (action: GameAction) => void;
}): ReactElement {
  const user = useAtomValue(userAtom);
  const canPlay = user.uid === props.gameState.currentPlayerUid;
  return (
    <div>
      <div>game in progress</div>
      <div>my turn?: {canPlay ? "yes" : "no"}</div>
      <div>
        <pre>{JSON.stringify(props.gameState, null, 2)}</pre>
      </div>
      <hr />
      <button disabled={!canPlay} onClick={() => props.update({ type: "Draw" })}>
        Draw 1
      </button>
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
      if (result.ok) {
        // TODO: Compare state and remote.state to verify remote.state is valid.
        return { type: "valid", gameState: result.state };
      } else {
        return { type: "invalid", errors: result.errors };
      }
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
