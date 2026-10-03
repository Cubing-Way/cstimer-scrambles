// Computer solutions for cubes, from csTimer's own solvers: its optimal 2x2x2 solver and
// min2phase (two-phase 3x3x3 solver). Both find a short solution, not a human method.

import image from './vendor/cstimer/image.js';
import min2phase from './vendor/cstimer/min2phase.js';
import scramble222 from './vendor/cstimer/2x2x2.js';

/** Face order of min2phase's facelet strings; a face's opposite is 3 places further. */
const FACES = 'URFDLB';
/** Face order of csTimer's stickers (see `image.nnnPosit`). */
const CSTIMER_FACES = 'DLBURF';

/** The cube sizes `solveCube` can solve. */
const SOLVER_SIZES: readonly number[] = [2, 3];

/**
 * The stickers of a size x size x size cube after `moves`, as face numbers (0-5, the face in
 * FACES each sticker's color started on), face by face in FACES order, each face read row
 * by row as in min2phase's facelet strings: U with its top row next to B, D with its top
 * row next to F, and L and B as seen from their own side.
 */
function cubeFacelets(size: number, moves: string): number[] {
  const posit = image.nnnPosit(size, moves);
  const facelets: number[] = [];
  for (const face of FACES) {
    const f = CSTIMER_FACES.indexOf(face);
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        // csTimer keeps L and B mirrored and D upside down.
        const x = face === 'L' || face === 'B' ? size - 1 - col : col;
        const y = face === 'D' ? size - 1 - row : row;
        facelets.push(FACES.indexOf(CSTIMER_FACES[posit[(f * size + y) * size + x]!]!));
      }
    }
  }
  return facelets;
}

/**
 * Renames the colors of `facelets` so each of `faces` gets the color its sticker at `at`
 * has now (and its opposite face the opposite color), which turns a cube held any way into
 * the same cube held with those stickers in place.
 */
function holdBy(facelets: number[], faces: number[], at: number[]): number[] {
  const name: number[] = [];
  faces.forEach((face, i) => {
    const color = facelets[at[i]!]!;
    name[color] = face;
    name[(color + 3) % 6] = (face + 3) % 6;
  });
  return facelets.map((color) => name[color]!);
}

/**
 * A short solution for a size x size x size cube after `moves` (cube notation as csTimer
 * reads it, rotations and wide moves included), for the cube as it is held after them:
 * optimal on 2x2x2 (only U, R and F turns), at most 21 face turns on 3x3x3.
 * `''` when it is already solved. Only for the sizes in SOLVER_SIZES.
 */
function solveCube(size: number, moves: string): string {
  if (size === 2) {
    // The solver keeps the D L B corner still, so hold the cube by that corner.
    const n = 4;
    const facelets = holdBy(cubeFacelets(2, moves), [3, 4, 5], [3 * n + 2, 4 * n + 2, 5 * n + 3]);
    const solution = scramble222.solveFacelet(facelets);
    if (solution === null) throw new Error(`Can't solve this 2x2x2: "${moves}"`);
    return solution;
  }
  if (size === 3) {
    // The centers say which face is which, even after rotations or slice moves.
    const facelets = holdBy(cubeFacelets(3, moves), [0, 1, 2], [4, 13, 22]);
    // min2phase pads its moves to two characters, e.g. "U  R2".
    const solution = min2phase
      .solve(facelets.map((f) => FACES[f]).join(''))
      .trim()
      .replace(/ +/g, ' ');
    if (solution.startsWith('Error')) throw new Error(`Can't solve this 3x3x3: "${moves}"`);
    return solution;
  }
  throw new Error(`No solver for ${size}x${size}x${size} cubes yet`);
}

export { SOLVER_SIZES, solveCube };
