import { useAtomValue } from "jotai";
import { ReactElement } from "react";
import { Route, Switch } from "wouter";
import { RoomPage } from "./$root/$rooms/RoomPage";
import { HomePage } from "./$root/HomePage";
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
