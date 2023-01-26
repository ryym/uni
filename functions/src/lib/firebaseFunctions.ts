import { CallableContext } from "firebase-functions/v1/https";

export type CallHandler<D, R> = (data: D, context: CallableContext) => R;
