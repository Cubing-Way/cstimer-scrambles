import type { ScrambleEvent } from './types.js';

const events = new Map<string, ScrambleEvent>();

/** Adds scramble events to the registry. Each puzzle module calls this once. */
export function registerEvents(...list: ScrambleEvent[]): void {
  for (const event of list) {
    events.set(event.id, event);
  }
}

export function getEvent(id: string): ScrambleEvent | undefined {
  return events.get(id);
}

export function listEvents(): ScrambleEvent[] {
  return [...events.values()];
}

/** Generates one scramble for a csTimer scramble type id, e.g. `getScramble('333')`. */
export function getScramble(id: string): string {
  const event = events.get(id);
  if (!event) {
    throw new Error(`Unknown scramble type "${id}"`);
  }
  return event.generate();
}
