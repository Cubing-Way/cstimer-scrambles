// Minimal typings for the parts of csTimer's scramble_333_edit.js this library uses.

/** A piece mask: an array (-1 = random) or csTimer's packed form, one hex digit per piece (0xf = random). */
type PieceMask = number | number[];

declare const scramble_333: {
  /** Scramble to a random state matching the masks, solved with min2phase. Arguments as in csTimer. */
  getAnyScramble(
    ep: PieceMask,
    eo: PieceMask,
    cp: PieceMask,
    co: PieceMask,
    neut?: number,
    rndApp?: number[][],
    rndPre?: number[][],
    firstAxisFilter?: number,
    lastAxisFilter?: number,
  ): string;
  /** Solves a facelet string with min2phase. */
  solvFacelet(facelet: string): string;
};
export default scramble_333;
export type { PieceMask };
