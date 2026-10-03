import { describe, expect, it } from 'vitest';
import { Puzzle } from '../src/index.js';

describe('Puzzle.solve', () => {
  it('solves random-state 2x2x2 and 3x3x3 scrambles', () => {
    for (const id of ['222', '333']) {
      const puzzle = new Puzzle(id).setSolveTimeLimit(200);
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

  it('finds shorter 3x3x3 solutions than the scramble, within the time limit', () => {
    const puzzle = new Puzzle('333').setSolveTimeLimit(500);
    for (let i = 0; i < 3; i++) {
      puzzle.scramble();
      const start = performance.now();
      const length = puzzle.solve().split(' ').length;
      // A step past the limit at most, plus setting up the solver the first time.
      expect(performance.now() - start).toBeLessThan(5000);
      // A random state takes 20 moves at most; csTimer's scrambles stop at 21.
      expect(length).toBeLessThanOrEqual(20);
    }
  });

  it('proves short 3x3x3 solutions are the shortest', () => {
    const cases: [string, number][] = [
      ["R U R' U'", 4],
      ["R U2 R' U' R U' R'", 7],
    ];
    for (const [scramble, length] of cases) {
      const cube = new Puzzle('333').setSolveTimeLimit(Infinity).setScramble(scramble);
      expect(cube.solve().split(' ')).toHaveLength(length);
      expect(cube.isSolutionShortest()).toBe(true);
      expect(cube.getSolveStatus()).toBe('solved');
    }
    // R R R U U U is R' U', so undone in 2 moves.
    const cube = new Puzzle('333').setSolveTimeLimit(Infinity).setScramble('R R R U U U');
    expect(cube.solve()).toBe('U R');
  });

  it('says when a solution is known to be the shortest', () => {
    const cube = new Puzzle('222').setScramble("R U R'");
    expect(cube.isSolutionShortest()).toBe(false);
    cube.solve();
    expect(cube.isSolutionShortest()).toBe(true);
    cube.setSolution("R U' R' U U'");
    expect(cube.isSolutionShortest()).toBe(false);
    expect(() => cube.setSolveTimeLimit(0)).toThrow();
    expect(cube.getSolveTimeLimit()).toBe(3000);
  });

  it('solves without blocking, reporting shorter solutions as it goes', async () => {
    const cube = new Puzzle('333').setSolveTimeLimit(300);
    cube.scramble();
    const found: string[] = [];
    const solution = await cube.solveAsync((s) => found.push(s));
    expect(found[found.length - 1]).toBe(solution);
    expect(cube.getSolution()).toBe(solution);
    expect(cube.getSolveStatus()).toBe('solved');
    const lengths = found.map((s) => s.split(' ').length);
    expect([...lengths].sort((a, b) => b - a)).toEqual(lengths);
  });

  it('stops early, and leaves a changed scramble alone', async () => {
    const cube = new Puzzle('333').setSolveTimeLimit(Infinity);
    cube.scramble();
    const running = cube.solveAsync();
    cube.stopSolving();
    expect((await running).length).toBeGreaterThan(0);
    expect(cube.getSolveStatus()).toBe('solved');
    const other = new Puzzle('333').setSolveTimeLimit(200);
    other.scramble();
    const later = other.solveAsync();
    other.setScramble('R U');
    await later;
    expect(other.getSolution()).toBe('');
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
    expect(cube.isSolutionShortest()).toBe(true);
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
