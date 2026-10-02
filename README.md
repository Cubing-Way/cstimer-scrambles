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

## Scramble images

`getScrambleImage(type, scramble)` draws the scrambled puzzle as an SVG string, the same picture csTimer's "Draw Scramble" tool shows (for cubes an unfolded net with U on top and F in the middle; csTimer's default colors). The SVG has no background of its own, so it takes the color of whatever it's placed on. It works in browsers and in Node.

```ts
import { getScramble, getScrambleImage, hasScrambleImage } from '@cubing-way/cstimer-scrambles';

const scramble = getScramble('333');
const svg = getScrambleImage('333', scramble); // '<svg viewBox="0 0 396 296" ...>...</svg>'
document.getElementById('cube').innerHTML = svg;
```

Pass the scramble type the scramble was made for. Every puzzle csTimer can draw has images: cubes from 2x2x2 to 11x11x11, megaminx, kilominx, gigaminx, pyraminx, master pyraminx, skewb, square-1, square-2, clock, FTO, the 15 and 8 puzzles, and the other shape-mods and curvy puzzles (Redi, Dino, Helicopter, Gear, ...). Relays and multi-blind are drawn as a grid, one picture per puzzle. `hasScrambleImage(type)` tells you whether a type has one; the types csTimer can't draw (Ivy, cuboids, the "noob" text scrambles, ...) throw.

## Puzzle class

`new Puzzle(id)` is one physical puzzle with its own settings: face colors, image size, scramble method and scramble length. Settings are `set...` methods that return the puzzle, so they can be chained, and two puzzles never share settings.

```ts
import { Puzzle } from '@cubing-way/cstimer-scrambles';

const cube = new Puzzle('333')
  .setColors({ U: '#ff0', D: '#fff' }) // yellow on top
  .setImageSize(200) // SVG 200px wide; the height follows
  .setScrambleMethod('random-move')
  .setScrambleLength(20);

cube.scramble(); // "R2 F' U ..." (20 random moves), and the puzzle is now scrambled
cube.getImage(); // '<svg viewBox="0 0 418 312" width="200" ...>...</svg>', the scrambled puzzle
cube.setSolution("R U R'"); // getImage() now shows the scramble followed by these moves
cube.setScramble("R U R' U'"); // or scramble it with moves of your own
cube.reset(); // back to solved: no scramble, no solution
```

Puzzles: `listPuzzles()` gives their ids: first the WCA puzzles (`222` to `777`, `clock`, `minx`, `pyram`, `skewb` and `sq1`), then every other puzzle csTimer has scrambles for, named after the `puzzle` groups of `listEvents()` (`fto`, `888` to `111111`, `gear`, `relay`, `joke`, ...). Puzzles outside the WCA keep csTimer's colors for now (`getFaces()` is empty), except the big cubes, which have the cube faces.

