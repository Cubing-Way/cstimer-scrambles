// Minimal typings for csTimer's cross solver (cross.js, from its tools panel).

/** A move as csTimer's cubeutil.parseScramble reads it: [face, width, power]. */
type ParsedMove = number[];

declare const cross: {
  /** The shortest cross on each face, in `faces` order, as moves like "R2" or "U'". */
  solve(moves: ParsedMove[]): string[][];
  /** The shortest cross plus one F2L pair (the best of the four) on `faces[face]`. */
  xcross(moves: ParsedMove[], face: number): string[];
  /** The shortest cross plus two pairs, or three when `is3x` is true, on `faces[face]`. */
  xxcross(moves: ParsedMove[], face: number, is3x?: boolean): string[];
  /** The faces a cross can be on: D, U, L, R, F, B. */
  faces: string[];
  /** The rotation that puts each face at the bottom, as HTML ("&nbsp;" for spaces). */
  rotations: string[];
};
export default cross;
export type { ParsedMove };
