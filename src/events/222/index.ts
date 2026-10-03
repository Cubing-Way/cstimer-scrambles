import '../../vendor/cstimer/2x2x2.js';
import '../../vendor/cstimer/megascramble.js';
import { cstimerEvent, cstimerScramble } from '../../cstimer.js';
import { registerEvents } from '../../registry.js';
import type { ScrambleEvent } from '../../types.js';

/** WCA 2x2: random-state scramble (at least 4 moves from solved, as in csTimer). */
function get222Scramble(): string {
  return cstimerScramble('222so');
}

const events222: ScrambleEvent[] = [
  { id: '222so', name: '2x2x2 random state', puzzle: '222', generate: get222Scramble },
  // Other csTimer scramble types for this puzzle, in csTimer's menu order.
  cstimerEvent('222o', '2x2x2 optimal', '222'),
  cstimerEvent('2223', '2x2x2 3-gen', '222', 25),
  cstimerEvent('222eg', '2x2x2 EG', '222'),
  cstimerEvent('222eg0', '2x2x2 CLL', '222'),
  cstimerEvent('222eg1', '2x2x2 EG1', '222'),
  cstimerEvent('222eg2', '2x2x2 EG2', '222'),
  cstimerEvent('222tcp', '2x2x2 TCLL+', '222'),
  cstimerEvent('222tcn', '2x2x2 TCLL-', '222'),
  cstimerEvent('222tc', '2x2x2 TCLL', '222'),
  cstimerEvent('222lsall', '2x2x2 LS', '222'),
  cstimerEvent('222nb', '2x2x2 No Bar', '222'),
];

registerEvents(...events222);

export { get222Scramble, events222 };
