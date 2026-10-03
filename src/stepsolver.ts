// csTimer's step solvers (its Tools > Solvers panel): the shortest way to do one step of a
// solve, like the cross or a Roux first block, or every step of a method in turn. They are
// csTimer's own code; csTimer writes the answers into its page, so here they are written
// into stand-in elements (see vendor/cstimer/toolsui.js) and read back.

import cross from './vendor/cstimer/cross.js';
import cubeutil from './vendor/cstimer/cubeutil.js';
import eoline from './vendor/cstimer/eoline.js';
import gsolver from './vendor/cstimer/gsolver.js';
import mathlib from './vendor/cstimer/mathlib.js';
import type { GSolver } from './vendor/cstimer/mathlib.js';
import roux1 from './vendor/cstimer/roux1.js';
import thistlethwaite from './vendor/cstimer/thistlethwaite.js';
import toolsui from './vendor/cstimer/toolsui.js';
import type { Elem } from './vendor/cstimer/toolsui.js';

/**
 * csTimer's step solvers, by the id csTimer gives them (the same names as in its tools
 * panel, where the cross solver's x, xx and 3x buttons are separate ids here):
 * - `'cross'`, `'xcross'`, `'xxcross'`, `'xxxcross'`: the cross, alone or with 1, 2 or 3
 *   F2L pairs, on each of the 6 faces (the best pairs for each face).
 * - `'eoline'`, `'eocross'`: ZZ's EOLine or EOCross, for each of the 12 ways to hold the cube.
 * - `'roux1'`: Roux's first block, in each of its 4 places.
 * - `'333222'`: a 2x2x2 block on each of the 8 corners.
 * - `'333cf'`: cross, then F2L pair by pair (CFOP's first two layers).
 * - `'333roux'`: Roux's first and second blocks.
 * - `'333petrus'`: Petrus's 2x2x2 block, then 2x2x3 block.
 * - `'333zz'`: ZZ's EOLine, then its F2L in two halves.
 * - `'333eodr'`: edge orientation, then domino reduction (FMC).
 * - `'333thistle'`: EO, DR, HTR and then solved (FMC), with other options for each step.
 * - `'222face'`: one face of a 2x2x2, for each of the 6 faces.
 * - `'sq1cs'`: a Square-1's shape (cube shape), then its colors.
 * - `'pyrv'`: a Pyraminx V (a face without one edge) on each of the 4 faces.
 * - `'skbl1'`: one face of a Skewb (its first layer), for each of the 6 faces.
 */
type StepSolverId =
  | 'cross'
  | 'xcross'
  | 'xxcross'
  | 'xxxcross'
  | 'eoline'
  | 'eocross'
  | 'roux1'
  | '333222'
  | '333cf'
  | '333roux'
  | '333petrus'
  | '333zz'
  | '333eodr'
  | '333thistle'
  | '222face'
  | 'sq1cs'
  | 'pyrv'
  | 'skbl1';

interface StepSolverInfo {
  id: StepSolverId;
  /** The name csTimer shows for it. */
  name: string;
  /** The puzzle it is for, as csTimer names puzzles (`'333'`, `'222'`, `'sq1'`, `'pyr'`, `'skb'`). */
  puzzle: string;
  /** Whether it holds the cube the way `Puzzle.setStepOrientation` says. */
  orientation: boolean;
  /** Whether `Puzzle.setStepNiss` changes it. */
  niss: boolean;
}

/**
 * One line of a step solver's answer.
 * - `label`: what the line solves, as csTimer labels it: the face or place (e.g. `'D'` for a
 *   cross on D, `'D(LR)'` for an EOLine on D along L and R, `'LU'`), or the step of a method
 *   (e.g. `'Cross'`, `'F2L-1'`, `'EO (fb)'`, with the axis it was done on).
 * - `rotation`: the cube rotation to do before the moves, e.g. `'z2'`, `''` for none.
 * - `moves`: the moves, `''` when the step is already done (a skip), `null` when csTimer
 *   found nothing within the most moves it tries. Each line of a method follows the lines
 *   before it.
 * - `alternatives`: only for `'333thistle'`: other ways to do that step, as more lines.
 */
