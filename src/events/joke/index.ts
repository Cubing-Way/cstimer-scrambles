import '../../vendor/cstimer/megascramble.js';
import '../../vendor/cstimer/utilscramble.js';
import { cstimerEvent } from '../../cstimer.js';
import { registerEvents } from '../../registry.js';
import type { ScrambleEvent } from '../../types.js';

/** csTimer's joke scramble types. */
const eventsJoke: ScrambleEvent[] = [
  cstimerEvent('111', '1x1x1 (x y z)', 'joke', 25),
  cstimerEvent('-1', '-1x-1x-1', 'joke', 25),
  cstimerEvent('112', '1x1x2', 'joke', 25),
  cstimerEvent('lol', 'LOL', 'joke', 25),
  cstimerEvent('eide', 'Derrick Eide', 'joke', 25),
];

registerEvents(...eventsJoke);

export { eventsJoke };
