import '../../vendor/cstimer/megascramble.js';
import { cstimerScramble } from '../../cstimer.js';
import { registerEvents } from '../../registry.js';
import type { ScrambleEvent } from '../../types.js';

/** WCA 6x6: 80 random moves in WCA notation. */
function get666Scramble(): string {
  return cstimerScramble('666wca', 80);
}

const events666: ScrambleEvent[] = [
  { id: '666wca', name: '6x6x6 WCA', puzzle: '666', generate: get666Scramble },
];

registerEvents(...events666);

export { get666Scramble, events666 };
