// A 3D view of a cube in a web page, built from plain HTML elements turned in 3D by CSS
// (no 3D library). It can be dragged with the mouse or a finger to look at every side.

type Axis = 'x' | 'y';

/**
 * The faces in the order their stickers are given, and where each one sits on the cube:
 * turned from the front (F) about an axis, by some degrees.
 */
const FACES: readonly [string, Axis, number][] = [
  ['U', 'x', 90],
  ['R', 'y', 90],
  ['F', 'y', 0],
  ['D', 'x', -90],
  ['L', 'y', -90],
  ['B', 'y', 180],
];

const place = (axis: Axis, degrees: number) => `rotate${axis.toUpperCase()}(${degrees}deg)`;

/** The camera's distance and, with floating faces, the cube's side, in cqmin (see STYLE). */
const CAMERA = 300;
const FLOATING_SIDE = 25;
/** The floating copies are this much smaller than the faces. */
const COPY_SCALE = 0.7;
/**
 * How far the copies' centers are from the cube's center, in cube sides: the cube reaches
 * at most 0.94 of a side from its center on the screen (half its diagonal, a little more
 * where it is nearer the camera), and a copy at most 0.5, so they never meet.
 */
const COPY_DISTANCE = 1.5;

/**
 * What the 3D view does with the faces at the back:
 * - `'hidden'`: hidden behind the cube, as on a real one.
 * - `'floating'`: a flat copy of each floats beside the cube, never covered by it, so all six
 *   faces show at once.
 */
type HiddenFaces = 'hidden' | 'floating';

/** How far the view is turned, in degrees: tilted toward you, then turned sideways. */
const START_ANGLE = { x: -28, y: -38 };

const STYLE = `
.cstimer-3d {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  container-type: size;
  max-width: 100%;
  touch-action: none;
  user-select: none;
  cursor: grab;
}
.cstimer-3d:active {
  cursor: grabbing;
}
/* The camera. Its distance is in cqmin, which only follows the box from inside it (on the
   box itself it would follow the window), so the camera moves back as the cube grows. */
.cstimer-3d-scene {
  --side: 52cqmin;
  position: absolute;
  inset: 0;
  perspective: ${CAMERA}cqmin;
}
.cstimer-3d-cube {
  position: absolute;
  inset: 0;
  margin: auto;
  width: var(--side);
  height: var(--side);
  transform-style: preserve-3d;
}
.cstimer-3d-face {
  position: absolute;
  inset: 0;
  box-sizing: border-box;
  display: grid;
  gap: calc(var(--side) * 0.02);
  padding: calc(var(--side) * 0.025);
  background: #111;
  /* Square corners and no back side, so nothing inside the cube shows through. */
  backface-visibility: hidden;
}
/* A black cube just inside the faces. Where two faces meet, the browser blends their edges
   with what is behind them, and this makes that black instead of the far side's colors. */
.cstimer-3d-core {
  position: absolute;
  inset: calc(var(--side) * 0.02);
  background: #111;
}
.cstimer-3d-face > div {
  border-radius: 12%;
}
/* With floating faces the cube is smaller, to leave room around it for the copies. */
.cstimer-3d-floating .cstimer-3d-scene {
  --side: ${FLOATING_SIDE}cqmin;
}
/* A flat copy of a face at the back, shown beside the cube (placed by placeCopies). */
.cstimer-3d-copy {
  inset: 0;
  margin: auto;
  width: var(--side);
  height: var(--side);
  backface-visibility: visible;
  display: none;
}
`;

interface View {
  box: HTMLElement;
  cube: HTMLElement;
  faces: HTMLElement[];
  /** The floating copies of the faces, in the same order. */
  copies: HTMLElement[];
  floating: boolean;
  size: number;
  angle: { x: number; y: number };
}

type Vector = [number, number, number];
type Matrix = [Vector, Vector, Vector];