- **Colors**: `getFaces()` lists the names `setColor(face, color)` takes (`U R F D L B` for cubes, skewb and square-1; `F L R D` for pyraminx; `U F R L BR BL DR DL DBR DBL B D` for megaminx; `front back hand handOutline pin` for clock). Colors are hex, `#rgb` or `#rrggbb`; csTimer draws with `#rgb` colors, so `#rrggbb` is rounded to the nearest one. `getColors()` and `resetColors()` read them and go back to csTimer's defaults.
- **Image size**: `setImageSize(width)` in pixels, for both the picture and the 3D view. For cubes a face is `width / 4` pixels in every 2D style but `'cstimer'` and in 3D, so the joined picture is `width` wide and the separated one a little wider. Without it the SVG keeps its own size and the 3D view fills its element; both can always be resized with CSS too.
- **Image style**: `setImageStyle(style)` picks how `getImage()` draws the puzzle. `'separated'` (the default) draws it in the style of the 3D view, with black faces, thick borders and rounded stickers, and a cube is unfolded with a gap between its faces. `'joined'` is the same with a cube's faces touching, as if it were cut open and laid flat (other puzzles look the same as `'separated'`). `'cstimer'` is csTimer's own picture, the same as `getScrambleImage`. Cubes are drawn by this library from `getStickers()`, in exact colors; the other puzzles keep csTimer's drawing with thicker black borders.
- **Cube style**: `setCubeStyle(style)` picks a ready-made look for a cube's tiles, in `getImage()` and `show3D` alike. `'classic'` (the default) rounds every tile's corners a little. `'stickered'` looks like a modern stickered cube: corner tiles square, edge tiles rounded on the two corners toward the face's center, center tiles rounded all round. `'stickered-round'` is rounder and also rounds the corner tiles' innermost corner. `'stickerless'` and `'stickerless-round'` have the same shapes with the tiles filling the whole face and touching, and a thin line in a slightly darker mix of the two tiles' colors where the pieces meet (no black line). On bigger cubes, the face's four corner tiles count as corners, the rest of its border as edges and everything inside as centers. `setElementStyle` still wins over it.
- **Scramble method**: `'default'` (the WCA scramble), `'random-state'` or `'random-move'`, each one of csTimer's scramble types (`getScrambleType()` says which). Not every puzzle has all three (csTimer has no random-state 5x5x5 to 7x7x7, nor random-move clock); `getScrambleMethods()` lists the ones it has and `setScrambleMethod` throws for the others.
- **Scramble type**: any of csTimer's scramble types for the puzzle, e.g. `setScrambleType('pll')` on a 3x3x3. `getScrambleTypes()` lists them (`{ id, name }`, in csTimer's menu order); all 206 are spread over the puzzles. A picked type is used instead of the method until `setScrambleMethod` is called again, and meanwhile `getScrambleMethod()` is `undefined`. Some types have no picture in csTimer (Ivy, cuboids, ...): `hasImage()` says whether `getImage()` can draw it.
- **Scramble length**: `setScrambleLength(moves)` for methods that make random moves (megaminx rounds it up to whole lines of 10). Random-state scrambles are as long as they need to be, so for them `getScrambleLength()` is `undefined` and the length waits until the method changes. `resetScrambleLength()` goes back to csTimer's default.
- **Typed moves**: `setScramble(moves)` scrambles the puzzle with your own moves, and `setSolution(moves)` sets moves done after the scramble, both in csTimer's notation for the puzzle. `scramble()` clears the solution, `reset()` clears both, and `getImage()` throws if csTimer can't read the moves.
- **Move counts**: `getScrambleMoveCount()` and `getSolutionMoveCount()`. Moves are counted between spaces, except on Square-1, where each slash is one move (twist metric). Relay numbers like `2)` are not counted.
- **3D view** (cubes, 2x2x2 to 11x11x11; `has3DView()` says if a puzzle has one): `show3D(element)` shows the cube in 3D inside an element of a web page, in the same state as `getImage()` and with the puzzle's colors; call it again after a change to update it. It is built from plain HTML elements turned by CSS, so it needs no 3D library. `getStickers()` gives the colors behind it: `{ U: [...], R, F, D, L, B }`, each face read row by row as in the unfolded picture.
- **3D camera**: the view starts at the camera angle, by default with the U R F corner in the middle, pointing straight at the camera. `setCameraMode('mouse')` (the default) lets it be dragged with the mouse or a finger to look at every side, and the dragged angle is kept when `show3D` is called again; `setCameraMode('fixed')` keeps it at the camera angle. `setCameraAngle({ x, y })` sets that angle in degrees: `x` tilts the cube (negative shows its top), then `y` turns it sideways (negative shows its right side). `getCameraAngle()` and `resetCameraAngle()` read it and go back to the default.
- **3D back faces**: `setHiddenFaces('floating')` shows a copy of each face you can't see, as big as the face and one cube side out from it, seen as through a glass cube, so all six faces show at once (turning the cube swaps which faces float; a face pointing straight away can still have its copy partly behind the cube); `'hidden'` is the default. `setFloatingFaceOffset(face, { x, y, z, rotateX, rotateY, rotateZ })` moves a face's copy from there and turns it about its own center, in the cube's directions (x toward R, y toward U, z toward F): positions in face widths, turns in degrees, clockwise as seen from the R, U and F sides like the cube rotations x, y and z. Values left out are 0. For example `cube.setFloatingFaceOffset('L', { x: 1, y: 1, z: 1 })` moves L's copy next to the cube with a corner touching its U L F corner. `getFloatingFaceOffset(face)` and `resetFloatingFaceOffsets()` read them and put them back.
- **3D face offsets**: `setFaceOffset(face, { x, y, z, rotateX, rotateY, rotateZ })` moves and turns one of the cube's own faces the same way, e.g. `cube.setFaceOffset('U', { y: 0.5 })` lifts the top face off the cube. It works with hidden and floating back faces. `getFaceOffset(face)` and `resetFaceOffsets()` read them and put them back.
- **Element styles**: `setElementStyle(part, css, where?)` adds CSS to the whole picture (`'image'`), the faces (`'face'`) or the tiles (`'tile'`), in `getImage()`'s SVG and in the `show3D` view, e.g. `cube.setElementStyle('tile', { stroke: '#fff', strokeWidth: '2' })` or `cube.setElementStyle('face', { opacity: '0.4' }, { face: 'B' })`. `where` picks one face and one tile number on it (row by row from the top left, from 0). The SVG takes SVG properties (`fill`, `stroke`, `opacity`; a face's `fill` is its background) and the 3D view HTML ones (`background`, `border-radius`). `getElementStyles()` and `resetElementStyles()` read them and take them away. The same parts carry class names for your own CSS: `.cstimer-image`, `.cstimer-face[data-face="U"]` and `.cstimer-tile[data-face="U"][data-tile="0"]`. Faces and tile numbers are for cubes; csTimer's pictures of other puzzles mark the picture and its tiles.

