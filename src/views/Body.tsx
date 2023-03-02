import { useAtomValue } from "jotai";
import { ReactElement } from "react";
import { Route, Switch } from "wouter";
import { HomePage } from "./_root_/HomePage";
import { RoomPage } from "./_root_/_rooms_/RoomPage";
import { sessionAtom, useAuthStateSubscription } from "./store/session";

export function Body(): ReactElement {
  useAuthStateSubscription();
  const session = useAtomValue(sessionAtom);
  if (!session.signedIn && session.restoring) {
    return <div>loading...</div>;
  }
  return (
    <div>
      <h1>Uni</h1>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/rooms/:roomId" component={RoomPage} />
      </Switch>
    </div>
  );
}
