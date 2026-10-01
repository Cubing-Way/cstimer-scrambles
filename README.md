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

| id        | description        |
| --------- | ------------------ |
| `333`     | 3x3x3 random state |
| `333fm`   | 3x3x3 fewest moves |
| `edges`   | 3x3x3 edges only   |
| `corners` | 3x3x3 corners only |
| `ll`      | 3x3x3 last layer   |

More puzzles are added as modules under `src/events/<puzzle>/`, each calling `registerEvents(...)`.

## Layout

```
src/
  index.ts             public API
  registry.ts          event id -> generator
  random.ts            seeding (ISAAC, as in csTimer)
  events/333/          3x3 scramble types (TypeScript port)
  vendor/cstimer/      csTimer files kept close to upstream, with .d.ts typings
```

`src/vendor/cstimer` holds csTimer's `mathlib.js`, `min2phase.js` and `isaac.js` from commit `2547d82`, changed only to use ESM imports/exports and to drop the jQuery dependency.

## Development

```sh
npm install      # needs Node 22.18+ (see .nvmrc); the published package runs on Node 18+
npm test          # vitest
npm run typecheck
npm run lint
npm run build     # tsdown -> dist/ (ESM + CJS + .d.ts)
```
