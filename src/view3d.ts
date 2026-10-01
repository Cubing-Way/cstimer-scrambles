// A 3D view of a cube in a web page, built from plain HTML elements turned in 3D by CSS
// (no 3D library). It can be dragged with the mouse or a finger to look at every side.

/** The faces in the order their stickers are given, and where each one sits on the cube. */
const FACES: readonly [string, string][] = [
  ['U', 'rotateX(90deg)'],
  ['R', 'rotateY(90deg)'],
  ['F', ''],
  ['D', 'rotateX(-90deg)'],
  ['L', 'rotateY(-90deg)'],
  ['B', 'rotateY(180deg)'],
];

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
  position: absolute;
  inset: 0;
  perspective: 300cqmin;
}
.cstimer-3d-cube {
  --side: 52cqmin;
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
`;

interface View {
  box: HTMLElement;
  cube: HTMLElement;
  faces: HTMLElement[];
  size: number;
  angle: { x: number; y: number };
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
  const faces = FACES.map(([name, place]) => {
    const face = doc.createElement('div');
    face.className = 'cstimer-3d-face';
    face.dataset.face = name;
    face.style.gridTemplate = `repeat(${size}, 1fr) / repeat(${size}, 1fr)`;
    face.style.transform = `${place} translateZ(calc(var(--side) / 2))`;
    for (let i = 0; i < size * size; i++) face.append(doc.createElement('div'));
    cube.append(face);
    return face;
  });
  for (const [, place] of FACES) {
    const core = doc.createElement('div');
    core.className = 'cstimer-3d-core';
    core.style.transform = `${place} translateZ(calc(var(--side) * 0.48))`;
    cube.append(core);
  }
  const scene = doc.createElement('div');
  scene.className = 'cstimer-3d-scene';
  scene.append(cube);
  box.append(scene);
  element.replaceChildren(box);
  const view = { box, cube, faces, size, angle };
  turn(view);
  makeDraggable(box, view);
  return view;
}

/**
 * Draws a size x size x size cube in `element` (replacing what is in it), with each
 * face's sticker colors in the order U R F D L B, as `Puzzle.getStickers()` gives them.
 * The view is `width` pixels wide and as tall, or fills the element's width without it.
 * Drawing in the same element again only changes the colors and width, so the angle is kept.
 */
function drawCube3D(
  element: HTMLElement,
  size: number,
  stickers: Record<string, string[]>,
  width?: number,
): void {
  let view = views.get(element);
  if (!view || view.size !== size || !element.contains(view.cube)) {
    view = createView(element, size, view ? view.angle : { ...START_ANGLE });
    views.set(element, view);
  }
  view.box.style.width = width === undefined ? '' : `${width}px`;
  FACES.forEach(([name], i) => {
    const colors = stickers[name] ?? [];
    [...view.faces[i]!.children].forEach((sticker, j) => {
      (sticker as HTMLElement).style.background = colors[j] ?? '#111';
    });
  });
}

export { drawCube3D };
