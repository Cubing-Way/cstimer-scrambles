// Minimal typings for csTimer's scramble manager (scrMgr).

/** csTimer's scrambler signature: (type, length, state, neutrality level) => scramble. */
type Scrambler = (type: string, length: number, state: unknown, neut: number) => string;

declare const scrMgr: {
  reg(type: string | string[], callback: Scrambler, filterAndProbs?: unknown): unknown;
  scramblers: Record<string, Scrambler | undefined>;
  getExtra(type: string, idx: number): unknown;
  rndState(filter: unknown, probs: unknown): unknown;
  /** Turns csTimer's display markup into plain text ("\\n" becomes a real newline). */
  toTxt(scramble: string): string;
};
export default scrMgr;
export type { Scrambler };
