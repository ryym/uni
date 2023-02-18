import { ReactElement } from "react";
import { Route, Switch } from "wouter";
import { useAuthStateSubscription } from "./_store/session";
import { HomePage } from "./home/HomePage";
import { RoomPage } from "./rooms/RoomPage";

export function Body(): ReactElement {
  useAuthStateSubscription();
  return (
    <div>
      <h1>DoUno</h1>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/rooms/:roomId" component={RoomPage} />
      </Switch>
    </div>
  );
}
