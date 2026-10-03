// Minimal typings for csTimer's Square-1 scrambler (scramble_sq1_new.js).

/** A Square-1 state: four halves of six twelfths of a circle each, and the middle layer. */
interface SqCubie {
  /** Turns the top by `move` twelfths (1 to 11), the bottom by `-move`, or slices on 0. */
  doMove(move: number): void;
  toString(): string;
}

declare const sq1: {
  SqCubie: new () => SqCubie;
  /**
   * Moves that make `cube` from a solved Square-1, like `(1,0)/ (-3,0)/`, found with
   * csTimer's two-phase solver. A `` `/` `` marks where the second phase starts.
   */
  solve(cube: SqCubie): string;
};
export default sq1;
export type { SqCubie };
