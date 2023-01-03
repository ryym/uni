import { Provider } from "jotai";
import { ReactElement, StrictMode } from "react";
import { FirebaseClient } from "~/lib/firebase";
import { Body } from "./Body";
import { firebaseAtomInitializers } from "./_store/firebase";

export type AppProps = {
  readonly firebase: FirebaseClient;
};

export function App(props: AppProps): ReactElement {
  return (
    <StrictMode>
      <Provider initialValues={firebaseAtomInitializers(props.firebase)}>
        <Body />
      </Provider>
    </StrictMode>
  );
}
