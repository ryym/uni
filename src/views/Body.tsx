import { useAtomValue } from "jotai";
import { ReactElement } from "react";
import { sessionAtom, useAuthStateSubscription, useSignIn } from "./_store/session";
import { ProtoRoomPage } from "./rooms/ProtoRoomPage";

export function Body(): ReactElement {
  const session = useAtomValue(sessionAtom);
  const signIn = useSignIn();
  useAuthStateSubscription();
  return (
    <div>
      <h1>Prototype</h1>
      <button onClick={() => signIn()}>sign in</button>
      <hr />
      {session.signedIn && <ProtoRoomPage />}
    </div>
  );
}
