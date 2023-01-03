import { Database, get, ref, runTransaction } from "firebase/database";
import { ProtoGameState } from "~/app/protogame";

export type GameStateCache = {
  readonly eventSeq: number;
  readonly state: ProtoGameState | null;
};

export const storeProtoGameStateCache = async (
  db: Database,
  params: {
    readonly roomId: string;
    readonly state: ProtoGameState | null;
    readonly eventSeq: number;
  },
): Promise<void> => {
  const cacheRef = ref(db, `protogames/${params.roomId}/gameStateCache`);
  await runTransaction(cacheRef, (current) => {
    if (current?.eventSeq >= params.eventSeq) {
      return undefined; // Do nothing
    }
    return { eventSeq: params.eventSeq, state: params.state } satisfies GameStateCache;
  });
};

export const readProtoGameStateCache = async (
  db: Database,
  params: {
    readonly roomId: string;
  },
): Promise<GameStateCache | null> => {
  const cacheRef = ref(db, `protogames/${params.roomId}/gameStateCache`);
  const snapshot = await get(cacheRef);
  return snapshot.val();
};
