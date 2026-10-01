# @cubing-way/cstimer-scrambles

csTimer's scramble generators as a typed, tree-shakeable ESM/CJS library.

The scrambling logic comes from [csTimer](https://github.com/cs0x7f/cstimer) by Shuang Chen (cs0x7f), including the min2phase two-phase solver. This package is therefore licensed **GPL-3.0**, like csTimer.

## Try it

Open the [demo page](https://cubing-way.github.io/cstimer-scrambles/) to generate scrambles in your browser. It's rebuilt from `demo/index.html` on every push to `main`.

## Usage

```ts
import { getScramble, listEvents, setSeed } from '@cubing-way/cstimer-scrambles';

getScramble('333'); // "D2 B2 R' B2 R' F2 L R2 ..."
listEvents().map((e) => e.id); // ['333', '333fm', 'edges', 'corners', 'll']

setSeed('my-seed'); // reproducible scrambles
```

Scramble type ids match csTimer's, so `getScramble('333fm')` is what csTimer calls "333fm".

## Supported events

All 206 scramble types in csTimer's menu are supported, with csTimer's ids (everything except its UI-only entries: input, remote, BLD helper, pattern tool and custom). `listEvents()` returns them all with a name and a `puzzle` group; the [demo page](https://cubing-way.github.io/cstimer-scrambles/) lists them too.

The WCA events:

| id        | description                    |
| --------- | ------------------------------ |
| `333`     | 3x3x3 random state             |
| `333oh`   | 3x3x3 one-handed               |
| `333fm`   | 3x3x3 fewest moves             |
| `333ni`   | 3x3x3 blindfolded              |
| `r3ni`    | 3x3x3 multi-blind (5 cubes)    |
| `edges`   | 3x3x3 edges only               |
| `corners` | 3x3x3 corners only             |
| `ll`      | 3x3x3 last layer               |
| `222so`   | 2x2x2 random state             |
| `444wca`  | 4x4x4 random state             |
| `444bld`  | 4x4x4 blindfolded              |
| `555wca`  | 5x5x5 (60 moves)               |
| `555bld`  | 5x5x5 blindfolded              |
| `666wca`  | 6x6x6 (80 moves)               |
| `777wca`  | 7x7x7 (100 moves)              |
| `clkwca`  | Clock                          |
| `mgmp`    | Megaminx (7 lines of Pochmann) |
| `pyrso`   | Pyraminx random state          |
| `skbso`   | Skewb random state             |
| `sqrs`    | Square-1 random state          |
| `ftoso`   | FTO random state               |

Some events take a length: `getScramble('r3ni', 3)` gives three multi-blind scrambles. `getEvent(id).length` is the default, and events without one ignore it.

Other types include random-move and SiGN notation for every cube size, 3x3x3 training cases (PLL, OLL, ZBLL, CMLL, Mehta steps, 2-gen and other subsets), 2x2x2 EG/TCLL, 4x4x4 Yau/Hoya steps, the other clock, megaminx, pyraminx, skewb, square-1 and FTO variants, non-WCA puzzles (15 puzzle, Kilominx, Gigaminx, Redi, Dino, Ivy, Helicopter, Gear, cuboids up to 11x11x11, ...), relays and csTimer's joke types.

Some solvers (4x4x4, FTO, megaminx random state, ...) build lookup tables on first use, so their first scramble takes a second or two.

The WCA puzzle modules also export named functions (`get222Scramble`, `getSkewbScramble`, ...) if you'd rather not go through ids.

Puzzles live in modules under `src/events/<puzzle>/`, each calling `registerEvents(...)`.

## Layout

```
src/
  index.ts             public API
  registry.ts          event id -> generator
  random.ts            seeding (ISAAC, as in csTimer)
  cstimer.ts           runs a vendored csTimer scrambler by its type id
  events/333/          3x3 scramble types (TypeScript port)
  events/<puzzle>/     other puzzles: typed wrappers around csTimer's scramblers
  vendor/cstimer/      csTimer files kept close to upstream, with .d.ts typings
```

`src/vendor/cstimer` holds csTimer files from commit `2547d82`: its libraries (`mathlib.js`, `min2phase.js`, `isaac.js`, `grouplib.js`, `pat3x3.js`, `poly3dlib.js`), solvers (`ftocta.js`, `mgmsolver.js`, `cross.js`), the scramble manager (`scrmgr.js`, the non-UI part of `scramble.js`) and every file from csTimer's `src/js/scramble`. They are changed only to run as ES modules outside csTimer's web page (imports/exports, no jQuery, csTimer's UI parts skipped); each file's first lines list its changes, so they stay easy to compare with upstream.

To update them from a newer csTimer, run `node scripts/vendor-cstimer.mjs <path to a csTimer checkout>` (it does the same edits again; `mathlib.js`, `min2phase.js` and `isaac.js` are updated by hand).

Code style: modules declare everything first and list their exports in one `export { ... }` block at the bottom.

## Development

```sh
npm install      # needs Node 22.18+ (see .nvmrc); the published package runs on Node 18+
npm test          # vitest
npm run typecheck
npm run lint
npm run build     # tsdown -> dist/ (ESM + CJS + .d.ts)
```
