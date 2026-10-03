// The Puzzle class: one physical puzzle with its own colors, image size and scramble method.

import { getEvent, getScramble, listEvents } from './registry.js';
import { drawImage, hasScrambleImage } from './image.js';
import { drawCubeNet, thickenBorders } from './net2d.js';
import { DEFAULT_CAMERA_ANGLE, drawCube3D } from './view3d.js';
import type { CameraAngle, CameraMode, FaceOffset, HiddenFaces } from './view3d.js';
import { CUBE_STYLES } from './cubestyle.js';
import type { CubeStyle } from './cubestyle.js';
import { IMAGE_PARTS, styleSvg } from './styling.js';
import type { ElementStyle, ImagePart, PartFilter } from './styling.js';
import {
  FMC_RULES,
  SLICE_MOVES,
  WIDE_MOVES,
  countSolutionMoves,
  cubeSolveStatus,
  invalidSolutionMoves,
  allowedSolutionMoves,
} from './solution.js';
import type { SliceMoves, SolutionRules, SolveStatus, WideMoves } from './solution.js';
import { CubeSearch, SOLVER_SIZES } from './solver.js';
import image from './vendor/cstimer/image.js';
import tools from './vendor/cstimer/toolsutil.js';

/**
 * How `Puzzle.scramble()` makes scrambles:
 * - `'default'`: the WCA scramble type for the puzzle (what csTimer picks for it).
 * - `'random-state'`: a random position, solved by a computer (as the WCA does for 3x3x3).
 * - `'random-move'`: a series of random moves.
 */
type ScrambleMethod = 'default' | 'random-state' | 'random-move';

/**
 * How `Puzzle.getImage()` draws the puzzle:
 * - `'separated'`: in the style of the 3D view, with black faces, thick borders and rounded
 *   stickers; a cube is unfolded with a gap between its faces.
 * - `'joined'`: the same, with a cube's faces touching, as if it were cut open and laid flat.
 *   Other puzzles look the same as with `'separated'`.
 * - `'cstimer'`: csTimer's own picture, the same as `getScrambleImage`.
 */
type ImageStyle = 'separated' | 'joined' | 'cstimer';

const IMAGE_STYLES: readonly ImageStyle[] = ['separated', 'joined', 'cstimer'];
const HIDDEN_FACES: readonly HiddenFaces[] = ['hidden', 'floating'];
const CAMERA_MODES: readonly CameraMode[] = ['mouse', 'fixed'];
const CUBE_FACES: readonly string[] = ['U', 'R', 'F', 'D', 'L', 'B'];
const NO_OFFSET: Readonly<FaceOffset> = { x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, rotateZ: 0 };

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

/** Cubes bigger than 7x7x7: csTimer only has random-move scrambles for them. */
const BIG_CUBES: Record<string, PuzzleInfo> = Object.fromEntries(
  [8, 9, 10, 11].map((n) => {
    const id = String(n).repeat(3);
    return [id, cube(n, { default: id, 'random-move': id })];
  }),
);

/** Names of the other puzzles, by the `puzzle` group of their scramble types. */
const OTHER_NAMES: Record<string, string> = {
  fto: 'FTO',
  '15p': '15 puzzle',
  '8p': '8 puzzle',
  '133': '1x3x3 (Floppy Cube)',
  '223': '2x2x3 (Tower Cube)',
  '233': '2x3x3 (Domino)',
  nnn: 'NxNxN',
  mrbl: 'Mirror Blocks',
  gear: 'Gear Cube',
  klm: 'Kilominx',
  giga: 'Gigaminx',
  crz3a: 'Crazy 3x3x3',
  cmetrick: 'Cmetrick',
  heli: 'Helicopter Cube',
  redi: 'Redi Cube',
  dino: 'Dino Cube',
  ivy: 'Ivy Cube',
  mpyr: 'Master Pyraminx',
  prc: 'Pyraminx Crystal',
  sia: 'Siamese Cube',
  sq2: 'Square-2',
  sfl: 'Super Floppy',
  ufo: 'UFO',
  ico: 'Icosahedron',
  bandaged: 'Bandaged puzzles',
  dmd: 'Diamond',
  relay: 'Relays',
  joke: 'Joke scrambles',
};

