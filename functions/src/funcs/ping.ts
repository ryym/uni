import { app } from "firebase-admin";
import { logger } from "firebase-functions";
import { CallHandler } from "../lib/firebaseFunctions";

export const pingHandler = (app: app.App): CallHandler<unknown, Promise<unknown>> => {
  return async function ping(data, ctx) {
    if (ctx.auth == null) {
      return null;
    }
    logger.info("ping with data", data);
    const doc = await app.firestore().collection("misc").doc("ping").get();
    return { pong: Date.now(), data: doc.data() };
  };
};
