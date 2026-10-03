// Minimal typings for csTimer's step solvers in gsolver.js (from its tools panel).
import type { Elem } from './toolsui.js';

declare const gsolver: {
  /** Writes the shortest way to solve each face of a 2x2x2 into `elem`. */
  pocketCube(scramble: string, elem: Elem): void;
  rubiksCube: {
    /** Sets the rotation the 3x3x3 method solvers hold the cube with (csTimer's default: "z2"). */
    setOri(rotation: string): void;
    /**
     * Writes a 3x3x3 method's steps into `elem`: 'cf' (cross + F2L), 'roux', 'petrus', 'zz',
     * 'eodr', or '222' (a 2x2x2 block on each corner).
     */
    exec(type: string, scramble: string, elem: Elem): void;
    /** Applies one move like "R2" or "U'" to a 54-sticker pattern. */
    move(state: string, move: string): string;
  };
  /** Writes a Square-1's shape and color steps into `elem`. */
  sq1Cube(scramble: string, elem: Elem): void;
  /** Writes the shortest way to solve each face of a Skewb into `elem`. */
  skewbCube(scramble: string, elem: Elem): void;
  /** Writes the shortest V (first layer without one edge) on each face of a Pyraminx into `elem`. */
  pyraCube(scramble: string, elem: Elem): void;
  /** The 3x3x3 general solver's patterns by name (54 stickers, U R F D L B faces). */
  presets: Record<string, string>;
};
export default gsolver;
