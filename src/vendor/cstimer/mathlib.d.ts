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
export type { CubieCube, CubieCubeStatic };
