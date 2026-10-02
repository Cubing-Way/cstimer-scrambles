import { describe, expect, it } from 'vitest';
import { Puzzle } from '../src/index.js';

/** The fill colors of the SVG, in drawing order. */
function fills(svg: string): string[] {
  return [...svg.matchAll(/fill:(#\w+)/g)].map((m) => m[1]!);
}

describe('Puzzle 3D view', () => {
  it('is for the cubes only', () => {
    const ids = [
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
    ];
    expect(ids.filter((id) => new Puzzle(id).has3DView())).toEqual(ids.slice(0, 6));
    expect(() => new Puzzle('pyram').getStickers()).toThrow('only cubes');
  });

  it('gives a solved cube one color per face', () => {
    const stickers = new Puzzle('444').getStickers();
    expect(Object.keys(stickers)).toEqual(['U', 'R', 'F', 'D', 'L', 'B']);
    expect(stickers.U).toEqual(Array(16).fill('#fff'));
    expect(stickers.B).toEqual(Array(16).fill('#00f'));
  });

  it('reads each face as in the unfolded picture', () => {
    const cube = new Puzzle('333');
    // R brings F's right column up to U's right column.
    expect(cube.setScramble('R').getStickers().U).toEqual([
      '#fff',
      '#fff',
      '#0d0',
      '#fff',
      '#fff',
      '#0d0',
      '#fff',
      '#fff',
      '#0d0',
    ]);
    // F brings L's colors to the row of U next to F (its bottom row).
    expect(cube.setScramble('F').getStickers().U!.slice(6)).toEqual(['#fa0', '#fa0', '#fa0']);
    // B brings R's colors to the row of U next to B (its top row).
    expect(cube.setScramble('B').getStickers().U!.slice(0, 3)).toEqual(['#f00', '#f00', '#f00']);
    // D's top row is next to F, so F brings R's colors there.
    expect(cube.setScramble('F').getStickers().D!.slice(0, 3)).toEqual(['#f00', '#f00', '#f00']);
  });

  it('matches the 2D picture after a scramble and solution', () => {
    for (const id of ['222', '333', '444', '555', '666', '777']) {
      const cube = new Puzzle(id).setImageStyle('cstimer').setColor('U', '#fff');
      cube.scramble();
      cube.setSolution("R U2 F'");
      const size = Number(id[0]);
      const stickers = cube.getStickers();
      // csTimer draws the faces D L B U R F, each column by column from the left.
      const expected = ['D', 'L', 'B', 'U', 'R', 'F'].flatMap((face) => {
        const colors: string[] = [];
        for (let col = 0; col < size; col++) {
          for (let row = 0; row < size; row++) colors.push(stickers[face]![row * size + col]!);
        }
        return colors;
      });
      expect(fills(cube.getImage())).toEqual(expected);
    }
  });

  it('uses the puzzle colors as they were set', () => {
    const cube = new Puzzle('222').setColor('U', '#123456');
    expect(cube.getStickers().U).toEqual(Array(4).fill('#123456'));
  });
});
