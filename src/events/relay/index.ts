import '../../vendor/cstimer/scramble_333_edit.js';
import '../../vendor/cstimer/2x2x2.js';
import '../../vendor/cstimer/scramble_sq1_new.js';
import '../../vendor/cstimer/pyraminx.js';
import '../../vendor/cstimer/skewb.js';
import '../../vendor/cstimer/megascramble.js';
import '../../vendor/cstimer/utilscramble.js';
import { cstimerEvent } from '../../cstimer.js';
import { registerEvents } from '../../registry.js';
import type { ScrambleEvent } from '../../types.js';

/** Relays: several puzzles in one scramble, one numbered line per puzzle. */
const eventsRelay: ScrambleEvent[] = [
  cstimerEvent('r3', '3x3x3 relay', 'relay', 5),
  cstimerEvent('r234', '234 relay', 'relay'),
  cstimerEvent('r2345', '2345 relay', 'relay'),
  cstimerEvent('r23456', '23456 relay', 'relay'),
  cstimerEvent('r234567', '234567 relay', 'relay'),
  cstimerEvent('r234w', '234 relay (WCA)', 'relay'),
  cstimerEvent('r2345w', '2345 relay (WCA)', 'relay'),
  cstimerEvent('r23456w', '23456 relay (WCA)', 'relay'),
  cstimerEvent('r234567w', '234567 relay (WCA)', 'relay'),
  cstimerEvent('rmngf', 'Mini Guildford', 'relay'),
];

registerEvents(...eventsRelay);

export { eventsRelay };
