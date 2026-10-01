import '../../vendor/cstimer/utilscramble.js';
import '../../vendor/cstimer/megascramble.js';
import '../../vendor/cstimer/megaminx.js';
import '../../vendor/cstimer/mgmlsll.js';
import { cstimerEvent, cstimerScramble } from '../../cstimer.js';
import { registerEvents } from '../../registry.js';
import type { ScrambleEvent } from '../../types.js';

/**
 * WCA Megaminx: 7 lines of Pochmann-style moves (R++ D-- ... U), separated by newlines.
 * Another `length` gives length / 10 lines, rounded up.
 */
function getMegaminxScramble(length = 70): string {
  return cstimerScramble('mgmp', length);
}

const eventsMinx: ScrambleEvent[] = [
  { id: 'mgmp', name: 'Megaminx WCA', puzzle: 'minx', length: 70, generate: getMegaminxScramble },
  // Other csTimer scramble types for this puzzle, in csTimer's menu order.
  cstimerEvent('mgmc', 'Megaminx Carrot', 'minx', 70),
  cstimerEvent('mgmo', 'Megaminx old style', 'minx', 70),
  cstimerEvent('minx2g', 'Megaminx 2-generator R,U', 'minx', 30),
  cstimerEvent('mlsll', 'Megaminx last slot + last layer', 'minx'),
  cstimerEvent('mgmso', 'Megaminx random state', 'minx'),
  cstimerEvent('mgmpll', 'Megaminx PLL', 'minx'),
  cstimerEvent('mgmll', 'Megaminx Last Layer', 'minx'),
  cstimerEvent('mgms2l', 'Megaminx S2L', 'minx', 48),
];

registerEvents(...eventsMinx);

export { getMegaminxScramble, eventsMinx };
