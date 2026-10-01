import '../../vendor/cstimer/megascramble.js';
import { cstimerEvent, cstimerScramble } from '../../cstimer.js';
import { registerEvents } from '../../registry.js';
import type { ScrambleEvent } from '../../types.js';

/** WCA 7x7: 100 random moves (or `length`) in WCA notation. */
function get777Scramble(length = 100): string {
  return cstimerScramble('777wca', length);
}

const events777: ScrambleEvent[] = [
  { id: '777wca', name: '7x7x7 WCA', puzzle: '777', length: 100, generate: get777Scramble },
  // Other csTimer scramble types for this puzzle, in csTimer's menu order.
  cstimerEvent('777si', '7x7x7 SiGN', '777', 100),
  cstimerEvent('777p', '7x7x7 prefix', '777', 100),
  cstimerEvent('777s', '7x7x7 suffix', '777', 100),
  cstimerEvent('7edge', '7x7x7 edges', '777', 8),
];

registerEvents(...events777);

export { get777Scramble, events777 };
