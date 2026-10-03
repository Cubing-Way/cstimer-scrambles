// Minimal typings for csTimer's cube helpers (cubeutil.js).
import type { ParsedMove } from './cross.js';

declare const cubeutil: {
  /**
   * Reads a scramble into [face, width, power] moves, the face as its index in `moveMap`
   * (e.g. "FRUBLD"). The power is 1, 2 or 3 (a quarter turn clockwise, a half turn, a
   * quarter turn counterclockwise).
   */
  parseScramble(scramble: string, moveMap: string): ParsedMove[];
};
export default cubeutil;
