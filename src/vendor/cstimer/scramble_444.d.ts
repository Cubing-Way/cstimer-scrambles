// Minimal typings for csTimer's 4x4x4 scrambler (scramble_444.js).

declare const scramble444: {
  /**
   * Moves that turn a solved 4x4x4 into the state given as 96 letters (U R F D L B), 16 per
   * face in that order, each face read row by row as in min2phase's facelet strings. Found
   * with csTimer's three-phase reduction solver, written with outer and wide (Rw) turns.
   */
  genFacelet(facelets: string): string;
};
export default scramble444;
