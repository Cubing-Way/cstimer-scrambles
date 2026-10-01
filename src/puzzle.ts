// The Puzzle class: one physical puzzle with its own colors, image size and scramble method.

import { getEvent, getScramble } from './registry.js';
import { drawImage } from './image.js';
import { drawCube3D } from './view3d.js';
import image from './vendor/cstimer/image.js';

/**
 * How `Puzzle.scramble()` makes scrambles:
 * - `'default'`: the WCA scramble type for the puzzle (what csTimer picks for it).
 * - `'random-state'`: a random position, solved by a computer (as the WCA does for 3x3x3).
 * - `'random-move'`: a series of random moves.
 */
type ScrambleMethod = 'default' | 'random-state' | 'random-move';

interface PuzzleInfo {
  name: string;
  /** csTimer's setting holding this puzzle's colors, e.g. `colcube`. */
  colorSetting: string;
  /** csTimer's default color for each face, in the order faces are listed to users. */
  defaultColors: Readonly<Record<string, string>>;
  /** The faces in the order csTimer keeps their colors in that setting. */
  cstimerOrder: readonly string[];
  /** The csTimer scramble type id for each method the puzzle has. */
  methods: { default: string } & Partial<Record<ScrambleMethod, string>>;
  /** For cubes: how many stickers along each edge, e.g. 3 for 3x3x3. */
  cubeSize?: number;
}

function cube(n: number, methods: PuzzleInfo['methods']): PuzzleInfo {
  return {
    name: `${n}x${n}x${n}`,
    colorSetting: 'colcube',
    defaultColors: { U: '#fff', R: '#f00', F: '#0d0', D: '#ff0', L: '#fa0', B: '#00f' },
    cstimerOrder: ['D', 'L', 'B', 'U', 'R', 'F'],
    methods,
    cubeSize: n,
  };
}

/** The puzzles `Puzzle` supports, by id (the same ids as `ScrambleEvent.puzzle`). */
const PUZZLES: Record<string, PuzzleInfo> = {
  // csTimer's 2x2x2 random-move scramble uses R, U and F, which reach every position.
  '222': cube(2, { default: '222so', 'random-state': '222so', 'random-move': '2223' }),
  '333': cube(3, { default: '333', 'random-state': '333', 'random-move': '333o' }),
  '444': cube(4, { default: '444wca', 'random-state': '444wca', 'random-move': '444m' }),
  // The WCA uses random moves for 5x5x5 and up; csTimer has no random-state scrambler for them.
  '555': cube(5, { default: '555wca', 'random-move': '555wca' }),
  '666': cube(6, { default: '666wca', 'random-move': '666wca' }),
  '777': cube(7, { default: '777wca', 'random-move': '777wca' }),
  clock: {
    name: 'Clock',
    colorSetting: 'colclk',
    // The outline of the hands, the two sides' dials, the hands (and pins that are up),
    // and pins that are down.
    defaultColors: { front: '#5cf', back: '#37b', hand: '#ff0', handOutline: '#f00', pin: '#850' },
    cstimerOrder: ['handOutline', 'back', 'front', 'hand', 'pin'],
    // Every dial gets a random time, so the WCA scramble is already random state.
    methods: { default: 'clkwca', 'random-state': 'clkwca' },
  },
  minx: {
    name: 'Megaminx',
    colorSetting: 'colmgm',
    defaultColors: {
      U: '#fff',
      F: '#060',
      R: '#d00',
      L: '#81f',
      BR: '#00b',
      BL: '#fc0',
      DR: '#ffb',
      DL: '#8df',
      DBR: '#f9f',
      DBL: '#f83',
      B: '#7e0',
      D: '#999',
    },
    cstimerOrder: ['U', 'R', 'F', 'L', 'BL', 'BR', 'DR', 'DL', 'DBL', 'B', 'DBR', 'D'],
    methods: { default: 'mgmp', 'random-state': 'mgmso', 'random-move': 'mgmp' },
  },
  pyram: {
    name: 'Pyraminx',
    colorSetting: 'colpyr',
    defaultColors: { F: '#0f0', L: '#f00', R: '#00f', D: '#ff0' },
    cstimerOrder: ['F', 'L', 'R', 'D'],
    methods: { default: 'pyrso', 'random-state': 'pyrso', 'random-move': 'pyrm' },
  },
  skewb: {
    name: 'Skewb',
    colorSetting: 'colskb',
    defaultColors: { U: '#fff', R: '#f00', F: '#0f0', D: '#ff0', L: '#f80', B: '#00f' },
    cstimerOrder: ['U', 'B', 'R', 'D', 'F', 'L'],
    methods: { default: 'skbso', 'random-state': 'skbso', 'random-move': 'skb' },
  },
  sq1: {
    name: 'Square-1',
    colorSetting: 'colsq1',
    defaultColors: { U: '#ff0', R: '#f80', F: '#0f0', D: '#fff', L: '#f00', B: '#00f' },
    cstimerOrder: ['U', 'R', 'F', 'D', 'L', 'B'],
    methods: { default: 'sqrs', 'random-state': 'sqrs', 'random-move': 'sq1h' },
  },
};

