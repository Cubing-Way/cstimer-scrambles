// Flat pictures drawn in the same style as the 3D view: black faces with a thick border
// and stickers with rounded corners. Cubes get their own drawing; the other puzzles keep
// csTimer's drawing with thicker black borders.

import { isStickerless, tileCorners } from './cubestyle.js';
import type { CubeStyle } from './cubestyle.js';

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

/** A `w` x `w` square at `x`, `y` with each corner rounded by its own radius, as a path. */
function roundedSquare(x: number, y: number, w: number, corners: number[]): string {
  const [tl = 0, tr = 0, br = 0, bl = 0] = corners;
  const arc = (r: number, toX: number, toY: number) =>
    r > 0 ? `A${round(r)} ${round(r)} 0 0 1 ${round(toX)} ${round(toY)}` : '';
  return (
    `M${round(x + tl)} ${round(y)}H${round(x + w - tr)}${arc(tr, x + w, y + tr)}` +
    `V${round(y + w - br)}${arc(br, x + w - br, y + w)}H${round(x + bl)}${arc(bl, x, y + w - bl)}` +
    `V${round(y + tl)}${arc(tl, x + tl, y)}Z`
  );
}

/**
 * Draws a size x size x size cube unfolded, as an SVG string, with each face's sticker
 * colors in the order `Puzzle.getStickers()` gives them. A face is `width / 4` pixels wide,
 * the same as in the 3D view, so the joined faces are `width` pixels wide and the separated
 * ones a little wider for the gaps; without it a face is 100 pixels wide. The picture, each
 * face and each tile carry the class names and data attributes of styling.ts. `style`
 * picks the tiles' look (see `CubeStyle`).
 */
function drawCubeNet(
  size: number,
  stickers: Record<string, string[]>,
  layout: NetLayout = 'separated',
  width?: number,
  style: CubeStyle = 'classic',
): string {
  const step = SIDE + (layout === 'joined' ? 0 : FACE_GAP);
  const w = 3 * step + SIDE;
  const h = 2 * step + SIDE;
  // Stickerless tiles fill the whole face and touch, with no black between them.
  const stickerless = isStickerless(style);
  const gap = stickerless ? 0 : GAP;
  const padding = stickerless ? 0 : PADDING;
  const cell = (SIDE - 2 * padding - (size - 1) * gap) / size;
  const radius = round(cell * 0.12);
  const parts: string[] = [];
  if (layout === 'joined') {
    // The black behind the faces as two overlapping strips, a row and a column, so there
    // are no seams where the faces' own backgrounds touch.
    parts.push(
      `<rect class="cstimer-background" x="0" y="${SIDE}" width="${w}" height="${SIDE}" fill="${BLACK}"/>`,
      `<rect class="cstimer-background" x="${SIDE}" y="0" width="${SIDE}" height="${h}" fill="${BLACK}"/>`,
    );
  }
  for (const [face, col, row] of NET) {
    const x0 = col * step;
    const y0 = row * step;
    // Each face is a group with its background and tiles, so it can be styled as one
    // (see styling.ts). Its background takes the group's fill.
    parts.push(
      `<g class="cstimer-face" data-face="${face}" fill="${BLACK}">`,
      `<rect class="cstimer-face-bg" x="${x0}" y="${y0}" width="${SIDE}" height="${SIDE}"/>`,
    );
    const colors = stickers[face] ?? [];
    for (let i = 0; i < size * size; i++) {
      const x = x0 + padding + (i % size) * (cell + gap);
      const y = y0 + padding + Math.floor(i / size) * (cell + gap);
      if (style !== 'classic') {
        const corners = tileCorners(style, size, i).map((r) => r * cell);
        parts.push(
          `<path class="cstimer-tile" data-face="${face}" data-tile="${i}"` +
            ` d="${roundedSquare(x, y, cell, corners)}" fill="${colors[i] ?? BLACK}"/>`,
        );
        continue;
      }
      parts.push(
        `<rect class="cstimer-tile" data-face="${face}" data-tile="${i}"` +
          ` x="${round(x)}" y="${round(y)}" width="${round(cell)}" height="${round(cell)}"` +
          ` rx="${radius}" fill="${colors[i] ?? BLACK}"/>`,
      );
    }
    parts.push('</g>');
  }
  const pxWidth = width === undefined ? w : (width / 4) * (w / SIDE);
  return (
    `<svg class="cstimer-image" viewBox="0 0 ${w} ${h}" width="${round(pxWidth)}" height="${round((pxWidth * h) / w)}"` +
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
