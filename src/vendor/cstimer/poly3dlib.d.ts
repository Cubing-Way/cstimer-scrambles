// Minimal typings for the parts of csTimer's poly3dlib.js (puzzle shapes for its images)
// the tests use.

interface PolyPuzzle {
  /** For each move, the sticker each sticker goes to (-1: stays). */
  moveTable: number[][];
  /** For each move: [name, turns until it is back, ...]. */
  twistyDetails: [string, number, ...number[]][];
  getTwistyIdx(move: string): number;
}

declare const poly3d: {
  /** A puzzle's shape and how csTimer reads its moves, by image type (e.g. "pyr", "skb"). */
  getFamousPuzzle(name: string): {
    polyParam: unknown[];
    parser?: { parseScramble(moves: string): [string, number][] };
  } | null;
  makePuzzle(...polyParam: unknown[]): PolyPuzzle;
  makePuzzleParser(puzzle: PolyPuzzle): { parseScramble(moves: string): [string, number][] };
  /** The unfolded picture: [size, stickers ([..., ..., face] each, or null), ...]. */
  renderNet(puzzle: PolyPuzzle, gap: number, minArea: number): [unknown, ([unknown, unknown, number] | null)[]];
};
export default poly3d;
