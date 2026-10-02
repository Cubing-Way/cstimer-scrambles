// Flat pictures drawn in the same style as the 3D view: black faces with a thick border
// and stickers with rounded corners. Cubes get their own drawing; the other puzzles keep
// csTimer's drawing with thicker black borders.

/**
 * How the cube's faces are laid out in the flat picture:
 * - `'separated'`: the unfolded cube with a gap between the faces.
 * - `'joined'`: the faces touching, as if the cube were cut open and laid flat.
 */
type NetLayout = 'separated' | 'joined';

/** Where each face sits in the unfolded cube, as [column, row]: U on top of F, D below. */
const NET: readonly [string, number, number][] = [
  ['U', 1, 0],
  ['L', 0, 1],
  ['F', 1, 1],
  ['R', 2, 1],
  ['B', 3, 1],
  ['D', 1, 2],
];

/**
 * One face is this many units wide in the SVG. The borders are a little thicker than the
 * 3D view's, which shows each face bigger, so they look as thick.
 */
const SIDE = 100;
const PADDING = SIDE * 0.035;
const GAP = SIDE * 0.03;
/** Space between faces when they are separated. */
const FACE_GAP = SIDE * 0.06;
const BLACK = '#111';

function round(n: number): string {
  return parseFloat(n.toFixed(3)).toString();
}

/**
 * Draws a size x size x size cube unfolded, as an SVG string, with each face's sticker
 * colors in the order `Puzzle.getStickers()` gives them. `width` sets the SVG's width in
 * pixels (the height follows); without it a face is 100 pixels wide.
 */
function drawCubeNet(
  size: number,
  stickers: Record<string, string[]>,
  layout: NetLayout = 'separated',
  width?: number,
): string {
  const step = SIDE + (layout === 'joined' ? 0 : FACE_GAP);
  const w = 3 * step + SIDE;
  const h = 2 * step + SIDE;
  const cell = (SIDE - 2 * PADDING - (size - 1) * GAP) / size;
  const radius = round(cell * 0.12);
  const parts: string[] = [];
  if (layout === 'joined') {
    // The black behind the faces as two overlapping strips, a row and a column, so there
    // are no seams where faces touch.
    parts.push(
      `<rect x="0" y="${SIDE}" width="${w}" height="${SIDE}" fill="${BLACK}"/>`,
      `<rect x="${SIDE}" y="0" width="${SIDE}" height="${h}" fill="${BLACK}"/>`,
    );
  }
  for (const [face, col, row] of NET) {
    const x0 = col * step;
    const y0 = row * step;
    if (layout === 'separated') {
      parts.push(`<rect x="${x0}" y="${y0}" width="${SIDE}" height="${SIDE}" fill="${BLACK}"/>`);
    }
    const colors = stickers[face] ?? [];
    for (let i = 0; i < size * size; i++) {
      const x = x0 + PADDING + (i % size) * (cell + GAP);
      const y = y0 + PADDING + Math.floor(i / size) * (cell + GAP);
      parts.push(
        `<rect x="${round(x)}" y="${round(y)}" width="${round(cell)}" height="${round(cell)}"` +
          ` rx="${radius}" fill="${colors[i] ?? BLACK}"/>`,
      );
    }
  }
  const pxWidth = width ?? w;
  return (
    `<svg viewBox="0 0 ${w} ${h}" width="${round(pxWidth)}" height="${round((pxWidth * h) / w)}"` +
    ` xmlns="http://www.w3.org/2000/svg">${parts.join('')}</svg>`
  );
}

/**
 * Gives one of csTimer's pictures the same look: its thin black outlines become thick,
 * dark ones with rounded corners. Only the outlined shapes change, so the clock's dials
 * and hands, which csTimer draws differently, stay as they are.
 */
function thickenBorders(svg: string): string {
  return svg.replace(/stroke:#000;/g, `stroke:${BLACK};stroke-width:2.5;stroke-linejoin:round;`);
}

export { drawCubeNet, thickenBorders };
export type { NetLayout };
