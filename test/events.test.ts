import { describe, expect, it } from 'vitest';
import { getScramble, listEvents, setSeed } from '../src/index.js';

// One pattern per event: what every move of its scramble must look like.
const MOVES: Record<string, RegExp> = {
  '222so': /^[URF][2']?$/,
  '444wca': /^[URFDLB]w?[2']?$/,
  '444bld': /^([URFDLB]w?[2']?|[xyz][2']?)$/,
  '555wca': /^[URFDLB]w?[2']?$/,
  '555bld': /^(3?[URFDLB]w?[2']?)$/,
  '666wca': /^3?[URFDLB]w?[2']?$/,
  '777wca': /^3?[URFDLB]w?[2']?$/,
  clkwca: /^(UR|DR|DL|UL|U|R|D|L|ALL)[0-6][+-]$|^y2$|^(UR|DR|DL|UL)$/,
  mgmp: /^([RD](\+\+|--)|U'?)$/,
  pyrso: /^[ULRBulrb]'?$/,
  skbso: /^[URLB]'?$/,
  ftoso: /^(U|F|R|L|D|B|BR|BL)'?$/,
};

// Lengths are [min, max] move counts, from csTimer's settings for these events.
const LENGTHS: Record<string, [number, number]> = {
  '222so': [4, 11],
  '555wca': [60, 60],
  '666wca': [80, 80],
  '777wca': [100, 100],
  mgmp: [77, 77],
  pyrso: [8, 15],
  skbso: [8, 11],
};

describe('WCA events', () => {
  it('registers every WCA event csTimer offers, plus FTO', () => {
    const ids = listEvents().map((e) => e.id);
    for (const id of [
      '333',
      '222so',
      '444wca',
      '555wca',
      '666wca',
      '777wca',
      '333ni',
      '333fm',
      '333oh',
      'clkwca',
      'mgmp',
      'pyrso',
      'skbso',
      'ftoso',
      'sqrs',
      '444bld',
      '555bld',
      'r3ni',
    ]) {
      expect(ids).toContain(id);
    }
  });

  for (const [id, pattern] of Object.entries(MOVES)) {
    it(`generates valid ${id} scrambles`, () => {
      for (let i = 0; i < 5; i++) {
        const moves = getScramble(id).split(/\s+/);
        for (const move of moves) {
          expect(move).toMatch(pattern);
        }
        const range = LENGTHS[id];
        if (range) {
          expect(moves.length).toBeGreaterThanOrEqual(range[0]);
          expect(moves.length).toBeLessThanOrEqual(range[1]);
        }
      }
    });
  }

  it('generates valid Square-1 scrambles', () => {
    for (let i = 0; i < 5; i++) {
      const scramble = getScramble('sqrs');
      expect(scramble).toMatch(/^(\(-?\d,-?\d\)\/ ?)+(\(-?\d,-?\d\))?$/);
    }
  });

  it('puts each megaminx line on its own row', () => {
    const lines = getScramble('mgmp').split('\n');
    expect(lines).toHaveLength(7);
    for (const line of lines) {
      expect(line).toMatch(/ U'?$/);
    }
  });

  it('is reproducible with a seed for every event', () => {
    for (const { id } of listEvents()) {
      setSeed('cubing-way');
      const a = getScramble(id);
      setSeed('cubing-way');
      expect(getScramble(id)).toBe(a);
    }
  });
});
