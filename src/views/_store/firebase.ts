import { Atom, atom } from "jotai";
import { FirebaseClient } from "~/lib/firebase";
import { pair } from "../_lib/jotai";

const mutFirebaseAtom = atom<FirebaseClient | null>(null);

export const firebaseAtomInitializers = (
  client: FirebaseClient,
): Array<readonly [Atom<unknown>, unknown]> => {
  return [pair(mutFirebaseAtom, client)];
};

export const firebaseAtom = atom((get) => {
  const firebase = get(mutFirebaseAtom);
  if (firebase == null) {
    throw new Error("Firebase client atom not set");
  }
  return firebase;
});
