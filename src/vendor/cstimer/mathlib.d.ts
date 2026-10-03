// Minimal typings for the parts of csTimer's mathlib this library uses.
interface CubieCube {
  ca: number[];
  ea: number[];
  ori: number;
  init(ca: number[], ea: number[]): CubieCube;
  selfConj(): CubieCube;
  toFaceCube(): string;
}

interface CubieCubeStatic {
  new (): CubieCube;
  CubeMult(a: CubieCube, b: CubieCube, prod: CubieCube): void;
  moveCube: CubieCube[];
}

/**
 * csTimer's mathlib.Solver: an IDA* search over coordinates, one move table per coordinate.
 * `init` builds the tables; after it `move[t][axis][coord]` is coordinate t after one turn.
 */
interface CoordSolver {
  init(): void;
  move: number[][][];
  /** The fewest moves to solve `state`, at least `minLength`: [axis, power] each (power 0 = one turn). */
  search(state: number[], minLength: number, maxLength?: number): [number, number][] | null;
}

declare const mathlib: {
  CubieCube: CubieCubeStatic;
  SOLVED_FACELET: string;
  getNPerm(arr: number[], n: number, even?: number): number;
  getNParity(idx: number, n: number): number;
  rn(n: number): number;
  rndEl<T>(arr: readonly T[]): T;
  getSeed(): [number, string];
  setSeed(count: number, seed: string): void;
};
export default mathlib;
export type { CubieCube, CubieCubeStatic, CoordSolver };
