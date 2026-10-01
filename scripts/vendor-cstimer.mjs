/* global process, console */
// Copies csTimer's scramble files into src/vendor/cstimer with the small edits
// they need to run as ES modules outside csTimer's web page.
//
// Usage: node scripts/vendor-cstimer.mjs <path to a csTimer checkout>
//
// mathlib.js, min2phase.js and isaac.js were vendored by hand and are not
// touched by this script.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const UPSTREAM_COMMIT = '2547d82';
const NAMES = {
  mathlib: 'mathlib',
  scrmgr: 'scrMgr',
  min2phase: 'min2phase',
  grouplib: 'grouplib',
  pat3x3: 'pat3x3',
  poly3dlib: 'poly3d',
  ftocta: 'ftosolver',
  scramble_333_edit: 'scramble_333',
  cross: 'cross',
  mgmsolver: 'mgmsolver',
};

// Shims for the few csTimer globals some files read. Values copied from csTimer.
const SHIMS = {
  // Files that also hold a piece of csTimer's UI guard it with ISCSTIMER; this skips it.
  noUi: 'var ISCSTIMER = false;',
  // From src/lang/en-us.js: words used by the "3x3x3 for noobs" scramble.
  noob: `var SCRAMBLE_NOOBST = [
	['turn the top face', 'turn the bottom face'],
	['turn the right face', 'turn the left face'],
	['turn the front face', 'turn the back face']
];
var SCRAMBLE_NOOBSS = ' clockwise by 90 degrees,| counterclockwise by 90 degrees,| by 180 degrees,';`,
  // poly3dlib reads puzzle colors (only used for drawing) and a regexp from csTimer's
  // jQuery helpers (src/js/lib/utillib.js). Colors are csTimer's defaults.
  poly3d: `var kernel = {
	getProp: function(key) {
		return {
			colcube: '#ff0#fa0#00f#fff#f00#0d0',
			colpyr: '#0f0#f00#00f#ff0',
			colmgm: '#fff#d00#060#81f#fc0#00b#ffb#8df#f83#7e0#f9f#999',
			colfto: '#fff#808#0d0#f00#00f#bbb#ff0#fa0',
			colico: '#fff#084#b36#a85#088#811#e71#b9b#05a#ed1#888#6a3#e8b#a52#6cb#c10#fa0#536#49c#ec9'
		}[key];
	}
};
var $ = {
	col2std: function(col, faceMap) {
		var ret = [];
		col = (col || '').match(/#[0-9a-fA-F]{3}/g) || [];
		for (var i = 0; i < col.length; i++) {
			var c = col[faceMap[i]].slice(1);
			ret.push(parseInt(c[0] + c[0] + c[1] + c[1] + c[2] + c[2], 16));
		}
		return ret;
	},
	UDPOLY_RE: "skb|m?pyr|prc|heli(?:2x2|cv)?|crz3a|giga|mgm|klm|redi|dino|fto|dmd|ctico"
};`,
};

const FILES = [
  // [upstream path, imports, default export, shims, extra notes, file name here]
  ['lib/grouplib.js', ['mathlib'], 'grouplib'],
  ['tools/cross.js', ['mathlib'], 'cross', ['noUi'], ['ISCSTIMER = false skips its UI part']],
  ['solver/megaminx.js', ['mathlib'], 'mgmsolver', [], ['renamed to mgmsolver.js'], 'mgmsolver.js'],
  ['lib/pat3x3.js', ['mathlib', 'grouplib'], 'pat3x3'],
  ['lib/poly3dlib.js', [], 'poly3d', ['poly3d'], ['kernel and $ shims give default colors']],
  ['solver/ftocta.js', ['mathlib'], 'ftosolver'],
  [
    'scramble/scramble_333_edit.js',
    ['mathlib', 'scrmgr', 'min2phase', 'grouplib', 'pat3x3', 'cross'],
    'scramble_333',
  ],
  ['scramble/2x2x2.js', ['mathlib', 'scrmgr'], 'scramble_222'],
  ['scramble/scramble_444.js', ['mathlib', 'scrmgr', 'scramble_333_edit'], 'scramble_444'],
  ['scramble/megascramble.js', ['mathlib', 'scrmgr']],
  [
    'scramble/utilscramble.js',
    ['mathlib', 'scrmgr', 'grouplib', 'poly3dlib'],
    null,
    ['noob'],
    ['SCRAMBLE_NOOB* strings from en-us.js'],
  ],
  ['scramble/pyraminx.js', ['mathlib', 'scrmgr']],
  ['scramble/skewb.js', ['mathlib', 'scrmgr']],
  ['scramble/scramble_fto.js', ['mathlib', 'scrmgr', 'ftocta']],
  ['scramble/scramble_sq1_new.js', ['mathlib', 'scrmgr'], 'sq1'],
  ['scramble/1x3x3.js', ['mathlib', 'scrmgr']],
  ['scramble/2x2x3.js', ['mathlib', 'scrmgr']],
  ['scramble/333lse.js', ['mathlib', 'scrmgr']],
  ['scramble/clock.js', ['mathlib', 'scrmgr'], 'clock'],
  ['scramble/gearcube.js', ['mathlib', 'scrmgr']],
  ['scramble/megaminx.js', ['mathlib', 'scrmgr', 'mgmsolver']],
  ['scramble/mgmlsll.js', ['mathlib', 'scrmgr']],
  ['scramble/redi.js', ['mathlib', 'scrmgr'], 'redi'],
  ['scramble/slide.js', ['mathlib', 'scrmgr'], 'slideCube'],
];