interface StepSolution {
  label: string;
  rotation: string;
  moves: string | null;
  alternatives?: StepSolution[];
}

const STEP_SOLVERS: readonly StepSolverInfo[] = [
  ['cross', 'Cross', '333'],
  ['xcross', 'XCross', '333'],
  ['xxcross', 'XXCross', '333'],
  ['xxxcross', 'XXXCross', '333'],
  ['eoline', 'EOLine', '333'],
  ['eocross', 'EOCross', '333'],
  ['roux1', 'Roux S1', '333'],
  ['333222', '2x2x2', '333'],
  ['333cf', 'Cross + F2L', '333', true],
  ['333roux', 'Roux S1 + S2', '333', true],
  ['333petrus', '2x2x2 + 2x2x3', '333', true],
  ['333zz', 'EOLine + ZZF2L', '333', true],
  ['333eodr', 'EO + DR', '333', true],
  ['333thistle', 'EO DR HTR OK', '333', false, true],
  ['222face', '2x2x2 face', '222'],
  ['sq1cs', 'SQ1 S1 + S2', 'sq1'],
  ['pyrv', 'Pyraminx V', 'pyr'],
  ['skbl1', 'Skewb Face', 'skb'],
].map(([id, name, puzzle, orientation = false, niss = false]) => ({
  id: id as StepSolverId,
  name: name as string,
  puzzle: puzzle as string,
  orientation: orientation as boolean,
  niss: niss as boolean,
}));

/** csTimer's default orientation for its 3x3x3 method solvers: white cross at the bottom. */
const DEFAULT_STEP_ORIENTATION = 'z2';

/** The settings some step solvers read (see `StepSolverInfo`). */
interface StepOptions {
  orientation: string;
  niss: boolean;
}

