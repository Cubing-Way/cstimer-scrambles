// Minimal typings for csTimer's Skewb scrambler (skewb.js).
import type { CoordSolver } from './mathlib.js';

declare const skewb: {
  /**
   * The optimal solver behind csTimer's random-state scrambles. Its state is [pieces,
   * twists], 0 = solved; each axis turns around one of four corners that never move.
   */
  solver: CoordSolver;
};
export default skewb;
