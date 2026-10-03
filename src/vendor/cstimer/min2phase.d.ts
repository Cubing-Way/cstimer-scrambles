// Minimal typings for csTimer's min2phase (two-phase 3x3 solver by Shuang Chen).
interface Search {
  solution(
    facelets: string,
    maxDepth?: number,
    probeMax?: number,
    probeMin?: number,
    verbose?: number,
    firstAxisFilter?: number,
    lastAxisFilter?: number,
  ): string;
  /** Carries on the last search: a shorter solution, `Error 8` if still looking, `Error 7` if done. */
  next(probeMax: number, probeMin: number, verbose: number): string;
}

declare const min2phase: {
  Search: new () => Search;
  solve(facelets: string): string;
  /** Applies a move sequence to a solved cube and returns its facelet string. */
  fromScramble(scramble: string): string;
  initFull(): void;
  INVERSE_SOLUTION: number;
};
export default min2phase;
export type { Search };
