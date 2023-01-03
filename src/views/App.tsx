import { ReactElement, StrictMode } from "react";
import { FirebaseClient } from "~/lib/firebase";

export type AppProps = {
  readonly firebase: FirebaseClient;
};

export function App(props: AppProps): ReactElement {
  return (
    <StrictMode>
      <h1>Hello, world</h1>
    </StrictMode>
  );
}
