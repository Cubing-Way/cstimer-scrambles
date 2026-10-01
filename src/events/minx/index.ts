import '../../vendor/cstimer/utilscramble.js';
import { cstimerScramble } from '../../cstimer.js';
import { registerEvents } from '../../registry.js';
import type { ScrambleEvent } from '../../types.js';

/** WCA Megaminx: 7 lines of Pochmann-style moves (R++ D-- ... U), separated by newlines. */
function getMegaminxScramble(): string {
  return cstimerScramble('mgmp', 70);
}

const eventsMinx: ScrambleEvent[] = [
  { id: 'mgmp', name: 'Megaminx WCA', puzzle: 'minx', generate: getMegaminxScramble },
];

registerEvents(...eventsMinx);

export { getMegaminxScramble, eventsMinx };
