export const range = (start: number, endExclusive: number): number[] => {
  return [...Array(endExclusive)].map((_, i) => start + i);
};
