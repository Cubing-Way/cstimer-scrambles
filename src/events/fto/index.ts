import '../../vendor/cstimer/scramble_fto.js';
import { cstimerScramble } from '../../cstimer.js';
import { registerEvents } from '../../registry.js';
import type { ScrambleEvent } from '../../types.js';

/**
 * Face-Turning Octahedron: random-state scramble. Not a WCA event, but csTimer
 * lists it with them. The first call builds the solver's tables (about a second).
 */
function getFtoScramble(): string {
  return cstimerScramble('ftoso');
}

const eventsFto: ScrambleEvent[] = [
  { id: 'ftoso', name: 'FTO random state', puzzle: 'fto', generate: getFtoScramble },
];

registerEvents(...eventsFto);

export { getFtoScramble, eventsFto };
