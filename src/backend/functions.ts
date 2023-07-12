import { Functions, httpsCallable } from "firebase/functions";
import { log } from "~/lib/logger";
import {
  CancelGameParams,
  CancelGameResult,
  InitGameParams,
  InitGameResult,
} from "~shared/functions";

export const callInitGameFunction = async (
  functions: Functions,
  params: InitGameParams,
): Promise<InitGameResult> => {
  const initGame = httpsCallable<InitGameParams, InitGameResult>(functions, "initGame", {});
  log.debug("calling initGame function");
  const result = await initGame(params);
  return result.data;
};

export const callCancelGameFunction = async (
  functions: Functions,
  params: CancelGameParams,
): Promise<CancelGameResult> => {
  const cancelGame = httpsCallable<CancelGameParams, CancelGameResult>(functions, "cancelGame", {});
  log.debug("calling cancelGame function");
  const result = await cancelGame(params);
  return result.data;
};
