// Minimal typings for toolsui.js, the stand-in for csTimer's page used by its solver tools.

/** One of csTimer's solutions as its tools panel would show it: the moves, one per item. */
interface SolutionSpan {
  solution: string[];
}

/** An element a solver tool writes into: whatever it appended, in order. */
interface Elem {
  children: (string | Elem | SolutionSpan)[];
}

declare const toolsui: {
  /** A new, empty element, like jQuery's `$('<span>')`. */
  $(html: string): Elem;
};
export default toolsui;
export type { Elem, SolutionSpan };
