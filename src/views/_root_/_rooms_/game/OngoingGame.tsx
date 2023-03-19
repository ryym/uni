import { ReactElement, useEffect, useMemo, useState } from "react";
import { User } from "~/app/models";
import { cardById } from "~/app/uni/cards";
import { GameAction, GameConfig, GameState, HandCardMap } from "~/app/uni/game";
import { countCardsInDeck, countCardsInHands } from "~/app/uni/game/readers";
import { RoomMemberMap } from "~shared/room";
import { Deck } from "./Deck";
import { DiscardPile } from "./DiscardPile";
import { GameEventNotice } from "./GameEventNotice";
import { MyHand } from "./MyHand";
import { Player, PlayerList } from "./PlayerList";
import styles from "./styles/OngoingGame.module.css";

export type OngoingGameProps = {
  readonly user: User;
  readonly memberMap: RoomMemberMap;
  readonly gameConfig: GameConfig;
  readonly gameState: GameState;
  readonly handCardMap: HandCardMap;
  readonly runAction: (action: GameAction) => void;
};

type GameEvent = {
  readonly key: number;
  readonly lastUpdate: GameState["lastUpdate"];
};

export function OngoingGame(props: OngoingGameProps): ReactElement {
  const [gameEvent, setGameEvent] = useState<GameEvent>({
    // Show the notice on initial render only if the game is initial state.
    key: props.gameState.lastUpdate != null ? 0 : 1,
    lastUpdate: props.gameState.lastUpdate,
  });
  if (gameEvent.lastUpdate !== props.gameState.lastUpdate) {
    setGameEvent({ key: gameEvent.key + 1, lastUpdate: props.gameState.lastUpdate });
  }

  // Update the game state with delay to let players see the game event notice first.
  const [gameState, setDelayedGameState] = useState<GameState>(props.gameState);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDelayedGameState(props.gameState);
    }, 800);
    return () => clearTimeout(timer);
  }, [props.gameState]);

  const players: Player[] = useMemo(() => {
    return props.gameConfig.playerUids.map((uid) => ({
      uid,
      name: props.memberMap[uid].name,
      hand: gameState.playerMap[uid].hand,
    }));
  }, [props.gameConfig, gameState, props.memberMap]);

  const deckCardCount = countCardsInDeck(props.gameConfig, gameState);
  const handCardCount = countCardsInHands(gameState);
  const pileCardCount = props.gameConfig.deck.length - deckCardCount - handCardCount;

  const pileTopCards = useMemo(() => {
    return gameState.discardPile.topCardIds.map((id) => cardById(id));
  }, [gameState.discardPile.topCardIds]);

  return (
    <div className={styles.root}>
      <div className={styles.players}>
        <PlayerList
          userUid={props.user.uid}
          currentPlayerUid={gameState.currentPlayerUid}
          players={players}
        />
      </div>
      <div className={styles.table}>
        {gameEvent.key > 0 && (
          <div key={gameEvent.key} className={styles.event}>
            <GameEventNotice
              lastUpdate={gameEvent.lastUpdate}
              playerName={(uid) => props.memberMap[uid].name}
            />
          </div>
        )}

        <div className={styles.discardPile}>
          <DiscardPile
            cardCount={pileCardCount}
            topCards={pileTopCards}
            color={gameState.discardPile.color}
            attackTotal={gameState.discardPile.attackTotal}
          />
        </div>
        <div className={styles.deck}>
          <Deck cardCount={deckCardCount} />
        </div>
      </div>
      <div className={styles.myHand}>
        <MyHand
          user={props.user}
          gameConfig={props.gameConfig}
          gameState={gameState}
          handCardMap={props.handCardMap}
          runAction={props.runAction}
        />
      </div>
    </div>
  );
}
