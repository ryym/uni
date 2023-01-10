export const range = (start: number, endExclusive: number): number[] => {
  return [...Array(endExclusive - start)].map((_, i) => start + i);
};
