import { WritableAtom } from "jotai";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyWritableAtom<T = any> = WritableAtom<T, any[], any>;

export type AtomInitializer<T> = readonly [AnyWritableAtom<T>, T];

/**
 * A helper function to construct initialValues for Provider in typesafe manner.
 *     initialValues={[[numberAtom, ""]]} //=> compile
 *     initialValues={[pair(numberAtom, "")]} //=> compile error
 */
export const pair = <T>(atom: AnyWritableAtom<T>, initialValue: T): AtomInitializer<T> => {
  return [atom, initialValue];
};
