import '../../vendor/cstimer/pyraminx.js';
import '../../vendor/cstimer/utilscramble.js';
import { cstimerEvent, cstimerScramble } from '../../cstimer.js';
import { registerEvents } from '../../registry.js';
import type { ScrambleEvent } from '../../types.js';

/** WCA Pyraminx: random-state scramble, with random tip turns (u l r b) at the end. */
function getPyraminxScramble(): string {
  return cstimerScramble('pyrso');
}

const eventsPyram: ScrambleEvent[] = [
  { id: 'pyrso', name: 'Pyraminx random state', puzzle: 'pyram', generate: getPyraminxScramble },
  // Other csTimer scramble types for this puzzle, in csTimer's menu order.
  cstimerEvent('pyro', 'Pyraminx optimal', 'pyram'),
  cstimerEvent('pyrm', 'Pyraminx random move', 'pyram', 25),
  cstimerEvent('pyrl4e', 'Pyraminx L4E', 'pyram'),
  cstimerEvent('pyr4c', 'Pyraminx 4 tips', 'pyram'),
  cstimerEvent('pyrnb', 'Pyraminx No bar', 'pyram'),
];

registerEvents(...eventsPyram);

export { getPyraminxScramble, eventsPyram };
