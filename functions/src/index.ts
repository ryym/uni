import * as functions from "firebase-functions";

const func = functions.region("asia-northeast1").https;

export const ping = func.onCall(async (data, _context) => {
  functions.logger.info("ping with data", data);
  return { pong: Date.now() };
});
