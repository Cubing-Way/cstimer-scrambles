import { describe, expect, it } from 'vitest';
import { Puzzle } from '../src/index.js';

/** A 3x3x3 scrambled with `scramble` and solved with `solution`. */
function cube(scramble: string, solution = ''): Puzzle {
  return new Puzzle('333').setScramble(scramble).setSolution(solution);
}

describe('solution options', () => {
  it('count every move by default, as before', () => {
    const puzzle = cube('R U', "x y' M2 r U' R'");
    expect(puzzle.getSolutionMoveCount()).toBe(6);
    expect(puzzle.getCountRotations()).toBe(true);
    expect(puzzle.getSliceMoves()).toBe('one-move');
    expect(puzzle.getWideMoves()).toBe('Rw-or-r');
    expect(puzzle.getFmcMode()).toBe(false);
    expect(puzzle.getInvalidMoves()).toEqual([]);
  });

  it('leave rotations out of the count', () => {
    const puzzle = cube('', "x y2 z' R U").setCountRotations(false);
    expect(puzzle.getSolutionMoveCount()).toBe(2);
  });

  it('count slice moves as 2, or don’t allow them', () => {
    const puzzle = cube('', "M2 S E' R").setSliceMoves('two-moves');
    expect(puzzle.getSolutionMoveCount()).toBe(7);
    expect(puzzle.getInvalidMoves()).toEqual([]);
    puzzle.setSliceMoves('not-allowed');
    expect(puzzle.getInvalidMoves()).toEqual(['M2', 'S', "E'"]);
    expect(() => puzzle.setSliceMoves('three' as never)).toThrow(/Unknown slice moves/);
  });

  it('allow wide moves only as Rw', () => {
    const puzzle = cube('', "Rw r' 3Rw2 u").setWideMoves('Rw-only');
    expect(puzzle.getInvalidMoves()).toEqual(["r'", 'u']);
    expect(() => puzzle.setWideMoves('r' as never)).toThrow(/Unknown wide moves/);
  });

  it('mark moves csTimer can’t read as invalid', () => {
    expect(cube('', 'R Q U').getInvalidMoves()).toEqual(['Q']);
  });

  it('use the FMC rules in FMC mode, and keep the other options', () => {
    const puzzle = cube('', "x R M r Rw'").setFmcMode(true);
    expect(puzzle.getSolutionMoveCount()).toBe(4);
    expect(puzzle.getInvalidMoves()).toEqual(['M', 'r']);
    puzzle.setFmcMode(false);
    expect(puzzle.getSolutionMoveCount()).toBe(5);
    expect(puzzle.getInvalidMoves()).toEqual([]);
  });

  it('leave puzzles other than the cubes as they were', () => {
    const pyraminx = new Puzzle('pyram').setScramble("R U L'").setSolution("L U' R'");
    pyraminx.setCountRotations(false).setFmcMode(true);
    expect(pyraminx.getSolutionMoveCount()).toBe(3);
    expect(pyraminx.getInvalidMoves()).toEqual([]);
    expect(pyraminx.getSolveStatus()).toBeUndefined();
  });
});

describe('solve status', () => {
  it('is solved when the solution undoes the scramble, in any orientation', () => {
    expect(new Puzzle('333').getSolveStatus()).toBe('solved');
    expect(cube("R U F'", "F U' R'").getSolveStatus()).toBe('solved');
    expect(cube("R U F'", "F U' R' x y").getSolveStatus()).toBe('solved');
    // R L' is the cube turned (x) with its M slice turned, so M' leaves it solved.
    expect(cube("R L'", "M'").getSolveStatus()).toBe('solved');
  });

  it('is +2 one outer turn away, and DNF further', () => {
    expect(cube("R U F'", "F U'").getSolveStatus()).toBe('+2');
    expect(cube("R2 U F'", "F U'").getSolveStatus()).toBe('+2');
    expect(cube("R U F'", 'F').getSolveStatus()).toBe('DNF');
    // An M turn is two outer turns (R and L), so not a +2.
    expect(cube('M', '').getSolveStatus()).toBe('DNF');
    // A wide turn is one outer block turn.
    expect(cube('Rw U', "U'").getSolveStatus()).toBe('+2');
  });

  it('is never +2 in FMC mode', () => {
    expect(cube("R U F'", "F U'").setFmcMode(true).getSolveStatus()).toBe('DNF');
  });

  it('is DNF with a move that isn’t allowed', () => {
    expect(cube('M', "M'").getSolveStatus()).toBe('solved');
    expect(cube('M', "M'").setFmcMode(true).getSolveStatus()).toBe('DNF');
    expect(cube('R', "r' M").setWideMoves('Rw-only').getSolveStatus()).toBe('DNF');
  });

  it('works on the big cubes', () => {
    const puzzle = new Puzzle('555').setScramble("3Rw U 2Fw'").setSolution("2Fw U'");
    expect(puzzle.getSolveStatus()).toBe('+2');
    puzzle.setSolution("2Fw U' 3Rw'");
    expect(puzzle.getSolveStatus()).toBe('solved');
  });
});
