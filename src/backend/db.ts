import {
  CollectionReference,
  DocumentReference,
  Firestore,
  Transaction,
  collection,
  doc,
  updateDoc as originalUpdateDoc,
} from "firebase/firestore";
import { GameConfig, GameSnapshot } from "~shared/game";
import { RoomState } from "~shared/room";

export const updateDoc = async <T>(
  tx: Transaction | null,
  ref: DocumentReference<T>,
  data: Partial<T>,
): Promise<void> => {
  // XXX: https://github.com/googleapis/nodejs-firestore/issues/1745
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const untypedData = data as any;

  if (tx != null) {
    tx.update(ref, untypedData);
  } else {
    await originalUpdateDoc(ref, untypedData);
  }
};

export type RoomCreatorForm = {
  readonly password: string;
  readonly registeredAt: number;
};

export const roomCreatorDocRef = (
  db: Firestore,
  uid: string,
): DocumentReference<RoomCreatorForm> => {
  return doc(db, `creators/${uid}`) as DocumentReference<RoomCreatorForm>;
};

export const roomCollectionRef = (db: Firestore): CollectionReference<RoomState> => {
  return collection(db, "rooms") as CollectionReference<RoomState>;
};

export const roomDocRef = (db: Firestore, roomId: string): DocumentReference<RoomState> => {
  return doc(db, `rooms/${roomId}`) as DocumentReference<RoomState>;
};

export const gameSnapDocRef = (db: Firestore, roomId: string): DocumentReference<GameSnapshot> => {
  return doc(db, `games/${roomId}/snapshots/current`) as DocumentReference<GameSnapshot>;
};

export const gameConfigDocRef = (db: Firestore, roomId: string): DocumentReference<GameConfig> => {
  return doc(db, `games/${roomId}`) as DocumentReference<GameConfig>;
};

export type HiddenCardInfo = {
  readonly cardId: string;
};

export const cardCollectionRef = (
  db: Firestore,
  roomId: string,
): CollectionReference<HiddenCardInfo> => {
  return collection(db, `games/${roomId}/cards`) as CollectionReference<HiddenCardInfo>;
};
