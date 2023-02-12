import { collection, documentId, getDocs, query, where } from "firebase/firestore";
import { useAtomValue } from "jotai";
import { ReactElement, useEffect, useState } from "react";
import { Card, cardById } from "~/app/douno/cards";
import { GameAction, GameConfig, GameState } from "~/app/douno/game";
import {
  canAct,
  canDraw,
  canPass,
  canPlayCards,
  canPlayOn,
  canPlayWith,
  isGameFinished,
} from "~/app/douno/game/readers";
import { log } from "~/lib/logger";
import { firebaseAtom } from "../_store/firebase";
import { userAtom } from "../_store/session";
import { useSyncedGame } from "./useSyncedGame";

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

export function ProtoRoomPage(): ReactElement {
  const user = useAtomValue(userAtom);
  const [synced, ops] = useSyncedGame();

  if (synced.status === "unsynced" || synced.status === "nogame") {
    return (
      <div>
        <div>no game</div>
        <button onClick={ops.startGame}>Start Game</button>
      </div>
    );
  }
  if (synced.status === "invalid") {
    return (
      <div>
        <div>unexpected game state</div>
        <div>{synced.error}</div>
      </div>
    );
  }
  return (
    <div style={{ backgroundColor: "#eee" }}>
      <h1>proto room page</h1>
      <GameStateView
        gameConfig={synced.config}
        gameState={synced.snapshot.state}
        stateSyncFinished={synced.syncFinished}
        update={(action) => ops.updateAndSync(user.uid, synced, action)}
      />
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
