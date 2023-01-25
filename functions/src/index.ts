import * as functions from "firebase-functions";
import { CODE_SHARE_TEST } from "../../shared/cards";

const func = functions.region("asia-northeast1").https;

export const ping = func.onCall(async (data, _context) => {
  functions.logger.info("ping with data", data);
  return { pong: Date.now(), shared: CODE_SHARE_TEST() };
});
