import '../../vendor/cstimer/skewb.js';
import { cstimerScramble } from '../../cstimer.js';
import { registerEvents } from '../../registry.js';
import type { ScrambleEvent } from '../../types.js';

/** WCA Skewb: random-state scramble in WCA notation (R U L B). */
function getSkewbScramble(): string {
  return cstimerScramble('skbso');
}

const eventsSkewb: ScrambleEvent[] = [
  { id: 'skbso', name: 'Skewb random state', puzzle: 'skewb', generate: getSkewbScramble },
];

registerEvents(...eventsSkewb);

export { getSkewbScramble, eventsSkewb };
