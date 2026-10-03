// Typed access to csTimer's getAnyScramble (src/vendor/cstimer/scramble_333_edit.js):
// a random (or partially fixed) cube state is built, then solved with min2phase;
// the solution is the scramble.

import { cleanScramble } from '../../cstimer.js';
import scramble_333 from '../../vendor/cstimer/scramble_333_edit.js';
import type { PieceMask } from '../../vendor/cstimer/scramble_333_edit.js';

/** Move indices for `rndApp` / `rndPre`, as used by csTimer (face * 3 + power). */
const Move = {
  U: 0,
  U2: 1,
  Ui: 2,
  R: 3,
  R2: 4,
  Ri: 5,
  F: 6,
  F2: 7,
  Fi: 8,
  D: 9,
  D2: 10,
  Di: 11,
  L: 12,
  L2: 13,
  Li: 14,
  B: 15,
  B2: 16,
  Bi: 17,
} as const;

interface StateOptions {
  ep?: PieceMask;
  eo?: PieceMask;
  cp?: PieceMask;
  co?: PieceMask;
  /** Color neutrality level 0-6, as in csTimer. */
  neut?: number;
  /** Move sequences, one of which is appended to the state at random. */
  rndApp?: number[][];
  /** Move sequences, one of which is prepended to the state at random. */
  rndPre?: number[][];
  firstAxisFilter?: number;
  lastAxisFilter?: number;
}

const ALL_RANDOM_12 = 0xffffffffffff;
const ALL_RANDOM_8 = 0xffffffff;

/**
 * Scramble to a random state where the pieces in the masks are fixed, e.g.
 * `getAnyScramble({ cp: 0x76543210, co: 0 })` for edges only. Unset masks are random.
 */
function getAnyScramble(options: StateOptions = {}): string {
  const scramble = scramble_333.getAnyScramble(
    options.ep ?? ALL_RANDOM_12,
    options.eo ?? ALL_RANDOM_12,
    options.cp ?? ALL_RANDOM_8,
    options.co ?? ALL_RANDOM_8,
    options.neut,
    options.rndApp,
    options.rndPre,
    options.firstAxisFilter,
    options.lastAxisFilter,
  );
  return cleanScramble(scramble);
}

export { Move, ALL_RANDOM_12, ALL_RANDOM_8, getAnyScramble };
export type { PieceMask, StateOptions };
