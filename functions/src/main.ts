import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { pingHandler } from "./funcs/ping";

switch (process.env.NODE_ENV) {
  case "production": {
    break;
  }

  case undefined:
  case "development": {
    /* eslint-disable @typescript-eslint/no-var-requires */
    const dotenv = require("dotenv");
    const path = require("path");
    /* eslint-enable @typescript-eslint/no-var-requires */
    dotenv.config({ path: path.resolve(process.cwd(), ".env.development") });
    break;
  }

  default: {
    throw new Error(`unexpected NODE_ENV: ${process.env.NODE_ENV}`);
  }
}

const app = admin.initializeApp();
const func = functions.region("asia-northeast1").https;

export const ping = func.onCall(pingHandler(app));
