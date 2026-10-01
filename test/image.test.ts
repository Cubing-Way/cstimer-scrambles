import { describe, expect, it } from 'vitest';
import min2phase from '../src/vendor/cstimer/min2phase.js';
import { getScramble, getScrambleImage, hasScrambleImage, listEvents } from '../src/index.js';

// csTimer's default colors, as the face each one belongs to.
const FACE_OF_COLOR: Record<string, string> = {
  '#fff': 'U',
  '#f00': 'R',
  '#0d0': 'F',
  '#ff0': 'D',
  '#fa0': 'L',
  '#00f': 'B',
};
// Where each face sits in the unfolded picture, in face-sized steps: [column, row].
const FACE_POSITION: Record<string, [number, number]> = {
  U: [1, 0],
  R: [2, 1],
  F: [1, 1],
  D: [1, 2],
  L: [0, 1],
  B: [3, 1],
};
const FACE_SIZE = 100; // 3 stickers of 30px, plus a gap
const STICKER = 30;

/**
 * Reads the picture back as a facelet string (faces U R F D L B, 9 stickers each, read
 * row by row as they appear on the unfolded cube), the format min2phase uses.
 */
function faceletsFromSvg(svg: string): string {
  const stickers = new Map<string, string>();
  for (const [, points, color] of svg.matchAll(/points="([^"]+)" style="fill:(#\w+);/g)) {
    const [x, y] = points!.split(' ')[0]!.split(',').map(Number) as [number, number];
    const key = [
      Math.floor(x / FACE_SIZE),
      Math.floor(y / FACE_SIZE),
      Math.floor((x % FACE_SIZE) / STICKER),
      Math.floor((y % FACE_SIZE) / STICKER),
    ].join();
    stickers.set(key, FACE_OF_COLOR[color!]!);
  }
  let facelets = '';
  for (const face of 'URFDLB') {
    const [col, row] = FACE_POSITION[face]!;
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        facelets += stickers.get([col, row, x, y].join()) ?? '?';
      }
    }
  }
  return facelets;
}

describe('scramble images', () => {
  it('draws a solved cube for an empty scramble', () => {
    const svg = getScrambleImage('333', '');
    expect(svg.startsWith('<svg viewBox="0 0 ')).toBe(true);
    expect(svg.match(/<polygon /g)).toHaveLength(54);
    expect(faceletsFromSvg(svg)).toBe(min2phase.fromScramble(''));
  });

  it('shows the same cube state as the scramble', () => {
    for (const type of ['333', '333oh', '333fm', 'pll', 'oll', 'zbll', 'f2l', 'edges']) {
      const scramble = getScramble(type);
      expect(faceletsFromSvg(getScrambleImage(type, scramble)), `${type}: ${scramble}`).toBe(
        min2phase.fromScramble(scramble),
      );
    }
  });

  it('draws blindfolded scrambles, including wide moves', () => {
    const svg = getScrambleImage('333ni', "Rw U2 Fw'");
    // Wide moves turn the middle layer too: with the same face moves, the picture differs.
    expect(svg).not.toBe(getScrambleImage('333', "R U2 F'"));
    expect(svg.match(/<polygon /g)).toHaveLength(54);
  });

  it('draws one cube per scramble for multi-blind', () => {
    const svg = getScrambleImage('r3ni', getScramble('r3ni', 4));
    expect(svg.match(/<polygon /g)).toHaveLength(4 * 54);
  });

  it('says which types have images', () => {
    for (const type of ['333', 'pll', 'r3ni', '444wca', 'pyrso', 'sqrs', 'clkwca', 'r2345']) {
      expect(hasScrambleImage(type), type).toBe(true);
    }
    // csTimer draws nothing for these.
    for (const type of ['333noob', 'ivy', '223', 'cubennn']) {
      expect(hasScrambleImage(type), type).toBe(false);
    }
    expect(() => getScrambleImage('ivy', 'R')).toThrow(/No scramble image/);
  });

  it('draws every type that has an image', () => {
    const types = listEvents()
      .map((event) => event.id)
      .filter(hasScrambleImage);
    expect(types.length).toBeGreaterThan(170);
    for (const type of types) {
      const svg = getScrambleImage(type, getScramble(type));
      expect(svg.startsWith('<svg viewBox="0 0 '), type).toBe(true);
      expect(svg, type).toMatch(/<(polygon|path|circle|rect)/);
    }
  }, 60_000);

  it('draws the scramble, not a solved puzzle', () => {
    for (const type of ['222so', '444wca', 'mgmp', 'pyrso', 'skbso', 'sqrs', 'clkwca', 'ftoso']) {
      expect(getScrambleImage(type, getScramble(type)), type).not.toBe(getScrambleImage(type, ''));
    }
  });
});
