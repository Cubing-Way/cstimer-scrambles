import '../../vendor/cstimer/utilscramble.js';
import '../../vendor/cstimer/clock.js';
import { cstimerEvent, cstimerScramble } from '../../cstimer.js';
import { registerEvents } from '../../registry.js';
import type { ScrambleEvent } from '../../types.js';

/** WCA Clock: random pin turns in WCA notation, e.g. "UR5- DR2+ ... ALL3+ y2 ... UL". */
function getClockScramble(): string {
  return cstimerScramble('clkwca');
}

const eventsClock: ScrambleEvent[] = [
  { id: 'clkwca', name: 'Clock WCA', puzzle: 'clock', generate: getClockScramble },
  // Other csTimer scramble types for this puzzle, in csTimer's menu order.
  cstimerEvent('clkwcab', 'Clock WCA (old)', 'clock'),
  cstimerEvent('clknf', 'Clock WCA w/o y2', 'clock'),
  cstimerEvent('clk', 'Clock Jaap', 'clock'),
  cstimerEvent('clko', 'Clock optimal', 'clock'),
  cstimerEvent('clkc', 'Clock concise', 'clock'),
  cstimerEvent('clke', 'Clock efficient pin order', 'clock'),
];

registerEvents(...eventsClock);

export { getClockScramble, eventsClock };
