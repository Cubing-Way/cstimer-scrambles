import '../../vendor/cstimer/megascramble.js';
import { cstimerScramble } from '../../cstimer.js';
import { registerEvents } from '../../registry.js';
import type { ScrambleEvent } from '../../types.js';

/** WCA 7x7: 100 random moves in WCA notation. */
function get777Scramble(): string {
  return cstimerScramble('777wca', 100);
}

const events777: ScrambleEvent[] = [
  { id: '777wca', name: '7x7x7 WCA', puzzle: '777', generate: get777Scramble },
];

registerEvents(...events777);

export { get777Scramble, events777 };
