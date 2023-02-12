import { Functions, httpsCallable } from "firebase/functions";

export const callInitGameFunction = async (functions: Functions): Promise<void> => {
  const initGame = httpsCallable(functions, "initGame", {});
  await initGame();
};
