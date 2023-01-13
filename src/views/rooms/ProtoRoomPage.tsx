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
import { Card, cardById } from "~/app/douno/cards";
import {
  GameAction,
  GameConfig,
  GameState,
  hasDrawnLastTime,
  updateGameState,
} from "~/app/douno/game";
import { deepStrictEqual } from "~/lib/deepEqual";
import { log } from "~/lib/logger";
import { firebaseAtom } from "../_store/firebase";
import { userAtom } from "../_store/session";

type GameSnapshot = {
  readonly state: GameState;
  readonly lastAction: GameAction;
};

type SyncedGameSnapshot =
  | {
      readonly type: "unset";
    }
  | {
      readonly type: "valid";
      readonly snapshot: GameSnapshot;
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
  const [synced, setSynced] = useState<SyncedGameSnapshot>({ type: "unset" });

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
      setSynced((synced) => syncGameState(gameConfigRef.current, synced, snapshot));
    });
  }, [db]);

  const publishNextGameState = (action: GameAction) => {
    if (synced.type !== "valid" || synced.snapshot.state.currentPlayerUid !== user.uid) {
      return;
    }
    const result = updateGameStateIfPossible(gameConfigRef.current, synced.snapshot, action);
    log.debug("updated game state locally", result);
    if (result.ok) {
      const updateData: GameSnapshot = { state: result.value, lastAction: action };
      // XXX: https://github.com/googleapis/nodejs-firestore/issues/1745
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateDoc(gameSnapDocRef(db), updateData as any);
    } else {
      setSynced({ type: "invalid", errors: [result.error] });
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
    <div style={{ backgroundColor: "#eee" }}>
      <h1>proto room page</h1>
      {gameConfigRef.current == null ? null : (
        <GameStateView
          gameConfig={gameConfigRef.current}
          gameState={synced.snapshot.state}
          update={publishNextGameState}
        />
      )}
    </div>
  );
}

type Player = {
  readonly uid: string;
  readonly wonAt: number | null;
};

function GameStateView(props: {
  readonly gameConfig: GameConfig;
  readonly gameState: GameState;
  readonly update: (action: GameAction) => void;
}): ReactElement {
  const user = useAtomValue(userAtom);
  const [cardSelection, setCardSelection] = useState<readonly number[]>([]);

  const players: Player[] = props.gameConfig.playerUids.map((uid) => ({
    uid,
    wonAt: props.gameState.playerMap[uid].wonAt,
  }));
  const myState = props.gameState.playerMap[user.uid];
  const gameFinished =
    props.gameConfig.playerUids.length === 1
      ? myState.wonAt != null
      : players.filter((s) => s.wonAt == null).length <= 1;
  const isMyTurn = user.uid === props.gameState.currentPlayerUid;
  const canPlay = !gameFinished && isMyTurn && myState.wonAt == null;
  const canDraw = isMyTurn && !hasDrawnLastTime(props.gameState, user.uid);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {gameFinished && (
        <div>
          <hr />
          <GameResultView gameState={props.gameState} players={players} />
          <hr />
        </div>
      )}
      <div>
        <div>turn: {props.gameState.turn}</div>
        <div>my turn?: {canPlay ? "yes" : "no"}</div>
        <div>won?: {myState.wonAt != null ? "yes" : "no"}</div>
        <div>
          <div>deck top: {props.gameState.deckTopIdx}</div>
          <CardView card={cardById(props.gameConfig.deck[props.gameState.deckTopIdx])} />
        </div>
      </div>
      <div>
        <button disabled={!canPlay || !canDraw} onClick={() => props.update({ type: "Draw" })}>
          Draw
        </button>
        <button
          disabled={!canPlay}
          onClick={() => {
            setCardSelection([]);
            props.update({ type: "Play", cardIndice: cardSelection });
          }}
        >
          Play
        </button>
        <button disabled={!canPlay} onClick={() => props.update({ type: "Pass" })}>
          Pass
        </button>
      </div>
      <div>
        <div>discard pile (color: {props.gameState.discardPile.color})</div>
        <div>top cards:</div>
        <ul>
          {props.gameState.discardPile.topCards.map((id) => (
            <li key={id}>
              <CardView card={cardById(id)} />
            </li>
          ))}
        </ul>
      </div>
      <div>
        {props.gameConfig.playerUids.map((uid) => (
          <div key={uid}>
            <div
              style={{
                fontWeight: uid === props.gameState.currentPlayerUid ? "bold" : "inherit",
              }}
            >
              hand of {uid}
              {uid === user.uid ? " (YOU)" : ""}
            </div>
            {uid === user.uid && canPlay ? (
              <ul>
                {props.gameState.playerMap[uid]?.hand.map((cardIdx) => (
                  <li key={cardIdx}>
                    <input
                      type="checkbox"
                      checked={cardSelection.includes(cardIdx)}
                      onChange={(e) =>
                        setCardSelection((is) =>
                          e.target.checked ? [...is, cardIdx] : is.filter((i) => i !== cardIdx),
                        )
                      }
                    />
                    <CardView card={cardById(props.gameConfig.deck[cardIdx])} />
                  </li>
                ))}
              </ul>
            ) : (
              <ul>
                {props.gameState.playerMap[uid]?.hand.map((cardIdx) => (
                  <li key={cardIdx}>
                    <CardView card={cardById(props.gameConfig.deck[cardIdx])} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CardView(props: { card: Card }): ReactElement {
  switch (props.card.type) {
    case "Number": {
      return <span style={{ color: props.card.color }}>Number {props.card.value}</span>;
    }
    case "Draw2": {
      return <span style={{ color: props.card.color }}>Draw2</span>;
    }
  }
}

function GameResultView(props: {
  readonly gameState: GameState;
  readonly players: readonly Player[];
}): ReactElement {
  const noWin = props.gameState.turn + 1;
  const players = [...props.players].sort((p1, p2) => {
    return (p1.wonAt ?? noWin) - (p2.wonAt ?? noWin);
  });
  return (
    <div>
      <h2>Result</h2>
      <ol>
        {players.map((p) => (
          <li key={p.uid}>
            {p.uid}: {p.wonAt != null ? `wonAt ${p.wonAt}` : "-"}
          </li>
        ))}
      </ol>
    </div>
  );
}

const syncGameState = (
  config: GameConfig | null,
  lastSynced: SyncedGameSnapshot,
  remote: GameSnapshot,
): SyncedGameSnapshot => {
  switch (lastSynced.type) {
    case "unset": {
      return { type: "valid", snapshot: remote };
    }
    case "invalid": {
      return lastSynced;
    }
    case "valid": {
      const result = updateGameStateIfPossible(config, lastSynced.snapshot, remote.lastAction);
      if (!result.ok) {
        return { type: "invalid", errors: [result.error] };
      }
      if (!deepStrictEqual(result.value, remote.state)) {
        log.debug("local and remote state mismatch", lastSynced.snapshot, remote, result.value);
        return {
          type: "invalid",
          errors: [
            "予期しないゲーム状態になりました。リロードしても直らない場合はゲームを中断してください。",
          ],
        };
      }
      return { type: "valid", snapshot: remote };
    }
  }
};

const updateGameStateIfPossible = (
  config: GameConfig | null,
  snapshot: GameSnapshot,
  action: GameAction,
): ReturnType<typeof updateGameState> => {
  if (config == null) {
    throw new Error("[douno] cannot update game state if game config is null");
  }
  return updateGameState(config, snapshot.state, action);
};
