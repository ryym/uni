import { Provider } from "jotai";
import { ReactElement, StrictMode } from "react";
import { FirebaseClient } from "~/lib/firebase";
import { firebaseAtomInitializers } from "./_store/firebase";

export type AppProps = {
  readonly firebase: FirebaseClient;
};

export function App(props: AppProps): ReactElement {
  return (
    <StrictMode>
      <Provider initialValues={firebaseAtomInitializers(props.firebase)}>
        <h1>Hello, world</h1>
      </Provider>
    </StrictMode>
  );
}
