// Bridge to csTimer's own scramblers (vendored in src/vendor/cstimer).
// Each vendored scramble file registers its generators with csTimer's scrMgr
// when it is imported; this module calls them the way csTimer's UI does.

import type { ScrambleEvent } from './types.js';
import scrMgr from './vendor/cstimer/scrmgr.js';

// HTML entities a few csTimer scramblers use (e.g. "U&sup2;" for 6x6 suffix notation).
const ENTITIES: Record<string, string> = {
  '&sup2;': '²',
  '&sup3;': '³',
  '&nbsp;': ' ',
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
};

/** Plain text: single spaces between moves, one trimmed line per row, no blank lines at the ends. */
function cleanScramble(scramble: string): string {
  return scramble
    .replace(/&(sup2|sup3|nbsp|lt|gt|amp);/g, (entity) => ENTITIES[entity]!)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .join('\n')
    .trim();
}

/**
 * Runs csTimer's scrambler for a scramble type id, e.g. `cstimerScramble('222so')`.
 * The vendored file that registers that type must have been imported first.
 */
function cstimerScramble(type: string, length = 0): string {
  const scrambler = scrMgr.scramblers[type];
  if (!scrambler) {
    throw new Error(`csTimer scrambler "${type}" is not loaded`);
  }
  // Same arguments csTimer passes: a random case for case-based types, no color neutrality.
  const state = scrMgr.rndState(undefined, scrMgr.getExtra(type, 1));
  return cleanScramble(scrMgr.toTxt(scrambler(type, length, state, 0)));
}

/**
 * Describes a csTimer scramble type that needs no extra code: generating it just
 * runs csTimer's scrambler. `length` is csTimer's default for types whose length
 * can be changed (number of moves, or of puzzles for relays).
 */
function cstimerEvent(id: string, name: string, puzzle: string, length?: number): ScrambleEvent {
  return {
    id,
    name,
    puzzle,
    ...(length ? { length } : {}),
    generate: (len = length) => cstimerScramble(id, len),
  };
}

export { cstimerScramble, cstimerEvent, cleanScramble };
