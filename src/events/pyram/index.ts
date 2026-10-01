import '../../vendor/cstimer/pyraminx.js';
import { cstimerScramble } from '../../cstimer.js';
import { registerEvents } from '../../registry.js';
import type { ScrambleEvent } from '../../types.js';

/** WCA Pyraminx: random-state scramble, with random tip turns (u l r b) at the end. */
function getPyraminxScramble(): string {
  return cstimerScramble('pyrso');
}

const eventsPyram: ScrambleEvent[] = [
  { id: 'pyrso', name: 'Pyraminx random state', puzzle: 'pyram', generate: getPyraminxScramble },
];

registerEvents(...eventsPyram);

export { getPyraminxScramble, eventsPyram };
