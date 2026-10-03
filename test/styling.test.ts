import { describe, expect, it } from 'vitest';
import { Puzzle, getScrambleImage } from '../src/index.js';

describe('Puzzle element styles', () => {
  it('marks the picture, each face and each tile of a cube', () => {
    const svg = new Puzzle('333').getImage();
    expect(svg).toMatch(/^<svg class="cstimer-image" /);
    expect(svg.match(/<g class="cstimer-face" data-face="\w"/g)).toHaveLength(6);
    expect(svg.match(/class="cstimer-tile" data-face="U" data-tile="\d"/g)).toHaveLength(9);
    expect(svg).toContain('data-face="B" data-tile="8"');
  });

  it('marks the picture and tiles of csTimer’s pictures', () => {
    const svg = getScrambleImage('pyrso', '');
    expect(svg).toMatch(/^<svg class="cstimer-image" /);
    expect(svg.match(/<polygon class="cstimer-tile" /g)?.length).toBe(
      svg.match(/<polygon/g)?.length,
    );
  });

  it('adds styles to every part, one face or one tile', () => {
    const cube = new Puzzle('222')
      .setElementStyle('image', { background: '#eee' })
      .setElementStyle('face', { opacity: '0.5' }, { face: 'B' })
      .setElementStyle('tile', { strokeWidth: '2', stroke: '#fff' })
      .setElementStyle('tile', { stroke: 'red' }, { face: 'U', tile: 3 });
    const svg = cube.getImage();
    expect(svg).toMatch(/^<svg class="cstimer-image" [^>]* style="background:#eee;"/);
    expect(svg).toMatch(/data-face="B" fill="#111" style="opacity:0.5;"/);
    expect(svg).not.toMatch(/data-face="U" fill="#111" style=/);
    expect(svg.match(/style="stroke-width:2;stroke:#fff;"/g)).toHaveLength(23);
    // The later style wins, and keeps its place among the properties.
    expect(svg).toMatch(/data-face="U" data-tile="3"[^>]* style="stroke-width:2;stroke:red;"/);
    expect(cube.getElementStyles()).toHaveLength(4);
    expect(cube.resetElementStyles().getImage()).not.toContain('style=');
  });

  it('adds styles after csTimer’s own', () => {
    const svg = new Puzzle('pyram').setElementStyle('tile', { stroke: '#fff' }).getImage();
    expect(svg).toContain('stroke-linejoin:round;stroke:#fff;"');
  });

  it('escapes values so they stay inside the attribute', () => {
    const svg = new Puzzle('333').setElementStyle('image', { fontFamily: '"A" <b>' }).getImage();
    expect(svg).toContain('style="font-family:&quot;A&quot; &lt;b>;"');
  });

  it('rejects unknown parts, faces and tiles', () => {
    const cube = new Puzzle('333');
    // @ts-expect-error: not a part
    expect(() => cube.setElementStyle('sticker', {})).toThrow('Unknown part');
    expect(() => cube.setElementStyle('face', {}, { face: 'X' })).toThrow('no face "X"');
    expect(() => cube.setElementStyle('tile', {}, { tile: -1 })).toThrow('whole number');
    expect(() => cube.setElementStyle('tile', { 'a;b': 'c' })).toThrow('property names');
    expect(() => new Puzzle('pyram').setElementStyle('face', {}, { face: 'F' })).toThrow(
      'Only cubes',
    );
  });
});

describe('Puzzle face offsets', () => {
  it('moves and turns the cube’s own faces apart from the floating copies', () => {
    const cube = new Puzzle('333');
    const none = { x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, rotateZ: 0 };
    cube.setFaceOffset('U', { y: 0.5 });
    expect(cube.getFaceOffset('U')).toEqual({ ...none, y: 0.5 });
    expect(cube.getFloatingFaceOffset('U')).toEqual(none);
    expect(cube.resetFaceOffsets().getFaceOffset('U')).toEqual(none);
    expect(() => cube.setFaceOffset('X', {})).toThrow('no face "X"');
    expect(() => new Puzzle('pyram').setFaceOffset('F', {})).toThrow('only cubes');
  });
});
