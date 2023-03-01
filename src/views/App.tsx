import { Provider } from "jotai";
import { ReactElement, StrictMode } from "react";
import { FirebaseClient } from "~/lib/firebase";
import { Body } from "./Body";
import { InitAtoms } from "./lib/InitAtoms";
import { firebaseAtomInitializers } from "./store/firebase";

export type AppProps = {
  readonly firebase: FirebaseClient;
};

export function App(props: AppProps): ReactElement {
  return (
    <StrictMode>
      <Provider>
        <InitAtoms initialValues={firebaseAtomInitializers(props.firebase)}>
          <Body />
        </InitAtoms>
      </Provider>
    </StrictMode>
  );
}
