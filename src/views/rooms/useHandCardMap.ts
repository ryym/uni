import { Firestore, documentId, getDocs, query, where } from "firebase/firestore";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { cardById } from "~/app/douno/cards";
import { SyncedGameSnapshot } from "~/app/douno/game/sync";
import { cardCollectionRef } from "~/backend/db";
import { log } from "~/lib/logger";
import { firebaseAtom } from "../_store/firebase";
import { Card } from "~shared/cards";

export type HandCardMap = {
  readonly [hash: string]: HandCardState;
};

export type HandCardState =
  | {
      readonly type: "fetching";
    }
  | {
      readonly type: "got";
      readonly card: Card;
    };

export const useHandCardMap = (userUid: string, game: SyncedGameSnapshot): HandCardMap => {
  const { db } = useAtomValue(firebaseAtom);
  const [handCardMap, setHandCardMap] = useState<HandCardMap>({});

  useEffect(() => {
    if (!(game.status === "valid" && game.syncFinished)) {
      return;
    }

    const handCardHashes = game.snapshot.state.playerMap[userUid].hand;
    const newCardHashes = handCardHashes.filter((h) => handCardMap[h] == null);
    if (newCardHashes.length === 0) {
      return;
    }
    log.debug("new card hashes", newCardHashes);

    setHandCardMap((cur) => {
      const m = { ...cur };
      newCardHashes.forEach((h) => {
        m[h] = { type: "fetching" };
      });
      return m;
    });

    openCards(db, newCardHashes).then((hashAndIds) => {
      log.debug("new cards got", hashAndIds);
      setHandCardMap((cur) => {
        const m = { ...cur };
        hashAndIds.forEach(([hash, cardId]) => {
          m[hash] = { type: "got", card: cardById(cardId) };
        });
        return m;
      });
    });
  }, [userUid, db, game, handCardMap]);

  return handCardMap;
};

const openCards = async (db: Firestore, cardHashes: readonly string[]) => {
  const q = query(cardCollectionRef(db), where(documentId(), "in", cardHashes));
  const result = await getDocs(q);
  return result.docs.map((d) => {
    const cardHash = d.id;
    return [cardHash, d.data().cardId] as const;
  });
};
