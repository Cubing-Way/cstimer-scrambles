import '../../vendor/cstimer/scramble_sq1_new.js';
import { cstimerScramble } from '../../cstimer.js';
import { registerEvents } from '../../registry.js';
import type { ScrambleEvent } from '../../types.js';

/** WCA Square-1: random-state scramble, e.g. "(1,0)/ (-3,0)/ ...". */
function getSquare1Scramble(): string {
  return cstimerScramble('sqrs');
}

const eventsSq1: ScrambleEvent[] = [
  { id: 'sqrs', name: 'Square-1 random state', puzzle: 'sq1', generate: getSquare1Scramble },
];

registerEvents(...eventsSq1);

export { getSquare1Scramble, eventsSq1 };
