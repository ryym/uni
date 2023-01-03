import { useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";
import { ProtoGameAction, ProtoGameState, updateProtoGameState } from "~/app/protogame";
import { dispatchProtoEvent, subscribeProtoEvents } from "~/db/protoevents";
import { readProtoGameStateCache, storeProtoGameStateCache } from "~/db/protogames";
import { log } from "~/lib/logger";
import { firebaseAtom } from "~/views/_store/firebase";

export type EventState = {
  readonly currentSeq: number;
  readonly gameState: ProtoGameState;
};

export type UseProtoGameStateValue = readonly [
  state: ProtoGameState | null,
  dispatch: (action: ProtoGameAction) => void,
];

export const useProtoGameState = (uid: string, isOwner: boolean): UseProtoGameStateValue => {
  const firebase = useAtomValue(firebaseAtom);
  const seqRef = useRef<number | null>(null);
  const [stateRestored, setStateRestored] = useState(false);
  const [gameState, setGameState] = useState<ProtoGameState | null>(null);

  const dispatch = (action: ProtoGameAction) => {
    dispatchProtoEvent(firebase.db, {
      roomId: "dev",
      seq: (seqRef.current || 0) + 1,
      event: action,
    });
  };

  useEffect(() => {
    if (stateRestored) {
      return;
    }
    readProtoGameStateCache(firebase.db, { roomId: "dev" }).then((cache) => {
      if (cache != null) {
        seqRef.current = cache.eventSeq;
        setGameState(cache.state);
      }
      setStateRestored(true);
    });
  }, [stateRestored, firebase.db]);

  useEffect(() => {
    if (!stateRestored) {
      return;
    }

    const cacheGameState = debounce((eventSeq: number, state: ProtoGameState) => {
      log.debug("cache game state", eventSeq, state);
      storeProtoGameStateCache(firebase.db, { roomId: "dev", eventSeq, state });
    });

    return subscribeProtoEvents(firebase.db, {
      roomId: "dev",
      lastSeq: seqRef.current,
      onEvent: (seq, event) => {
        if (seqRef.current == null || seqRef.current + 1 === seq) {
          seqRef.current = seq;
          const action = event as ProtoGameAction;
          setGameState((s) => {
            const next = updateProtoGameState(s, action);
            if (action.playerUid === uid && isOwner) {
              cacheGameState(seq, next);
            }
            return next;
          });
        } else {
          window.alert("please reload");
        }
      },
    });
  }, [stateRestored, firebase.db, uid, isOwner]);

  return [gameState, dispatch] as const;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const debounce = <Args extends any[]>(
  fn: (...args: Args) => void,
  timeout = 300,
): ((...args: Args) => void) => {
  let timer: number | null = null;
  return (...args) => {
    timer != null && window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), timeout);
  };
};
