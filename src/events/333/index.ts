import '../../vendor/cstimer/scramble_333_edit.js';
import '../../vendor/cstimer/megascramble.js';
import '../../vendor/cstimer/utilscramble.js';
import { cstimerScramble } from '../../cstimer.js';
import { registerEvents } from '../../registry.js';
import type { ScrambleEvent } from '../../types.js';
import { events333Variants } from './variants.js';

/** WCA 3x3: random-state scramble. */
function get333Scramble(): string {
  return cstimerScramble('333');
}

/** WCA one-handed: the same random-state scramble as 3x3. */
function get333OhScramble(): string {
  return cstimerScramble('333oh');
}

/** WCA FMC: random state, wrapped in R' U' F so it cannot start or end with trivial cancellations. */
function get333FmcScramble(): string {
  return cstimerScramble('333fm');
}

/** WCA 3x3 blindfolded: random state plus random wide moves, so the solver can't rely on orientation. */
function get333BldScramble(): string {
  return cstimerScramble('333ni');
}

/** WCA multi-blind: one numbered blindfolded scramble per cube, one per line. */
function get333MultiBldScramble(cubes = 5): string {
  return cstimerScramble('r3ni', cubes);
}

/** Only edges scrambled; corners solved. */
function get333EdgesScramble(): string {
  return cstimerScramble('edges');
}

/** Only corners scrambled; edges solved. */
function get333CornersScramble(): string {
  return cstimerScramble('corners');
}

/** Last layer: first two layers solved, U layer random. */
function get333LLScramble(): string {
  return cstimerScramble('ll');
}

const events333: ScrambleEvent[] = [
  { id: '333', name: '3x3x3 random state', puzzle: '333', generate: get333Scramble },
  { id: '333oh', name: '3x3x3 one-handed', puzzle: '333', generate: get333OhScramble },
  { id: '333fm', name: '3x3x3 fewest moves', puzzle: '333', generate: get333FmcScramble },
  { id: '333ni', name: '3x3x3 blindfolded', puzzle: '333', generate: get333BldScramble },
  {
    id: 'r3ni',
    name: '3x3x3 multi-blind',
    puzzle: '333',
    length: 5,
    generate: get333MultiBldScramble,
  },
  { id: 'edges', name: '3x3x3 edges only', puzzle: '333', generate: get333EdgesScramble },
  { id: 'corners', name: '3x3x3 corners only', puzzle: '333', generate: get333CornersScramble },
  { id: 'll', name: '3x3x3 last layer', puzzle: '333', generate: get333LLScramble },
];

registerEvents(...events333, ...events333Variants);

export {
  get333Scramble,
  get333OhScramble,
  get333FmcScramble,
  get333BldScramble,
  get333MultiBldScramble,
  get333EdgesScramble,
  get333CornersScramble,
  get333LLScramble,
  events333,
  events333Variants,
};
export { getAnyScramble, Move } from './state.js';
export type { PieceMask, StateOptions } from './state.js';
