import { Fragment, ReactElement, useState } from "react";
import { User } from "~/app/models";
import { GameAction, GameConfig, GameState, HandCardMap } from "~/app/uni/game";
import {
  canAct,
  canDraw,
  canPass,
  canPlayCards,
  canPlayOn,
  canPlayWith,
} from "~/app/uni/game/readers";
import { Card } from "~shared/cards";
import { CardView } from "./CardView";
import styles from "./styles/MyHand.module.css";

export type MyHandProps = {
  readonly user: User;
  readonly gameConfig: GameConfig;
  readonly gameState: GameState;
  readonly handCardMap: HandCardMap;
  readonly runAction: (action: GameAction) => void;
};

export function MyHand(props: MyHandProps): ReactElement {
  const [selectedCards, setSelectedCards] = useState<readonly Card[]>([]);

  const isMyTurn = canAct(props.gameConfig, props.gameState, props.user.uid);
  const myCardHashes = props.gameState.playerMap[props.user.uid]?.hand || [];

  const playEnabled = canPlayCards(
    props.gameConfig,
    props.gameState,
    props.user.uid,
    selectedCards.length,
  );
  const drawEnabled = canDraw(props.gameConfig, props.gameState, props.user.uid);
  const passEnabled = canPass(props.gameConfig, props.gameState, props.user.uid);

  const canSelectCard = (card: Card): boolean => {
    if (!isMyTurn) {
      return false;
    }
    if (selectedCards.length === 0) {
      return canPlayOn(props.gameState.discardPile, card);
    }
    return canPlayWith(selectedCards[0], card);
  };

  const selectCard = (card: Card) => {
    if (selectedCards.indexOf(card) === -1) {
      setSelectedCards([...selectedCards, card]);
    }
  };

  const unselectCard = (card: Card) => {
    // Just unselect card if it is not the first one.
    if (selectedCards.length <= 1 || selectedCards.indexOf(card) !== 0) {
      setSelectedCards(selectedCards.filter((c) => c !== card));
      return;
    }
    // Otherwise, validate whole selection using the second card.
    const second = selectedCards[1];
    if (!canPlayOn(props.gameState.discardPile, second)) {
      setSelectedCards([]);
      return;
    }
    const nextSelection = selectedCards.slice(1).filter((c) => {
      return c === selectedCards[1] || canPlayWith(second, c);
    });
    setSelectedCards(nextSelection);
  };

  const renderCard = (cardHash: string) => {
    const cardState = props.handCardMap[cardHash];
    if (cardState?.type !== "got") {
      return <CardView key={cardHash} card="hidden" />;
    }
    const { card } = cardState;
    const checked = selectedCards.includes(card);
    const selectable = canSelectCard(card);
    return (
      <Fragment key={card.id}>
        <label
          className={`${styles.cardSelection} ${!selectable ? styles.cardUnselectable : ""}`}
          htmlFor={`my-hand-${card.id}`}
        >
          <CardView card={card} focused={checked} />
        </label>
        <input
          type="checkbox"
          id={`my-hand-${card.id}`}
          checked={checked}
          disabled={!checked && !selectable}
          onChange={(e) => (e.target.checked ? selectCard(card) : unselectCard(card))}
        />
      </Fragment>
    );
  };

  const onPlay = () => {
    if (selectedCards.length === 0) {
      return;
    }
    const cardIds = selectedCards.map((c) => c.id);
    const cardType = selectedCards[0].type;
    let color: string | null = null;
    if (cardType === "Wild" || cardType === "Draw4") {
      color = window.prompt("color (Red | Blue | Green | Yellow)");
    }
    setSelectedCards([]);
    props.runAction({ type: "Play", cardIds, color });
  };

  const onDraw = () => {
    setSelectedCards([]);
    props.runAction({ type: "Draw" });
  };

  const onPass = () => {
    setSelectedCards([]);
    props.runAction({ type: "Pass" });
  };

  return (
    <div className={styles.root}>
      <div className={`${styles.handHead} ${isMyTurn ? styles.isMyTurn : ""}`}>
        <span>手札</span>
        {selectedCards.length > 0 && (
          <div className={styles.selectedCards}>
            {selectedCards.map((c) => (
              <CardView key={c.id} card={c} size="sm" />
            ))}
          </div>
        )}
      </div>
      <div className={styles.cards}>{myCardHashes.map((cardHash) => renderCard(cardHash))}</div>
      <div className={styles.actions}>
        <button className={styles.actionButton} disabled={!playEnabled} onClick={onPlay}>
          出す
        </button>
        <button className={styles.actionButton} disabled={!drawEnabled} onClick={onDraw}>
          引く
        </button>
        <button className={styles.actionButton} disabled={!passEnabled} onClick={onPass}>
          パス
        </button>
      </div>
    </div>
  );
}
