import '../../vendor/cstimer/slide.js';
import '../../vendor/cstimer/1x3x3.js';
import '../../vendor/cstimer/2x2x3.js';
import '../../vendor/cstimer/megascramble.js';
import '../../vendor/cstimer/gearcube.js';
import '../../vendor/cstimer/megaminx.js';
import '../../vendor/cstimer/utilscramble.js';
import '../../vendor/cstimer/redi.js';
import '../../vendor/cstimer/skewb.js';
import '../../vendor/cstimer/pyraminx.js';
import { cstimerEvent } from '../../cstimer.js';
import { registerEvents } from '../../registry.js';
import type { ScrambleEvent } from '../../types.js';

/** Non-WCA puzzles from csTimer's "OTHER" menu: sliding puzzles, cuboids, Gear Cube, Kilominx, Helicopter, Redi, Dino, Ivy and more. */
const eventsOther: ScrambleEvent[] = [
  cstimerEvent('15prp', '15 puzzle random state URLD', '15p'),
  cstimerEvent('15prap', '15 puzzle random state ^<>v', '15p'),
  cstimerEvent('15prmp', '15 puzzle random state Blank', '15p'),
  cstimerEvent('15p', '15 puzzle random move URLD', '15p', 80),
  cstimerEvent('15pat', '15 puzzle random move ^<>v', '15p', 80),
  cstimerEvent('15pm', '15 puzzle random move Blank', '15p', 80),
  cstimerEvent('8prp', '8 puzzle random state URLD', '8p'),
  cstimerEvent('8prap', '8 puzzle random state ^<>v', '8p'),
  cstimerEvent('8prmp', '8 puzzle random state Blank', '8p'),
  cstimerEvent('133', '1x3x3 (Floppy Cube)', '133'),
  cstimerEvent('223', '2x2x3 (Tower Cube)', '223'),
  cstimerEvent('233', '2x3x3 (Domino)', '233', 25),
  cstimerEvent('334', '3x3x4', '334', 40),
  cstimerEvent('335', '3x3x5', '335', 25),
  cstimerEvent('336', '3x3x6', '336', 40),
  cstimerEvent('337', '3x3x7', '337', 40),
  cstimerEvent('888', '8x8x8', '888', 120),
  cstimerEvent('999', '9x9x9', '999', 120),
  cstimerEvent('101010', '10x10x10', '101010', 120),
  cstimerEvent('111111', '11x11x11', '111111', 120),
  cstimerEvent('cubennn', 'NxNxN', 'nnn', 12),
  cstimerEvent('mrbl', 'Mirror Blocks', 'mrbl'),
  cstimerEvent('gearso', 'Gear Cube random state', 'gear'),
  cstimerEvent('gearo', 'Gear Cube optimal', 'gear'),
  cstimerEvent('gear', 'Gear Cube random move', 'gear', 10),
  cstimerEvent('klmso', 'Kilominx random state', 'klm'),
  cstimerEvent('klmp', 'Kilominx Pochmann', 'klm', 30),
  cstimerEvent('giga', 'Gigaminx Pochmann', 'giga', 300),
  cstimerEvent('crz3a', 'Crazy 3x3x3', 'crz3a', 30),
  cstimerEvent('cm3', 'Cmetrick', 'cmetrick', 25),
  cstimerEvent('cm2', 'Cmetrick Mini', 'cmetrick', 25),
  cstimerEvent('heli', 'Helicopter Cube', 'heli', 40),
  cstimerEvent('helicv', 'Curvy Copter', 'heli', 40),
  cstimerEvent('heli2x2', 'Helicopter Cube 2x2 Heli random move', 'heli', 70),
  cstimerEvent('heli2x2g', 'Helicopter Cube 2x2 Heli by group', 'heli', 5),
  cstimerEvent('rediso', 'Redi Cube random state', 'redi'),
  cstimerEvent('redim', 'Redi Cube MoYu', 'redi', 8),
  cstimerEvent('redi', 'Redi Cube random move', 'redi', 20),
  cstimerEvent('dinoso', 'Dino Cube random state', 'dino'),
  cstimerEvent('dinoo', 'Dino Cube optimal', 'dino'),
  cstimerEvent('ivyso', 'Ivy cube random state', 'ivy'),
  cstimerEvent('ivyo', 'Ivy cube optimal', 'ivy'),
  cstimerEvent('ivy', 'Ivy cube random move', 'ivy', 10),
  cstimerEvent('mpyrso', 'Master Pyraminx random state', 'mpyr'),
  cstimerEvent('mpyr', 'Master Pyraminx random move', 'mpyr', 42),
  cstimerEvent('prcp', 'Pyraminx Crystal Pochmann', 'prc', 70),
  cstimerEvent('prco', 'Pyraminx Crystal old style', 'prc', 70),
  cstimerEvent('sia113', 'Siamese Cube 1x1x3 block', 'sia', 25),
  cstimerEvent('sia123', 'Siamese Cube 1x2x3 block', 'sia', 25),
  cstimerEvent('sia222', 'Siamese Cube 2x2x2 block', 'sia', 25),
  cstimerEvent('sq2', 'Square-2', 'sq2', 20),
  cstimerEvent('ssq1t', 'Super Square-1', 'sq2', 20),
  cstimerEvent('sfl', 'Super Floppy', 'sfl', 25),
  cstimerEvent('ufo', 'UFO Jaap style', 'ufo', 25),
  cstimerEvent('ctico', 'Icosahedron Icosamate random move', 'ico', 60),
  cstimerEvent('bic', 'Bicube', 'bandaged', 30),
  cstimerEvent('bsq', 'Square-1 /,(1,0)', 'bandaged', 25),
  cstimerEvent('dmdso', 'Diamond random state', 'dmd'),
];

registerEvents(...eventsOther);

export { eventsOther };
