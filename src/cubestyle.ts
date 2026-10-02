// Ready-made looks for the cube's tiles, the same in the flat picture and the 3D view: how
// round each corner of a tile is, and whether the tiles are stickers on a black cube or
// colored plastic with no black around them.

/**
 * How the cube's tiles look:
 * - `'classic'`: every corner of every tile a little rounded (the default).
 * - `'stickered'`: like a modern stickered cube. Corner tiles have square corners, edge
 *   tiles round the two corners toward the face's center, and center tiles round all four.
 * - `'stickered-round'`: the same, a little rounder, and corner tiles also round their
 *   corner toward the face's center.
 * - `'stickerless'`, `'stickerless-round'`: the same tile shapes with the tiles filling the
 *   whole face, with no black border; only the space left by the round corners shows the
 *   black, and a thin line in a darker shade of each tile's color marks where two pieces
 *   meet.
 *
 * On bigger cubes, corner tiles are the four in the face's corners, edge tiles the rest of
 * the face's border, and center tiles everything inside it.
 */
type CubeStyle = 'classic' | 'stickered' | 'stickered-round' | 'stickerless' | 'stickerless-round';

const CUBE_STYLES: readonly CubeStyle[] = [
  'classic',
  'stickered',
  'stickered-round',
  'stickerless',
  'stickerless-round',
];

/** How round a tile's corners are, as a part of its width: top left, top right, bottom right, bottom left. */
type Corners = [number, number, number, number];

/** How round the rounded corners are, as a part of a tile's width. */
const CLASSIC_RADIUS = 0.12;
const RADIUS = 0.25;
const ROUND_RADIUS = 0.32;
/**
 * How wide the darker line along a stickerless tile's edges is, as a part of its width.
 * Two touching tiles each draw one, so the line between them is twice as wide.
 */
const SEAM = 0.035;
/** How dark that line is: the tile's color mixed with this much black. */
const SEAM_DARKNESS = 0.35;

/**
 * The darker shade of a tile's color for its line in the stickerless styles. Hex and
 * `rgb()` colors are worked out here, so the picture looks the same anywhere; any other
 * CSS color is left to the browser with `color-mix`.
 */
function seamColor(color: string): string {
  let rgb: number[] | undefined;
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (hex) {
    const digits = hex[1]!.length === 3 ? [...hex[1]!].map((d) => d + d) : hex[1]!.match(/../g)!;
    rgb = digits.map((d) => parseInt(d, 16));
  } else {
    const fn = /^rgb\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*\)$/i.exec(color.trim());
    if (fn) rgb = fn.slice(1, 4).map(Number);
  }
  if (!rgb) return `color-mix(in srgb, ${color} ${Math.round((1 - SEAM_DARKNESS) * 100)}%, #000)`;
  return `#${rgb
    .map((c) =>
      Math.round(Math.min(c, 255) * (1 - SEAM_DARKNESS))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

function isStickerless(style: CubeStyle): boolean {
  return style.startsWith('stickerless');
}

/**
 * How round each corner of tile `index` is (counted row by row from the top left) on a
 * face `size` tiles wide. A corner is rounded when it points into the face, away from all
 * its borders; corner tiles keep that one square except in the round styles.
 */
function tileCorners(style: CubeStyle, size: number, index: number): Corners {
  if (style === 'classic') return [CLASSIC_RADIUS, CLASSIC_RADIUS, CLASSIC_RADIUS, CLASSIC_RADIUS];
  const round = style.endsWith('-round');
  const radius = round ? ROUND_RADIUS : RADIUS;
  const row = Math.floor(index / size);
  const col = index % size;
  const top = row === 0;
  const bottom = row === size - 1;
  const left = col === 0;
  const right = col === size - 1;
  const cornerTile = (top || bottom) && (left || right);
  const inner = (onBorder: boolean) => (onBorder || (cornerTile && !round) ? 0 : radius);
  return [inner(top || left), inner(top || right), inner(bottom || right), inner(bottom || left)];
}

export { CUBE_STYLES, SEAM, tileCorners, isStickerless, seamColor };
export type { CubeStyle, Corners };
