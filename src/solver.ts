// Computer solutions from csTimer's own solvers: its optimal 2x2x2, Pyraminx and Skewb
// solvers, min2phase (two-phase 3x3x3 solver, used to search for the shortest solution),
// and its 4x4x4, Square-1 and FTO solvers, which solve in phases. Computer solutions, not a
// human method.

import image from './vendor/cstimer/image.js';
import min2phase from './vendor/cstimer/min2phase.js';
import type { Search } from './vendor/cstimer/min2phase.js';
import scramble222 from './vendor/cstimer/2x2x2.js';
import scramble444 from './vendor/cstimer/scramble_444.js';
import pyraminx from './vendor/cstimer/pyraminx.js';
import skewb from './vendor/cstimer/skewb.js';
import sq1 from './vendor/cstimer/scramble_sq1_new.js';
import type { SqCubie } from './vendor/cstimer/scramble_sq1_new.js';
import ftosolver from './vendor/cstimer/ftocta.js';
import type { FtoCubie } from './vendor/cstimer/ftocta.js';
import type { CoordSolver } from './vendor/cstimer/mathlib.js';

/**
 * How a puzzle's solver solves:
 * - `'fewest-moves'`: always a solution with the fewest moves there are, at once.
 * - `'search'`: a solution at once, then shorter ones for as long as it may search.
 * - `'phases'`: one solution, made in phases (like a person solving step by step), so
 *   usually longer than the shortest.
 */
type SolverKind = 'fewest-moves' | 'search' | 'phases';

/**
 * The puzzles with a solver, by Puzzle id: how it solves, and the csTimer puzzle type of
 * the moves it reads (`tools.puzzleType` of a scramble type).
 */
const SOLVERS: Readonly<Record<string, { kind: SolverKind; notation: string }>> = {
  '222': { kind: 'fewest-moves', notation: '222' },
  '333': { kind: 'search', notation: '333' },
  '444': { kind: 'phases', notation: '444' },
  pyram: { kind: 'fewest-moves', notation: 'pyr' },
  skewb: { kind: 'fewest-moves', notation: 'skb' },
  sq1: { kind: 'phases', notation: 'sq1' },
  fto: { kind: 'phases', notation: 'fto' },
};

/** A solve in progress: see `CubeSearch`. Solvers that don't search are done at once. */
interface PuzzleSearch {
  /** The shortest solution found so far. */
  solution: string;
  /** Whether `solution` is known to be the shortest there is. */
  shortest: boolean;
  /** Whether the solver has nothing more to look for. */
  done: boolean;
  /** The moves the puzzle was solved after. */
  readonly scramble: string;
  /** Searches a little more. Returns whether `solution` or `shortest` changed. */
  step(): boolean;
}

/** Face order of min2phase's facelet strings; a face's opposite is 3 places further. */
const FACES = 'URFDLB';
/** Face order of csTimer's stickers (see `image.nnnPosit`). */
const CSTIMER_FACES = 'DLBURF';

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
 * The moves that undo `moves`: in reverse order, each turned the other way. For moves
 * written like `R`, `R'` and `R2` (and `Rw`, `BR`, ...).
 */
function invertMoves(moves: string): string {
  return moves
    .split(/\s+/)
    .filter(Boolean)
    .reverse()
    .map((move) =>
      move.endsWith("'") ? move.slice(0, -1) : move.endsWith('2') ? move : move + "'",
    )
    .join(' ');
}

/** The 24 ways to hold a cube, as rotations from the way it is held. */
const ROTATIONS = ['', 'y', 'y2', "y'"].flatMap((y) =>
  ['', 'x', 'x2', "x'", 'z', "z'"].map((xz) => `${xz} ${y}`.trim()),
);

/**
 * `moves` done after `rotation` instead of before it: each face letter is renamed to the
 * face the rotation turns it into, so `rotation` then `moves` is the renamed moves then
 * `rotation`.
 */
function moveRotationLast(moves: string, rotation: string): string {
  if (!rotation) return moves;
  const undo = invertMoves(rotation);
  const name: Record<string, string> = {};
  for (const face of FACES) {
    const turned = cubeFacelets(3, `${rotation} ${face} ${undo}`).join();
    name[face] = [...FACES].find((other) => cubeFacelets(3, other).join() === turned)!;
  }
  return moves.replace(/[URFDLB]/g, (face) => name[face]!);
}

/**
 * A solution of a 4x4x4 after `moves`, with csTimer's three-phase reduction solver
 * (centers, then edges, then the cube is solved as a 3x3x3 with min2phase): outer and wide
 * (Rw) turns, about 45 moves. It leaves the cube solved, though maybe held another way, as
 * a 4x4x4 has no centers that stay put. The first solve takes a second or two while the
 * solver sets up.
 */