const METHODS: readonly ScrambleMethod[] = ['default', 'random-state', 'random-move'];
const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * csTimer draws with 3-digit colors (#rgb), so a 6-digit color becomes the nearest one,
 * e.g. "#ff8000" -> "#f80".
 */
function toCstimerColor(color: string): string {
  const hex = color.slice(1);
  if (hex.length === 3) return color;
  let short = '#';
  for (let i = 0; i < 6; i += 2) {
    short += Math.round(parseInt(hex.slice(i, i + 2), 16) / 17).toString(16);
  }
  return short;
}

/**
 * csTimer's Square-1 drawing reads one turn like `(1,0)` between slashes, so turns in a
 * row, e.g. where a scramble ends and a solution starts, are added up into one turn.
 * Anything else is left as it is.
 */
function joinSq1Turns(moves: string): string {
  const tokens = moves.match(/\(\s*-?\d+\s*,\s*-?\d+\s*\)|\/|\S/g) ?? [];
  if (tokens.some((token) => token !== '/' && !token.startsWith('('))) return moves;
  const out: (string | [number, number])[] = [];
  for (const token of tokens) {
    const last = out[out.length - 1];
    if (token === '/') {
      out.push(token);
    } else {
      const [top, bottom] = token.slice(1, -1).split(',').map(Number) as [number, number];
      if (Array.isArray(last)) {
        last[0] += top;
        last[1] += bottom;
      } else {
        out.push([top, bottom]);
      }
    }
  }
  // Sums are written from -5 to 6, like csTimer's own scrambles.
  const turn = (n: number) => ((((n + 5) % 12) + 12) % 12) - 5;
  return out
    .map((token) => (typeof token === 'string' ? token : ` (${turn(token[0])},${turn(token[1])})`))
    .join('')
    .trim();
}

/** Ids of the puzzles `new Puzzle(id)` accepts, e.g. `'333'`, `'pyram'`. */
function listPuzzles(): string[] {
  return Object.keys(PUZZLES);
}

/**
 * One physical puzzle, e.g. `new Puzzle('333')`. Each puzzle keeps its own settings
 * (colors, image size, scramble method and length), so two puzzles never affect each other.
 *
 * Settings are changed with `set...` methods, which return the puzzle so they can be
 * chained: `new Puzzle('333').setColor('U', '#ff0').setImageSize(200)`.
 */
class Puzzle {
  /** The puzzle id, e.g. `'333'`. */
  readonly id: string;
  /** Human-readable name, e.g. `'3x3x3'`. */
  readonly name: string;

  #info: PuzzleInfo;
  #colors: Record<string, string>;
  #imageSize: number | undefined;
  #method: ScrambleMethod = 'default';
  #length: number | undefined;
  #scramble = '';
  #solution = '';
  /** The scramble type `#scramble` was made with, which is the one to draw it with. */
  #scrambleType = '';

  constructor(id: string) {
    const info = PUZZLES[id];
    if (!info) {
      throw new Error(`Unknown puzzle "${id}". Puzzles: ${listPuzzles().join(', ')}`);
    }
    this.id = id;
    this.name = info.name;
    this.#info = info;
    this.#colors = { ...info.defaultColors };
  }

  /** Names `setColor` accepts, e.g. `['U', 'R', 'F', 'D', 'L', 'B']` for cubes. */
  getFaces(): string[] {
    return Object.keys(this.#info.defaultColors);
  }

  /**
   * Sets the color of one face (or part, for clock), as a hex color like `'#ff0'` or
   * `'#ffaa00'`. csTimer draws with 3-digit colors, so 6-digit ones are rounded to the
   * nearest of those.
   */
  setColor(face: string, color: string): this {
    if (!Object.prototype.hasOwnProperty.call(this.#colors, face)) {
      throw new Error(`${this.name} has no face "${face}". Faces: ${this.getFaces().join(', ')}`);
    }
    if (!HEX_COLOR.test(color)) {
      throw new Error(`"${color}" is not a hex color like "#ff0" or "#ffaa00"`);
    }
    this.#colors[face] = color.toLowerCase();
    return this;
  }

  /** Sets several colors at once, e.g. `{ U: '#ff0', D: '#fff' }`. */
  setColors(colors: Record<string, string>): this {
    for (const [face, color] of Object.entries(colors)) {
      this.setColor(face, color);
    }
    return this;
  }

  /** Every face's color, e.g. `{ D: '#ff0', L: '#fa0', ... }`. */
  getColors(): Record<string, string> {
    return { ...this.#colors };
  }

  /** Goes back to csTimer's default colors. */
  resetColors(): this {
    this.#colors = { ...this.#info.defaultColors };
    return this;
  }

  /**
   * Sets the width of `getImage()`'s SVG in pixels; the height follows the picture's
   * shape. Without it the SVG keeps csTimer's own size. It can still be resized with CSS.
   */
  setImageSize(width: number): this {
    if (!(width > 0) || !Number.isFinite(width)) {
      throw new Error(`Image size must be a positive number of pixels, not ${width}`);
    }
    this.#imageSize = width;
    return this;
  }

  /** The width set with `setImageSize`, or `undefined` for csTimer's own size. */
  getImageSize(): number | undefined {
    return this.#imageSize;
  }

  /** Which methods `setScrambleMethod` accepts for this puzzle. */
  getScrambleMethods(): ScrambleMethod[] {
    return METHODS.filter((method) => method in this.#info.methods);
  }

  /**
   * Picks how `scramble()` makes scrambles: `'default'` (the WCA way), `'random-state'`
   * or `'random-move'`. Throws if csTimer has no such scrambler for this puzzle
   * (see `getScrambleMethods`).
   */
  setScrambleMethod(method: ScrambleMethod): this {
    if (!(method in this.#info.methods)) {
      throw new Error(
        `${this.name} has no "${method}" scrambles. Methods: ${this.getScrambleMethods().join(', ')}`,
      );
    }
    this.#method = method;
    return this;
  }

  getScrambleMethod(): ScrambleMethod {
    return this.#method;
  }

  /** The csTimer scramble type id the current method uses, e.g. `'333o'`. */
  getScrambleType(): string {
    return this.#info.methods[this.#method]!;
  }

  /**
   * Sets how many moves `scramble()` makes, e.g. `setScrambleLength(30)`. It is used by
   * methods that make random moves; random-state scrambles are as long as they need to
   * be, so they ignore it (see `getScrambleLength`). Megaminx rounds it up to whole
   * lines of 10 moves.
   */
  setScrambleLength(length: number): this {
    if (!Number.isInteger(length) || length < 1) {
      throw new Error(`Scramble length must be a whole number of moves, at least 1, not ${length}`);
    }
    this.#length = length;
    return this;
  }

  /**
   * How many moves `scramble()` will make with the current method: the length set with
   * `setScrambleLength`, or csTimer's default for the method. `undefined` when the method
   * picks its own length (random-state scrambles).
   */
  getScrambleLength(): number | undefined {
    const defaultLength = getEvent(this.getScrambleType())?.length;
    return defaultLength === undefined ? undefined : (this.#length ?? defaultLength);
  }

  /** Goes back to csTimer's default scramble length. */
  resetScrambleLength(): this {
    this.#length = undefined;
    return this;
  }

  /**
   * Makes a new scramble with the current method and length, and scrambles the puzzle
   * with it (clearing any solution), so `getImage()` then shows it.
   */
  scramble(): string {
    this.#scrambleType = this.getScrambleType();
    this.#scramble = getScramble(this.#scrambleType, this.getScrambleLength());
    this.#solution = '';
    return this.#scramble;
  }

  /**
   * Scrambles the puzzle with a scramble of your own, e.g. `setScramble("R U R' U'")`,
   * written in csTimer's notation for this puzzle. The solution is kept.
   */
  setScramble(scramble: string): this {
    this.#scrambleType = this.getScrambleType();
    this.#scramble = scramble.trim();
    return this;
  }

  /** The scramble the puzzle was last scrambled with, or `''` when it is solved. */
  getScramble(): string {
    return this.#scramble;
  }

  /**
   * Sets the moves done after the scramble, e.g. a solution being typed, so `getImage()`
   * shows the puzzle after the scramble and then these moves. Same notation as the scramble.
   */
  setSolution(moves: string): this {
    this.#solution = moves.trim();
    return this;
  }

  /** The moves set with `setSolution`, or `''`. */
  getSolution(): string {
    return this.#solution;
  }

  /** Puts the puzzle back to solved: no scramble and no solution. */
  reset(): this {
    this.#scramble = '';
    this.#solution = '';
    return this;
  }

  /** Whether `getStickers` and `show3D` work for this puzzle: the cubes, 2x2x2 to 7x7x7. */
  has3DView(): boolean {
    return this.#info.cubeSize !== undefined;
  }

  /**
   * The color of every sticker of a cube as it is now (after the scramble and then the
   * solution), by face: `{ U: [...], R: [...], F, D, L, B }`, each with size x size colors.
   * Each face is read row by row, from the top left, as you see it in `getImage()`'s
   * unfolded picture: U with its top row next to B, D with its top row next to F, and the
   * side faces upright. Only for cubes (see `has3DView`).
   */
  getStickers(): Record<string, string[]> {
    const size = this.#info.cubeSize;
    if (size === undefined) throw new Error(`${this.name} has no 3D view yet, only cubes do`);
    const moves = [this.#scramble, this.#solution].filter(Boolean).join(' ');
    // csTimer's stickers: per face (D L B U R F), the face each sticker's color comes from.
    const posit = image.nnnPosit(size, moves);
    const order = this.#info.cstimerOrder;
    const stickers: Record<string, string[]> = {};
    for (const face of this.getFaces()) {
      const f = order.indexOf(face);
      const colors: string[] = [];
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          // The same flips as csTimer's unfolded picture: L and B mirrored, D upside down.
          const x = face === 'L' || face === 'B' ? size - 1 - col : col;
          const y = face === 'D' ? size - 1 - row : row;
          colors.push(this.#colors[order[posit[(f * size + y) * size + x]!]!]!);
        }
      }
      stickers[face] = colors;
    }
    return stickers;
  }

  /**
   * Shows the cube in 3D inside `element` on a web page, as it is now (the same state as
   * `getImage()`), with this puzzle's colors. It fills the element's width; drag it with
   * the mouse or a finger to look at every side. Call it again after changing the puzzle
   * to update the view: the cube keeps the angle it was turned to. Only for cubes (see
   * `has3DView`), and only in a browser.
   */
  show3D(element: HTMLElement): this {
    drawCube3D(element, this.#info.cubeSize ?? 0, this.getStickers());
    return this;
  }

  /**
   * Draws the puzzle as it is now (solved, or after the scramble and then the solution)
   * as an SVG string, with this puzzle's colors and image size. Same picture as
   * `getScrambleImage`. Throws if csTimer can't read the moves.
   */
  getImage(): string {
    const colors = this.#info.cstimerOrder
      .map((face) => toCstimerColor(this.#colors[face]!))
      .join('');
    let moves = [this.#scramble, this.#solution].filter(Boolean).join(' ');
    if (this.id === 'sq1') moves = joinSq1Turns(moves);
    try {
      return drawImage(
        this.#scramble ? this.#scrambleType : this.getScrambleType(),
        moves,
        { [this.#info.colorSetting]: colors },
        this.#imageSize,
      );
    } catch {
      throw new Error(`Can't read these moves as ${this.name} moves: "${moves}"`);
    }
  }
}

export { Puzzle, listPuzzles };
export type { ScrambleMethod };
