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
};
export default image;
export type { CstimerSvg };