/** Cube rotations, e.g. "z2 y'", or nothing. */
const ROTATIONS = /^\s*([xyz][2']?\s*)*$/;

/** Writes rotations with single spaces, e.g. "z2&nbsp;y" -> "z2 y". */
function cleanRotation(text: string): string {
  return (text.replace(/&nbsp;/g, ' ').match(/[xyz][2']?/g) ?? []).join(' ');
}

/** csTimer's moves (e.g. ["R ", "U2"]) as one string. */
function joinMoves(moves: string[]): string {
  return moves
    .map((move) => move.trim())
    .filter(Boolean)
    .join(' ');
}

/** Square-1 moves from csTimer's tool ("/", "3,0/") in scramble notation: "/ (3,0) /". */
function sq1Moves(moves: string[]): string {
  return moves
    .map((move) => {
      const turn = /^(-?\d+),(-?\d+)\/$/.exec(move.trim());
      return turn ? `(${turn[1]},${turn[2]}) /` : move.trim();
    })
    .join(' ');
}

/**
 * Reads back what a csTimer tool wrote into `elem`: one line per "<br>", each "label:
 * rotation" text followed by a solution. Lines without a solution (like csTimer's
 * orientation picker) are left out.
 */
function readLines(elem: Elem, writeMoves: (moves: string[]) => string): StepSolution[] {
  const lines: StepSolution[] = [];
  let text = '';
  let moves: string | null | undefined;
  const endLine = (): void => {
    const plain = text.replace(/&nbsp;/g, ' ');
    if (moves === undefined && /no solution found/.test(plain)) moves = null;
    if (moves === undefined && /\(skip\)/.test(plain)) moves = '';
    const colon = plain.indexOf(':');
    if (moves !== undefined && colon >= 0) {
      const rotation = plain.slice(colon + 1).replace(/\(.*\)|no solution found/g, '');
      lines.push({ label: plain.slice(0, colon).trim(), rotation: cleanRotation(rotation), moves });
    }
    text = '';
    moves = undefined;
  };
  const read = (item: Elem['children'][number]): void => {
    if (typeof item === 'string') {
      if (item === '<br>') endLine();
      else text += item;
    } else if ('solution' in item) {
      moves = writeMoves(item.solution);
    } else {
      item.children.forEach(read);
    }
  };
  elem.children.forEach(read);
  return lines;
}

/** Runs a csTimer tool that writes into an element, and reads its answer back. */
function runTool(
  tool: (elem: Elem) => void,
  writeMoves: (moves: string[]) => string = joinMoves,
): StepSolution[] {
  const elem = toolsui.$('<span>');
  tool(elem);
  return readLines(elem, writeMoves);
}

/**
 * The cross solver's lines: one per face (only the faces in `only`, if given), with
 * `solve` giving the moves for each face.
 */
function crossLines(solve: (face: number) => string[], only?: readonly string[]): StepSolution[] {
  const lines: StepSolution[] = [];
  cross.faces.forEach((label, face) => {
    if (only && !only.includes(label)) return;
    lines.push({
      label,
      rotation: cleanRotation(cross.rotations[face]!),
      moves: joinMoves(solve(face)),
    });
  });
  return lines;
}

const THISTLE_STEPS = ['EO', 'DR', 'HTR', 'OK'];

/** A line of the EO DR HTR solver, from csTimer's text like "fb: (R') U F". */
function thistleLine(step: string, solution: string): StepSolution {
  const text = thistlethwaite.toPrettyStyle(solution.trim());
  const axis = /^(\w+):\s*(.*)$/.exec(text);
  return {
    label: axis ? `${step} (${axis[1]})` : step,
    rotation: '',
    moves: (axis ? axis[2]! : text).replace(/\s+/g, ' ').trim(),
  };
}

/** Checks that `scramble` only has the moves csTimer's tool reads right. */
function checkMoves(scramble: string, allowed: RegExp, what: string): void {
  if (!allowed.test(scramble)) {
    throw new Error(`The step solvers only read ${what}, not "${scramble}"`);
  }
}

/** Face turns of a 3x3x3 (csTimer's step solvers don't read wide moves, slices or rotations). */
const FACE_TURNS = /^[URFDLB2' ]*$/;

/**
 * The answer of csTimer's step solver `id` for a puzzle after `scramble` (in the notation
 * of the puzzle's csTimer scrambles), only the lines labelled as in `only` if given. See
 * `StepSolverId` for what each one solves.
 */
function solveStep(
  id: StepSolverId,
  scramble: string,
  options: StepOptions,
  only?: readonly string[],
): StepSolution[] {
  const lines = solveAll(id, scramble, options, only);
  return only ? lines.filter((line) => only.includes(line.label)) : lines;
}

/** `solveStep`'s answer, with every line except for the cross solvers, which skip faces. */
function solveAll(
  id: StepSolverId,
  scramble: string,
  options: StepOptions,
  only?: readonly string[],
): StepSolution[] {
  const info = STEP_SOLVERS.find((solver) => solver.id === id);
  if (!info) throw new Error(`Unknown step solver "${id}"`);
  if (info.puzzle === '333') checkMoves(scramble, FACE_TURNS, 'U, R, F, D, L and B turns');
  if (info.puzzle === '222') checkMoves(scramble, /^[URF2' ]*$/, 'U, R and F turns on a 2x2x2');
  switch (id) {
    case 'cross':
    case 'xcross':
    case 'xxcross':
    case 'xxxcross': {
      const moves = cubeutil.parseScramble(scramble, 'FRUBLD');
      if (id === 'cross') {
        const solutions = cross.solve(moves);
        return crossLines((face) => solutions[face]!, only);
      }
      if (id === 'xcross') return crossLines((face) => cross.xcross(moves, face), only);
      return crossLines((face) => cross.xxcross(moves, face, id === 'xxxcross'), only);
    }
    case 'eoline':
    case 'eocross':
      return runTool((elem) => eoline.solve(scramble, id === 'eocross', elem));
    case 'roux1':
      return runTool((elem) => roux1.solve(scramble, elem));
    case '333thistle': {
      const steps = thistlethwaite.fillStepsCandidates(scramble, [], options.niss, true, 5);
      return steps.map((candidates, i) => {
        const [first, ...others] = candidates.map((c) => thistleLine(THISTLE_STEPS[i]!, c));
        return { ...first!, alternatives: others };
      });
    }
    case '222face':
      return runTool((elem) => gsolver.pocketCube(scramble, elem));
    case 'sq1cs':
      return runTool((elem) => gsolver.sq1Cube(scramble, elem), sq1Moves);
    case 'pyrv':
      return runTool((elem) => gsolver.pyraCube(scramble, elem));
    case 'skbl1':
      return runTool((elem) => gsolver.skewbCube(scramble, elem));
    default: {
      // 333222, 333cf, 333roux, 333petrus, 333zz and 333eodr.
      if (!info.orientation)
        return runTool((elem) => gsolver.rubiksCube.exec('222', scramble, elem));
      gsolver.rubiksCube.setOri(options.orientation);
      const lines = runTool((elem) => gsolver.rubiksCube.exec(id.slice(3), scramble, elem));
      if (lines[0]) lines[0].rotation = cleanRotation(options.orientation);
      return lines;
    }
  }
}

/** csTimer's patterns for its 3x3x3 general solver, by name (see `solvePattern`). */
const STEP_PATTERNS: Readonly<Record<string, string>> = { ...gsolver.presets };

/** The moves the general solver turns with (csTimer's gsolver.js): face, then axis. */
const PATTERN_MOVES: Record<string, number> = {};
Object.entries({ U: 0x00, R: 0x11, F: 0x22, D: 0x30, L: 0x41, B: 0x52 }).forEach(([face, n]) => {
  for (const turn of " 2'") PATTERN_MOVES[face + turn] = n;
});

/** Search steps per round of `solvePattern` (a millisecond or so each). */
const PATTERN_COST = 1000;

/** The general solver for the last patterns used, which keeps its tables. */
const patternSolvers = new Map<string, GSolver>();

/**
 * The fewest face turns that take a 3x3x3, after `scramble`, to `pattern` (csTimer's
 * "3x3x3 General" solver), or null if none was found within `timeLimit` milliseconds.
 * The pattern is 54 stickers, face by face in U R F D L B order, each face read row by row
 * as in `STEP_PATTERNS`: a face letter is a sticker that must end up where that face's
 * stickers are in the pattern, X, Y and Z mark groups of stickers that must end up within
 * their own group's places (like edges that must be oriented), and "-" is any sticker.
 */
function solvePattern(scramble: string, pattern: string, timeLimit: number): string | null {
  checkMoves(scramble, FACE_TURNS, 'U, R, F, D, L and B turns');
  if (!/^[URFDLBXYZ-]{54}$/.test(pattern)) {
    throw new Error(`A pattern is 54 of U R F D L B X Y Z and -, not "${pattern}"`);
  }
  let solver = patternSolvers.get(pattern);
  if (!solver) {
    if (patternSolvers.size >= 4) patternSolvers.clear();
    solver = new mathlib.gSolver([pattern], gsolver.rubiksCube.move, PATTERN_MOVES);
    patternSolvers.set(pattern, solver);
  }
  let state = pattern;
  for (const [face, , power] of cubeutil.parseScramble(scramble, 'URFDLB')) {
    state = gsolver.rubiksCube.move(state, 'URFDLB'[face!]! + " 2'"[power! - 1]!);
  }
  const maxLength = 30;
  const end = performance.now() + timeLimit;
  let solution = solver.search(state, 0, 0);
  while (!solution && solver.maxl <= maxLength && performance.now() < end) {
    solution = solver.searchNext(maxLength, PATTERN_COST);
  }
  return solution && joinMoves(solution);
}

export {
  STEP_SOLVERS,
  STEP_PATTERNS,
  DEFAULT_STEP_ORIENTATION,
  ROTATIONS,
  solveStep,
  solvePattern,
};
export type { StepSolverId, StepSolverInfo, StepSolution, StepOptions };
