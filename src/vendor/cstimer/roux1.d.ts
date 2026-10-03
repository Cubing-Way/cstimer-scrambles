// Minimal typings for csTimer's Roux first block solver (roux1.js, from its tools panel).
import type { Elem } from './toolsui.js';

declare const roux1: {
  /** Writes the shortest first block in each of its 4 places into `elem`. */
  solve(scramble: string, elem: Elem): void;
};
export default roux1;
