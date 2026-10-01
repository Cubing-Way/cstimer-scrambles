import '../../vendor/cstimer/scramble_333_edit.js';
import '../../vendor/cstimer/megascramble.js';
import '../../vendor/cstimer/utilscramble.js';
import '../../vendor/cstimer/333lse.js';
import { cstimerEvent } from '../../cstimer.js';
import type { ScrambleEvent } from '../../types.js';

/**
 * csTimer's other 3x3x3 scramble types: random move, CFOP / Roux / Mehta training cases and move subsets.
 * Registered by ./index.ts, after the WCA 3x3 events.
 */
const events333Variants: ScrambleEvent[] = [
  cstimerEvent('333o', '3x3x3 random move', '333', 25),
  cstimerEvent('333noob', '3x3x3 for noobs', '333', 25),
  cstimerEvent('333ft', '3x3x3 with feet', '333'),
  cstimerEvent('pll', '3x3x3 CFOP PLL', '333'),
  cstimerEvent('oll', '3x3x3 CFOP OLL', '333'),
  cstimerEvent('lsll2', '3x3x3 CFOP last slot + last layer', '333'),
  cstimerEvent('zbll', '3x3x3 CFOP ZBLL', '333'),
  cstimerEvent('coll', '3x3x3 CFOP COLL', '333'),
  cstimerEvent('cll', '3x3x3 CFOP CLL', '333'),
  cstimerEvent('ell', '3x3x3 CFOP ELL', '333'),
  cstimerEvent('2gll', '3x3x3 CFOP 2GLL', '333'),
  cstimerEvent('zzll', '3x3x3 CFOP ZZLL', '333'),
  cstimerEvent('zbls', '3x3x3 CFOP ZBLS', '333'),
  cstimerEvent('eols', '3x3x3 CFOP EOLS', '333'),
  cstimerEvent('wvls', '3x3x3 CFOP WVLS', '333'),
  cstimerEvent('vls', '3x3x3 CFOP VLS', '333'),
  cstimerEvent('f2l', '3x3x3 CFOP cross solved', '333'),
  cstimerEvent('eoline', '3x3x3 CFOP EOLine', '333'),
  cstimerEvent('eocross', '3x3x3 CFOP EO Cross', '333'),
  cstimerEvent('easyc', '3x3x3 CFOP easy cross', '333', 3),
  cstimerEvent('easyxc', '3x3x3 CFOP easy xcross', '333', 4),
  cstimerEvent('sbrx', '3x3x3 Roux 2nd Block', '333'),
  cstimerEvent('cmll', '3x3x3 Roux CMLL', '333'),
  cstimerEvent('lse', '3x3x3 Roux LSE', '333'),
  cstimerEvent('lsemu', '3x3x3 Roux LSE <M, U>', '333'),
  cstimerEvent('mt3qb', '3x3x3 Mehta 3QB', '333'),
  cstimerEvent('mteole', '3x3x3 Mehta EOLE', '333'),
  cstimerEvent('mttdr', '3x3x3 Mehta TDR', '333'),
  cstimerEvent('mt6cp', '3x3x3 Mehta 6CP', '333'),
  cstimerEvent('mtcdrll', '3x3x3 Mehta CDRLL', '333'),
  cstimerEvent('mtl5ep', '3x3x3 Mehta L5EP', '333'),
  cstimerEvent('ttll', '3x3x3 Mehta TTLL', '333'),
  cstimerEvent('2gen', '3x3x3 subsets 2-generator R,U', '333'),
  cstimerEvent('2genl', '3x3x3 subsets 2-generator L,U', '333'),
  cstimerEvent('roux', '3x3x3 subsets Roux-generator M,U', '333'),
  cstimerEvent('3gen_F', '3x3x3 subsets 3-generator F,R,U', '333'),
  cstimerEvent('3gen_L', '3x3x3 subsets 3-generator R,U,L', '333'),
  cstimerEvent('RrU', '3x3x3 subsets 3-generator R,r,U', '333'),
  cstimerEvent('333drud', '3x3x3 subsets Domino Subgroup', '333'),
  cstimerEvent('half', '3x3x3 subsets half turns only', '333'),
  cstimerEvent('lsll', '3x3x3 subsets last slot + last layer (old)', '333', 15),
];

export { events333Variants };
