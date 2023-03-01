import { ReactElement, useState } from "react";
import { User } from "~/app/models";
import { cardById } from "~/app/uni/cards";
import {
  canAct,
  canDraw,
  canPass,
  canPlayCards,
  canPlayOn,
  canPlayWith,
  isGameFinished,
} from "~/app/uni/game/readers";
import { CardView } from "./CardView";
import { HandCardMap } from "./useHandCardMap";
import { Card } from "~shared/cards";
import { GameAction, GameConfig, GameState } from "~shared/game";

type Player = {
  readonly uid: string;
  readonly wonAt: number | null;
};

export type OngoingGameProps = {
  readonly user: User;
  readonly gameConfig: GameConfig;
  readonly gameState: GameState;
  readonly handCardMap: HandCardMap;
  readonly update: (action: GameAction) => void;
};

export function OngoingGame(props: OngoingGameProps): ReactElement {
  const [cardSelection, setCardSelection] = useState<readonly string[]>([]);

  const players: Player[] = props.gameConfig.playerUids.map((uid) => ({
    uid,
    wonAt: props.gameState.playerMap[uid].wonAt,
  }));
  const myState = props.gameState.playerMap[props.user.uid];
  const isMyTurn = canAct(props.gameConfig, props.gameState, props.user.uid);

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
          disabled={!canDraw(props.gameConfig, props.gameState, props.user.uid)}
          onClick={() => {
            setCardSelection([]);
            props.update({ type: "Draw" });
          }}
        >
          Draw
        </button>
        <button
          disabled={
            !canPlayCards(props.gameConfig, props.gameState, props.user.uid, cardSelection.length)
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
          disabled={!canPass(props.gameConfig, props.gameState, props.user.uid)}
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
              {uid === props.user.uid ? " (YOU)" : ""}
            </div>
            {uid === props.user.uid ? (
              isMyTurn ? (
                <ul>
                  {props.gameState.playerMap[uid]?.hand.map((cardHash) => {
                    const cardState = props.handCardMap[cardHash];
                    if (cardState == null || cardState.type === "fetching") {
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
                    const cardState = props.handCardMap[cardHash];
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
