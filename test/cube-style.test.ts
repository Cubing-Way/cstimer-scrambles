import { describe, expect, it } from 'vitest';
import { Puzzle } from '../src/index.js';
import { tileCorners } from '../src/cubestyle.js';

/** The `d` of each tile drawn as a path, in drawing order. */
function tilePaths(svg: string): string[] {
  return [...svg.matchAll(/class="cstimer-tile"[^>]* d="([^"]*)"/g)].map((m) => m[1]!);
}

describe('Puzzle cube styles', () => {
  it('keeps the classic look by default', () => {
    const cube = new Puzzle('333');
    expect(cube.getCubeStyle()).toBe('classic');
    expect(cube.getImage()).toBe(new Puzzle('333').setCubeStyle('classic').getImage());
    expect(() => cube.setCubeStyle('shiny' as never)).toThrow('Unknown cube style');
  });

  it('rounds corners toward the face center on a stickered 3x3', () => {
    // Top left corner, top edge, center: corners TL, TR, BR, BL.
    expect(tileCorners('stickered', 3, 0)).toEqual([0, 0, 0, 0]);
    expect(tileCorners('stickered', 3, 1)).toEqual([0, 0, 0.25, 0.25]);
    expect(tileCorners('stickered', 3, 3)).toEqual([0, 0.25, 0.25, 0]);
    expect(tileCorners('stickered', 3, 4)).toEqual([0.25, 0.25, 0.25, 0.25]);
  });

  it('also rounds a corner tile’s inner corner in the round styles', () => {
    expect(tileCorners('stickered-round', 3, 0)).toEqual([0, 0, 0.32, 0]);
    expect(tileCorners('stickerless-round', 3, 8)).toEqual([0.32, 0, 0, 0]);
    expect(tileCorners('stickered-round', 3, 4)).toEqual([0.32, 0.32, 0.32, 0.32]);
  });

  it('treats a big cube’s border as edges and its inside as centers', () => {
    // 5x5: tile 6 is inside, tile 2 on the top border, tile 24 the bottom right corner.
    expect(tileCorners('stickered', 5, 6)).toEqual([0.25, 0.25, 0.25, 0.25]);
    expect(tileCorners('stickered', 5, 2)).toEqual([0, 0, 0.25, 0.25]);
    expect(tileCorners('stickered', 5, 24)).toEqual([0, 0, 0, 0]);
  });

  it('draws shaped tiles in 2D, keeping colors and class names', () => {
    const cube = new Puzzle('333').setScramble('R U');
    const svg = cube.setCubeStyle('stickered').getImage();
    expect(tilePaths(svg)).toHaveLength(54);
    expect(svg).not.toContain('filter=');
    const fills = [...svg.matchAll(/d="[^"]*" fill="(#\w+)"/g)].map((m) => m[1]);
    const stickers = cube.getStickers();
    expect(fills).toEqual(['U', 'L', 'F', 'R', 'B', 'D'].flatMap((face) => stickers[face]!));
  });

  it('fills the whole face with stickerless tiles and one black line where they meet', () => {
    const svg = new Puzzle('222').setCubeStyle('stickerless').getImage();
    // U is at x 106, after the gap. Between two tiles the face's black shows through a gap 7% of
    // a tile's space (3.5 of 50) wide, and half that along the face's border.
    expect(tilePaths(svg)[0]).toMatch(/^M107.75 1.75H154.25/);
    expect(svg).toMatch(/<g class="cstimer-face" data-face="U" fill="#111">/);
    expect(svg).not.toContain('stroke');
    expect(svg).not.toContain('filter');
  });

  it('lets element styles win over the cube style', () => {
    const svg = new Puzzle('333')
      .setCubeStyle('stickerless')
      .setElementStyle('tile', { filter: 'none' })
      .getImage();
    expect(svg).toContain('style="filter:none;"');
  });

  it('leaves the other puzzles as they were', () => {
    const pyram = new Puzzle('pyram').setScramble("R U L'");
    const before = pyram.getImage();
    expect(pyram.setCubeStyle('stickerless').getImage()).toBe(before);
  });
});
