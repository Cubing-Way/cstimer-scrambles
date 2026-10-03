// Computer solutions for cubes, from csTimer's own solvers: its optimal 2x2x2 solver and
// min2phase (two-phase 3x3x3 solver), used to search for the shortest solution. Computer
// solutions, not a human method.

import image from './vendor/cstimer/image.js';
import min2phase from './vendor/cstimer/min2phase.js';
import type { Search } from './vendor/cstimer/min2phase.js';
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

/** Phase-2 tries min2phase makes per search step (each step takes well under 0.2 s). */
const PROBES_PER_STEP = 500;

/**
 * A search for the shortest solution of a size x size x size cube after `moves` (cube
 * notation as csTimer reads it, rotations and wide moves included), for the cube as it is
 * held after them. It holds a solution from the start and finds shorter ones step by step:
 * - 2x2x2: csTimer's optimal solver (only U, R and F turns), so the first is the shortest.
 * - 3x3x3: min2phase finds a solution of at most 21 face turns, then is asked again and
 *   again for one at least a move shorter. When it has looked everywhere without finding
 *   one, the solution it has is the shortest there is (half-turn metric: R2 is one move).
 *   That can take minutes, but a solution of the usual 17 to 19 moves comes in seconds.
 * `solution` is `''` when the cube is already solved. Only for the sizes in SOLVER_SIZES.
 */
class CubeSearch {
  /** The shortest solution found so far. */
  solution: string;
  /** Whether `solution` is known to be the shortest there is, so the search is over. */
  shortest = false;
  /** The moves the cube was solved after. */
  readonly scramble: string;
  #facelets = '';
  #search: Search | undefined;

  constructor(size: number, moves: string) {
    this.scramble = moves;
    if (size === 2) {
      // The solver keeps the D L B corner still, so hold the cube by that corner.
      const n = 4;
      const facelets = holdBy(cubeFacelets(2, moves), [3, 4, 5], [3 * n + 2, 4 * n + 2, 5 * n + 3]);
      const solution = scramble222.solveFacelet(facelets);
      if (solution === null) throw new Error(`Can't solve this 2x2x2: "${moves}"`);
      this.solution = solution;
      this.shortest = true;
      return;
    }
    if (size !== 3) throw new Error(`No solver for ${size}x${size}x${size} cubes yet`);
    // The centers say which face is which, even after rotations or slice moves.
    const facelets = holdBy(cubeFacelets(3, moves), [0, 1, 2], [4, 13, 22]);
    this.#facelets = facelets.map((f) => FACES[f]).join('');
    this.#search = new min2phase.Search();
    const first = this.#search.solution(this.#facelets);
    if (first.startsWith('Error')) throw new Error(`Can't solve this 3x3x3: "${moves}"`);
    this.solution = '';
    this.#found(first);
  }

  /**
   * Searches a little more (well under 0.2 s each time min2phase is asked). Returns whether
   * `solution` got shorter or is now known to be the shortest.
   */
  step(): boolean {
    if (this.shortest) return false;
    // Carry on where the last step stopped.
    const result = this.#search!.next(PROBES_PER_STEP, 0, 0);
    // Error 8: not done looking yet.
    if (result === 'Error 8') return false;
    // Error 7: looked everywhere without finding anything shorter.
    if (result === 'Error 7') this.shortest = true;
    else this.#found(result);
    return true;
  }

  /**
   * Takes `result`, a solution from min2phase, and asks for one at least a move shorter,
   * taking that too if it comes at once, and so on.
   */
  #found(result: string): void {
    for (;;) {
      this.solution = this.#read(result);
      const length = this.solution ? this.solution.split(' ').length : 0;
      if (length === 0) {
        this.shortest = true;
        return;
      }
      result = this.#search!.solution(this.#facelets, length - 1, PROBES_PER_STEP, 0, 0);
      if (result === 'Error 8') return;
      if (result === 'Error 7') {
        this.shortest = true;
        return;
      }
    }
  }

  /** min2phase pads its moves to two characters, e.g. "U  R2". */
  #read(solution: string): string {
    return solution.trim().replace(/ +/g, ' ');
  }
}

export { SOLVER_SIZES, CubeSearch };
