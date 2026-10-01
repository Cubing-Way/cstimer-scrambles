// Minimal typings for csTimer's puzzle type helpers (toolsutil.js, from tools.js).

declare const tools: {
  /** The puzzle a scramble type id is for, e.g. "pll" -> "333". Unknown ids come back unchanged. */
  puzzleType(scrambleType: string): string;
};
export default tools;
