import { User as FirebaseUser, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect } from "react";
import { NoSessionError, User } from "~/app/models";
import { log } from "~/lib/logger";
import { firebaseAtom } from "./firebase";

export type Session =
  | {
      readonly signedIn: false;
      readonly restoring: boolean;
    }
  | {
      readonly signedIn: true;
      readonly user: User;
    };

const mutSessionAtom = atom<Session>({ signedIn: false, restoring: true });

export const sessionAtom = atom((get) => get(mutSessionAtom));

export const userAtom = atom((get) => {
  const session = get(sessionAtom);
  if (!session.signedIn) {
    throw new NoSessionError();
  }
  return session.user;
});

export const useAuthStateSubscription = (): void => {
  const { auth } = useAtomValue(firebaseAtom);
  const setSession = useSetAtom(mutSessionAtom);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (rawUser) => {
      log.debug("authencitaed uid", rawUser?.uid);
      if (rawUser == null) {
        setSession({ signedIn: false, restoring: false });
      } else {
        setSession({ signedIn: true, user: buildUser(rawUser) });
      }
    });
    return unsubscribe;
  }, [auth, setSession]);
};

export type SignInFunc = () => Promise<User>;

export const useSignIn = (): SignInFunc => {
  const firebase = useAtomValue(firebaseAtom);
  const [session, setSession] = useAtom(mutSessionAtom);

  const signIn: SignInFunc = useCallback(async () => {
    let user: User;
    if (session.signedIn) {
      user = session.user;
    } else {
      const cred = await signInAnonymously(firebase.auth);
      user = buildUser(cred.user);
    }
    setSession({ signedIn: true, user });
    return user;
  }, [firebase, session, setSession]);

  return signIn;
};

const buildUser = (raw: FirebaseUser): User => {
  return { uid: raw.uid };
};
