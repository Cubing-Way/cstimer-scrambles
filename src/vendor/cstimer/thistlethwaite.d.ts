// Minimal typings for csTimer's EO DR HTR solver (thistlethwaite.js, from its tools panel).

declare const thistlethwaite: {
  /**
   * Up to `nSols` solutions for each of the 4 steps (EO, DR, HTR, solved), each step after
   * the first one of the step before. Moves before "@" go before the scramble (NISS), and a
   * prefix like "fb: " is the axis the step was done on.
   */
  fillStepsCandidates(
    scramble: string,
    skeleton: string[],
    useNiss: boolean,
    tryMultiAxis: boolean,
    nSols: number,
  ): string[][];
  /** Writes a solution as people do: NISS moves inverted, in brackets, before the others. */
  toPrettyStyle(solution: string): string;
};
export default thistlethwaite;
