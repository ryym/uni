import {
  DocumentReference,
  Firestore,
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useAtomValue } from "jotai";
import { ReactElement, useEffect, useRef, useState } from "react";
import { Card, cardById } from "~/app/douno/cards";
import { GameAction, GameConfig, GameSnapshot, GameState, updateGameState } from "~/app/douno/game";
import {
  canAct,
  canDraw,
  canPass,
  canPlayCards,
  canPlayOn,
  canPlayWith,
  isGameFinished,
} from "~/app/douno/game/readers";
import { deepStrictEqual } from "~/lib/deepEqual";
import { log } from "~/lib/logger";
import { firebaseAtom } from "../_store/firebase";
import { userAtom } from "../_store/session";

type HandCardMap = {
  readonly [hash: string]: HandCardState;
};

type HandCardState =
  | {
      readonly type: "getting";
    }
  | {
      readonly type: "got";
      readonly card: Card;
    };

type SyncedGameSnapshot =
  | {
      readonly type: "unset";
    }
  | {
      readonly type: "valid";
      readonly snapshot: GameSnapshot;
      readonly syncFinished: boolean;
    }
  | {
      readonly type: "invalid";
      readonly errors: readonly string[];
    };

const gameSnapDocRef = (db: Firestore) => {
  return doc(db, "games/poc/snapshots/current") as DocumentReference<GameSnapshot>;
};
const gameConfigDocRef = (db: Firestore) => {
  return doc(db, "games/poc") as DocumentReference<GameConfig>;
};

