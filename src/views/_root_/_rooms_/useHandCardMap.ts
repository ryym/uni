import { Firestore, documentId, getDocs, query, where } from "firebase/firestore";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { cardById } from "~/app/uni/cards";
import { HandCardMap } from "~/app/uni/game";
import { SyncedGameSnapshot } from "~/app/uni/game/sync";
import { cardCollectionRef } from "~/backend/db";
import { log } from "~/lib/logger";
import { firebaseAtom } from "~/views/store/firebase";
import { roomAtom } from "./store/room";

export const useHandCardMap = (userUid: string, game: SyncedGameSnapshot): HandCardMap => {
  const { db } = useAtomValue(firebaseAtom);
  const room = useAtomValue(roomAtom);

  const [handCardMap, setHandCardMap] = useState<HandCardMap>({});

  useEffect(() => {
    if (!(game.status === "valid" && game.syncFinished)) {
      return;
    }

    const handCardHashes = game.state.playerMap[userUid].hand;
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

    openCards(db, room.id, newCardHashes).then((hashAndIds) => {
      log.debug("new cards got", hashAndIds);
      setHandCardMap((cur) => {
        const m = { ...cur };
        hashAndIds.forEach(([hash, cardId]) => {
          m[hash] = { type: "got", card: cardById(cardId) };
        });
        return m;
      });
    });
  }, [userUid, db, room, game, handCardMap]);

  return handCardMap;
};

const openCards = async (db: Firestore, roomId: string, cardHashes: readonly string[]) => {
  const maxValueCount = 10; // A maximum number of elements supported by "in" filter.
  const hashGroups: string[][] = [];
  for (let i = 0; i < cardHashes.length; i += maxValueCount) {
    hashGroups.push(cardHashes.slice(i, i + maxValueCount));
  }

  const results = await Promise.all(
    hashGroups.map((hashes) => {
      const q = query(cardCollectionRef(db, roomId), where(documentId(), "in", hashes));
      return getDocs(q);
    }),
  );

  return results.flatMap((r) => {
    return r.docs.map((d) => {
      const cardHash = d.id;
      return [cardHash, d.data().cardId] as const;
    });
  });
};
