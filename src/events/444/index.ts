import '../../vendor/cstimer/scramble_444.js';
import '../../vendor/cstimer/megascramble.js';
import { cstimerScramble } from '../../cstimer.js';
import { registerEvents } from '../../registry.js';
import type { ScrambleEvent } from '../../types.js';

/**
 * WCA 4x4: random-state scramble. The first call builds the solver's tables,
 * which takes a second or two; later calls are fast.
 */
function get444Scramble(): string {
  return cstimerScramble('444wca');
}

/** WCA 4x4 blindfolded: random state plus a random cube rotation. */
function get444BldScramble(): string {
  return cstimerScramble('444bld');
}

const events444: ScrambleEvent[] = [
  { id: '444wca', name: '4x4x4 random state', puzzle: '444', generate: get444Scramble },
  { id: '444bld', name: '4x4x4 blindfolded', puzzle: '444', generate: get444BldScramble },
];

registerEvents(...events444);

export { get444Scramble, get444BldScramble, events444 };
