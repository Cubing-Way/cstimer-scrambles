/** A function that produces one scramble string, e.g. "R U2 F' ...". */
export type ScrambleGenerator = () => string;

/** Describes one scramble type (csTimer calls these "scramble types"). */
export interface ScrambleEvent {
  /** csTimer's scramble type id, e.g. "333", "333fm", "edges". */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Puzzle this event scrambles, e.g. "333". Used to group events. */
  puzzle: string;
  generate: ScrambleGenerator;
}
