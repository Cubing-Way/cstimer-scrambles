import '../../vendor/cstimer/megascramble.js';
import { cstimerEvent, cstimerScramble } from '../../cstimer.js';
import { registerEvents } from '../../registry.js';
import type { ScrambleEvent } from '../../types.js';

/** WCA 5x5: 60 random moves (or `length`) in WCA notation. */
function get555Scramble(length = 60): string {
  return cstimerScramble('555wca', length);
}

/** WCA 5x5 blindfolded: 60 random moves plus random wide moves for orientation. */
function get555BldScramble(): string {
  return cstimerScramble('555bld', 60);
}

const events555: ScrambleEvent[] = [
  { id: '555wca', name: '5x5x5 WCA', puzzle: '555', length: 60, generate: get555Scramble },
  { id: '555bld', name: '5x5x5 blindfolded', puzzle: '555', generate: get555BldScramble },
  // Other csTimer scramble types for this puzzle, in csTimer's menu order.
  cstimerEvent('555', '5x5x5 SiGN', '555', 60),
  cstimerEvent('5edge', '5x5x5 edges', '555', 8),
];

registerEvents(...events555);

export { get555Scramble, get555BldScramble, events555 };
