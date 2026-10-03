// Minimal typings for csTimer's 2x2x2 scrambler (2x2x2.js).

declare const scramble222: {
  /**
   * An optimal solution (fewest moves, only U, R and F turns) of a 2x2x2 state given as
   * 24 face numbers (0-5 = U R F D L B), 4 per face in that order, each face read row by
   * row as in min2phase's facelet strings. The D L B corner must be solved. `null` if the
   * state isn't a real cube.
   */
  solveFacelet(facelets: number[]): string | null;
};
export default scramble222;
