import '../../vendor/cstimer/scramble_sq1_new.js';
import '../../vendor/cstimer/utilscramble.js';
import { cstimerEvent, cstimerScramble } from '../../cstimer.js';
import { registerEvents } from '../../registry.js';
import type { ScrambleEvent } from '../../types.js';

/** WCA Square-1: random-state scramble, e.g. "(1,0)/ (-3,0)/ ...". */
function getSquare1Scramble(): string {
  return cstimerScramble('sqrs');
}

const eventsSq1: ScrambleEvent[] = [
  { id: 'sqrs', name: 'Square-1 random state', puzzle: 'sq1', generate: getSquare1Scramble },
  // Other csTimer scramble types for this puzzle, in csTimer's menu order.
  cstimerEvent('sqrcsp', 'Square-1 CSP', 'sq1'),
  cstimerEvent('sq1pll', 'Square-1 PLL', 'sq1'),
  cstimerEvent('sq1h', 'Square-1 face turn metric', 'sq1', 40),
  cstimerEvent('sq1t', 'Square-1 twist metric', 'sq1', 20),
];

registerEvents(...eventsSq1);

export { getSquare1Scramble, eventsSq1 };
