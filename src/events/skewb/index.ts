import '../../vendor/cstimer/skewb.js';
import '../../vendor/cstimer/megascramble.js';
import { cstimerEvent, cstimerScramble } from '../../cstimer.js';
import { registerEvents } from '../../registry.js';
import type { ScrambleEvent } from '../../types.js';

/** WCA Skewb: random-state scramble in WCA notation (R U L B). */
function getSkewbScramble(): string {
  return cstimerScramble('skbso');
}

const eventsSkewb: ScrambleEvent[] = [
  { id: 'skbso', name: 'Skewb random state', puzzle: 'skewb', generate: getSkewbScramble },
  // Other csTimer scramble types for this puzzle, in csTimer's menu order.
  cstimerEvent('skbo', 'Skewb optimal', 'skewb'),
  cstimerEvent('skb', 'Skewb random move', 'skewb', 25),
  cstimerEvent('skbnb', 'Skewb No bar', 'skewb'),
];

registerEvents(...eventsSkewb);

export { getSkewbScramble, eventsSkewb };