function solve444(moves: string): string {
  const facelets = cubeFacelets(4, moves);
  if (facelets.every((face, i) => face === facelets[i - (i % 16)])) return '';
  // genFacelet gives moves that make the state from a solved cube, as held some way:
  // `made` and then one of the rotations.
  const made = scramble444.genFacelet(facelets.map((f) => FACES[f]).join(''));
  const state = facelets.join();
  const rotation = ROTATIONS.find((r) => cubeFacelets(4, `${made} ${r}`).join() === state);
  if (rotation === undefined) throw new Error(`Can't solve this 4x4x4: "${moves}"`);
  // So the rotation undone and then `made` undone solves it; done with the rotation last,
  // which can then be left out.
  return moveRotationLast(invertMoves(made), invertMoves(rotation));
}

/**
 * A search for the shortest solution of a size x size x size cube after `moves` (cube
 * notation as csTimer reads it, rotations and wide moves included), for the cube as it is
 * held after them. It holds a solution from the start and finds shorter ones step by step:
 * - 2x2x2: csTimer's optimal solver (only U, R and F turns), so the first is the shortest.
 * - 3x3x3: min2phase finds a solution of at most 21 face turns, then is asked again and
 *   again for one at least a move shorter. When it has looked everywhere without finding
 *   one, the solution it has is the shortest there is (half-turn metric: R2 is one move).
 *   That can take minutes, but a solution of the usual 17 to 19 moves comes in seconds.
 * - 4x4x4: one solution from csTimer's reduction solver (see `solve444`).
 * `solution` is `''` when the cube is already solved. Only for 2x2x2 to 4x4x4.
 */
class CubeSearch implements PuzzleSearch {
  solution: string;
  shortest = false;
  done = false;
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
      this.shortest = this.done = true;
      return;
    }
    if (size === 4) {
      this.solution = solve444(moves);
      this.done = true;
      return;
    }
    if (size !== 3) throw new Error(`No solver for ${size}x${size}x${size} cubes`);
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
    if (this.done) return false;
    // Carry on where the last step stopped.
    const result = this.#search!.next(PROBES_PER_STEP, 0, 0);
    // Error 8: not done looking yet.
    if (result === 'Error 8') return false;
    // Error 7: looked everywhere without finding anything shorter.
    if (result === 'Error 7') this.shortest = this.done = true;
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
        this.shortest = this.done = true;
        return;
      }
      result = this.#search!.solution(this.#facelets, length - 1, PROBES_PER_STEP, 0, 0);
      if (result === 'Error 8') return;
      if (result === 'Error 7') {
        this.shortest = this.done = true;
        return;
      }
    }
  }

  /** min2phase pads its moves to two characters, e.g. "U  R2". */
  #read(solution: string): string {
    return solution.trim().replace(/ +/g, ' ');
  }
}

/** A solve by a solver that doesn't search further: done at once. */
class DoneSearch implements PuzzleSearch {
  shortest: boolean;
  done = true;
  constructor(
    readonly scramble: string,
    public solution: string,
    shortest: boolean,
  ) {
    this.shortest = shortest;
  }
  step(): boolean {
    return false;
  }
}

/** The moves of `moves`, each checked against `move`; throws on any other text. */
function readMoves(puzzle: string, moves: string, move: RegExp): RegExpExecArray[] {
  return moves
    .split(/\s+/)
    .filter(Boolean)
    .map((text) => {
      const read = move.exec(text);
      if (!read) throw new Error(`The ${puzzle} solver can't read "${text}"`);
      return read;
    });
}

/** Does `axis` `times` times on a csTimer solver state (one coordinate per table). */
function turnCoords(solver: CoordSolver, state: number[], axis: number, times: number): number[] {
  for (let i = 0; i < times; i++) state = state.map((coord, t) => solver.move[t]![axis]![coord]!);
  return state;
}

/**
 * The fewest moves that solve a Pyraminx after `moves` (U L R B turns and u l r b tips,
 * clockwise or with '), with csTimer's optimal solver: the big turns first, then the tips.
 */
