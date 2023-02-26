import { useAtomValue } from "jotai";
import { ReactElement } from "react";
import { Route, Switch } from "wouter";
import { sessionAtom, useAuthStateSubscription } from "./_store/session";
import { HomePage } from "./home/HomePage";
import { RoomPage } from "./rooms/RoomPage";

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