const JQUERY = [
  ['$.now()', 'Date.now()'],
  ['$.noop', 'function() {}'],
  ['$.isArray', 'Array.isArray'],
];

function header(path, changes, imports) {
  return [
    `// Vendored from csTimer (src/js/${path}) @ ${UPSTREAM_COMMIT}. GPL-3.0, (c) cs0x7f.`,
    `// Changes: ${changes.join('; ')}.`,
    ...imports.map((name) => `import ${NAMES[name]} from './${name}.js';`),
    'var DEBUG = false;',
  ].join('\n');
}

function vendorFile(cstimer, [path, imports, exportName, shims = [], notes = [], fileName]) {
  let code = readFileSync(join(cstimer, 'src/js', path), 'utf8');
  const changes = ['ESM import/export'];
  const replaced = [];
  for (const [from, to] of JQUERY) {
    if (code.includes(from)) {
      code = code.split(from).join(to);
      replaced.push(from);
    }
  }
  if (replaced.length) changes.push(`${replaced.join(', ')} -> plain JS`);
  changes.push('DEBUG disabled', ...notes);
  const parts = [header(path, changes, imports), ...shims.map((s) => SHIMS[s]), code.trimEnd()];
  if (exportName) parts.push(`export default ${exportName};`);
  const name = fileName ?? path.split('/').pop();
  writeFileSync(join('src/vendor/cstimer', name), parts.join('\n') + '\n');
  return name;
}

// scrmgr.js is the first part of scramble.js (the scramble manager); the rest is csTimer's UI.
function vendorScrMgr(cstimer) {
  const code = readFileSync(join(cstimer, 'src/js/scramble/scramble.js'), 'utf8');
  const end = code.indexOf('})(mathlib.rn, mathlib.rndEl);');
  if (end < 0) throw new Error('scrMgr not found in scramble.js');
  const body = code
    .slice(0, end + '})(mathlib.rn, mathlib.rndEl);'.length)
    .split('$.isArray')
    .join('Array.isArray');
  const changes = [
    'ESM import/export',
    '$.isArray -> Array.isArray',
    'DEBUG disabled',
    'the jQuery UI part of the file is left out',
  ];
  writeFileSync(
    'src/vendor/cstimer/scrmgr.js',
    [
      `// Vendored from csTimer (src/js/scramble/scramble.js, the scrMgr part only) @ ${UPSTREAM_COMMIT}. GPL-3.0, (c) cs0x7f.`,
      `// Changes: ${changes.join('; ')}.`,
      "import mathlib from './mathlib.js';",
      'var DEBUG = false;',
      body,
      '',
      'export default scrMgr;',
      '',
    ].join('\n'),
  );
}

const cstimer = process.argv[2];
if (!cstimer) {
  console.error('Usage: node scripts/vendor-cstimer.mjs <path to a csTimer checkout>');
  process.exit(1);
}
vendorScrMgr(cstimer);
for (const file of FILES) console.log('vendored', vendorFile(cstimer, file));