function solvePyraminx(moves: string): string {
  const solver = pyraminx.solver;
  solver.init();
  let state = [0, 0];
  // How far each tip is turned from the piece under it, in thirds of a turn.
  const tips = [0, 0, 0, 0];
  for (const [, face, prime] of readMoves('Pyraminx', moves, /^([ULRBulrb])(')?$/)) {
    const axis = 'ULRB'.indexOf(face!.toUpperCase());
    const times = prime ? 2 : 1;
    if (face === face!.toUpperCase()) state = turnCoords(solver, state, axis, times);
    else tips[axis] = (tips[axis]! + times) % 3;
  }
  const solution = solver
    .search(state, 0)!
    .map(([axis, power]) => 'ULRB'[axis]! + (power ? "'" : ''));
  tips.forEach((turned, axis) => {
    if (turned) solution.push('ulrb'[axis]! + (turned === 1 ? "'" : ''));
  });
  return solution.join(' ');
}

/**
 * csTimer's Skewb solver turns around four corners that never move, while R, U and L turn
 * around three of them and B around a fourth that does move: a B turn is the solver's turn
 * around the opposite corner, plus turning the whole puzzle. So which solver turn a letter
 * stands for changes after each B (as in csTimer's skewb.js, which writes its scrambles
 * this way). Takes the letters for solver turns 0 to 3 and turns them for `times` B turns.
 */
function turnSkewbLetters(letters: string[], times: number): void {
  for (let i = 0; i < times; i++) {
    const [a, b, c] = [letters[0]!, letters[3]!, letters[1]!];
    letters[3] = a;
    letters[1] = b;
    letters[0] = c;
  }
}

/** The fewest moves that solve a Skewb after `moves` (WCA notation: R U L B, with '). */
function solveSkewb(moves: string): string {
  const solver = skewb.solver;
  solver.init();
  let state = [0, 0];
  const letters = ['L', 'R', 'B', 'U'];
  for (const [, face, prime] of readMoves('Skewb', moves, /^([RULB])(')?$/)) {
    const axis = letters.indexOf(face!);
    state = turnCoords(solver, state, axis, prime ? 2 : 1);
    if (axis === 2) turnSkewbLetters(letters, prime ? 2 : 1);
  }
  const solution: string[] = [];
  for (const [axis, power] of solver.search(state, 0)!) {
    solution.push(letters[axis]! + (power ? "'" : ''));
    if (axis === 2) turnSkewbLetters(letters, power + 1);
  }
  return solution.join(' ');
}

/** Square-1 turns and slashes: `(1,0)` turns the top 30° clockwise, `/` is a slice. */
const SQ1_MOVE = /\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)|\//g;

/** The turns and slashes of Square-1 moves: [top, bottom] for a turn, null for a slash. */
function readSq1(moves: string): ([number, number] | null)[] {
  const leftover = moves.replace(SQ1_MOVE, '').replace(/`/g, '').trim();
  if (leftover) throw new Error(`The Square-1 solver can't read "${leftover.split(/\s+/)[0]}"`);
  return [...moves.matchAll(SQ1_MOVE)].map((m) => (m[0] === '/' ? null : [+m[1]!, +m[2]!]));
}

/**
 * A solution of a Square-1 after `moves`, with csTimer's two-phase solver (cube shape
 * first, then the pieces), written like csTimer's scrambles: `(1,0)/ (-3,0)/ ...`.
 */
function solveSq1(moves: string): string {
  const cube: SqCubie = new sq1.SqCubie();
  const solved = cube.toString();
  // As in csTimer's image.js: a turn by n twelfths of a circle is doMove(n) on top and
  // doMove(-n) on the bottom, 0 is a slice.
  for (const move of readSq1(moves)) {
    if (move === null) {
      cube.doMove(0);
      continue;
    }
    const [top, bottom] = move.map((n) => ((n % 12) + 12) % 12) as [number, number];
    if (top) cube.doMove(top);
    if (bottom) cube.doMove(-bottom);
  }
  if (cube.toString() === solved) return '';
  // The solver gives moves that make the state from a solved Square-1, so undo those.
  // Turns are written from -5 to 6, like csTimer's own scrambles.
  const turn = (n: number) => ((((-n + 5) % 12) + 12) % 12) - 5;
  return readSq1(sq1.solve(cube))
    .reverse()
    .map((move) => (move === null ? '/' : ` (${turn(move[0])},${turn(move[1])})`))
    .join('')
    .trim();
}

/** csTimer's FTO face turns, in the order of its solver's moves. */
const FTO_FACES = ['U', 'F', 'BR', 'BL', 'D', 'B', 'R', 'L'];

/**
 * A solution of an FTO after `moves` (U F BR BL D B R L turns, with '), with csTimer's
 * three-phase solver. The first solve takes a moment while the solver sets up.
 */
function solveFto(moves: string): string {
  const { FtoCubie } = ftosolver;
  let cube: FtoCubie = new FtoCubie();
  for (const [, face, prime] of readMoves('FTO', moves, /^(U|F|BR|BL|D|B|R|L)(')?$/)) {
    const move = FtoCubie.moveCube[FTO_FACES.indexOf(face!) * 2 + (prime ? 1 : 0)]!;
    cube = FtoCubie.FtoMult(cube, move, null);
  }
  if (cube.isEqual(new FtoCubie())) return '';
  const solution = ftosolver.solveFacelet(cube.toFaceCube(), false);
  if (!/^[A-Z' ]*$/.test(solution)) throw new Error(`Can't solve this FTO: "${moves}"`);
  return solution;
}

/** Starts solving puzzle `id` (one of SOLVERS) after `moves`, written in its notation. */
function startSearch(id: string, moves: string): PuzzleSearch {
  switch (id) {
    case '222':
      return new CubeSearch(2, moves);
    case '333':
      return new CubeSearch(3, moves);
    case '444':
      return new CubeSearch(4, moves);
    case 'pyram':
      return new DoneSearch(moves, solvePyraminx(moves), true);
    case 'skewb':
      return new DoneSearch(moves, solveSkewb(moves), true);
    case 'sq1':
      return new DoneSearch(moves, solveSq1(moves), false);
    case 'fto':
      return new DoneSearch(moves, solveFto(moves), false);
    default:
      throw new Error(`No solver for puzzle "${id}"`);
  }
}

export { SOLVERS, startSearch };
export type { PuzzleSearch, SolverKind };
