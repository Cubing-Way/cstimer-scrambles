// Minimal typings for csTimer's FTO solver (ftocta.js).

/** An FTO state: corners, edges and the two kinds of centers. */
interface FtoCubie {
  isEqual(other: FtoCubie): boolean;
  /** 72 face numbers (0-7 = U F BR BL D B R L), 9 per face in that order. */
  toFaceCube(): number[];
}

interface FtoCubieStatic {
  new (): FtoCubie;
  /** `a` then `b`, into `prod` if given; returns the result. */
  FtoMult(a: FtoCubie, b: FtoCubie, prod: FtoCubie | null): FtoCubie;
  /** A turn by index: U F BR BL D B R L clockwise at 0, 2, ..., 14, each with ' one after. */
  moveCube: FtoCubie[];
}

declare const ftosolver: {
  FtoCubie: FtoCubieStatic;
  /**
   * A solution of the state (as `toFaceCube` gives it) with csTimer's three-phase solver,
   * or the moves that make it when `inverse`. "FTO Solver ERROR!" if it isn't a real FTO.
   */
  solveFacelet(facelets: number[], inverse: boolean): string;
};
export default ftosolver;
export type { FtoCubie };
