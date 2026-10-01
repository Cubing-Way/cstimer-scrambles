// Bridge to csTimer's own scramblers (vendored in src/vendor/cstimer).
// Each vendored scramble file registers its generators with csTimer's scrMgr
// when it is imported; this module calls them the way csTimer's UI does.

import scrMgr from './vendor/cstimer/scrmgr.js';

/** Plain text: single spaces between moves, one trimmed line per row, no blank lines at the ends. */
function cleanScramble(scramble: string): string {
  return scramble
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

export { cstimerScramble, cleanScramble };