## Supported events

All 206 scramble types in csTimer's menu are supported, with csTimer's ids (everything except its UI-only entries: input, remote, BLD helper, pattern tool and custom). `listEvents()` returns them all with a name and a `puzzle` group; the [demo page](https://cubing-way.github.io/cstimer-scrambles/) has them all, picked by puzzle and then type.

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
  image.ts             scramble images, drawn by csTimer's image code
  puzzle.ts            the Puzzle class
  view3d.ts            the 3D cube view (Puzzle.show3D)
  net2d.ts             flat cube pictures in the 3D view's style (Puzzle.getImage)
  events/<puzzle>/     typed wrappers around csTimer's scramblers, one module per puzzle
  vendor/cstimer/      csTimer files kept close to upstream, with .d.ts typings
```

`src/vendor/cstimer` holds csTimer files from commit `2547d82`: its libraries (`mathlib.js`, `min2phase.js`, `isaac.js`, `grouplib.js`, `pat3x3.js`, `poly3dlib.js`), solvers (`ftocta.js`, `mgmsolver.js`, `cross.js`), the scramble manager (`scrmgr.js`, the non-UI part of `scramble.js`), every file from csTimer's `src/js/scramble`, and for images `image.js` (from `src/js/tools`), `cubeutil.js`, `svglib.js` (csTimer's SVG helpers from `utillib.js`) and `toolsutil.js` (its puzzle type helpers from `tools.js`), plus `kernel.js`, a stand-in for csTimer's settings (colors) that the image code reads. They are changed only to run as ES modules outside csTimer's web page (imports/exports, no jQuery, csTimer's UI parts skipped, and `image.js` also exports the cube sticker code the 3D view uses); each file's first lines list its changes, so they stay easy to compare with upstream.

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
