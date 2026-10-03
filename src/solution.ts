// Rules for a solution typed on a cube: which moves are allowed, how they are counted, and
// whether the solution solves the cube (solved, +2 or DNF).

import image from './vendor/cstimer/image.js';

/**
 * How the slice moves M, S and E are treated in a solution:
 * - `'one-move'`: allowed, each counted as 1 move (the default, as before).
 * - `'two-moves'`: allowed, each counted as 2 moves, like the two face turns it stands for.
 * - `'not-allowed'`: not allowed, as in WCA Fewest Moves.
 */
type SliceMoves = 'one-move' | 'two-moves' | 'not-allowed';

/**
 * How wide moves may be written in a solution:
 * - `'Rw-or-r'`: as `Rw` or as `r` (the default).
 * - `'Rw-only'`: only as `Rw`, as in WCA Fewest Moves; `r` is not allowed.
 */
type WideMoves = 'Rw-or-r' | 'Rw-only';

/**
 * Whether a solution solves the cube, as a judge would say:
 * - `'solved'`: every face is one color, whichever way the cube is held.
 * - `'+2'`: one more turn of 90° or 180° of an outer block (a face turn like `R2` or a wide
 *   turn like `Rw'`) would solve it. Never in FMC mode.
 * - `'DNF'`: further than that from solved, or the solution has a move that isn't allowed.
 */
type SolveStatus = 'solved' | '+2' | 'DNF';

interface SolutionRules {
  countRotations: boolean;
  sliceMoves: SliceMoves;
  wideMoves: WideMoves;
}

const SLICE_MOVES: readonly SliceMoves[] = ['one-move', 'two-moves', 'not-allowed'];
const WIDE_MOVES: readonly WideMoves[] = ['Rw-or-r', 'Rw-only'];

/** The WCA Fewest Moves rules: rotations are free, no slice moves, wide moves only as `Rw`. */
const FMC_RULES: Readonly<SolutionRules> = {
  countRotations: false,
  sliceMoves: 'not-allowed',
  wideMoves: 'Rw-only',
};

// The moves csTimer reads on a cube, e.g. R, R2, R', Rw, 3Rw, r, x, M (see its cubeutil.js).
const MOVE = /^(?:\d+(?:-\d+)?)?([FRUBLDfrubldxyzSME])w?[2']?$/;

/** The moves in `moves`, without relay numbers like `2)`. */
function splitMoves(moves: string): string[] {
  return moves.split(/\s+/).filter((move) => move && !/^\w+\)$/.test(move));
}

/** How many moves `moves` has under `rules`. Moves csTimer can't read count as 1. */
function countSolutionMoves(moves: string, rules: SolutionRules): number {
  let count = 0;
  for (const move of splitMoves(moves)) {
    const letter = MOVE.exec(move)?.[1];
    if (letter && 'xyz'.includes(letter)) count += rules.countRotations ? 1 : 0;
    else if (letter && 'SME'.includes(letter)) count += rules.sliceMoves === 'two-moves' ? 2 : 1;
    else count += 1;
  }
  return count;
}

/** The moves in `moves` that csTimer can't read or that `rules` don't allow, in order. */
function invalidSolutionMoves(moves: string, rules: SolutionRules): string[] {
  return splitMoves(moves).filter((move) => {
    const letter = MOVE.exec(move)?.[1];
    if (letter === undefined) return true;
    if ('SME'.includes(letter)) return rules.sliceMoves === 'not-allowed';
    if ('frubld'.includes(letter)) return rules.wideMoves === 'Rw-only';
    return false;
  });
}

/** Whether every face of csTimer's sticker list (`size` x `size` per face) is one color. */
function isSolved(posit: number[], size: number): boolean {
  const n = size * size;
  for (let face = 0; face < 6; face++) {
    for (let i = 1; i < n; i++) {
      if (posit[face * n + i] !== posit[face * n]) return false;
    }
  }
  return true;
}

/**
 * Whether the cube of `size` is solved after `moves`, one outer block turn from it ('+2'),
 * or further ('DNF'). With `plusTwo` false it is only ever 'solved' or 'DNF'.
 */
function cubeSolveStatus(size: number, moves: string, plusTwo: boolean): SolveStatus {
  if (isSolved(image.nnnPosit(size, moves), size)) return 'solved';
  if (!plusTwo) return 'DNF';
  // A block turned from R is the rest of the cube turned from L, so R, U and F blocks of
  // every width cover them all (the cube may be solved in any orientation).
  for (const face of ['R', 'U', 'F']) {
    for (let width = 1; width < size; width++) {
      const block = width === 1 ? face : `${width}${face}w`;
      for (const turn of ['', '2', "'"]) {
        if (isSolved(image.nnnPosit(size, `${moves} ${block}${turn}`), size)) return '+2';
      }
    }
  }
  return 'DNF';
}

export {
  SLICE_MOVES,
  WIDE_MOVES,
  FMC_RULES,
  countSolutionMoves,
  invalidSolutionMoves,
  cubeSolveStatus,
};
export type { SliceMoves, WideMoves, SolveStatus, SolutionRules };
