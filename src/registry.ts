import type { ScrambleEvent } from './types.js';

const events = new Map<string, ScrambleEvent>();

/** Adds scramble events to the registry. Each puzzle module calls this once. */
function registerEvents(...list: ScrambleEvent[]): void {
  for (const event of list) {
    events.set(event.id, event);
  }
}

function getEvent(id: string): ScrambleEvent | undefined {
  return events.get(id);
}

function listEvents(): ScrambleEvent[] {
  return [...events.values()];
}

/**
 * Generates one scramble for a csTimer scramble type id, e.g. `getScramble('333')`.
 * `length` only matters for events that have a `length` (see `ScrambleEvent`).
 */
function getScramble(id: string, length?: number): string {
  const event = events.get(id);
  if (!event) {
    throw new Error(`Unknown scramble type "${id}"`);
  }
  return event.generate(length ?? event.length);
}

export { registerEvents, getEvent, listEvents, getScramble };
