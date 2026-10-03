import '../../vendor/cstimer/megascramble.js';
import { cstimerEvent, cstimerScramble } from '../../cstimer.js';
import { registerEvents } from '../../registry.js';
import type { ScrambleEvent } from '../../types.js';

/** WCA 6x6: 80 random moves (or `length`) in WCA notation. */
function get666Scramble(length = 80): string {
  return cstimerScramble('666wca', length);
}

const events666: ScrambleEvent[] = [
  { id: '666wca', name: '6x6x6 WCA', puzzle: '666', length: 80, generate: get666Scramble },
  // Other csTimer scramble types for this puzzle, in csTimer's menu order.
  cstimerEvent('666si', '6x6x6 SiGN', '666', 80),
  cstimerEvent('666p', '6x6x6 prefix', '666', 80),
  cstimerEvent('666s', '6x6x6 suffix', '666', 80),
  cstimerEvent('6edge', '6x6x6 edges', '666', 8),
];

registerEvents(...events666);

export { get666Scramble, events666 };
