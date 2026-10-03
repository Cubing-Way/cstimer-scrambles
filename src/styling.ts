// Styles of your own for the parts of a picture: the whole picture, each face and each tile
// (sticker). The 2D pictures and the 3D view mark these parts with the same class names and
// data attributes, so they can also be styled with a page's own CSS:
// - `.cstimer-image`: the whole picture (the `<svg>`, or the 3D view's box).
// - `.cstimer-face[data-face="U"]`: one face (cubes only).
// - `.cstimer-tile[data-face="U"][data-tile="0"]`: one tile. `data-tile` counts a face's
//   tiles row by row from the top left. Only cubes drawn by this library have faces and
//   tile numbers; csTimer's pictures only mark the picture and its tiles.

/**
 * A part of a picture:
 * - `'image'`: the whole picture.
 * - `'face'`: a face, as a group around its black background and its tiles (cubes only).
 * - `'tile'`: a tile (sticker).
 */
type ImagePart = 'image' | 'face' | 'tile';

/**
 * Which parts a style is for: only those of this face (`face`) and only the tile with this
 * number on its face (`tile`, counted row by row from the top left from 0). Left out, it is
 * for every face and every tile.
 */
interface PartFilter {
  face?: string;
  tile?: number;
}

/** A style for some parts of a picture: CSS properties and their values, e.g. `{ opacity: '0.5' }`. */
interface ElementStyle extends PartFilter {
  part: ImagePart;
  css: Record<string, string>;
}

const IMAGE_PARTS: readonly ImagePart[] = ['image', 'face', 'tile'];

/** `strokeWidth` and `stroke-width` both become `stroke-width`. */
function kebab(property: string): string {
  return property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

/**
 * The CSS for one part, from every style that is for it; later styles win over earlier
 * ones. `face` and `tile` are the part's own, when it has them.
 */
function cssFor(
  styles: readonly ElementStyle[],
  part: ImagePart,
  face?: string,
  tile?: number,
): Map<string, string> {
  const css = new Map<string, string>();
  for (const style of styles) {
    if (style.part !== part) continue;
    if (style.face !== undefined && style.face !== face) continue;
    if (style.tile !== undefined && style.tile !== tile) continue;
    for (const [property, value] of Object.entries(style.css)) {
      css.delete(kebab(property));
      css.set(kebab(property), value);
    }
  }
  return css;
}

function escapeAttribute(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/**
 * Adds the styles to an SVG drawn with the class names above, at the end of each part's
 * `style` attribute, so they win over the picture's own colors and sizes.
 */
function styleSvg(svg: string, styles: readonly ElementStyle[]): string {
  if (styles.length === 0) return svg;
  return svg.replace(/<(\w+)([^>]*?)(\/?)>/g, (tag, name: string, attrs: string, end: string) => {
    const part = attrs.match(/class="cstimer-(image|face|tile)"/)?.[1] as ImagePart | undefined;
    if (!part) return tag;
    const face = attrs.match(/data-face="([^"]*)"/)?.[1];
    const tile = attrs.match(/data-tile="(\d+)"/)?.[1];
    const css = cssFor(styles, part, face, tile === undefined ? undefined : Number(tile));
    if (css.size === 0) return tag;
    const added = [...css].map(([property, value]) => `${property}:${value};`).join('');
    const own = attrs.match(/ style="([^"]*)"/);
    const style = ` style="${own ? own[1] : ''}${escapeAttribute(added)}"`;
    const rest = own ? attrs.replace(own[0], '') : attrs;
    return `<${name}${rest}${style}${end}>`;
  });
}

/** Marks the parts of one of csTimer's pictures: the `<svg>` as the image, each shape as a tile. */
function markCstimerSvg(svg: string): string {
  return svg
    .replace('<svg ', '<svg class="cstimer-image" ')
    .replace(/<(polygon|circle|path|rect) /g, '<$1 class="cstimer-tile" ');
}

/** The CSS each element got from `styleElement`, with what it had before, to put back. */
const applied = new WeakMap<HTMLElement, Map<string, string>>();

/** Takes away the styles `styleElement` gave an element, putting back what it had before. */
function unstyleElement(element: HTMLElement): void {
  for (const [property, value] of applied.get(element) ?? []) {
    element.style.setProperty(property, value);
  }
  applied.delete(element);
}

/** Gives an element of the 3D view the styles that are for it. */
function styleElement(
  element: HTMLElement,
  styles: readonly ElementStyle[],
  part: ImagePart,
  face?: string,
  tile?: number,
): void {
  const css = cssFor(styles, part, face, tile);
  if (css.size === 0) return;
  const before = new Map<string, string>();
  for (const [property, value] of css) {
    before.set(property, element.style.getPropertyValue(property));
    element.style.setProperty(property, value);
  }
  applied.set(element, before);
}

export { IMAGE_PARTS, styleSvg, markCstimerSvg, styleElement, unstyleElement };
export type { ImagePart, PartFilter, ElementStyle };
