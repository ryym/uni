import {
  CollectionReference,
  DocumentReference,
  Firestore,
  collection,
  doc,
  updateDoc as originalUpdateDoc,
} from "firebase/firestore";
import { GameConfig, GameSnapshot } from "~shared/game";

export const updateDoc = <T>(ref: DocumentReference<T>, data: T): Promise<void> => {
  // XXX: https://github.com/googleapis/nodejs-firestore/issues/1745
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return originalUpdateDoc(ref, data as any);
};

export const gameSnapDocRef = (db: Firestore): DocumentReference<GameSnapshot> => {
  return doc(db, "games/poc/snapshots/current") as DocumentReference<GameSnapshot>;
};

export const gameConfigDocRef = (db: Firestore): DocumentReference<GameConfig> => {
  return doc(db, "games/poc") as DocumentReference<GameConfig>;
};

export type HiddenCardInfo = {
  readonly cardId: string;
};

export const cardCollectionRef = (db: Firestore): CollectionReference<HiddenCardInfo> => {
  return collection(db, "games/poc/cards") as CollectionReference<HiddenCardInfo>;
};
