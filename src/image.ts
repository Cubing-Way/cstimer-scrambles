// Scramble images, drawn by csTimer's own image code (vendored in src/vendor/cstimer/image.js).

import image from './vendor/cstimer/image.js';
import tools from './vendor/cstimer/toolsutil.js';

/** Puzzles that have images so far. 3x3x3 is the trial; the other puzzles come next. */
const IMAGE_PUZZLES = ['333'];

/** Whether `getScrambleImage` can draw scrambles of this csTimer scramble type id. */
function hasScrambleImage(type: string): boolean {
  // Multi-blind ("r3ni") is a grid of 3x3x3 images, one per cube.
  return type === 'r3ni' || IMAGE_PUZZLES.includes(tools.puzzleType(type));
}

/**
 * Draws the scrambled puzzle as an SVG string, the same picture csTimer shows in its
 * "Draw Scramble" tool: an unfolded cube with the U face on top and F in the middle.
 *
 * `type` is the scramble type id the scramble was made for, e.g. `'333'` or `'pll'`.
 * The SVG has a viewBox, so it can be resized with CSS.
 *
 * Only 3x3x3 scramble types are supported for now; others throw.
 */
function getScrambleImage(type: string, scramble: string): string {
  if (!hasScrambleImage(type)) {
    throw new Error(`No scramble image for "${type}" yet (only 3x3x3 for now)`);
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
