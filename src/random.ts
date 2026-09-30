import mathlib from './vendor/cstimer/mathlib.js';

/**
 * Seeds the shared random generator (ISAAC, as in csTimer) so scrambles are
 * reproducible. By default it is seeded from `crypto.getRandomValues`.
 */
export function setSeed(seed: string, count = 0): void {
  mathlib.setSeed(count, seed);
}

/** Returns `[count, seed]`: how many numbers have been drawn since the seed was set. */
export function getSeed(): [number, string] {
  return mathlib.getSeed();
}
