import { Functions, httpsCallable } from "firebase/functions";
import { log } from "~/lib/logger";
import { InitGameParams, InitGameResult } from "~shared/functions";

export const callInitGameFunction = async (
  functions: Functions,
  params: InitGameParams,
): Promise<InitGameResult> => {
  const initGame = httpsCallable<InitGameParams, InitGameResult>(functions, "initGame", {});
  log.debug("calling initGame function");
  const result = await initGame(params);
  return result.data;
};
