type AnyObject = Record<string | number | symbol, unknown>;

// Naive and simple deep equality checker.
export const deepStrictEqual = (v1: unknown, v2: unknown): boolean => {
  if (Object.is(v1, v2)) {
    return true;
  }
  if (Array.isArray(v1) && Array.isArray(v2)) {
    return deepArrayEqual(v1, v2);
  }
  if (typeof v1 === "object" && typeof v2 === "object" && v1 != null && v2 != null) {
    return deepObjectEqual(v1 as AnyObject, v2 as AnyObject);
  }
  return false;
};

const deepArrayEqual = (v1: readonly unknown[], v2: readonly unknown[]): boolean => {
  if (v1.length !== v2.length) {
    return false;
  }
  return v1.every((e1, i) => deepStrictEqual(e1, v2[i]));
};

const deepObjectEqual = (v1: AnyObject, v2: AnyObject): boolean => {
  const keys1 = Object.keys(v1);
  const keys2 = Object.keys(v2);
  if (keys1.length !== keys2.length) {
    return false;
  }
  const keys2Set = new Set(keys2);
  for (const key of keys1) {
    if (!keys2Set.has(key) || !deepStrictEqual(v1[key], v2[key])) {
      return false;
    }
  }
  return true;
};
