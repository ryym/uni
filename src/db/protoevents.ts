import { Database, onChildAdded, orderByKey, query, ref, set, startAfter } from "firebase/database";
import { Unsubscribe } from "~/app/models";
import { log } from "~/lib/logger";

export type SubscribeProtoEventsParams = {
  readonly roomId: string;
  readonly onEvent: (seq: number, event: unknown) => void;
};

export const subscribeProtoEvents = (
  db: Database,
  params: SubscribeProtoEventsParams,
): Unsubscribe => {
  const eventsRef = ref(db, `protoevents/${params.roomId}`);
  const q = query(eventsRef, orderByKey(), startAfter("000"));
  return onChildAdded(q, (snapshot) => {
    log.debug("protoevent", snapshot.key, snapshot.val());
    const seq = Number(snapshot.key);
    if (Number.isNaN(seq)) {
      throw new Error(`invalid event seq: ${snapshot.key}`);
    }
    params.onEvent(seq, snapshot.val());
  });
};

export type DispatchProtoEventParams = {
  readonly roomId: string;
  readonly seq: number;
  readonly event: unknown;
};

export const dispatchProtoEvent = async (
  db: Database,
  params: DispatchProtoEventParams,
): Promise<void> => {
  const seqKey = params.seq.toString().padStart(3, "0");
  const eventRef = ref(db, `protoevents/${params.roomId}/${seqKey}`);
  await set(eventRef, params.event);
};
