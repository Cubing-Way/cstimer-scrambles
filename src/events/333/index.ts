import { registerEvents } from '../../registry.js';
import type { ScrambleEvent } from '../../types.js';
import { getAnyScramble } from './state.js';

export { getAnyScramble, Move } from './state.js';
export type { PieceMask, StateOptions } from './state.js';

/** WCA 3x3: random-state scramble. */
export function get333Scramble(): string {
  return getAnyScramble().trim();
}

/** WCA FMC: random state, wrapped in R' U' F so it cannot start or end with trivial cancellations. */
export function get333FmcScramble(): string {
  const scramble = getAnyScramble({ firstAxisFilter: 2, lastAxisFilter: 1 });
  return `R' U' F ${scramble.trim()} R' U' F`;
}

/** Only edges scrambled; corners solved. */
export function get333EdgesScramble(): string {
  return getAnyScramble({ cp: 0x76543210, co: 0x00000000 }).trim();
}

/** Only corners scrambled; edges solved. */
export function get333CornersScramble(): string {
  return getAnyScramble({ ep: 0xba9876543210, eo: 0x000000000000 }).trim();
}

/** Last layer: first two layers solved, U layer random. */
export function get333LLScramble(): string {
  return getAnyScramble({
    ep: 0xba987654ffff,
    eo: 0x00000000ffff,
    cp: 0x7654ffff,
    co: 0x0000ffff,
  }).trim();
}

export const events333: ScrambleEvent[] = [
  { id: '333', name: '3x3x3 random state', puzzle: '333', generate: get333Scramble },
  { id: '333fm', name: '3x3x3 fewest moves', puzzle: '333', generate: get333FmcScramble },
  { id: 'edges', name: '3x3x3 edges only', puzzle: '333', generate: get333EdgesScramble },
  { id: 'corners', name: '3x3x3 corners only', puzzle: '333', generate: get333CornersScramble },
  { id: 'll', name: '3x3x3 last layer', puzzle: '333', generate: get333LLScramble },
];

registerEvents(...events333);