export function ProtoRoomPage(): ReactElement {
  const { db, functions } = useAtomValue(firebaseAtom);
  const user = useAtomValue(userAtom);

  const gameConfigRef = useRef<GameConfig | null>(null);
  const [synced, setSynced] = useState<SyncedGameSnapshot>({ type: "unset" });

  useEffect(() => {
    return onSnapshot(gameSnapDocRef(db), { includeMetadataChanges: true }, async (d) => {
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
      setSynced((synced) => {
        return syncGameState(gameConfigRef.current, synced, snapshot, d.metadata.hasPendingWrites);
      });
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
    const handleStartGame = async () => {
      const initGame = httpsCallable(functions, "initGame", {});
      const result = await initGame();
      console.log("initGame result", result);
    };
    return (
      <div>
        <div>no game</div>
        <button onClick={handleStartGame}>Start Game</button>
      </div>
    );
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
          stateSyncFinished={synced.syncFinished}
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
  readonly stateSyncFinished: boolean;
  readonly update: (action: GameAction) => void;
}): ReactElement {
  const user = useAtomValue(userAtom);
  const { db } = useAtomValue(firebaseAtom);
  const [cardSelection, setCardSelection] = useState<readonly string[]>([]);

  const [handCardMap, setHandCardMap] = useState<HandCardMap>({});
  useEffect(() => {
    const handCardHashes = props.gameState.playerMap[user.uid].hand;
    const newCardHashes = handCardHashes.filter((h) => handCardMap[h] == null);
    log.debug("new card hashes", newCardHashes);
    if (newCardHashes.length > 0 && props.stateSyncFinished) {
      setHandCardMap((cur) => {
        const m = { ...cur };
        newCardHashes.forEach((h) => {
          m[h] = { type: "getting" };
        });
        return m;
      });
      const q = query(collection(db, "games/poc/cards"), where(documentId(), "in", newCardHashes));
      getDocs(q).then((r) => {
        const hashAndIds = r.docs.map((d) => [d.id, d.data().cardId as string]);
        log.debug("new cards got", hashAndIds);
        setHandCardMap((cur) => {
          const m = { ...cur };
          hashAndIds.forEach(([hash, cardId]) => {
            m[hash] = { type: "got", card: cardById(cardId) };
          });
          return m;
        });
      });
    }
  }, [props.gameState, props.stateSyncFinished, user, db, handCardMap]);

  const players: Player[] = props.gameConfig.playerUids.map((uid) => ({
    uid,
    wonAt: props.gameState.playerMap[uid].wonAt,
  }));
  const myState = props.gameState.playerMap[user.uid];
  const isMyTurn = canAct(props.gameConfig, props.gameState, user.uid);

  const canSelectCard = (card: Card): boolean => {
    if (cardSelection.length === 0) {
      return canPlayOn(props.gameState.discardPile, card);
    }
    return canPlayWith(cardById(cardSelection[0]), card);
  };

  const selectCard = (cardId: string) => {
    if (cardSelection.indexOf(cardId) === -1) {
      setCardSelection([...cardSelection, cardId]);
    }
  };

  const unselectCard = (cardId: string) => {
    // Just unselect the card if it is not the first one.
    if (cardSelection.length <= 1 || cardSelection.indexOf(cardId) !== 0) {
      setCardSelection(cardSelection.filter((id) => id !== cardId));
      return;
    }
    // Otherwise, validate whole selection using the second card.
    const second = cardById(cardSelection[1]);
    if (!canPlayOn(props.gameState.discardPile, second)) {
      setCardSelection([]);
      return;
    }
    const nextSelection = cardSelection.slice(1).filter((id) => {
      return id === cardSelection[1] || canPlayWith(second, cardById(id));
    });
    setCardSelection(nextSelection);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {isGameFinished(props.gameConfig, props.gameState) && (
        <div>
          <hr />
          <GameResultView gameState={props.gameState} players={players} />
          <hr />
        </div>
      )}
      <div>
        <div>turn: {props.gameState.turn}</div>
        <div>my turn?: {isMyTurn ? "yes" : "no"}</div>
        <div>won?: {myState.wonAt != null ? "yes" : "no"}</div>
        <div>deck top: {props.gameState.deckTopIdx}</div>
      </div>
      <div>
        <button
          disabled={!canDraw(props.gameConfig, props.gameState, user.uid)}
          onClick={() => {
            setCardSelection([]);
            props.update({ type: "Draw" });
          }}
        >
          Draw
        </button>
        <button
          disabled={
            !canPlayCards(props.gameConfig, props.gameState, user.uid, cardSelection.length)
          }
          onClick={() => {
            setCardSelection([]);
            const cardType = cardById(cardSelection[0]).type;
            let color: string | null = null;
            if (cardType === "Wild" || cardType === "Draw4") {
              color = window.prompt("color (Red | Blue | Green | Yellow)");
            }
            props.update({ type: "Play", cardIds: cardSelection, color });
          }}
        >
          Play
        </button>
        <button
          disabled={!canPass(props.gameConfig, props.gameState, user.uid)}
          onClick={() => {
            setCardSelection([]);
            props.update({ type: "Pass" });
          }}
        >
          Pass
        </button>
      </div>
      <div>
        <div>discard pile (color: {props.gameState.discardPile.color})</div>
        <div>top cards:</div>
        <ul>
          {props.gameState.discardPile.topCardIds.map((id) => (
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
            {uid === user.uid ? (
              isMyTurn ? (
                <ul>
                  {props.gameState.playerMap[uid]?.hand.map((cardHash) => {
                    const cardState = handCardMap[cardHash];
                    if (cardState == null || cardState.type === "getting") {
                      return <li key={cardHash}>???</li>;
                    }
                    const { card } = cardState;
                    const checked = cardSelection.includes(card.id);
                    return (
                      <li key={card.id}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!checked && !canSelectCard(card)}
                          onChange={(e) =>
                            e.target.checked ? selectCard(card.id) : unselectCard(card.id)
                          }
                        />
                        <CardView card={card} />
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <ul>
                  {props.gameState.playerMap[uid]?.hand.map((cardHash) => {
                    const cardState = handCardMap[cardHash];
                    return (
                      <li key={cardHash}>
                        {cardState?.type === "got" ? (
                          <CardView card={cardState.card} />
                        ) : (
                          <div>???</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )
            ) : (
              <ul>
                {props.gameState.playerMap[uid]?.hand.map((cardHash) => (
                  <li key={cardHash}>??? ({cardHash})</li>
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
    case "Reverse": {
      return <span style={{ color: props.card.color }}>Reverse</span>;
    }
    case "Skip": {
      return <span style={{ color: props.card.color }}>Skip</span>;
    }
    case "Draw2": {
      return <span style={{ color: props.card.color }}>Draw2</span>;
    }
    case "Wild": {
      return <span>Wild</span>;
    }
    case "Draw4": {
      return <span>Draw4</span>;
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
  hasPendingWrites: boolean,
): SyncedGameSnapshot => {
  const syncFinished = !hasPendingWrites;
  switch (lastSynced.type) {
    case "unset": {
      return { type: "valid", snapshot: remote, syncFinished };
    }
    case "invalid": {
      return lastSynced;
    }
    case "valid": {
      if (lastSynced.snapshot.state.turn === remote.state.turn) {
        return { ...lastSynced, syncFinished };
      }

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
      return { type: "valid", snapshot: remote, syncFinished };
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