/**
 * The puzzle info for an id: a WCA puzzle, a big cube, or any other `puzzle` group of
 * csTimer's scramble types. The others have csTimer's colors only, and their methods
 * come from their types' names ("random state", "random move").
 */
function puzzleInfo(id: string): PuzzleInfo | undefined {
  const known = PUZZLES[id] ?? BIG_CUBES[id];
  if (known) return known;
  const types = listEvents().filter((event) => event.puzzle === id);
  if (types.length === 0) return undefined;
  const methods: PuzzleInfo['methods'] = { default: types[0]!.id };
  const state = types.find((type) => /random state/.test(type.name));
  const move = types.find((type) => /random move/.test(type.name));
  if (state) methods['random-state'] = state.id;
  if (move) methods['random-move'] = move.id;
  return {
    name: OTHER_NAMES[id] ?? types[0]!.name,
    colorSetting: '',
    defaultColors: {},
    cstimerOrder: [],
    methods,
  };
}

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

/**
 * Counts the moves in `moves`, written in the puzzle's notation: the moves between
 * spaces, except on Square-1, where each slash `/` is one move (twist metric) and the
 * turns between them are free. Relay numbers like `2)` are not moves.
 */
function countMoves(puzzleId: string, moves: string): number {
  if (puzzleId === 'sq1') return (moves.match(/\//g) ?? []).length;
  return moves.split(/\s+/).filter((move) => move && !/^\w+\)$/.test(move)).length;
}

/**
 * Ids of the puzzles `new Puzzle(id)` accepts, e.g. `'333'`, `'pyram'`: the WCA puzzles
 * first, then every other puzzle csTimer has scrambles for (the `puzzle` groups of
 * `listEvents()`, in the same order).
 */
function listPuzzles(): string[] {
  const ids = new Set(Object.keys(PUZZLES));
  for (const event of listEvents()) ids.add(event.puzzle);
  return [...ids];
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
  #imageStyle: ImageStyle = 'separated';
  #hiddenFaces: HiddenFaces = 'hidden';
  #cubeStyle: CubeStyle = 'classic';
  #cameraMode: CameraMode = 'mouse';
  #cameraAngle: CameraAngle = { ...DEFAULT_CAMERA_ANGLE };
  #floatingOffsets: Partial<Record<string, FaceOffset>> = {};
  #faceOffsets: Partial<Record<string, FaceOffset>> = {};
  #styles: ElementStyle[] = [];
  #method: ScrambleMethod = 'default';
  #length: number | undefined;
  #scramble = '';
  #solution = '';
  #rules: SolutionRules = { countRotations: true, sliceMoves: 'one-move', wideMoves: 'Rw-or-r' };
  #fmc = false;
  #solveTimeLimit = 3000;
  /** The solution the last solve found, while it is still the puzzle's solution. */
  #solved: { scramble: string; solution: string; shortest: boolean } | undefined;
  /** Ends the running `solveAsync` early. */
  #stopSolving: (() => void) | undefined;
  /** The scramble type `#scramble` was made with, which is the one to draw it with. */
  #scrambleType = '';
  /** A scramble type picked with `setScrambleType`, used instead of the method's. */
  #type: string | undefined;

  constructor(id: string) {
    const info = puzzleInfo(id);
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
   * For cubes it sets the size of a face, `width / 4` pixels, the same in the picture (with
   * any style but `'cstimer'`) and in the `show3D` view: the joined picture and the 3D view
   * with floating faces are `width` pixels wide, the separated picture a little wider for
   * its gaps and the 3D view with hidden faces a little over half as wide.
   */
  setImageSize(width: number): this {
    if (!(width > 0) || !Number.isFinite(width)) {
      throw new Error(`Image size must be a positive number of pixels, not ${width}`);
    }
    this.#imageSize = width;
    return this;
  }

  /** The width set with `setImageSize`, or `undefined` for the default sizes. */
  getImageSize(): number | undefined {
    return this.#imageSize;
  }

  /**
   * Picks how `getImage()` draws the puzzle: `'separated'` (the default), `'joined'` or
   * `'cstimer'` (see `ImageStyle`). Cubes are drawn by this library in the style of the
   * 3D view; the other puzzles keep csTimer's drawing, with thicker black borders.
   */
  setImageStyle(style: ImageStyle): this {
    if (!IMAGE_STYLES.includes(style)) {
      throw new Error(`Unknown image style "${style}". Styles: ${IMAGE_STYLES.join(', ')}`);
    }
    this.#imageStyle = style;
    return this;
  }

  /** The style set with `setImageStyle`, `'separated'` by default. */
  getImageStyle(): ImageStyle {
    return this.#imageStyle;
  }

  /**
   * Picks a ready-made look for a cube's tiles, in `getImage()` (with any image style but
   * `'cstimer'`) and in `show3D` alike: `'classic'` (the default), `'stickered'`,
   * `'stickered-round'`, `'stickerless'` or `'stickerless-round'` (see `CubeStyle`).
   * Styles from `setElementStyle` still win over it. Only cubes have it (see `has3DView`);
   * the other puzzles are drawn as before.
   */
  setCubeStyle(style: CubeStyle): this {
    if (!CUBE_STYLES.includes(style)) {
      throw new Error(`Unknown cube style "${style}". Styles: ${CUBE_STYLES.join(', ')}`);
    }
    this.#cubeStyle = style;
    return this;
  }

  /** The style set with `setCubeStyle`, `'classic'` by default. */
  getCubeStyle(): CubeStyle {
    return this.#cubeStyle;
  }

  /**
   * Picks what `show3D` does with the faces you can't see from where you look:
   * - `'hidden'` (the default): they are hidden behind the cube, as on a real one.
   * - `'floating'`: a copy of each of them, as big as the face, floats one cube side out
   *   from it, seen as through a glass cube, so every face can be seen at once. A face
   *   pointing straight away from you can still have its copy partly behind the cube.
   *   Turning the cube swaps which faces float. `setFloatingFaceOffset` moves and turns
   *   the copies.
   */
  setHiddenFaces(mode: HiddenFaces): this {
    if (!HIDDEN_FACES.includes(mode)) {
      throw new Error(`Unknown hidden faces mode "${mode}". Modes: ${HIDDEN_FACES.join(', ')}`);
    }
    this.#hiddenFaces = mode;
    return this;
  }

  /** The mode set with `setHiddenFaces`, `'hidden'` by default. */
  getHiddenFaces(): HiddenFaces {
    return this.#hiddenFaces;
  }

  /**
   * Moves and turns the floating copy of one face of the `show3D` view (with
   * `setHiddenFaces('floating')`) from where it floats by default, e.g.
   * `setFloatingFaceOffset('L', { x: 1, rotateY: 45 })`. Positions are in face widths and
   * turns in degrees, in the cube's directions: x toward R, y toward U, z toward F (see
   * `FaceOffset`). Values left out are 0, and it replaces the face's earlier offset.
   * Any of the six faces can be moved; a copy only shows while its face is at the back.
   * Only for cubes (see `has3DView`).
   */
  setFloatingFaceOffset(face: string, offset: Partial<FaceOffset>): this {
    this.#floatingOffsets[face] = this.#checkOffset(face, offset);
    return this;
  }

  /** The offset set with `setFloatingFaceOffset` for one face, all 0 by default. */
  getFloatingFaceOffset(face: string): FaceOffset {
    return { ...(this.#floatingOffsets[face] ?? NO_OFFSET) };
  }

  /** Puts every floating face back where it floats by default. */
  resetFloatingFaceOffsets(): this {
    this.#floatingOffsets = {};
    return this;
  }

  /**
   * Moves and turns one face of the cube itself in the `show3D` view, the way
   * `setFloatingFaceOffset` moves a floating copy, e.g. `setFaceOffset('U', { y: 0.5 })` to
   * lift the top face off the cube. It works with hidden and floating back faces alike.
   * Only for cubes (see `has3DView`).
   */
  setFaceOffset(face: string, offset: Partial<FaceOffset>): this {
    this.#faceOffsets[face] = this.#checkOffset(face, offset);
    return this;
  }

  /** The offset set with `setFaceOffset` for one face, all 0 by default. */
  getFaceOffset(face: string): FaceOffset {
    return { ...(this.#faceOffsets[face] ?? NO_OFFSET) };
  }

  /** Puts every face of the cube back in its place. */
  resetFaceOffsets(): this {
    this.#faceOffsets = {};
    return this;
  }

  /** Checks a face offset, filling in 0 for the values left out. */
  #checkOffset(face: string, offset: Partial<FaceOffset>): FaceOffset {
    if (!this.has3DView()) throw new Error(`${this.name} has no 3D view yet, only cubes do`);
    if (!CUBE_FACES.includes(face)) {
      throw new Error(`${this.name} has no face "${face}". Faces: ${CUBE_FACES.join(', ')}`);
    }
    const full = { ...NO_OFFSET, ...offset };
    for (const [key, value] of Object.entries(full)) {
      if (!(key in NO_OFFSET)) {
        throw new Error(`Unknown offset "${key}". Offsets: ${Object.keys(NO_OFFSET).join(', ')}`);
      }
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`Offset ${key} must be a number, not ${value}`);
      }
    }
    return full;
  }

  /**
   * Adds a style of your own to some parts of the picture, in `getImage()`'s SVG and in the
   * `show3D` view: the whole picture (`'image'`), the faces (`'face'`) or the tiles
   * (`'tile'`), all of them or only those of one face, or one tile by its number on its face
   * (counted row by row from the top left, from 0). `css` holds CSS properties and values,
   * e.g. `setElementStyle('tile', { stroke: '#fff', strokeWidth: '2' })` or
   * `setElementStyle('face', { opacity: '0.4' }, { face: 'B' })`. Styles add up, and a later
   * one wins over an earlier one on the same property.
   *
   * The SVG takes SVG properties (`fill`, `stroke`, `rx`, `opacity`...) and the 3D view
   * HTML ones (`background`, `border-radius`, `opacity`...). A face of the SVG is a group:
   * its `fill` colors its black background, its `stroke` outlines its background and tiles.
   * Faces and tile numbers are for cubes drawn by this library (any image style but
   * `'cstimer'`, and the 3D view); csTimer's pictures only have the image and its tiles. The
   * same parts carry class names and data attributes (`cstimer-image`, `cstimer-face`,
   * `cstimer-tile`, `data-face`, `data-tile`) for styling with a page's own CSS instead.
   */
  setElementStyle(part: ImagePart, css: Record<string, string>, where: PartFilter = {}): this {
    if (!IMAGE_PARTS.includes(part)) {
      throw new Error(`Unknown part "${part}". Parts: ${IMAGE_PARTS.join(', ')}`);
    }
    for (const [property, value] of Object.entries(css)) {
      if (typeof value !== 'string' || !/^[a-zA-Z-]+$/.test(property)) {
        throw new Error(`CSS must be property names with text values, not ${property}: ${value}`);
      }
    }
    if ((where.face !== undefined || where.tile !== undefined) && !this.has3DView()) {
      throw new Error(`Only cubes have faces and tile numbers to style, not ${this.name}`);
    }
    if (where.face !== undefined && !CUBE_FACES.includes(where.face)) {
      throw new Error(`${this.name} has no face "${where.face}". Faces: ${CUBE_FACES.join(', ')}`);
    }
    if (where.tile !== undefined && !(Number.isInteger(where.tile) && where.tile >= 0)) {
      throw new Error(`A tile number must be a whole number from 0, not ${where.tile}`);
    }
    const style: ElementStyle = { part, css: { ...css } };
    if (where.face !== undefined) style.face = where.face;
    if (where.tile !== undefined) style.tile = where.tile;
    this.#styles.push(style);
    return this;
  }

  /** The styles added with `setElementStyle`, in the order they were added. */
  getElementStyles(): ElementStyle[] {
    return this.#styles.map((style) => ({ ...style, css: { ...style.css } }));
  }

  /** Takes away every style added with `setElementStyle`. */
  resetElementStyles(): this {
    this.#styles = [];
    return this;
  }

  /**
   * Picks how the camera of the `show3D` view moves: `'mouse'` (the default) lets the
   * cube be dragged with the mouse or a finger to look at every side, `'fixed'` keeps it
   * at the camera angle (see `setCameraAngle`).
   */
  setCameraMode(mode: CameraMode): this {
    if (!CAMERA_MODES.includes(mode)) {
      throw new Error(`Unknown camera mode "${mode}". Modes: ${CAMERA_MODES.join(', ')}`);
    }
    this.#cameraMode = mode;
    return this;
  }

  /** The mode set with `setCameraMode`, `'mouse'` by default. */
  getCameraMode(): CameraMode {
    return this.#cameraMode;
  }

  /**
   * Sets where the camera of the `show3D` view looks from, in degrees: `x` tilts the cube
   * (negative shows its top), then `y` turns it sideways (negative shows its right side).
   * By default the U R F corner is in the middle, pointing straight at the camera
   * (`{ x: -35.26..., y: -45 }`). With the `'mouse'` camera the view goes there the next
   * time `show3D` is called, and can then be dragged away from it.
   */
  setCameraAngle(angle: CameraAngle): this {
    for (const value of [angle.x, angle.y]) {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new Error(`Camera angles must be numbers of degrees, not ${value}`);
      }
    }
    this.#cameraAngle = { x: angle.x, y: angle.y };
    return this;
  }

  /** The angle set with `setCameraAngle`, the U R F corner by default. */
  getCameraAngle(): CameraAngle {
    return { ...this.#cameraAngle };
  }

  /** Goes back to the default camera angle, the U R F corner. */
  resetCameraAngle(): this {
    this.#cameraAngle = { ...DEFAULT_CAMERA_ANGLE };
    return this;
  }

  /** Which methods `setScrambleMethod` accepts for this puzzle. */
  getScrambleMethods(): ScrambleMethod[] {
    return METHODS.filter((method) => method in this.#info.methods);
  }

  /**
   * Picks how `scramble()` makes scrambles: `'default'` (the WCA way), `'random-state'`
   * or `'random-move'`. Throws if csTimer has no such scrambler for this puzzle
   * (see `getScrambleMethods`). It replaces a type picked with `setScrambleType`.
   */
  setScrambleMethod(method: ScrambleMethod): this {
    if (!(method in this.#info.methods)) {
      throw new Error(
        `${this.name} has no "${method}" scrambles. Methods: ${this.getScrambleMethods().join(', ')}`,
      );
    }
    this.#method = method;
    this.#type = undefined;
    return this;
  }

  /** The method `scramble()` uses, or `undefined` when a type was picked with `setScrambleType`. */
  getScrambleMethod(): ScrambleMethod | undefined {
    return this.#type === undefined ? this.#method : undefined;
  }

  /**
   * The csTimer scramble type `scramble()` uses, e.g. `'333o'`: the one picked with
   * `setScrambleType`, or else the current method's.
   */
  getScrambleType(): string {
    return this.#type ?? this.#info.methods[this.#method]!;
  }

  /**
   * Every csTimer scramble type for this puzzle, e.g. for 3x3x3 `{ id: 'pll', name:
   * '3x3x3 CFOP PLL' }` and 48 more, in csTimer's menu order. Any of them can be picked with
   * `setScrambleType`.
   */
  getScrambleTypes(): { id: string; name: string }[] {
    return listEvents()
      .filter((event) => event.puzzle === this.id)
      .map(({ id, name }) => ({ id, name }));
  }

  /**
   * Makes `scramble()` use one of csTimer's scramble types for this puzzle, e.g.
   * `setScrambleType('pll')` for PLL cases (see `getScrambleTypes`), instead of the
   * method's. `setScrambleMethod` goes back to the methods.
   */
  setScrambleType(type: string): this {
    if (getEvent(type)?.puzzle !== this.id) {
      throw new Error(`"${type}" is not a ${this.name} scramble type`);
    }
    this.#type = type;
    return this;
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

  /**
   * How many moves the scramble has. Moves are counted between spaces, except on
   * Square-1, where each slash is one move (twist metric).
   */
  getScrambleMoveCount(): number {
    return countMoves(this.id, this.#scramble);
  }

  /**
   * How many moves the solution has, counted like `getScrambleMoveCount`. On cubes the
   * solution options change this: rotations may be free (`setCountRotations`) and slice
   * moves may count as 2 (`setSliceMoves`), and FMC mode (`setFmcMode`) uses its own rules.
   */
  getSolutionMoveCount(): number {
    if (!this.#hasCubeNotation()) return countMoves(this.id, this.#solution);
    return countSolutionMoves(this.#solution, this.#solutionRules());
  }

  /**
   * Whether the rotations x, y and z count toward the solution's move count: `true` (the
   * default) or `false`. Cubes only; FMC mode never counts them.
   */
  setCountRotations(count: boolean): this {
    this.#rules.countRotations = count;
    return this;
  }

  /** What was set with `setCountRotations`, `true` by default. */
  getCountRotations(): boolean {
    return this.#rules.countRotations;
  }

  /**
   * Whether the slice moves M, S and E are allowed in the solution, and if so whether each
   * counts as 1 or 2 moves: `'one-move'` (the default), `'two-moves'` or `'not-allowed'`
   * (see `SliceMoves`). Cubes only; FMC mode never allows them.
   */
  setSliceMoves(mode: SliceMoves): this {
    if (!SLICE_MOVES.includes(mode)) {
      throw new Error(`Unknown slice moves mode "${mode}". Modes: ${SLICE_MOVES.join(', ')}`);
    }
    this.#rules.sliceMoves = mode;
    return this;
  }

  /** The mode set with `setSliceMoves`, `'one-move'` by default. */
  getSliceMoves(): SliceMoves {
    return this.#rules.sliceMoves;
  }

  /**
   * How wide moves may be written in the solution: `'Rw-or-r'` (the default) or
   * `'Rw-only'`, where `r` is not allowed (see `WideMoves`). Cubes only; FMC mode always
   * uses `'Rw-only'`.
   */
  setWideMoves(mode: WideMoves): this {
    if (!WIDE_MOVES.includes(mode)) {
      throw new Error(`Unknown wide moves mode "${mode}". Modes: ${WIDE_MOVES.join(', ')}`);
    }
    this.#rules.wideMoves = mode;
    return this;
  }

  /** The mode set with `setWideMoves`, `'Rw-or-r'` by default. */
  getWideMoves(): WideMoves {
    return this.#rules.wideMoves;
  }

  /**
   * Turns FMC mode on or off (off by default). While it is on, the solution follows the WCA
   * Fewest Moves rules, whatever the other solution options say: rotations don't count,
   * M, S and E are not allowed, wide moves are written only as `Rw`, and the solve status is
   * only `'solved'` or `'DNF'`, never `'+2'`. The other options are kept and apply again
   * when it is turned off. Cubes only.
   */
  setFmcMode(on: boolean): this {
    this.#fmc = on;
    return this;
  }

  /** Whether FMC mode is on, `false` by default. */
  getFmcMode(): boolean {
    return this.#fmc;
  }

  /**
   * The moves of the solution that aren't allowed by the solution options, or that can't be
   * read as cube moves at all, in the order they are typed, e.g. `['M', 'r']`. Always `[]`
   * for puzzles other than the cubes. Moves the options don't allow aren't done on the
   * cube: `getImage`, `getStickers` and `show3D` show it without them.
   */
  getInvalidMoves(): string[] {
    if (!this.#hasCubeNotation()) return [];
    return invalidSolutionMoves(this.#solution, this.#solutionRules());
  }

  /**
   * Whether the scramble and then the solution leave the cube solved: `'solved'`, `'+2'`
   * when one more outer block turn would solve it, or `'DNF'` (see `SolveStatus`). A
   * solution with a move that isn't allowed is a DNF (see `getInvalidMoves`), and FMC mode
   * has no +2. `undefined` for puzzles other than the cubes, which can't be checked yet.
   */
  getSolveStatus(): SolveStatus | undefined {
    const size = this.#info.cubeSize;
    if (size === undefined || !this.#hasCubeNotation()) return undefined;
    if (this.getInvalidMoves().length > 0) return 'DNF';
    const moves = [this.#scramble, this.#solution].filter(Boolean).join(' ');
    return cubeSolveStatus(size, moves, !this.#fmc);
  }

  /**
   * Whether `solve` works for this puzzle with its current scramble type: 2x2x2 and 3x3x3,
   * with their own scramble types (not relays or other notations). More puzzles later.
   */
  hasSolver(): boolean {
    return SOLVER_SIZES.includes(this.#info.cubeSize ?? 0) && this.#hasCubeNotation();
  }

  /**
   * How long `solve` and `solveAsync` may search for a shorter 3x3x3 solution, in
   * milliseconds (default 3000). A few seconds usually gets 17 to 19 moves, often the
   * shortest there is, but proving that nothing shorter exists can take many minutes.
   * `Infinity` searches until it has that proof, so the solution is always the shortest.
   * 2x2x2 is always solved in the fewest moves at once.
   */
  setSolveTimeLimit(ms: number): this {
    if (!(ms > 0)) throw new Error(`The solve time limit must be more than 0 ms, not ${ms}`);
    this.#solveTimeLimit = ms;
    return this;
  }

  getSolveTimeLimit(): number {
    return this.#solveTimeLimit;
  }

  /**
   * Finds the shortest solution it can for the scramble with csTimer's own solvers, in the
   * half-turn metric (R2 counts as one move), and makes it the puzzle's solution (replacing
   * anything set with `setSolution`), so `getImage()` then shows the puzzle solved. Returns
   * that solution, `''` if the scramble leaves the puzzle solved. It is a computer
   * solution, not a human method: the fewest moves on 2x2x2 (only U, R and F turns); on
   * 3x3x3 the shortest found within the time limit (see `setSolveTimeLimit`), and
   * `isSolutionShortest` says whether it is known to be the shortest. Only face turns, so
   * it follows every solution option, FMC mode included. The page can't do anything else
   * while it searches; `solveAsync` lets it. The first 3x3x3 solve takes a bit longer
   * while the solver sets up. Throws on puzzles without a solver (see `hasSolver`).
   */
  solve(): string {
    const search = this.#startSearch();
    const end = performance.now() + this.#solveTimeLimit;
    while (!search.shortest && performance.now() < end) search.step();
    return this.#finishSearch(search);
  }

  /**
   * The same as `solve`, but searches in small steps, letting the page carry on between
   * them, and calls `onProgress` with each shorter solution it finds. `stopSolving` ends it
   * early with the shortest found so far. The solution only becomes the puzzle's if its
   * scramble is still the same at the end.
   */
  async solveAsync(onProgress?: (solution: string) => void): Promise<string> {
    const search = this.#startSearch();
    this.#stopSolving?.();
    let stopped = false;
    const stop = (): void => {
      stopped = true;
    };
    this.#stopSolving = stop;
    const end = performance.now() + this.#solveTimeLimit;
    onProgress?.(search.solution);
    while (!search.shortest && !stopped && performance.now() < end) {
      // Let the page draw and handle clicks between steps.
      await new Promise((resolve) => setTimeout(resolve, 0));
      if (stopped) break;
      if (search.step() && !search.shortest) onProgress?.(search.solution);
    }
    if (this.#stopSolving === stop) this.#stopSolving = undefined;
    return this.#finishSearch(search);
  }

  /** Ends the running `solveAsync`, if any, with the shortest solution found so far. */
  stopSolving(): this {
    this.#stopSolving?.();
    this.#stopSolving = undefined;
    return this;
  }

  /**
   * Whether the puzzle's solution is the one the last solve found and that solve made sure
   * no shorter solution exists. Always true after solving a 2x2x2; on 3x3x3 only when the
   * search finished within the time limit (see `setSolveTimeLimit`).
   */
  isSolutionShortest(): boolean {
    const solved = this.#solved;
    return (
      solved !== undefined &&
      solved.shortest &&
      solved.scramble === this.#scramble &&
      solved.solution === this.#solution
    );
  }

  #startSearch(): CubeSearch {
    if (!this.hasSolver()) {
      throw new Error(`No solver for ${this.name} with "${this.getScrambleType()}" scrambles yet`);
    }
    return new CubeSearch(this.#info.cubeSize!, this.#scramble);
  }

  #finishSearch(search: CubeSearch): string {
    if (search.scramble === this.#scramble) {
      this.#solution = search.solution;
      this.#solved = {
        scramble: search.scramble,
        solution: search.solution,
        shortest: search.shortest,
      };
    }
    return search.solution;
  }

  /**
   * The scramble and then the solution, as done on the puzzle: on cubes, the solution's
   * moves that the solution options don't allow (see `getInvalidMoves`) are left out, so
   * `getStickers`, `getImage` and `show3D` show the cube without them.
   */
  #movesDone(): string {
    const solution = this.#hasCubeNotation()
      ? allowedSolutionMoves(this.#solution, this.#solutionRules())
      : this.#solution;
    return [this.#scramble, solution].filter(Boolean).join(' ');
  }

  /** The rules the solution follows: FMC's in FMC mode, the options set otherwise. */
  #solutionRules(): SolutionRules {
    return this.#fmc ? FMC_RULES : this.#rules;
  }

  /**
   * Whether the moves are written in cube notation: on a cube, with one of its own scramble
   * types (not, say, 3x3x3's relays or its words-only "noob" scrambles).
   */
  #hasCubeNotation(): boolean {
    if (this.#info.cubeSize === undefined) return false;
    const type = this.#scramble ? this.#scrambleType : this.getScrambleType();
    return tools.puzzleType(type) === this.id;
  }

  /** Puts the puzzle back to solved: no scramble and no solution. */
  reset(): this {
    this.#scramble = '';
    this.#solution = '';
    return this;
  }

  /** Whether `getStickers` and `show3D` work for this puzzle: the cubes, 2x2x2 to 11x11x11. */
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
    const moves = this.#movesDone();
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
   * `getImage()`), with this puzzle's colors. Its faces are as big as in `getImage()` at the
   * size set with `setImageSize` (see there), never wider than the element, or it fills
   * the element's width without one. It starts at the camera angle (see `setCameraAngle`,
   * the U R F corner by default); drag it with the mouse or a finger to look at every side,
   * unless the camera is fixed (see `setCameraMode`). Call it again after changing the
   * puzzle to update the view: the cube keeps the angle it was dragged to. Only for cubes
   * (see `has3DView`), and only in a browser. `setHiddenFaces('floating')` also shows the
   * faces at the back, and `setFloatingFaceOffset` moves them. `setFaceOffset` moves the
   * cube's own faces and `setElementStyle` styles the view.
   */
  show3D(element: HTMLElement): this {
    drawCube3D(element, this.#info.cubeSize ?? 0, this.getStickers(), {
      width: this.#imageSize,
      hidden: this.#hiddenFaces,
      camera: this.#cameraMode,
      angle: this.#cameraAngle,
      offsets: this.#floatingOffsets,
      faceOffsets: this.#faceOffsets,
      styles: this.#styles,
      cubeStyle: this.#cubeStyle,
    });
    return this;
  }

  /** Whether `getImage()` can draw the puzzle with its current scramble type. */
  hasImage(): boolean {
    return hasScrambleImage(this.#scramble ? this.#scrambleType : this.getScrambleType());
  }

  /**
   * Draws the puzzle as it is now (solved, or after the scramble and then the solution)
   * as an SVG string, with this puzzle's colors, image size and image style (see
   * `setImageStyle`). With the `'cstimer'` style it is the same picture as
   * `getScrambleImage`. Throws if csTimer can't read the moves.
   */
  getImage(): string {
    const type = this.#scramble ? this.#scrambleType : this.getScrambleType();
    if (!hasScrambleImage(type)) {
      throw new Error(`csTimer has no picture for "${type}" scrambles`);
    }
    const style = this.#imageStyle;
    // A cube's own scramble types (not relays of it) are drawn from its stickers.
    const size = this.#info.cubeSize;
    if (style !== 'cstimer' && size !== undefined && tools.puzzleType(type) === this.id) {
      const svg = drawCubeNet(size, this.getStickers(), style, this.#imageSize, this.#cubeStyle);
      return styleSvg(svg, this.#styles);
    }
    const colors = this.#info.cstimerOrder
      .map((face) => toCstimerColor(this.#colors[face]!))
      .join('');
    let moves = this.#movesDone();
    if (this.id === 'sq1') moves = joinSq1Turns(moves);
    try {
      const svg = drawImage(
        type,
        moves,
        this.#info.colorSetting ? { [this.#info.colorSetting]: colors } : {},
        this.#imageSize,
      );
      return styleSvg(style === 'cstimer' ? svg : thickenBorders(svg), this.#styles);
    } catch {
      throw new Error(`Can't read these moves as ${this.name} moves: "${moves}"`);
    }
  }
}

export { Puzzle, listPuzzles };
export type {
  ScrambleMethod,
  ImageStyle,
  CubeStyle,
  HiddenFaces,
  CameraMode,
  CameraAngle,
  FaceOffset,
  ImagePart,
  PartFilter,
  ElementStyle,
  SliceMoves,
  WideMoves,
  SolveStatus,
};
