import { n as scrMgr, r as mathlib, t as min2phase } from "./redi-89Vgp74P.mjs";
//#region src/registry.ts
const events = /* @__PURE__ */ new Map();
/** Adds scramble events to the registry. Each puzzle module calls this once. */
function registerEvents(...list) {
	for (const event of list) events.set(event.id, event);
}
function getEvent(id) {
	return events.get(id);
}
function listEvents() {
	return [...events.values()];
}
/**
* Generates one scramble for a csTimer scramble type id, e.g. `getScramble('333')`.
* `length` only matters for events that have a `length` (see `ScrambleEvent`).
*/
function getScramble(id, length) {
	const event = events.get(id);
	if (!event) throw new Error(`Unknown scramble type "${id}"`);
	return event.generate(length ?? event.length);
}
//#endregion
//#region src/random.ts
/**
* Seeds the shared random generator (ISAAC, as in csTimer) so scrambles are
* reproducible. By default it is seeded from `crypto.getRandomValues`.
*/
function setSeed(seed, count = 0) {
	mathlib.setSeed(count, seed);
}
/** Returns `[count, seed]`: how many numbers have been drawn since the seed was set. */
function getSeed() {
	return mathlib.getSeed();
}
//#endregion
//#region src/cstimer.ts
const ENTITIES = {
	"&sup2;": "²",
	"&sup3;": "³",
	"&nbsp;": " ",
	"&lt;": "<",
	"&gt;": ">",
	"&amp;": "&"
};
/** Plain text: single spaces between moves, one trimmed line per row, no blank lines at the ends. */
function cleanScramble(scramble) {
	return scramble.replace(/&(sup2|sup3|nbsp|lt|gt|amp);/g, (entity) => ENTITIES[entity]).split("\n").map((line) => line.replace(/\s+/g, " ").trim()).join("\n").trim();
}
/**
* Runs csTimer's scrambler for a scramble type id, e.g. `cstimerScramble('222so')`.
* The vendored file that registers that type must have been imported first.
*/
function cstimerScramble(type, length = 0) {
	const scrambler = scrMgr.scramblers[type];
	if (!scrambler) throw new Error(`csTimer scrambler "${type}" is not loaded`);
	const state = scrMgr.rndState(void 0, scrMgr.getExtra(type, 1));
	return cleanScramble(scrMgr.toTxt(scrambler(type, length, state, 0)));
}
/**
* Describes a csTimer scramble type that needs no extra code: generating it just
* runs csTimer's scrambler. `length` is csTimer's default for types whose length
* can be changed (number of moves, or of puzzles for relays).
*/
function cstimerEvent(id, name, puzzle, length) {
	return {
		id,
		name,
		puzzle,
		...length ? { length } : {},
		generate: (len = length) => cstimerScramble(id, len)
	};
}
//#endregion
//#region src/events/333/state.ts
const { getNPerm, getNParity, rn, rndEl } = mathlib;
/** Move indices as used by mathlib.CubieCube.moveCube (face * 3 + power). */
const Move = {
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
	Bi: 17
};
const search = new min2phase.Search();
function countUnknown(arr) {
	return arr.filter((v) => v === -1).length;
}
function fixOri(arr, unknown, base) {
	let sum = 0;
	let idx = 0;
	for (const v of arr) if (v !== -1) sum += v;
	sum %= base;
	for (let i = 0; i < arr.length - 1; i++) {
		if (arr[i] === -1) {
			if (unknown-- === 1) arr[i] = ((base << 4) - sum) % base;
			else {
				arr[i] = rn(base);
				sum += arr[i];
			}
		}
		idx *= base;
		idx += arr[i];
	}
	if (unknown === 1) arr.splice(-1, 1, ((base << 4) - sum) % base);
	return idx;
}
function fixPerm(arr, unknown, parity) {
	const val = [
		0,
		1,
		2,
		3,
		4,
		5,
		6,
		7,
		8,
		9,
		10,
		11
	];
	for (const v of arr) if (v !== -1) val[v] = -1;
	for (let i = 0, j = 0; i < val.length; i++) if (val[i] !== -1) val[j++] = val[i];
	let last = 0;
	let i = 0;
	for (; i < arr.length && unknown > 0; i++) if (arr[i] === -1) {
		const r = rn(unknown);
		arr[i] = val[r];
		for (let j = r; j < 11; j++) val[j] = val[j + 1];
		if (unknown-- === 2) last = i;
	}
	if (getNParity(getNPerm(arr, arr.length), arr.length) === 1 - parity) {
		const temp = arr[i - 1];
		arr[i - 1] = arr[last];
		arr[last] = temp;
	}
	return getNPerm(arr, arr.length);
}
function parseMask(mask, length) {
	if (typeof mask !== "number") return mask;
	const ret = [];
	for (let i = 0; i < length; i++) {
		const val = mask % 16;
		ret[i] = val === 15 ? -1 : val;
		mask = Math.floor(mask / 16);
	}
	return ret;
}
const EMPTY = [[]];
/** csTimer's getAnyScramble: scramble to a random state matching the given masks. */
function getAnyScramble(options = {}) {
	const { neut, rndApp = EMPTY, rndPre = EMPTY, firstAxisFilter, lastAxisFilter } = options;
	const maskEp = parseMask(options.ep ?? 0xffffffffffff, 12);
	const maskEo = parseMask(options.eo ?? 0xffffffffffff, 12);
	const maskCp = parseMask(options.cp ?? 4294967295, 8);
	const maskCo = parseMask(options.co ?? 4294967295, 8);
	let solution = "";
	do {
		const eo = maskEo.slice();
		const ep = maskEp.slice();
		const co = maskCo.slice();
		const cp = maskCp.slice();
		const neo = fixOri(eo, countUnknown(eo), 2);
		const nco = fixOri(co, countUnknown(co), 3);
		let nep;
		let ncp;
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
		if (ncp + nco + nep + neo === 0) continue;
		const pre = rndEl(rndPre);
		const app = rndEl(rndApp);
		const { CubieCube } = mathlib;
		const cc = new CubieCube();
		const cd = new CubieCube();
		for (let i = 0; i < 12; i++) {
			cc.ea[i] = ep[i] << 1 | eo[i];
			if (i < 8) cc.ca[i] = co[i] << 3 | cp[i];
		}
		for (const m of pre) {
			CubieCube.CubeMult(CubieCube.moveCube[m], cc, cd);
			cc.init(cd.ca, cd.ea);
		}
		for (const m of app) {
			CubieCube.CubeMult(cc, CubieCube.moveCube[m], cd);
			cc.init(cd.ca, cd.ea);
		}
		if (neut) {
			cc.ori = rn([
				1,
				4,
				8,
				1,
				1,
				1,
				24
			][neut]);
			cc.selfConj();
			cc.ori = 0;
		}
		solution = search.solution(cc.toFaceCube(), 21, 1e9, 50, 2, lastAxisFilter, firstAxisFilter);
	} while (solution.length <= 3);
	return solution.replace(/ +/g, " ");
}
//#endregion
//#region src/events/333/variants.ts
/**
* csTimer's other 3x3x3 scramble types: random move, CFOP / Roux / Mehta training cases and move subsets.
* Registered by ./index.ts, after the WCA 3x3 events.
*/
const events333Variants = [
	cstimerEvent("333o", "3x3x3 random move", "333", 25),
	cstimerEvent("333noob", "3x3x3 for noobs", "333", 25),
	cstimerEvent("333ft", "3x3x3 with feet", "333"),
	cstimerEvent("pll", "3x3x3 CFOP PLL", "333"),
	cstimerEvent("oll", "3x3x3 CFOP OLL", "333"),
	cstimerEvent("lsll2", "3x3x3 CFOP last slot + last layer", "333"),
	cstimerEvent("zbll", "3x3x3 CFOP ZBLL", "333"),
	cstimerEvent("coll", "3x3x3 CFOP COLL", "333"),
	cstimerEvent("cll", "3x3x3 CFOP CLL", "333"),
	cstimerEvent("ell", "3x3x3 CFOP ELL", "333"),
	cstimerEvent("2gll", "3x3x3 CFOP 2GLL", "333"),
	cstimerEvent("zzll", "3x3x3 CFOP ZZLL", "333"),
	cstimerEvent("zbls", "3x3x3 CFOP ZBLS", "333"),
	cstimerEvent("eols", "3x3x3 CFOP EOLS", "333"),
	cstimerEvent("wvls", "3x3x3 CFOP WVLS", "333"),
	cstimerEvent("vls", "3x3x3 CFOP VLS", "333"),
	cstimerEvent("f2l", "3x3x3 CFOP cross solved", "333"),
	cstimerEvent("eoline", "3x3x3 CFOP EOLine", "333"),
	cstimerEvent("eocross", "3x3x3 CFOP EO Cross", "333"),
	cstimerEvent("easyc", "3x3x3 CFOP easy cross", "333", 3),
	cstimerEvent("easyxc", "3x3x3 CFOP easy xcross", "333", 4),
	cstimerEvent("sbrx", "3x3x3 Roux 2nd Block", "333"),
	cstimerEvent("cmll", "3x3x3 Roux CMLL", "333"),
	cstimerEvent("lse", "3x3x3 Roux LSE", "333"),
	cstimerEvent("lsemu", "3x3x3 Roux LSE <M, U>", "333"),
	cstimerEvent("mt3qb", "3x3x3 Mehta 3QB", "333"),
	cstimerEvent("mteole", "3x3x3 Mehta EOLE", "333"),
	cstimerEvent("mttdr", "3x3x3 Mehta TDR", "333"),
	cstimerEvent("mt6cp", "3x3x3 Mehta 6CP", "333"),
	cstimerEvent("mtcdrll", "3x3x3 Mehta CDRLL", "333"),
	cstimerEvent("mtl5ep", "3x3x3 Mehta L5EP", "333"),
	cstimerEvent("ttll", "3x3x3 Mehta TTLL", "333"),
	cstimerEvent("2gen", "3x3x3 subsets 2-generator R,U", "333"),
	cstimerEvent("2genl", "3x3x3 subsets 2-generator L,U", "333"),
	cstimerEvent("roux", "3x3x3 subsets Roux-generator M,U", "333"),
	cstimerEvent("3gen_F", "3x3x3 subsets 3-generator F,R,U", "333"),
	cstimerEvent("3gen_L", "3x3x3 subsets 3-generator R,U,L", "333"),
	cstimerEvent("RrU", "3x3x3 subsets 3-generator R,r,U", "333"),
	cstimerEvent("333drud", "3x3x3 subsets Domino Subgroup", "333"),
	cstimerEvent("half", "3x3x3 subsets half turns only", "333"),
	cstimerEvent("lsll", "3x3x3 subsets last slot + last layer (old)", "333", 15)
];
//#endregion
//#region src/events/333/index.ts
/** WCA 3x3: random-state scramble. */
function get333Scramble() {
	return getAnyScramble().trim();
}
/** WCA one-handed: the same random-state scramble as 3x3. */
function get333OhScramble() {
	return get333Scramble();
}
/** WCA FMC: random state, wrapped in R' U' F so it cannot start or end with trivial cancellations. */
function get333FmcScramble() {
	return `R' U' F ${getAnyScramble({
		firstAxisFilter: 2,
		lastAxisFilter: 1
	}).trim()} R' U' F`;
}
/** WCA 3x3 blindfolded: random state plus random wide moves, so the solver can't rely on orientation. */
function get333BldScramble() {
	return cstimerScramble("333ni");
}
/** WCA multi-blind: one numbered blindfolded scramble per cube, one per line. */
function get333MultiBldScramble(cubes = 5) {
	return cstimerScramble("r3ni", cubes);
}
/** Only edges scrambled; corners solved. */
function get333EdgesScramble() {
	return getAnyScramble({
		cp: 1985229328,
		co: 0
	}).trim();
}
/** Only corners scrambled; edges solved. */
function get333CornersScramble() {
	return getAnyScramble({
		ep: 0xba9876543210,
		eo: 0
	}).trim();
}
/** Last layer: first two layers solved, U layer random. */
function get333LLScramble() {
	return getAnyScramble({
		ep: 0xba987654ffff,
		eo: 65535,
		cp: 1985282047,
		co: 65535
	}).trim();
}
const events333 = [
	{
		id: "333",
		name: "3x3x3 random state",
		puzzle: "333",
		generate: get333Scramble
	},
	{
		id: "333oh",
		name: "3x3x3 one-handed",
		puzzle: "333",
		generate: get333OhScramble
	},
	{
		id: "333fm",
		name: "3x3x3 fewest moves",
		puzzle: "333",
		generate: get333FmcScramble
	},
	{
		id: "333ni",
		name: "3x3x3 blindfolded",
		puzzle: "333",
		generate: get333BldScramble
	},
	{
		id: "r3ni",
		name: "3x3x3 multi-blind",
		puzzle: "333",
		length: 5,
		generate: get333MultiBldScramble
	},
	{
		id: "edges",
		name: "3x3x3 edges only",
		puzzle: "333",
		generate: get333EdgesScramble
	},
	{
		id: "corners",
		name: "3x3x3 corners only",
		puzzle: "333",
		generate: get333CornersScramble
	},
	{
		id: "ll",
		name: "3x3x3 last layer",
		puzzle: "333",
		generate: get333LLScramble
	}
];
registerEvents(...events333, ...events333Variants);
//#endregion
//#region src/events/222/index.ts
/** WCA 2x2: random-state scramble (at least 4 moves from solved, as in csTimer). */
function get222Scramble() {
	return cstimerScramble("222so");
}
const events222 = [
	{
		id: "222so",
		name: "2x2x2 random state",
		puzzle: "222",
		generate: get222Scramble
	},
	cstimerEvent("222o", "2x2x2 optimal", "222"),
	cstimerEvent("2223", "2x2x2 3-gen", "222", 25),
	cstimerEvent("222eg", "2x2x2 EG", "222"),
	cstimerEvent("222eg0", "2x2x2 CLL", "222"),
	cstimerEvent("222eg1", "2x2x2 EG1", "222"),
	cstimerEvent("222eg2", "2x2x2 EG2", "222"),
	cstimerEvent("222tcp", "2x2x2 TCLL+", "222"),
	cstimerEvent("222tcn", "2x2x2 TCLL-", "222"),
	cstimerEvent("222tc", "2x2x2 TCLL", "222"),
	cstimerEvent("222lsall", "2x2x2 LS", "222"),
	cstimerEvent("222nb", "2x2x2 No Bar", "222")
];
registerEvents(...events222);
//#endregion
//#region src/events/444/index.ts
/**
* WCA 4x4: random-state scramble. The first call builds the solver's tables,
* which takes a second or two; later calls are fast.
*/
function get444Scramble() {
	return cstimerScramble("444wca");
}
/** WCA 4x4 blindfolded: random state plus a random cube rotation. */
function get444BldScramble() {
	return cstimerScramble("444bld");
}
const events444 = [
	{
		id: "444wca",
		name: "4x4x4 random state",
		puzzle: "444",
		generate: get444Scramble
	},
	{
		id: "444bld",
		name: "4x4x4 blindfolded",
		puzzle: "444",
		generate: get444BldScramble
	},
	cstimerEvent("444m", "4x4x4 random move", "444", 40),
	cstimerEvent("444", "4x4x4 SiGN", "444", 40),
	cstimerEvent("444yj", "4x4x4 YJ", "444", 40),
	cstimerEvent("4edge", "4x4x4 edges", "444"),
	cstimerEvent("RrUu", "4x4x4 R,r,U,u", "444", 40),
	cstimerEvent("444ll", "4x4x4 Last layer", "444"),
	cstimerEvent("444ell", "4x4x4 ELL", "444"),
	cstimerEvent("444edo", "4x4x4 Edge only", "444"),
	cstimerEvent("444cto", "4x4x4 Center only", "444"),
	cstimerEvent("444ctud", "4x4x4 Yau/Hoya UD center solved", "444"),
	cstimerEvent("444ud3c", "4x4x4 Yau/Hoya UD+3E solved", "444"),
	cstimerEvent("444l8e", "4x4x4 Yau/Hoya Last 8 dedges", "444"),
	cstimerEvent("444ctrl", "4x4x4 Yau/Hoya RL center solved", "444"),
	cstimerEvent("444rlda", "4x4x4 Yau/Hoya RLDX center solved", "444"),
	cstimerEvent("444rlca", "4x4x4 Yau/Hoya RLDX cross solved", "444"),
	cstimerEvent("444poll", "4x4x4 Yau/Hoya POLL", "444"),
	cstimerEvent("444ppll", "4x4x4 Yau/Hoya PPLL", "444")
];
registerEvents(...events444);
//#endregion
//#region src/events/555/index.ts
/** WCA 5x5: 60 random moves in WCA notation. */
function get555Scramble() {
	return cstimerScramble("555wca", 60);
}
/** WCA 5x5 blindfolded: 60 random moves plus random wide moves for orientation. */
function get555BldScramble() {
	return cstimerScramble("555bld", 60);
}
const events555 = [
	{
		id: "555wca",
		name: "5x5x5 WCA",
		puzzle: "555",
		generate: get555Scramble
	},
	{
		id: "555bld",
		name: "5x5x5 blindfolded",
		puzzle: "555",
		generate: get555BldScramble
	},
	cstimerEvent("555", "5x5x5 SiGN", "555", 60),
	cstimerEvent("5edge", "5x5x5 edges", "555", 8)
];
registerEvents(...events555);
//#endregion
//#region src/events/666/index.ts
/** WCA 6x6: 80 random moves in WCA notation. */
function get666Scramble() {
	return cstimerScramble("666wca", 80);
}
const events666 = [
	{
		id: "666wca",
		name: "6x6x6 WCA",
		puzzle: "666",
		generate: get666Scramble
	},
	cstimerEvent("666si", "6x6x6 SiGN", "666", 80),
	cstimerEvent("666p", "6x6x6 prefix", "666", 80),
	cstimerEvent("666s", "6x6x6 suffix", "666", 80),
	cstimerEvent("6edge", "6x6x6 edges", "666", 8)
];
registerEvents(...events666);
//#endregion
//#region src/events/777/index.ts
/** WCA 7x7: 100 random moves in WCA notation. */
function get777Scramble() {
	return cstimerScramble("777wca", 100);
}
const events777 = [
	{
		id: "777wca",
		name: "7x7x7 WCA",
		puzzle: "777",
		generate: get777Scramble
	},
	cstimerEvent("777si", "7x7x7 SiGN", "777", 100),
	cstimerEvent("777p", "7x7x7 prefix", "777", 100),
	cstimerEvent("777s", "7x7x7 suffix", "777", 100),
	cstimerEvent("7edge", "7x7x7 edges", "777", 8)
];
registerEvents(...events777);
//#endregion
//#region src/events/clock/index.ts
/** WCA Clock: random pin turns in WCA notation, e.g. "UR5- DR2+ ... ALL3+ y2 ... UL". */
function getClockScramble() {
	return cstimerScramble("clkwca");
}
const eventsClock = [
	{
		id: "clkwca",
		name: "Clock WCA",
		puzzle: "clock",
		generate: getClockScramble
	},
	cstimerEvent("clkwcab", "Clock WCA (old)", "clock"),
	cstimerEvent("clknf", "Clock WCA w/o y2", "clock"),
	cstimerEvent("clk", "Clock Jaap", "clock"),
	cstimerEvent("clko", "Clock optimal", "clock"),
	cstimerEvent("clkc", "Clock concise", "clock"),
	cstimerEvent("clke", "Clock efficient pin order", "clock")
];
registerEvents(...eventsClock);
//#endregion
//#region src/events/minx/index.ts
/** WCA Megaminx: 7 lines of Pochmann-style moves (R++ D-- ... U), separated by newlines. */
function getMegaminxScramble() {
	return cstimerScramble("mgmp", 70);
}
const eventsMinx = [
	{
		id: "mgmp",
		name: "Megaminx WCA",
		puzzle: "minx",
		generate: getMegaminxScramble
	},
	cstimerEvent("mgmc", "Megaminx Carrot", "minx", 70),
	cstimerEvent("mgmo", "Megaminx old style", "minx", 70),
	cstimerEvent("minx2g", "Megaminx 2-generator R,U", "minx", 30),
	cstimerEvent("mlsll", "Megaminx last slot + last layer", "minx"),
	cstimerEvent("mgmso", "Megaminx random state", "minx"),
	cstimerEvent("mgmpll", "Megaminx PLL", "minx"),
	cstimerEvent("mgmll", "Megaminx Last Layer", "minx"),
	cstimerEvent("mgms2l", "Megaminx S2L", "minx", 48)
];
registerEvents(...eventsMinx);
//#endregion
//#region src/events/pyram/index.ts
/** WCA Pyraminx: random-state scramble, with random tip turns (u l r b) at the end. */
function getPyraminxScramble() {
	return cstimerScramble("pyrso");
}
const eventsPyram = [
	{
		id: "pyrso",
		name: "Pyraminx random state",
		puzzle: "pyram",
		generate: getPyraminxScramble
	},
	cstimerEvent("pyro", "Pyraminx optimal", "pyram"),
	cstimerEvent("pyrm", "Pyraminx random move", "pyram", 25),
	cstimerEvent("pyrl4e", "Pyraminx L4E", "pyram"),
	cstimerEvent("pyr4c", "Pyraminx 4 tips", "pyram"),
	cstimerEvent("pyrnb", "Pyraminx No bar", "pyram")
];
registerEvents(...eventsPyram);
//#endregion
//#region src/events/skewb/index.ts
/** WCA Skewb: random-state scramble in WCA notation (R U L B). */
function getSkewbScramble() {
	return cstimerScramble("skbso");
}
const eventsSkewb = [
	{
		id: "skbso",
		name: "Skewb random state",
		puzzle: "skewb",
		generate: getSkewbScramble
	},
	cstimerEvent("skbo", "Skewb optimal", "skewb"),
	cstimerEvent("skb", "Skewb random move", "skewb", 25),
	cstimerEvent("skbnb", "Skewb No bar", "skewb")
];
registerEvents(...eventsSkewb);
//#endregion
//#region src/events/sq1/index.ts
/** WCA Square-1: random-state scramble, e.g. "(1,0)/ (-3,0)/ ...". */
function getSquare1Scramble() {
	return cstimerScramble("sqrs");
}
const eventsSq1 = [
	{
		id: "sqrs",
		name: "Square-1 random state",
		puzzle: "sq1",
		generate: getSquare1Scramble
	},
	cstimerEvent("sqrcsp", "Square-1 CSP", "sq1"),
	cstimerEvent("sq1pll", "Square-1 PLL", "sq1"),
	cstimerEvent("sq1h", "Square-1 face turn metric", "sq1", 40),
	cstimerEvent("sq1t", "Square-1 twist metric", "sq1", 20)
];
registerEvents(...eventsSq1);
//#endregion
//#region src/events/fto/index.ts
/**
* Face-Turning Octahedron: random-state scramble. Not a WCA event, but csTimer
* lists it with them. The first call builds the solver's tables (about a second).
*/
function getFtoScramble() {
	return cstimerScramble("ftoso");
}
const eventsFto = [
	{
		id: "ftoso",
		name: "FTO random state",
		puzzle: "fto",
		generate: getFtoScramble
	},
	cstimerEvent("fto", "FTO random move", "fto", 30),
	cstimerEvent("ftol3t", "FTO L3T", "fto"),
	cstimerEvent("ftol4t", "FTO L3T+LBT", "fto"),
	cstimerEvent("ftotcp", "FTO TCP", "fto"),
	cstimerEvent("ftoedge", "FTO edges only", "fto"),
	cstimerEvent("ftocent", "FTO centers only", "fto"),
	cstimerEvent("ftocorn", "FTO corners only", "fto")
];
registerEvents(...eventsFto);
//#endregion
//#region src/events/other/index.ts
/** Non-WCA puzzles from csTimer's "OTHER" menu: sliding puzzles, cuboids, Gear Cube, Kilominx, Helicopter, Redi, Dino, Ivy and more. */
const eventsOther = [
	cstimerEvent("15prp", "15 puzzle random state URLD", "15p"),
	cstimerEvent("15prap", "15 puzzle random state ^<>v", "15p"),
	cstimerEvent("15prmp", "15 puzzle random state Blank", "15p"),
	cstimerEvent("15p", "15 puzzle random move URLD", "15p", 80),
	cstimerEvent("15pat", "15 puzzle random move ^<>v", "15p", 80),
	cstimerEvent("15pm", "15 puzzle random move Blank", "15p", 80),
	cstimerEvent("8prp", "8 puzzle random state URLD", "8p"),
	cstimerEvent("8prap", "8 puzzle random state ^<>v", "8p"),
	cstimerEvent("8prmp", "8 puzzle random state Blank", "8p"),
	cstimerEvent("133", "1x3x3 (Floppy Cube)", "133"),
	cstimerEvent("223", "2x2x3 (Tower Cube)", "223"),
	cstimerEvent("233", "2x3x3 (Domino)", "233", 25),
	cstimerEvent("334", "3x3x4", "334", 40),
	cstimerEvent("335", "3x3x5", "335", 25),
	cstimerEvent("336", "3x3x6", "336", 40),
	cstimerEvent("337", "3x3x7", "337", 40),
	cstimerEvent("888", "8x8x8", "888", 120),
	cstimerEvent("999", "9x9x9", "999", 120),
	cstimerEvent("101010", "10x10x10", "101010", 120),
	cstimerEvent("111111", "11x11x11", "111111", 120),
	cstimerEvent("cubennn", "NxNxN", "nnn", 12),
	cstimerEvent("mrbl", "Mirror Blocks", "mrbl"),
	cstimerEvent("gearso", "Gear Cube random state", "gear"),
	cstimerEvent("gearo", "Gear Cube optimal", "gear"),
	cstimerEvent("gear", "Gear Cube random move", "gear", 10),
	cstimerEvent("klmso", "Kilominx random state", "klm"),
	cstimerEvent("klmp", "Kilominx Pochmann", "klm", 30),
	cstimerEvent("giga", "Gigaminx Pochmann", "giga", 300),
	cstimerEvent("crz3a", "Crazy 3x3x3", "crz3a", 30),
	cstimerEvent("cm3", "Cmetrick", "cmetrick", 25),
	cstimerEvent("cm2", "Cmetrick Mini", "cmetrick", 25),
	cstimerEvent("heli", "Helicopter Cube", "heli", 40),
	cstimerEvent("helicv", "Curvy Copter", "heli", 40),
	cstimerEvent("heli2x2", "Helicopter Cube 2x2 Heli random move", "heli", 70),
	cstimerEvent("heli2x2g", "Helicopter Cube 2x2 Heli by group", "heli", 5),
	cstimerEvent("rediso", "Redi Cube random state", "redi"),
	cstimerEvent("redim", "Redi Cube MoYu", "redi", 8),
	cstimerEvent("redi", "Redi Cube random move", "redi", 20),
	cstimerEvent("dinoso", "Dino Cube random state", "dino"),
	cstimerEvent("dinoo", "Dino Cube optimal", "dino"),
	cstimerEvent("ivyso", "Ivy cube random state", "ivy"),
	cstimerEvent("ivyo", "Ivy cube optimal", "ivy"),
	cstimerEvent("ivy", "Ivy cube random move", "ivy", 10),
	cstimerEvent("mpyrso", "Master Pyraminx random state", "mpyr"),
	cstimerEvent("mpyr", "Master Pyraminx random move", "mpyr", 42),
	cstimerEvent("prcp", "Pyraminx Crystal Pochmann", "prc", 70),
	cstimerEvent("prco", "Pyraminx Crystal old style", "prc", 70),
	cstimerEvent("sia113", "Siamese Cube 1x1x3 block", "sia", 25),
	cstimerEvent("sia123", "Siamese Cube 1x2x3 block", "sia", 25),
	cstimerEvent("sia222", "Siamese Cube 2x2x2 block", "sia", 25),
	cstimerEvent("sq2", "Square-2", "sq2", 20),
	cstimerEvent("ssq1t", "Super Square-1", "sq2", 20),
	cstimerEvent("sfl", "Super Floppy", "sfl", 25),
	cstimerEvent("ufo", "UFO Jaap style", "ufo", 25),
	cstimerEvent("ctico", "Icosahedron Icosamate random move", "ico", 60),
	cstimerEvent("bic", "Bicube", "bandaged", 30),
	cstimerEvent("bsq", "Square-1 /,(1,0)", "bandaged", 25),
	cstimerEvent("dmdso", "Diamond random state", "dmd")
];
registerEvents(...eventsOther);
//#endregion
//#region src/events/relay/index.ts
/** Relays: several puzzles in one scramble, one numbered line per puzzle. */
const eventsRelay = [
	cstimerEvent("r3", "3x3x3 relay", "relay", 5),
	cstimerEvent("r234", "234 relay", "relay"),
	cstimerEvent("r2345", "2345 relay", "relay"),
	cstimerEvent("r23456", "23456 relay", "relay"),
	cstimerEvent("r234567", "234567 relay", "relay"),
	cstimerEvent("r234w", "234 relay (WCA)", "relay"),
	cstimerEvent("r2345w", "2345 relay (WCA)", "relay"),
	cstimerEvent("r23456w", "23456 relay (WCA)", "relay"),
	cstimerEvent("r234567w", "234567 relay (WCA)", "relay"),
	cstimerEvent("rmngf", "Mini Guildford", "relay")
];
registerEvents(...eventsRelay);
//#endregion
//#region src/events/joke/index.ts
/** csTimer's joke scramble types. */
const eventsJoke = [
	cstimerEvent("111", "1x1x1 (x y z)", "joke", 25),
	cstimerEvent("-1", "-1x-1x-1", "joke", 25),
	cstimerEvent("112", "1x1x2", "joke", 25),
	cstimerEvent("lol", "LOL", "joke", 25),
	cstimerEvent("eide", "Derrick Eide", "joke", 25)
];
registerEvents(...eventsJoke);
//#endregion
export { Move, events222, events333, events333Variants, events444, events555, events666, events777, eventsClock, eventsFto, eventsJoke, eventsMinx, eventsOther, eventsPyram, eventsRelay, eventsSkewb, eventsSq1, get222Scramble, get333BldScramble, get333CornersScramble, get333EdgesScramble, get333FmcScramble, get333LLScramble, get333MultiBldScramble, get333OhScramble, get333Scramble, get444BldScramble, get444Scramble, get555BldScramble, get555Scramble, get666Scramble, get777Scramble, getAnyScramble, getClockScramble, getEvent, getFtoScramble, getMegaminxScramble, getPyraminxScramble, getScramble, getSeed, getSkewbScramble, getSquare1Scramble, listEvents, registerEvents, setSeed };

//# sourceMappingURL=index.mjs.map