import { describe, expect, it } from 'vitest';
import { Puzzle } from '../src/index.js';

describe('Puzzle.solve', () => {
  it('solves random-state 2x2x2 and 3x3x3 scrambles', () => {
    for (const id of ['222', '333']) {
      const puzzle = new Puzzle(id);
      for (let i = 0; i < 5; i++) {
        puzzle.scramble();
        const solution = puzzle.solve();
        expect(puzzle.getSolution()).toBe(solution);
        expect(puzzle.getSolveStatus()).toBe('solved');
      }
    }
  });

  it('finds the fewest moves on 2x2x2', () => {
    expect(new Puzzle('222').setScramble("R U R'").solve()).toBe("R U' R'");
    expect(new Puzzle('222').setScramble('R2 F2').solve().split(' ')).toHaveLength(2);
  });

  it('stays within 21 face turns on 3x3x3', () => {
    const puzzle = new Puzzle('333');
    for (let i = 0; i < 5; i++) {
      puzzle.scramble();
      expect(puzzle.solve().split(' ').length).toBeLessThanOrEqual(21);
    }
  });

  it('solves scrambles with rotations, wide and slice moves', () => {
    const cube = new Puzzle('333').setScramble("x Rw U M' y S E2 z Fw' R2 D");
    cube.solve();
    expect(cube.getSolveStatus()).toBe('solved');
    const small = new Puzzle('222').setScramble("x R U' y F2 z' D L'");
    small.solve();
    expect(small.getSolveStatus()).toBe('solved');
  });

  it('replaces a solution typed before, and gives "" when already solved', () => {
    const cube = new Puzzle('333').setScramble('R U').setSolution('F');
    expect(cube.solve()).toBe("U' R'");
    expect(new Puzzle('333').setScramble('x y').solve()).toBe('');
  });

  it('only works where there is a solver', () => {
    expect(new Puzzle('444').hasSolver()).toBe(false);
    expect(new Puzzle('pyram').hasSolver()).toBe(false);
    expect(() => new Puzzle('444').solve()).toThrow();
    expect(new Puzzle('333').hasSolver()).toBe(true);
    expect(new Puzzle('222').hasSolver()).toBe(true);
    expect(new Puzzle('333').setScrambleType('pll').hasSolver()).toBe(true);
  });
});
