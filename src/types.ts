/**
 * A function that produces one scramble string, e.g. "R U2 F' ...".
 * Events whose length can be changed (see `ScrambleEvent.length`) read it from
 * the argument; the others ignore it.
 */
type ScrambleGenerator = (length?: number) => string;

/** Describes one scramble type (csTimer calls these "scramble types"). */
interface ScrambleEvent {
  /** csTimer's scramble type id, e.g. "333", "333fm", "edges". */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Puzzle this event scrambles, e.g. "333". Used to group events. */
  puzzle: string;
  /**
   * Default length, for events where it can be changed (number of moves, or
   * number of cubes for multi-blind). Missing when the length is fixed.
   */
  length?: number;
  generate: ScrambleGenerator;
}

export type { ScrambleEvent, ScrambleGenerator };
