// Random-state 3x3 scrambles, ported from csTimer's src/js/scramble/scramble_333_edit.js.
// A random (or partially fixed) cube state is built, then solved with min2phase;
// the solution is the scramble.

import mathlib from '../../vendor/cstimer/mathlib.js';
import min2phase from '../../vendor/cstimer/min2phase.js';

const { getNPerm, getNParity, rn, rndEl } = mathlib;

/** Move indices as used by mathlib.CubieCube.moveCube (face * 3 + power). */
export const Move = {
  U: 0,
  U2: 1,
  Ui: 2,
  R: 3,
  R2: 4,
  Ri: 5,
  F: 6,
  F2: 7,
  Fi: 8,
  D: 9,
  D2: 10,
  Di: 11,
  L: 12,
  L2: 13,
  Li: 14,
  B: 15,
  B2: 16,
  Bi: 17,
} as const;

/**
 * A piece mask: either an explicit array (-1 = random) or csTimer's packed form,
 * one hex digit per piece with 0xf meaning random.
 */
export type PieceMask = number | number[];

export interface StateOptions {
  ep?: PieceMask;
  eo?: PieceMask;
  cp?: PieceMask;
  co?: PieceMask;
  /** Color neutrality level 0-6, as in csTimer. */
  neut?: number;
  /** Move sequences, one of which is appended to the state at random. */
  rndApp?: number[][];
  /** Move sequences, one of which is prepended to the state at random. */
  rndPre?: number[][];
  firstAxisFilter?: number;
  lastAxisFilter?: number;
}

export const ALL_RANDOM_12 = 0xffffffffffff;
export const ALL_RANDOM_8 = 0xffffffff;

const search = new min2phase.Search();

function countUnknown(arr: number[]): number {
  return arr.filter((v) => v === -1).length;
}

function fixOri(arr: number[], unknown: number, base: number): number {
  let sum = 0;
  let idx = 0;
  for (const v of arr) {
    if (v !== -1) sum += v;
  }
  sum %= base;
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === -1) {
      if (unknown-- === 1) {
        arr[i] = ((base << 4) - sum) % base;
      } else {
        arr[i] = rn(base);
        sum += arr[i]!;
      }
    }
    idx *= base;
    idx += arr[i]!;
  }
  if (unknown === 1) {
    arr.splice(-1, 1, ((base << 4) - sum) % base);
  }
  return idx;
}

function fixPerm(arr: number[], unknown: number, parity: number): number {
  const val = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  for (const v of arr) {
    if (v !== -1) val[v] = -1;
  }
  for (let i = 0, j = 0; i < val.length; i++) {
    if (val[i] !== -1) val[j++] = val[i]!;
  }
  let last = 0;
  let i = 0;
  for (; i < arr.length && unknown > 0; i++) {
    if (arr[i] === -1) {
      const r = rn(unknown);
      arr[i] = val[r]!;
      for (let j = r; j < 11; j++) val[j] = val[j + 1]!;
      if (unknown-- === 2) last = i;
    }
  }
  if (getNParity(getNPerm(arr, arr.length), arr.length) === 1 - parity) {
    const temp = arr[i - 1]!;
    arr[i - 1] = arr[last]!;
    arr[last] = temp;
  }
  return getNPerm(arr, arr.length);
}

function parseMask(mask: PieceMask, length: number): number[] {
  if (typeof mask !== 'number') return mask;
  const ret: number[] = [];
  for (let i = 0; i < length; i++) {
    const val = mask % 16; // "/" rather than ">>": masks exceed 32 bits
    ret[i] = val === 15 ? -1 : val;
    mask = Math.floor(mask / 16);
  }
  return ret;
}

const EMPTY: number[][] = [[]];

/** csTimer's getAnyScramble: scramble to a random state matching the given masks. */
export function getAnyScramble(options: StateOptions = {}): string {
  const { neut, rndApp = EMPTY, rndPre = EMPTY, firstAxisFilter, lastAxisFilter } = options;
  const maskEp = parseMask(options.ep ?? ALL_RANDOM_12, 12);
  const maskEo = parseMask(options.eo ?? ALL_RANDOM_12, 12);
  const maskCp = parseMask(options.cp ?? ALL_RANDOM_8, 8);
  const maskCo = parseMask(options.co ?? ALL_RANDOM_8, 8);
  let solution = '';
  do {
    const eo = maskEo.slice();
    const ep = maskEp.slice();
    const co = maskCo.slice();
    const cp = maskCp.slice();
    const neo = fixOri(eo, countUnknown(eo), 2);
    const nco = fixOri(co, countUnknown(co), 3);
    let nep: number;
    let ncp: number;
    let ue = countUnknown(ep);
    let uc = countUnknown(cp);
    if (ue === 1) {
      fixPerm(ep, ue, -1);
      ue = 0;
    }
    if (uc === 1) {
      fixPerm(cp, uc, -1);
      uc = 0;
    }
    if (ue === 0 && uc === 0) {
      nep = getNPerm(ep, 12);
      ncp = getNPerm(cp, 8);
    } else if (ue !== 0 && uc === 0) {
      ncp = getNPerm(cp, 8);
      nep = fixPerm(ep, ue, getNParity(ncp, 8));
    } else if (ue === 0 && uc !== 0) {
      nep = getNPerm(ep, 12);
      ncp = fixPerm(cp, uc, getNParity(nep, 12));
    } else {
      nep = fixPerm(ep, ue, -1);
      ncp = fixPerm(cp, uc, getNParity(nep, 12));
    }
    if (ncp + nco + nep + neo === 0) continue; // solved state, try again

    const pre = rndEl(rndPre);
    const app = rndEl(rndApp);
    const { CubieCube } = mathlib;
    const cc = new CubieCube();
    const cd = new CubieCube();
    for (let i = 0; i < 12; i++) {
      cc.ea[i] = (ep[i]! << 1) | eo[i]!;
      if (i < 8) cc.ca[i] = (co[i]! << 3) | cp[i]!;
    }
    for (const m of pre) {
      CubieCube.CubeMult(CubieCube.moveCube[m]!, cc, cd);
      cc.init(cd.ca, cd.ea);
    }
    for (const m of app) {
      CubieCube.CubeMult(cc, CubieCube.moveCube[m]!, cd);
      cc.init(cd.ca, cd.ea);
    }
    if (neut) {
      cc.ori = rn([1, 4, 8, 1, 1, 1, 24][neut]!);
      cc.selfConj();
      cc.ori = 0;
    }
    // Argument order (lastAxisFilter before firstAxisFilter) matches csTimer.
    solution = search.solution(cc.toFaceCube(), 21, 1e9, 50, 2, lastAxisFilter, firstAxisFilter);
  } while (solution.length <= 3);
  return solution.replace(/ +/g, ' ');
}
