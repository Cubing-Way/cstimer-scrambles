// Minimal typings for csTimer's Pyraminx scrambler (pyraminx.js).
import type { CoordSolver } from './mathlib.js';

declare const pyraminx: {
  /**
   * The optimal solver behind csTimer's random-state scrambles, without the tips. Its state
   * is [edge permutation, orientation], 0 = solved; axes 0-3 turn U, L, R and B clockwise.
   */
  solver: CoordSolver;
};
export default pyraminx;
