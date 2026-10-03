import { describe, expect, it } from 'vitest';
import { Puzzle } from '../src/index.js';
import type { StepSolution, StepSolverId } from '../src/index.js';

const SCRAMBLE = "R2 U' F2 D B2 L2 U' B2 R2 U2 F' L' D2 U' F2 R D' F' R U' F2";

/** A line's rotation and moves, as one solution. */
function movesOf(line: StepSolution): string {
  return [line.rotation, line.moves].filter(Boolean).join(' ');
}

/** The stickers of a 3x3x3 as one list, U R F D L B, each face row by row. */
function facelets(puzzle: Puzzle): string[] {
  const stickers = puzzle.getStickers();
  return ['U', 'R', 'F', 'D', 'L', 'B'].flatMap((face) => stickers[face]!);
}

/**
 * Whether `solution` after `scramble` leaves the 3x3x3 matching `pattern` (as in
 * getStepPatterns, X and Y groups only checked loosely), for the cube held as the
 * solution's rotations turn it.
 */
function matches(scramble: string, solution: string, pattern: string): boolean {
  const now = facelets(new Puzzle('333').setScramble(scramble).setSolution(solution));
  const rotations = solution.split(' ').filter((move) => /^[xyz]/.test(move));
  const solved = facelets(new Puzzle('333').setSolution(rotations.join(' ')));
  return [...pattern].every((letter, i) => {
    if (letter === '-') return true;
    const allowed = solved.filter((_, j) => pattern[j] === letter);
    return allowed.includes(now[i]!);
  });
}

/**
 * Whether `solution` after `scramble` leaves a Roux first block at the bottom left of the
 * 3x3x3, which needn't line up with the centers of the M slice.
 */
function rouxBlock(scramble: string, solution: string): boolean {
  const stickers = new Puzzle('333').setScramble(scramble).setSolution(solution).getStickers();
  const same = (colors: string[]): boolean => colors.every((color) => color === colors[0]);
  return (
    same(stickers.L!.slice(3)) &&
    same([0, 3, 6].map((i) => stickers.D![i]!)) &&
    same([3, 6].map((i) => stickers.F![i]!)) &&
    same([5, 8].map((i) => stickers.B![i]!))
  );
}

const PATTERNS = new Puzzle('333').getStepPatterns();
/** The four F2L slots solved, one each (from csTimer's Cross + F2L solver). */
const SLOTS = [
  '----U-------RR-RR-----FF-FF-DDDDD-D-----L--L-----B--B-',
  '----U--------R--R----FF-FF-DD-DDD-D-----LL-LL----B--B-',
  '----U--------RR-RR----F--F--D-DDD-DD----L--L----BB-BB-',
  '----U--------R--R-----F--F--D-DDDDD----LL-LL-----BB-BB',
];

