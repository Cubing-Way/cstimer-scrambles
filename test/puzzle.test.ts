import { describe, expect, it } from 'vitest';
import { Puzzle, getScrambleImage, listPuzzles } from '../src/index.js';

/** The fill colors of the SVG, in drawing order. */
function fills(svg: string): string[] {
  return [...svg.matchAll(/fill:(#\w+)/g)].map((m) => m[1]!);
}

describe('Puzzle', () => {
  it('covers the WCA puzzles', () => {
    expect(listPuzzles()).toEqual([
      '222',
      '333',
      '444',
      '555',
      '666',
      '777',
      'clock',
      'minx',
      'pyram',
      'skewb',
      'sq1',
    ]);
  });

  it('throws for unknown puzzles', () => {
    expect(() => new Puzzle('nope')).toThrow('Unknown puzzle "nope"');
  });

  // Scrambles for every puzzle and method; the first 4x4x4 and megaminx random-state
  // scrambles build solver tables, which can be slow on a busy CI runner.
  it.each(listPuzzles())(
    '%s scrambles and draws with every method',
    (id) => {
      const puzzle = new Puzzle(id);
      expect(puzzle.getScrambleMethods()).toContain('default');
      for (const method of puzzle.getScrambleMethods()) {
        puzzle.setScrambleMethod(method);
        const scramble = puzzle.scramble();
        expect(scramble.length).toBeGreaterThan(0);
        expect(puzzle.getScramble()).toBe(scramble);
        expect(puzzle.getImage()).toBe(getScrambleImage(puzzle.getScrambleType(), scramble));
      }
    },
    20000,
  );

  it('uses the WCA type by default and csTimer types for each method', () => {
    const puzzle = new Puzzle('333');
    expect(puzzle.getScrambleMethod()).toBe('default');
    expect(puzzle.getScrambleType()).toBe('333');
    expect(puzzle.setScrambleMethod('random-move').getScrambleType()).toBe('333o');
    expect(puzzle.scramble().split(' ')).toHaveLength(25);
  });

  it('throws for methods a puzzle has no scrambler for', () => {
    const puzzle = new Puzzle('555');
    expect(puzzle.getScrambleMethods()).toEqual(['default', 'random-move']);
    expect(() => puzzle.setScrambleMethod('random-state')).toThrow(
      '5x5x5 has no "random-state" scrambles',
    );
    expect(puzzle.getScrambleMethod()).toBe('default');
  });

  it('starts solved and can be reset', () => {
    const puzzle = new Puzzle('333');
    expect(puzzle.getScramble()).toBe('');
    const solved = puzzle.getImage();
    // A solved 3x3x3 shows each default color on 9 stickers.
    const counts = new Map<string, number>();
    for (const color of fills(solved)) counts.set(color, (counts.get(color) ?? 0) + 1);
    expect([...counts.values()]).toEqual([9, 9, 9, 9, 9, 9]);
    puzzle.scramble();
    expect(puzzle.getImage()).not.toBe(solved);
    expect(puzzle.reset().getImage()).toBe(solved);
  });
});

describe('Puzzle colors', () => {
  it('starts with csTimer’s default colors', () => {
    const puzzle = new Puzzle('333');
    expect(puzzle.getFaces()).toEqual(['U', 'R', 'F', 'D', 'L', 'B']);
    expect(puzzle.getColors()).toEqual({
      U: '#fff',
      R: '#f00',
      F: '#0d0',
      D: '#ff0',
      L: '#fa0',
      B: '#00f',
    });
  });

  it('puts cube faces where the picture shows them', () => {
    // Unfolded net: U on top, then L F R B, then D; each face is 100px with its gap.
    const svg = new Puzzle('333')
      .setColors({ U: '#100', L: '#200', F: '#300', R: '#400', B: '#500', D: '#600' })
      .getImage();
    const where = new Map<string, string>();
    for (const [, points, color] of svg.matchAll(/points="([^"]+)" style="fill:(#\w+);/g)) {
      const [x, y] = points!.split(' ')[0]!.split(',').map(Number) as [number, number];
      where.set(color!, `${Math.floor(x / 100)},${Math.floor(y / 100)}`);
    }
    expect(Object.fromEntries(where)).toEqual({
      '#100': '1,0',
      '#200': '0,1',
      '#300': '1,1',
      '#400': '2,1',
      '#500': '3,1',
      '#600': '1,2',
    });
  });

  it('names megaminx faces like csTimer’s move notation', () => {
    // Turning a face moves its own stickers around more than any other face's, so after
    // a few moves to mix things up, turning face X changes face X's color the most.
    const puzzle = new Puzzle('minx');
    const solved = fills(getScrambleImage('mgmp', ''));
    const mix = "R++ D-- R-- D++ U R-- D++ U'";
    const before = fills(getScrambleImage('mgmp', mix));
    for (const [face, color] of Object.entries(puzzle.getColors())) {
      const after = fills(getScrambleImage('mgmp', `${mix} ${face}`));
      const changed = new Map<string, number>();
      after.forEach((c, i) => {
        if (c !== before[i]) changed.set(solved[i]!, (changed.get(solved[i]!) ?? 0) + 1);
      });
      const most = [...changed].sort((a, b) => b[1] - a[1])[0]![0];
      // poly3d writes colors as #rrggbb.
      const long = '#' + [...color.slice(1)].map((x) => x + x).join('');
      expect([face, most]).toEqual([face, long]);
    }
  });

  it('draws faces in the colors set', () => {
    const puzzle = new Puzzle('333').setColors({ U: '#123', D: '#456' });
    const colors = fills(puzzle.getImage());
    expect(colors.filter((c) => c === '#123')).toHaveLength(9);
    expect(colors.filter((c) => c === '#456')).toHaveLength(9);
    expect(colors).not.toContain('#fff');
    expect(colors).not.toContain('#ff0');
  });

  it('rounds 6-digit colors to the nearest of csTimer’s 3-digit ones', () => {
    const puzzle = new Puzzle('333').setColor('U', '#FF8000');
    expect(puzzle.getColors().U).toBe('#ff8000');
    expect(fills(puzzle.getImage())).toContain('#f80');
  });

  it('keeps colors per puzzle', () => {
    const custom = new Puzzle('333').setColor('U', '#f0f');
    const plain = new Puzzle('333');
    expect(fills(custom.getImage())).toContain('#f0f');
    expect(fills(plain.getImage())).not.toContain('#f0f');
    expect(fills(getScrambleImage('333', ''))).not.toContain('#f0f');
  });

  it('works for puzzles drawn from a 3D model', () => {
    const puzzle = new Puzzle('pyram');
    expect(puzzle.getFaces()).toEqual(['F', 'L', 'R', 'D']);
    const before = getScrambleImage('pyrso', '');
    const after = puzzle.setColor('F', '#f0f').getImage();
    expect(after).not.toBe(before);
    expect(after).toMatch(/#ff00ff|#f0f/);
  });

  it('can go back to the defaults', () => {
    const puzzle = new Puzzle('skewb').setColor('U', '#000');
    expect(puzzle.resetColors().getImage()).toBe(getScrambleImage('skbso', ''));
  });

  it('rejects unknown faces and colors that are not hex', () => {
    const puzzle = new Puzzle('333');
    expect(() => puzzle.setColor('X', '#fff')).toThrow('3x3x3 has no face "X"');
    expect(() => puzzle.setColor('U', 'red')).toThrow('"red" is not a hex color');
  });
});

describe('Puzzle image size', () => {
  it('keeps csTimer’s size by default', () => {
    const puzzle = new Puzzle('333');
    expect(puzzle.getImageSize()).toBeUndefined();
    expect(puzzle.getImage()).toMatch(/^<svg viewBox="0 0 396 296" width="396" height="296"/);
  });

  it('sets the width and keeps the shape', () => {
    const svg = new Puzzle('333').setImageSize(198).getImage();
    expect(svg).toMatch(/^<svg viewBox="0 0 396 296" width="198" height="148"/);
  });

  it('rejects sizes that are not positive', () => {
    expect(() => new Puzzle('333').setImageSize(0)).toThrow('positive number');
    expect(() => new Puzzle('333').setImageSize(NaN)).toThrow('positive number');
  });
});
