import { ReactElement, useMemo } from "react";
import { User } from "~/app/models";
import { cardById } from "~/app/uni/cards";
import { GameAction, GameConfig, GameState, HandCardMap } from "~/app/uni/game";
import { countCardsInDeck, countCardsInHands } from "~/app/uni/game/readers";
import { RoomMemberMap } from "~shared/room";
import { Deck } from "./Deck";
import { DiscardPile } from "./DiscardPile";
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

export function OngoingGame(props: OngoingGameProps): ReactElement {
  const players: Player[] = useMemo(() => {
    return props.gameConfig.playerUids.map((uid) => ({
      uid,
      name: props.memberMap[uid].name,
      hand: props.gameState.playerMap[uid].hand,
    }));
  }, [props.gameConfig, props.gameState, props.memberMap]);

  const deckCardCount = countCardsInDeck(props.gameConfig, props.gameState);
  const handCardCount = countCardsInHands(props.gameState);
  const pileCardCount = props.gameConfig.deck.length - deckCardCount - handCardCount;

  const pileTopCards = useMemo(() => {
    return props.gameState.discardPile.topCardIds.map((id) => cardById(id));
  }, [props.gameState.discardPile.topCardIds]);

  return (
    <div className={styles.root}>
      <div className={styles.players}>
        <PlayerList
          userUid={props.user.uid}
          currentPlayerUid={props.gameState.currentPlayerUid}
          players={players}
        />
      </div>
      <div className={styles.table}>
        <div className={styles.discardPile}>
          <DiscardPile cardCount={pileCardCount} topCards={pileTopCards} />
        </div>
        <div className={styles.deck}>
          <Deck cardCount={deckCardCount} />
        </div>
      </div>
      <div className={styles.myHand}>
        <MyHand
          user={props.user}
          gameConfig={props.gameConfig}
          gameState={props.gameState}
          handCardMap={props.handCardMap}
          runAction={props.runAction}
        />
      </div>
    </div>
  );
}
