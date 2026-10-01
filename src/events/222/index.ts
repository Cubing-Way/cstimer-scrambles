import '../../vendor/cstimer/2x2x2.js';
import { cstimerScramble } from '../../cstimer.js';
import { registerEvents } from '../../registry.js';
import type { ScrambleEvent } from '../../types.js';

/** WCA 2x2: random-state scramble (at least 4 moves from solved, as in csTimer). */
function get222Scramble(): string {
  return cstimerScramble('222so');
}

const events222: ScrambleEvent[] = [
  { id: '222so', name: '2x2x2 random state', puzzle: '222', generate: get222Scramble },
];

registerEvents(...events222);

export { get222Scramble, events222 };
