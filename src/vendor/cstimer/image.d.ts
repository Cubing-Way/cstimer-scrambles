// Minimal typings for the parts of csTimer's image.js (scramble images) this library uses.

/** csTimer's SVG builder (from svglib.js). */
interface CstimerSvg {
  width: number;
  height: number;
  /** The whole picture as an SVG document string. */
  render(): string;
}

declare const image: {
  /**
   * Draws a scramble: [scramble type id, scramble text, cube size (only for type "cubennn")].
   * Returns false when csTimer has no image for that type.
   */
  draw(scramble: [string, string, number]): CstimerSvg | false;
  /**
   * The stickers of a size x size x size cube after the moves: for each face in the order
   * D L B U R F, size * size face numbers (0-5, same order) at `(face * size + y) * size + x`.
   */
  nnnPosit(size: number, moves: string): number[];
};
export default image;
export type { CstimerSvg };
