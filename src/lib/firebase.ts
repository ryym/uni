import { initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Database, connectDatabaseEmulator, getDatabase } from "firebase/database";
import { Firestore, connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { log } from "./logger";

export type FirebaseClient = {
  readonly auth: Auth;
  readonly db: Database;
  readonly firestore: Firestore;
};

export const buildFirebaseClient = async (): Promise<FirebaseClient> => {
  const app = initializeApp({
    apiKey: getEnv("VITE_FIREBASE_API_KEY"),
    authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN"),
    databaseURL: getEnv("VITE_FIREBASE_DATABASE_URL"),
    projectId: getEnv("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: getEnv("VITE_FIREBASE_APP_ID"),
    measurementId: getEnv("VITE_FIREBASE_MEASUREMENT_ID"),
  });
  const auth = getAuth(app);
  const db = getDatabase(app);
  const firestore = getFirestore(app);

  if (__FIREBASE_EMULATOR__) {
    log.debug("starting Firebase emulator...");
    const { default: config } = await import("../../firebase.json");
    const em = config.emulators;
    const host = "localhost";
    connectDatabaseEmulator(db, host, em.database.port);
    connectFirestoreEmulator(firestore, host, em.firestore.port);
  }

  return Object.freeze({ auth, db, firestore });
};

const getEnv = (name: string): string => {
  const value = import.meta.env[name];
  if (typeof value !== "string") {
    throw new Error(`environment variable not found: ${name}`);
  }
  return value;
};
