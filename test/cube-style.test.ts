import { describe, expect, it } from 'vitest';
import { Puzzle } from '../src/index.js';
import { seamColor, tileCorners } from '../src/cubestyle.js';

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

  it('fills the whole face with touching stickerless tiles and a darker colored line between them', () => {
    const cube = new Puzzle('222').setCubeStyle('stickerless');
    const svg = cube.getImage();
    // U is at x 106, after the gap. Its first tile fills a quarter of the face, with no black around it.
    expect(tilePaths(svg)[0]).toBe('M106 0H156V50H106V0Z');
    // Each tile paints half of the 3-wide line along its right side (6% of 50), in one color
    // for both: the two tiles' colors mixed, 30% darker.
    const u = cube.getStickers().U!;
    const line = seamColor(u[0]!, u[1]!);
    expect(svg).toContain(
      `<rect class="cstimer-seam" x="154.5" y="0" width="1.5" height="50" fill="${line}"/>`,
    );
    expect(svg).toContain(
      `<rect class="cstimer-seam" x="156" y="0" width="1.5" height="50" fill="${line}"/>`,
    );
    expect(svg).not.toContain('stroke');
    expect(svg).not.toContain('filter');
  });

  it('darkens and mixes the colors for the line between two stickerless tiles', () => {
    expect(seamColor('#ffffff')).toBe('#b3b3b3');
    expect(seamColor('#ff0000', '#0000ff')).toBe('#590059');
    expect(seamColor('rgb(255, 255, 255)', '#fff')).toBe('#b3b3b3');
    expect(seamColor('white', 'red')).toBe(
      'color-mix(in srgb, color-mix(in srgb, white, red) 70%, #000)',
    );
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