/** The turn CSS's `rotateX` or `rotateY` makes, as a matrix (y points down, z at you). */
function rotation(axis: Axis, degrees: number): Matrix {
  const a = (degrees * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return axis === 'x'
    ? [
        [1, 0, 0],
        [0, c, -s],
        [0, s, c],
      ]
    : [
        [c, 0, s],
        [0, 1, 0],
        [-s, 0, c],
      ];
}

function multiply(a: Matrix, b: Matrix): Matrix {
  const cell = (i: number, j: number) =>
    a[i]![0] * b[0]![j]! + a[i]![1] * b[1]![j]! + a[i]![2] * b[2]![j]!;
  return [0, 1, 2].map((i) => [cell(i, 0), cell(i, 1), cell(i, 2)]) as Matrix;
}

/** Column `j` of a matrix: where it sends the x (0), y (1) or z (2) direction. */
function column(m: Matrix, j: number): Vector {
  return [m[0][j]!, m[1][j]!, m[2][j]!];
}

/**
 * With floating faces, shows a flat copy of each face at the back beside the cube, on a
 * ring around it so the cube never covers it. Each copy sits on the side its face points
 * to, and is turned and mirrored the way the face would look through a glass cube, so its
 * stickers line up with the ones they touch on the cube.
 */
function placeCopies(view: View): void {
  const turned = multiply(rotation('x', view.angle.x), rotation('y', view.angle.y));
  const faces = FACES.map(([, axis, degrees]) => {
    const m = multiply(turned, rotation(axis, degrees));
    return { across: column(m, 0), down: column(m, 1), out: column(m, 2) };
  });
  // A face is out of sight when the camera is behind its plane, half a side from the center.
  const back = faces.map((face) => view.floating && face.out[2] < 0.5 * (FLOATING_SIDE / CAMERA));
  const length = (x: number, y: number) => Math.hypot(x, y);
  // A face pointing almost straight away has no clear side, so its copy goes where the
  // other copies leave the most room, blending in as the face turns that way.
  const clear = faces.filter((face, i) => back[i] && length(face.out[0], face.out[1]) >= 0.3);
  let room = [0, 0];
  for (const { out } of clear) {
    const l = length(out[0], out[1]);
    room = [room[0]! - out[0] / l, room[1]! - out[1] / l];
  }
  room = length(room[0]!, room[1]!) < 0.1 ? [Math.SQRT1_2, Math.SQRT1_2] : room;
  faces.forEach((face, i) => {
    const copy = view.copies[i]!;
    copy.style.display = back[i] ? 'grid' : 'none';
    if (!back[i]) return;
    const blend = Math.max(0, 0.3 - length(face.out[0], face.out[1])) / 0.3;
    const roomLength = length(room[0]!, room[1]!);
    let x = face.out[0] + (blend * room[0]!) / roomLength;
    let y = face.out[1] + (blend * room[1]!) / roomLength;
    const l = length(x, y) || 1;
    x = (x / l) * COPY_DISTANCE;
    y = (y / l) * COPY_DISTANCE;
    // Turned the way the face's rows and columns run on the screen, mirrored because the
    // face is seen from behind. Each direction counts more the less it is foreshortened,
    // so a face seen edge on follows the direction that still shows.
    const [ax, ay] = [-face.across[0], -face.across[1]];
    const [dx, dy] = [face.down[0], face.down[1]];
    const wa = (ax * ax + ay * ay) ** 2;
    const wd = (dx * dx + dy * dy) ** 2;
    const fromAcross = Math.atan2(ay, ax);
    const fromDown = Math.atan2(-dx, dy);
    const angle = Math.atan2(
      wa * Math.sin(fromAcross) + wd * Math.sin(fromDown),
      wa * Math.cos(fromAcross) + wd * Math.cos(fromDown),
    );
    copy.style.transform =
      `translate(calc(var(--side) * ${x.toFixed(4)}), calc(var(--side) * ${y.toFixed(4)}))` +
      ` rotate(${angle.toFixed(4)}rad) scale(${-COPY_SCALE}, ${COPY_SCALE})`;
  });
}

/** The views already drawn, by the element they are in, so drawing again updates them. */
const views = new WeakMap<HTMLElement, View>();

function addStyle(doc: Document): void {
  if (doc.getElementById('cstimer-3d-style')) return;
  const style = doc.createElement('style');
  style.id = 'cstimer-3d-style';
  style.textContent = STYLE;
  doc.head.append(style);
}

function turn(view: View): void {
  view.cube.style.transform = `rotateX(${view.angle.x}deg) rotateY(${view.angle.y}deg)`;
  placeCopies(view);
}

/** Turns the view while it is dragged: sideways all the way round, up and down to the top and bottom. */
function makeDraggable(box: HTMLElement, view: View): void {
  let last: { x: number; y: number } | undefined;
  box.addEventListener('pointerdown', (e) => {
    last = { x: e.clientX, y: e.clientY };
    box.setPointerCapture(e.pointerId);
  });
  box.addEventListener('pointermove', (e) => {
    if (!last) return;
    // About half a degree per pixel dragged.
    view.angle.y += (e.clientX - last.x) * 0.5;
    view.angle.x = Math.max(-90, Math.min(90, view.angle.x - (e.clientY - last.y) * 0.5));
    last = { x: e.clientX, y: e.clientY };
    turn(view);
  });
  const stop = () => (last = undefined);
  box.addEventListener('pointerup', stop);
  box.addEventListener('pointercancel', stop);
}

function createView(element: HTMLElement, size: number, angle: View['angle']): View {
  const doc = element.ownerDocument;
  addStyle(doc);
  const box = doc.createElement('div');
  box.className = 'cstimer-3d';
  const cube = doc.createElement('div');
  cube.className = 'cstimer-3d-cube';
  const makeFace = (name: string, className: string) => {
    const face = doc.createElement('div');
    face.className = className;
    face.dataset.face = name;
    face.style.gridTemplate = `repeat(${size}, 1fr) / repeat(${size}, 1fr)`;
    for (let i = 0; i < size * size; i++) face.append(doc.createElement('div'));
    return face;
  };
  const faces = FACES.map(([name, axis, degrees]) => {
    const face = makeFace(name, 'cstimer-3d-face');
    face.style.transform = `${place(axis, degrees)} translateZ(calc(var(--side) / 2))`;
    cube.append(face);
    return face;
  });
  for (const [, axis, degrees] of FACES) {
    const core = doc.createElement('div');
    core.className = 'cstimer-3d-core';
    core.style.transform = `${place(axis, degrees)} translateZ(calc(var(--side) * 0.48))`;
    cube.append(core);
  }
  // The copies are flat and outside the cube, so they are never hidden behind it.
  const copies = FACES.map(([name]) => makeFace(name, 'cstimer-3d-face cstimer-3d-copy'));
  const scene = doc.createElement('div');
  scene.className = 'cstimer-3d-scene';
  scene.append(...copies, cube);
  box.append(scene);
  element.replaceChildren(box);
  const view = { box, cube, faces, copies, floating: false, size, angle };
  turn(view);
  makeDraggable(box, view);
  return view;
}

/**
 * Draws a size x size x size cube in `element` (replacing what is in it), with each
 * face's sticker colors in the order U R F D L B, as `Puzzle.getStickers()` gives them.
 * The view is `width` pixels wide and as tall, or fills the element's width without it.
 * `hidden` says whether the faces at the back float around the cube (see `HiddenFaces`).
 * Drawing in the same element again only changes the colors, width and mode, so the
 * angle is kept.
 */
function drawCube3D(
  element: HTMLElement,
  size: number,
  stickers: Record<string, string[]>,
  width?: number,
  hidden: HiddenFaces = 'hidden',
): void {
  let view = views.get(element);
  if (!view || view.size !== size || !element.contains(view.cube)) {
    view = createView(element, size, view ? view.angle : { ...START_ANGLE });
    views.set(element, view);
  }
  view.box.style.width = width === undefined ? '' : `${width}px`;
  view.floating = hidden === 'floating';
  view.box.classList.toggle('cstimer-3d-floating', view.floating);
  placeCopies(view);
  FACES.forEach(([name], i) => {
    const colors = stickers[name] ?? [];
    for (const face of [view.faces[i]!, view.copies[i]!]) {
      [...face.children].forEach((sticker, j) => {
        (sticker as HTMLElement).style.background = colors[j] ?? '#111';
      });
    }
  });
}

export { drawCube3D };
export type { HiddenFaces };
