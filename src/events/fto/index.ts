import '../../vendor/cstimer/scramble_fto.js';
import '../../vendor/cstimer/megascramble.js';
import { cstimerEvent, cstimerScramble } from '../../cstimer.js';
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
  // Other csTimer scramble types for this puzzle, in csTimer's menu order.
  cstimerEvent('fto', 'FTO random move', 'fto', 30),
  cstimerEvent('ftol3t', 'FTO L3T', 'fto'),
  cstimerEvent('ftol4t', 'FTO L3T+LBT', 'fto'),
  cstimerEvent('ftotcp', 'FTO TCP', 'fto'),
  cstimerEvent('ftoedge', 'FTO edges only', 'fto'),
  cstimerEvent('ftocent', 'FTO centers only', 'fto'),
  cstimerEvent('ftocorn', 'FTO corners only', 'fto'),
];

registerEvents(...eventsFto);

export { getFtoScramble, eventsFto };
