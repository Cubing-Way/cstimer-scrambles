import { describe, expect, it } from 'vitest';
import { Puzzle, getScrambleImage } from '../src/index.js';

/** The sticker colors of a cube picture drawn by this library, in drawing order. */
function stickerFills(svg: string): string[] {
  return [...svg.matchAll(/rx="[^"]*" fill="(#\w+)"/g)].map((m) => m[1]!);
}

describe('Puzzle image styles', () => {
  it('draws cubes like the 3D view, faces separated, by default', () => {
    const cube = new Puzzle('333');
    expect(cube.getImageStyle()).toBe('separated');
    const svg = cube.getImage();
    expect(svg).toMatch(/^<svg viewBox="0 0 418 312"/);
    // Six black faces, then 9 rounded stickers on each.
    expect(svg.match(/fill="#111"/g)).toHaveLength(6);
    expect(stickerFills(svg)).toHaveLength(54);
  });

  it('draws each face in the order of getStickers, U L F R B D', () => {
    const cube = new Puzzle('444');
    cube.scramble();
    cube.setSolution("R U2 F'");
    const stickers = cube.getStickers();
    const expected = ['U', 'L', 'F', 'R', 'B', 'D'].flatMap((face) => stickers[face]!);
    expect(stickerFills(cube.getImage())).toEqual(expected);
  });

  it('can join the faces into one flat cube', () => {
    const cube = new Puzzle('222').setImageStyle('joined');
    const svg = cube.getImage();
    expect(svg).toMatch(/^<svg viewBox="0 0 400 300"/);
    expect(stickerFills(svg)).toEqual(stickerFills(new Puzzle('222').getImage()));
  });

  it('keeps the colors exact, without csTimer’s rounding', () => {
    const svg = new Puzzle('333').setColor('F', '#123456').getImage();
    expect(stickerFills(svg)).toContain('#123456');
  });

  it('sets the width and keeps the shape', () => {
    const svg = new Puzzle('333').setImageStyle('joined').setImageSize(200).getImage();
    expect(svg).toMatch(/^<svg viewBox="0 0 400 300" width="200" height="150"/);
  });

  it('keeps a face a quarter of the size, joined or separated', () => {
    const face = (svg: string) => {
      const [, w, px] = svg.match(/viewBox="0 0 (\d+) \d+" width="([\d.]+)"/)!;
      return (Number(px) / Number(w)) * 100;
    };
    const cube = new Puzzle('333').setImageSize(300);
    expect(face(cube.setImageStyle('separated').getImage())).toBeCloseTo(75);
    expect(face(cube.setImageStyle('joined').getImage())).toBeCloseTo(75);
  });

  it('gives other puzzles thick black borders, joined or not', () => {
    const pyram = new Puzzle('pyram');
    const scramble = pyram.scramble();
    const plain = getScrambleImage(pyram.getScrambleType(), scramble);
    const styled = pyram.getImage();
    expect(styled).not.toContain('stroke:#000;');
    expect(
      styled.replace(/stroke:#111;stroke-width:2.5;stroke-linejoin:round;/g, 'stroke:#000;'),
    ).toBe(plain);
    expect(pyram.setImageStyle('joined').getImage()).toBe(styled);
  });

  it('can draw csTimer’s own picture', () => {
    const cube = new Puzzle('333').setImageStyle('cstimer');
    const scramble = cube.scramble();
    expect(cube.getImage()).toBe(getScrambleImage('333', scramble));
  });

  it('draws a cube’s relays with csTimer’s pictures', () => {
    const cube = new Puzzle('333').setScrambleType('r3ni');
    cube.scramble();
    expect(cube.getImage()).toContain('stroke-width:2.5');
  });

  it('rejects unknown styles', () => {
    // @ts-expect-error: not a style
    expect(() => new Puzzle('333').setImageStyle('round')).toThrow('Unknown image style');
  });
});

describe('Puzzle hidden faces', () => {
  it('hides the back faces by default and can float them', () => {
    const cube = new Puzzle('333');
    expect(cube.getHiddenFaces()).toBe('hidden');
    expect(cube.setHiddenFaces('floating').getHiddenFaces()).toBe('floating');
    // @ts-expect-error: not a mode
    expect(() => cube.setHiddenFaces('ghost')).toThrow('Unknown hidden faces mode');
  });
});

describe('Puzzle 3D camera and floating face offsets', () => {
  it('has a mouse camera on the U R F corner by default and can fix it', () => {
    const cube = new Puzzle('333');
    expect(cube.getCameraMode()).toBe('mouse');
    expect(cube.setCameraMode('fixed').getCameraMode()).toBe('fixed');
    // @ts-expect-error: not a mode
    expect(() => cube.setCameraMode('drone')).toThrow('Unknown camera mode');
    expect(cube.getCameraAngle().y).toBe(-45);
    expect(cube.getCameraAngle().x).toBeCloseTo(-35.26, 2);
    expect(cube.setCameraAngle({ x: -20, y: 30 }).getCameraAngle()).toEqual({ x: -20, y: 30 });
    expect(() => cube.setCameraAngle({ x: NaN, y: 0 })).toThrow('numbers of degrees');
    expect(cube.resetCameraAngle().getCameraAngle().y).toBe(-45);
  });

  it('moves and turns each floating face, 0 by default', () => {
    const cube = new Puzzle('444');
    const none = { x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, rotateZ: 0 };
    expect(cube.getFloatingFaceOffset('L')).toEqual(none);
    cube.setFloatingFaceOffset('L', { x: 1, rotateY: 45 });
    expect(cube.getFloatingFaceOffset('L')).toEqual({ ...none, x: 1, rotateY: 45 });
    // Setting again replaces the whole offset.
    cube.setFloatingFaceOffset('L', { z: 2 });
    expect(cube.getFloatingFaceOffset('L')).toEqual({ ...none, z: 2 });
    expect(cube.resetFloatingFaceOffsets().getFloatingFaceOffset('L')).toEqual(none);
    expect(() => cube.setFloatingFaceOffset('X', {})).toThrow('no face "X"');
    expect(() => cube.setFloatingFaceOffset('U', { x: Infinity })).toThrow('must be a number');
    // @ts-expect-error: not an offset
    expect(() => cube.setFloatingFaceOffset('U', { w: 1 })).toThrow('Unknown offset');
    expect(() => new Puzzle('pyram').setFloatingFaceOffset('F', {})).toThrow('only cubes');
  });
});
