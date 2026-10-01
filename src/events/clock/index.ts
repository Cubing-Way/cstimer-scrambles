import '../../vendor/cstimer/utilscramble.js';
import { cstimerScramble } from '../../cstimer.js';
import { registerEvents } from '../../registry.js';
import type { ScrambleEvent } from '../../types.js';

/** WCA Clock: random pin turns in WCA notation, e.g. "UR5- DR2+ ... ALL3+ y2 ... UL". */
function getClockScramble(): string {
  return cstimerScramble('clkwca');
}

const eventsClock: ScrambleEvent[] = [
  { id: 'clkwca', name: 'Clock WCA', puzzle: 'clock', generate: getClockScramble },
];

registerEvents(...eventsClock);

export { getClockScramble, eventsClock };