describe('Puzzle step solvers', () => {
  const cube = new Puzzle('333').setScramble(SCRAMBLE);

  it('lists the solvers each puzzle has', () => {
    expect(cube.getStepSolvers().map((solver) => solver.id)).toEqual([
      'cross',
      'xcross',
      'xxcross',
      'xxxcross',
      'eoline',
      'eocross',
      'roux1',
      '333222',
      '333cf',
      '333roux',
      '333petrus',
      '333zz',
      '333eodr',
      '333thistle',
    ]);
    expect(new Puzzle('222').getStepSolvers().map((solver) => solver.id)).toEqual(['222face']);
    expect(new Puzzle('sq1').getStepSolvers().map((solver) => solver.id)).toEqual(['sq1cs']);
    expect(new Puzzle('pyram').getStepSolvers().map((solver) => solver.id)).toEqual(['pyrv']);
    expect(new Puzzle('skewb').getStepSolvers().map((solver) => solver.id)).toEqual(['skbl1']);
    expect(new Puzzle('444').getStepSolvers()).toEqual([]);
    expect(() => new Puzzle('444').solveStep('cross')).toThrow();
  });

  it('solves the cross, with 0 to 3 pairs, on every face', () => {
    const pairs: [StepSolverId, number][] = [
      ['cross', 0],
      ['xcross', 1],
      ['xxcross', 2],
      ['xxxcross', 3],
    ];
    for (const [id, count] of pairs) {
      // XXXCross takes several seconds per face, so only one face.
      const lines = id === 'xxxcross' ? cube.solveStep(id, ['D']) : cube.solveStep(id);
      expect(lines.map((line) => line.label)).toEqual(
        id === 'xxxcross' ? ['D'] : ['D', 'U', 'L', 'R', 'F', 'B'],
      );
      for (const line of lines) {
        const solution = movesOf(line);
        expect(matches(SCRAMBLE, solution, PATTERNS['Cross']!)).toBe(true);
        const solved = SLOTS.filter((slot) => matches(SCRAMBLE, solution, slot)).length;
        expect(solved).toBeGreaterThanOrEqual(count);
      }
    }
    const cross = cube.solveStep('cross');
    expect(cross[1]!.rotation).toBe('z2');
    // Every cross takes 8 moves at most.
    expect(cross.every((line) => line.moves!.split(' ').length <= 8)).toBe(true);
    expect(cube.solveStep('eoline', ['U(FB)']).map((line) => line.label)).toEqual(['U(FB)']);
  }, 120_000);

  it('solves EOLine and EOCross 12 ways, and Roux first block 4 ways', () => {
    const eoline = cube.solveStep('eoline');
    expect(eoline).toHaveLength(12);
    expect(eoline[0]).toMatchObject({ label: 'D(LR)', rotation: '' });
    expect(eoline[3]).toMatchObject({ label: 'U(FB)', rotation: 'z2 y' });
    for (const line of eoline)
      expect(matches(SCRAMBLE, movesOf(line), PATTERNS['EOLine']!)).toBe(true);
    expect(cube.solveStep('eocross')).toHaveLength(12);
    const roux1 = cube.solveStep('roux1');
    expect(roux1.map((line) => line.label)).toEqual(['LU', 'LD', 'FU', 'FD']);
    for (const line of roux1) expect(rouxBlock(SCRAMBLE, movesOf(line))).toBe(true);
  });

  it("solves each method's steps in turn", () => {
    const methods: [StepSolverId, string[], string][] = [
      [
        '333cf',
        ['Cross', 'F2L-1', 'F2L-2', 'F2L-3', 'F2L-4'],
        '----U-------RRRRRR---FFFFFFDDDDDDDDD---LLLLLL---BBBBBB',
      ],
      ['333roux', ['Step 1', 'Step 2'], '------------RRRRRR---F-FF-FD-DD-DD-D---LLLLLL---B-BB-B'],
      ['333petrus', ['2x2x2', '2x2x3'], '---------------------FF-FF-DD-DD-DD----LLLLLL----BB-BB'],
      [
        '333zz',
        ['EOLine', 'ZZF2L1', 'ZZF2L2'],
        '------------RRRRRR---FFFFFFDDDDDDDDD---LLLLLL---BBBBBB',
      ],
      ['333eodr', ['EO', 'DR'], PATTERNS['Domino']!],
    ];
    for (const [id, steps, pattern] of methods) {
      const lines = cube.solveStep(id);
      expect(lines.map((line) => line.label)).toEqual(steps);
      expect(lines[0]!.rotation).toBe('z2');
      const solution = lines.map(movesOf).join(' ');
      expect(matches(SCRAMBLE, solution, pattern)).toBe(true);
    }
  });

  it('holds the cube as set for the method solvers', () => {
    const puzzle = new Puzzle('333').setScramble(SCRAMBLE).setStepOrientation('x2  y');
    expect(puzzle.getStepOrientation()).toBe('x2 y');
    const lines = puzzle.solveStep('333petrus');
    expect(lines[0]!.rotation).toBe('x2 y');
    const solution = lines.map(movesOf).join(' ');
    expect(
      matches(SCRAMBLE, solution, '---------------------FF-FF-DD-DD-DD----LLLLLL----BB-BB'),
    ).toBe(true);
    expect(() => puzzle.setStepOrientation('R U')).toThrow();
  });

  it('solves a 2x2x2 block on every corner', () => {
    const lines = cube.solveStep('333222');
    expect(lines.map((line) => line.label)).toEqual([
      'URF',
      'UFL',
      'ULB',
      'UBR',
      'DFR',
      'DLF',
      'DBL',
      'DRB',
    ]);
    expect(lines.every((line) => typeof line.moves === 'string')).toBe(true);
    // Each block solved, as csTimer's 2x2x2 solver checks it.
    const blocks = [
      '----UU-UURR-RR-----FF-FF------------------------------',
      '---UU-UU----------FF-FF--------------LL-LL------------',
      'UU-UU-------------------------------LL-LL-----BB-BB---',
      '-UU-UU----RR-RR------------------------------BB-BB----',
      '------------RR-RR-----FF-FF-DD-DD---------------------',
      '---------------------FF-FF-DD-DD--------LL-LL---------',
      '------------------------------DD-DD----LL-LL-----BB-BB',
      '-------------RR-RR-------------DD-DD------------BB-BB-',
    ];
    lines.forEach((line, i) => expect(matches(SCRAMBLE, line.moves!, blocks[i]!)).toBe(true));
  });

  it('solves EO, DR, HTR and the rest, with other options for each step', () => {
    const lines = cube.solveStep('333thistle');
    expect(lines.map((line) => line.label.split(' ')[0])).toEqual(['EO', 'DR', 'HTR', 'OK']);
    expect(lines[0]!.alternatives!.length).toBeGreaterThan(0);
    const solution = lines.map(movesOf).join(' ');
    expect(new Puzzle('333').setScramble(SCRAMBLE).setSolution(solution).getSolveStatus()).toBe(
      'solved',
    );
    const niss = new Puzzle('333').setScramble(SCRAMBLE).setStepNiss(true);
    expect(niss.getStepNiss()).toBe(true);
    expect(niss.solveStep('333thistle')).toHaveLength(4);
  });

  it('solves a 2x2x2 face, a Pyraminx V, a Skewb face and a Square-1 in two steps', () => {
    const pocket = new Puzzle('222');
    pocket.scramble();
    const faces = pocket.solveStep('222face');
    expect(faces.map((line) => line.label)).toEqual(['U', 'R', 'F', 'D', 'L', 'B']);
    for (const line of faces) {
      const stickers = new Puzzle('222')
        .setScramble(pocket.getScramble())
        .setSolution(line.moves!)
        .getStickers();
      const color = pocket.getColors()[line.label];
      expect(Object.values(stickers).some((face) => face.every((c) => c === color))).toBe(true);
    }
    const checks: [string, StepSolverId, string[]][] = [
      ['pyram', 'pyrv', ['D', 'L', 'R', 'F']],
      ['skewb', 'skbl1', ['U', 'R', 'F', 'D', 'L', 'B']],
      ['sq1', 'sq1cs', ['Shape', 'Color']],
    ];
    for (const [id, solver, labels] of checks) {
      const puzzle = new Puzzle(id);
      puzzle.scramble();
      const lines = puzzle.solveStep(solver);
      expect(lines.map((line) => line.label)).toEqual(labels);
      expect(lines.every((line) => typeof line.moves === 'string')).toBe(true);
    }
  });

  it('reads only face turns', () => {
    expect(() => new Puzzle('333').setScramble("R U Rw' M").solveStep('cross')).toThrow();
  });

  it('solves to a pattern', () => {
    const puzzle = new Puzzle('333').setScramble(SCRAMBLE).setSolveTimeLimit(5000);
    const solution = puzzle.solvePattern(PATTERNS['Cross']!)!;
    expect(solution.split(' ').length).toBe(cube.solveStep('cross')[0]!.moves!.split(' ').length);
    expect(matches(SCRAMBLE, solution, PATTERNS['Cross']!)).toBe(true);
    expect(puzzle.solvePattern(PATTERNS['2x2x2']!)).not.toBeNull();
    expect(new Puzzle('333').solvePattern(PATTERNS['Cross']!)).toBe('');
    expect(() => puzzle.solvePattern('UUU')).toThrow();
    expect(() => new Puzzle('222').solvePattern(PATTERNS['Cross']!)).toThrow();
  });
});
