import { useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";
import { ProtoGameAction, ProtoGameState, updateProtoGameState } from "~/app/protogame";
import { dispatchProtoEvent, subscribeProtoEvents } from "~/db/protoevents";
import { firebaseAtom } from "~/views/_store/firebase";

export type EventState = {
  readonly currentSeq: number;
  readonly gameState: ProtoGameState;
};

export type UseProtoGameStateValue = readonly [
  state: ProtoGameState | null,
  dispatch: (action: ProtoGameAction) => void,
];

export const useProtoGameState = (): UseProtoGameStateValue => {
  const firebase = useAtomValue(firebaseAtom);
  const seqRef = useRef<number | null>(null);
  const [gameState, setGameState] = useState<ProtoGameState | null>(null);

  const dispatch = (action: ProtoGameAction) => {
    dispatchProtoEvent(firebase.db, {
      roomId: "dev",
      seq: (seqRef.current || 0) + 1,
      event: action,
    });
  };

  useEffect(() => {
    return subscribeProtoEvents(firebase.db, {
      roomId: "dev",
      onEvent: (seq, event) => {
        if (seqRef.current == null || seqRef.current + 1 === seq) {
          seqRef.current = seq;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setGameState((s) => updateProtoGameState(s, event as any));
        } else {
          window.alert("please reload");
        }
      },
    });
  }, [firebase.db]);

  return [gameState, dispatch] as const;
};
