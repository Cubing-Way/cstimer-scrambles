// Minimal typings for csTimer's EOLine and EOCross solver (eoline.js, from its tools panel).
import type { Elem } from './toolsui.js';

declare const eoline: {
  /** Writes the shortest EOLine (or EOCross) for each of the 12 ways to hold the cube into `elem`. */
  solve(scramble: string, isCross: boolean, elem: Elem): void;
};
export default eoline;
