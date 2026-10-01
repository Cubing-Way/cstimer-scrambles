import { describe, expect, it } from 'vitest';
import min2phase from '../src/vendor/cstimer/min2phase.js';
import mathlib from '../src/vendor/cstimer/mathlib.js';
import { getScramble, listEvents, setSeed } from '../src/index.js';

const MOVE = /^[URFDLB][2']?$/;

describe('3x3 scrambles', () => {
  it('registers the 3x3 events', () => {
    expect(
      listEvents()
        .filter((e) => e.puzzle === '333')
        .map((e) => e.id),
    ).toEqual(['333', '333oh', '333fm', '333ni', 'r3ni', 'edges', 'corners', 'll']);
  });

  it('produces valid, unsolved random-state scrambles', () => {
    for (let i = 0; i < 20; i++) {
      const moves = getScramble('333').trim().split(' ');
      expect(moves.every((m) => MOVE.test(m))).toBe(true);
      expect(moves.length).toBeGreaterThanOrEqual(15);
      expect(moves.length).toBeLessThanOrEqual(21);
      expect(min2phase.fromScramble(moves.join(' '))).not.toBe(mathlib.SOLVED_FACELET);
    }
  });

  it('keeps the first two layers solved for LL scrambles', () => {
    const f = min2phase.fromScramble(getScramble('ll'));
    // Facelet order: U R F D L B, 9 each. D face and the bottom two rows of R/F/L/B stay solved.
    expect(f.slice(27, 36)).toBe('DDDDDDDDD');
    for (const face of [9, 18, 36, 45]) {
      expect(new Set(f.slice(face + 3, face + 9)).size).toBe(1);
    }
  });

  it('is reproducible with a seed', () => {
    setSeed('cubing-way');
    const a = getScramble('333');
    setSeed('cubing-way');
    expect(getScramble('333')).toBe(a);
  });

  it("wraps FMC scrambles in R' U' F", () => {
    const s = getScramble('333fm');
    expect(s.startsWith("R' U' F ")).toBe(true);
    expect(s.endsWith("R' U' F")).toBe(true);
  });

  it('adds wide moves to blindfolded scrambles', () => {
    for (let i = 0; i < 10; i++) {
      const moves = getScramble('333ni').split(' ');
      expect(moves.every((m) => /^[URFDLB]w?[2']?$/.test(m))).toBe(true);
    }
  });

  it('numbers one blindfolded scramble per cube for multi-blind', () => {
    const lines = getScramble('r3ni', 3).split('\n');
    expect(lines).toHaveLength(3);
    lines.forEach((line, i) => expect(line.startsWith(`${i + 1}) `)).toBe(true));
    expect(getScramble('r3ni').split('\n')).toHaveLength(5);
  });
});
