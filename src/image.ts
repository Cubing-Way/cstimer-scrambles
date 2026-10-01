// Scramble images, drawn by csTimer's own image code (vendored in src/vendor/cstimer/image.js).

import image from './vendor/cstimer/image.js';
import tools from './vendor/cstimer/toolsutil.js';

/**
 * Puzzles csTimer's image code can draw, as csTimer's puzzle type ids (what
 * `tools.puzzleType(type)` returns). Mirrors `renderSVG` in csTimer's image.js.
 */
const IMAGE_PUZZLES = [
  // Cubes, 2x2x2 up to 11x11x11, as an unfolded net.
  '222',
  '333',
  '444',
  '555',
  '666',
  '777',
  '888',
  '999',
  '101010',
  '111111',
  // Puzzles drawn from a 3D model, unfolded.
  'pyr',
  'mpyr',
  'skb',
  'mgm',
  'klm',
  'giga',
  'prc',
  'fto',
  'dmd',
  'ctico',
  'redi',
  'dino',
  'heli',
  'heli2x2',
  'helicv',
  'crz3a',
  // Puzzles with their own drawing code.
  'sq1',
  'sq2',
  'clk',
  'gear',
  'mrbl',
  '15p',
  '15b',
  '8p',
  '8b',
];

/** Relays and multi-blind: a grid with one image per scramble. */
const MULTI_TYPES = /^r(3(ni)?|23\d+w?|mngf)$/;

/** Whether `getScrambleImage` can draw scrambles of this csTimer scramble type id. */
function hasScrambleImage(type: string): boolean {
  return MULTI_TYPES.test(type) || IMAGE_PUZZLES.includes(tools.puzzleType(type));
}

/**
 * Draws the scrambled puzzle as an SVG string, the same picture csTimer shows in its
 * "Draw Scramble" tool, e.g. an unfolded cube with the U face on top and F in the middle.
 *
 * `type` is the scramble type id the scramble was made for, e.g. `'333'` or `'pll'`.
 * The SVG has a viewBox, so it can be resized with CSS, and no background.
 *
 * Throws for types csTimer has no image for (see `hasScrambleImage`).
 */
function getScrambleImage(type: string, scramble: string): string {
  if (!hasScrambleImage(type)) {
    throw new Error(`No scramble image for "${type}"`);
  }
  const svg = image.draw([type, scramble, 0]);
  if (!svg) {
    throw new Error(`csTimer has no scramble image for "${type}"`);
  }
  // csTimer's SVG only sets width and height; a viewBox lets the picture scale.
  return svg
    .render()
    .replace('<svg ', `<svg viewBox="0 0 ${round(svg.width)} ${round(svg.height)}" `);
}

function round(n: number): string {
  return parseFloat(n.toFixed(3)).toString();
}

export { getScrambleImage, hasScrambleImage };
