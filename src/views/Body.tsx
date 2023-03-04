import { useAtomValue } from "jotai";
import { ReactElement } from "react";
import { Route, Switch } from "wouter";
import { Layout } from "./Layout";
import { HomePage } from "./_root_/HomePage";
import { RoomPage } from "./_root_/_rooms_/RoomPage";
import { sessionAtom, useAuthStateSubscription } from "./store/session";

export function Body(): ReactElement {
  useAuthStateSubscription();
  const session = useAtomValue(sessionAtom);
  return (
    <Layout>
      {!session.signedIn && session.restoring ? (
        <div>loading...</div>
      ) : (
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/rooms/:roomId" component={RoomPage} />
        </Switch>
      )}
    </Layout>
  );
}
