import '../../vendor/cstimer/scramble_444.js';
import '../../vendor/cstimer/megascramble.js';
import '../../vendor/cstimer/utilscramble.js';
import { cstimerEvent, cstimerScramble } from '../../cstimer.js';
import { registerEvents } from '../../registry.js';
import type { ScrambleEvent } from '../../types.js';

/**
 * WCA 4x4: random-state scramble. The first call builds the solver's tables,
 * which takes a second or two; later calls are fast.
 */
function get444Scramble(): string {
  return cstimerScramble('444wca');
}

/** WCA 4x4 blindfolded: random state plus a random cube rotation. */
function get444BldScramble(): string {
  return cstimerScramble('444bld');
}

const events444: ScrambleEvent[] = [
  { id: '444wca', name: '4x4x4 random state', puzzle: '444', generate: get444Scramble },
  { id: '444bld', name: '4x4x4 blindfolded', puzzle: '444', generate: get444BldScramble },
  // Other csTimer scramble types for this puzzle, in csTimer's menu order.
  cstimerEvent('444m', '4x4x4 random move', '444', 40),
  cstimerEvent('444', '4x4x4 SiGN', '444', 40),
  cstimerEvent('444yj', '4x4x4 YJ', '444', 40),
  cstimerEvent('4edge', '4x4x4 edges', '444'),
  cstimerEvent('RrUu', '4x4x4 R,r,U,u', '444', 40),
  cstimerEvent('444ll', '4x4x4 Last layer', '444'),
  cstimerEvent('444ell', '4x4x4 ELL', '444'),
  cstimerEvent('444edo', '4x4x4 Edge only', '444'),
  cstimerEvent('444cto', '4x4x4 Center only', '444'),
  cstimerEvent('444ctud', '4x4x4 Yau/Hoya UD center solved', '444'),
  cstimerEvent('444ud3c', '4x4x4 Yau/Hoya UD+3E solved', '444'),
  cstimerEvent('444l8e', '4x4x4 Yau/Hoya Last 8 dedges', '444'),
  cstimerEvent('444ctrl', '4x4x4 Yau/Hoya RL center solved', '444'),
  cstimerEvent('444rlda', '4x4x4 Yau/Hoya RLDX center solved', '444'),
  cstimerEvent('444rlca', '4x4x4 Yau/Hoya RLDX cross solved', '444'),
  cstimerEvent('444poll', '4x4x4 Yau/Hoya POLL', '444'),
  cstimerEvent('444ppll', '4x4x4 Yau/Hoya PPLL', '444'),
];

registerEvents(...events444);

export { get444Scramble, get444BldScramble, events444 };
