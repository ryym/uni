import { Atom } from "jotai";

/**
 * A helper function to construct initialValues for Provider in typesafe manner.
 *     initialValues={[[numberAtom, ""]]} //=> compile
 *     initialValues={[pair(numberAtom, "")]} //=> compile error
 */
export const pair = <T>(atom: Atom<T>, initialValue: T) => [atom, initialValue] as const;
