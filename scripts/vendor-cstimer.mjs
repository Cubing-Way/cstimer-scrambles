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
  scramble_sq1_new: 'sq1',
  svglib: '$',
  toolsutil: 'tools',
  cubeutil: 'cubeutil',
  clock: 'clock',
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
  // poly3dlib reads puzzle colors (only used for drawing) from csTimer's settings, and a
  // regexp from csTimer's jQuery helpers (src/js/lib/utillib.js).
  poly3d: `import kernel from './kernel.js';
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
  // csTimer's settings, shared with src/image.ts so it can draw with other colors.
  kernel: "import kernel from './kernel.js';",
};

// csTimer's settings (src/js/kernel.js) that the image code reads, with their default values.
const KERNEL = `// Stand-in for csTimer's settings (src/js/kernel.js): the ones its image code reads,
// with csTimer's default values. Written by scripts/vendor-cstimer.mjs.
var kernel = {
	props: {
		'col-font': '#000000',
		'col-board': '#ffdddd',
		colcube: '#ff0#fa0#00f#fff#f00#0d0',
		colpyr: '#0f0#f00#00f#ff0',
		colskb: '#fff#00f#f00#ff0#0f0#f80',
		colmgm: '#fff#d00#060#81f#fc0#00b#ffb#8df#f83#7e0#f9f#999',
		colsq1: '#ff0#f80#0f0#fff#f00#00f',
		colclk: '#f00#37b#5cf#ff0#850',
		col15p: '#f99#9f9#99f#fff',
		colfto: '#fff#808#0d0#f00#00f#bbb#ff0#fa0',
		colico: '#fff#084#b36#a85#088#811#e71#b9b#05a#ed1#888#6a3#e8b#a52#6cb#c10#fa0#536#49c#ec9',
		imgSize: 15,
		imgRep: false,
		preScr: '',
		preScrT: ''
	},
	getProp: function(key, def) {
		return key in this.props ? this.props[key] : def;
	}
};
export default kernel;
`;

const FILES = [
  // [upstream path, imports, default export, shims, extra notes, file name here]
  ['lib/grouplib.js', ['mathlib'], 'grouplib'],
  ['tools/cross.js', ['mathlib'], 'cross', ['noUi'], ['ISCSTIMER = false skips its UI part']],
  ['solver/megaminx.js', ['mathlib'], 'mgmsolver', [], ['renamed to mgmsolver.js'], 'mgmsolver.js'],
  ['lib/pat3x3.js', ['mathlib', 'grouplib'], 'pat3x3'],
  [
    'lib/poly3dlib.js',
    ['toolsutil'],
    'poly3d',
    ['poly3d'],
    ['kernel shim (csTimer settings) and $ shim'],
  ],
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
  // Scramble images.
  [
    'lib/cubeutil.js',
    ['mathlib', 'toolsutil'],
    'cubeutil',
    ['kernel'],
    ['kernel shim: no pre-scramble'],
  ],
  [
    'tools/image.js',
    ['mathlib', 'svglib', 'poly3dlib', 'scramble_sq1_new', 'clock', 'cubeutil', 'toolsutil'],
    'image',
    ['noUi', 'kernel'],
    ['ISCSTIMER = false skips its UI part', 'kernel shim (csTimer settings)'],
  ],
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

// Copies the part of a csTimer file between two markers (both included) into its own module.
function vendorSlice(cstimer, { path, start, end, name, changes, before = [], after = [] }) {
  const code = readFileSync(join(cstimer, 'src/js', path), 'utf8');
  const from = code.indexOf(start);
  const to = code.indexOf(end, from);
  if (from < 0 || to < 0) throw new Error(`markers not found in ${path}`);
  writeFileSync(
    join('src/vendor/cstimer', name),
    [
      `// Vendored from csTimer (src/js/${path}, part only) @ ${UPSTREAM_COMMIT}. GPL-3.0, (c) cs0x7f.`,
      `// Changes: ${['ESM export', ...changes].join('; ')}.`,
      ...before,
      code.slice(from, to + end.length),
      ...after,
      '',
    ].join('\n'),
  );
  return name;
}

// csTimer's SVG drawing helpers ($.svg, $.ctxDrawPolygon, ...) from its jQuery extensions.
function vendorSvgLib(cstimer) {
  return vendorSlice(cstimer, {
    path: 'lib/utillib.js',
    start: '\t$.svg = (function() {',
    // Up to the end of $.col2std, the last helper the image code uses.
    end: "replace('#', '0x')));\n\t\t}\n\t\treturn ret;\n\t};",
    name: 'svglib.js',
    changes: ['only the SVG and canvas helpers, on a plain object instead of jQuery'],
    before: ['var $ = {};'],
    after: ['export default $;'],
  });
}

// csTimer's functions that tell which puzzle a scramble type is for, from its tools panel.
function vendorToolsUtil(cstimer) {
  return vendorSlice(cstimer, {
    path: 'tools/tools.js',
    start: '\tfunction scrambleType(scramble) {',
    end: '\t\t\treturn scrambleType;\n\t\t}\n\t}',
    name: 'toolsutil.js',
    changes: ['only the puzzle type helpers, without the tools panel'],
    before: ["var curScramble = ['-', '', 0];"],
    after: [
      'var tools = {',
      '\tscrambleType: scrambleType,',
      '\tpuzzleType: puzzleType,',
      '\tisPuzzle: isPuzzle,',
      '\tcarrot2poch: carrot2poch,',
      '\tisCurTrainScramble: function() {',
      '\t\treturn false;',
      '\t}',
      '};',
      'export default tools;',
    ],
  });
}

const cstimer = process.argv[2];
if (!cstimer) {
  console.error('Usage: node scripts/vendor-cstimer.mjs <path to a csTimer checkout>');
  process.exit(1);
}
vendorScrMgr(cstimer);
writeFileSync('src/vendor/cstimer/kernel.js', KERNEL);
console.log('wrote kernel.js');
console.log('vendored', vendorSvgLib(cstimer));
console.log('vendored', vendorToolsUtil(cstimer));
for (const file of FILES) console.log('vendored', vendorFile(cstimer, file));
