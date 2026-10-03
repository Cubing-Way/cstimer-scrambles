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
//#region src/vendor/cstimer/isaac.js
var isaac = (function() {
	var m = Array(256), acc = 0, brs = 0, cnt = 0, r = Array(256), gnt = 0;
	seed(Math.random() * 4294967295);
	function add(x, y) {
		var lsb = (x & 65535) + (y & 65535);
		return (x >>> 16) + (y >>> 16) + (lsb >>> 16) << 16 | lsb & 65535;
	}
	function reset() {
		acc = brs = cnt = 0;
		for (var i = 0; i < 256; ++i) m[i] = r[i] = 0;
		gnt = 0;
	}
	function seed(s) {
		var a = b = c = d = e = f = g = h = 2654435769, b, c, d, e, f, g, h, i;
		if (s && typeof s === "number") s = [s];
		if (s instanceof Array) {
			reset();
			for (i = 0; i < s.length; i++) r[i & 255] += typeof s[i] === "number" ? s[i] : 0;
		}
		function seed_mix() {
			a ^= b << 11;
			d = add(d, a);
			b = add(b, c);
			b ^= c >>> 2;
			e = add(e, b);
			c = add(c, d);
			c ^= d << 8;
			f = add(f, c);
			d = add(d, e);
			d ^= e >>> 16;
			g = add(g, d);
			e = add(e, f);
			e ^= f << 10;
			h = add(h, e);
			f = add(f, g);
			f ^= g >>> 4;
			a = add(a, f);
			g = add(g, h);
			g ^= h << 8;
			b = add(b, g);
			h = add(h, a);
			h ^= a >>> 9;
			c = add(c, h);
			a = add(a, b);
		}
		for (i = 0; i < 4; i++) seed_mix();
		for (i = 0; i < 256; i += 8) {
			if (s) {
				a = add(a, r[i + 0]);
				b = add(b, r[i + 1]);
				c = add(c, r[i + 2]);
				d = add(d, r[i + 3]);
				e = add(e, r[i + 4]);
				f = add(f, r[i + 5]);
				g = add(g, r[i + 6]);
				h = add(h, r[i + 7]);
			}
			seed_mix();
			m[i + 0] = a;
			m[i + 1] = b;
			m[i + 2] = c;
			m[i + 3] = d;
			m[i + 4] = e;
			m[i + 5] = f;
			m[i + 6] = g;
			m[i + 7] = h;
		}
		if (s) for (i = 0; i < 256; i += 8) {
			a = add(a, m[i + 0]);
			b = add(b, m[i + 1]);
			c = add(c, m[i + 2]);
			d = add(d, m[i + 3]);
			e = add(e, m[i + 4]);
			f = add(f, m[i + 5]);
			g = add(g, m[i + 6]);
			h = add(h, m[i + 7]);
			seed_mix();
			m[i + 0] = a;
			m[i + 1] = b;
			m[i + 2] = c;
			m[i + 3] = d;
			m[i + 4] = e;
			m[i + 5] = f;
			m[i + 6] = g;
			m[i + 7] = h;
		}
		prng();
		gnt = 256;
	}
	function prng(n) {
		var i, x, y;
		n = n && typeof n === "number" ? Math.abs(Math.floor(n)) : 1;
		while (n--) {
			cnt = add(cnt, 1);
			brs = add(brs, cnt);
			for (i = 0; i < 256; i++) {
				switch (i & 3) {
					case 0:
						acc ^= acc << 13;
						break;
					case 1:
						acc ^= acc >>> 6;
						break;
					case 2:
						acc ^= acc << 2;
						break;
					case 3: acc ^= acc >>> 16;
				}
				acc = add(m[i + 128 & 255], acc);
				x = m[i];
				m[i] = y = add(m[x >>> 2 & 255], add(acc, brs));
				r[i] = brs = add(m[y >>> 10 & 255], x);
			}
		}
	}
	function rand() {
		if (!gnt--) {
			prng();
			gnt = 255;
		}
		return r[gnt];
	}
	function random() {
		return ((rand() >>> 5) * 67108864 + (rand() >>> 6)) / 9007199254740992;
	}
	function internals(obj) {
		var ret = {
			a: acc,
			b: brs,
			c: cnt,
			m: m.slice(),
			r: r.slice(),
			g: gnt
		};
		if (obj) {
			acc = obj.a;
			brs = obj.b;
			cnt = obj.c;
			m = obj.m.slice();
			r = obj.r.slice();
			gnt = obj.g;
		}
		return ret;
	}
	return {
		reset,
		seed,
		prng,
		rand,
		random,
		internals
	};
})();
//#endregion
//#region src/vendor/cstimer/mathlib.js
var mathlib = (function() {
	var Cnk = [], fact = [1];
	for (var i = 0; i < 32; ++i) {
		Cnk[i] = [];
		for (var j = 0; j < 32; ++j) Cnk[i][j] = 0;
	}
	for (var i = 0; i < 32; ++i) {
		Cnk[i][0] = Cnk[i][i] = 1;
		fact[i + 1] = fact[i] * (i + 1);
		for (var j = 1; j < i; ++j) Cnk[i][j] = Cnk[i - 1][j - 1] + Cnk[i - 1][j];
	}
	var permMul4 = [];
	for (var i = 0; i < 24; i++) {
		var perm1 = [];
		var perm2 = [];
		var perm3 = [];
		permMul4[i] = [];
		setNPerm(perm1, i, 4);
		for (var j = 0; j < 24; j++) {
			setNPerm(perm2, j, 4);
			for (var k = 0; k < 4; k++) perm3[k] = perm1[perm2[k]];
			permMul4[i][j] = getNPerm(perm3, 4);
		}
	}
	function circleOri(arr, a, b, c, d, ori) {
		var temp = arr[a];
		arr[a] = arr[d] ^ ori;
		arr[d] = arr[c] ^ ori;
		arr[c] = arr[b] ^ ori;
		arr[b] = temp ^ ori;
	}
	function circle(arr) {
		var length = arguments.length - 1, temp = arr[arguments[length]];
		for (var i = length; i > 1; i--) arr[arguments[i]] = arr[arguments[i - 1]];
		arr[arguments[1]] = temp;
		return circle;
	}
	function acycle(arr, perm, pow, ori) {
		pow = pow || 1;
		var plen = perm.length;
		var tmp = [];
		for (var i = 0; i < plen; i++) tmp[i] = arr[perm[i]];
		for (var i = 0; i < plen; i++) {
			var j = (i + pow) % plen;
			arr[perm[j]] = tmp[i];
			if (ori) arr[perm[j]] += ori[j] - ori[i] + ori.at(-1);
		}
		return acycle;
	}
	function getPruning(table, index) {
		return table[index >> 3] >> ((index & 7) << 2) & 15;
	}
	function setNPerm(arr, idx, n, even) {
		var prt = 0;
		if (even < 0) idx <<= 1;
		if (n >= 16) {
			arr[n - 1] = 0;
			for (var i = n - 2; i >= 0; i--) {
				arr[i] = idx % (n - i);
				prt ^= arr[i];
				idx = ~~(idx / (n - i));
				for (var j = i + 1; j < n; j--) arr[j] >= arr[i] && arr[j]++;
			}
			if (even < 0 && (prt & 1) != 0) {
				var tmp = arr[n - 1];
				arr[n - 1] = arr[n - 2];
				arr[n - 2] = tmp;
			}
			return arr;
		}
		var vall = 1985229328;
		var valh = 4275878552;
		for (var i = 0; i < n - 1; i++) {
			var p = fact[n - 1 - i];
			var v = idx / p;
			idx = idx % p;
			prt ^= v;
			v <<= 2;
			if (v >= 32) {
				v = v - 32;
				arr[i] = valh >> v & 15;
				var m = (1 << v) - 1;
				valh = (valh & m) + (valh >> 4 & ~m);
			} else {
				arr[i] = vall >> v & 15;
				var m = (1 << v) - 1;
				vall = (vall & m) + (vall >>> 4 & ~m) + (valh << 28);
				valh = valh >> 4;
			}
		}
		if (even < 0 && (prt & 1) != 0) {
			arr[n - 1] = arr[n - 2];
			arr[n - 2] = vall & 15;
		} else arr[n - 1] = vall & 15;
		return arr;
	}
	function getNPerm(arr, n, even) {
		n = n || arr.length;
		var idx = 0;
		if (n >= 16) {
			for (var i = 0; i < n - 1; i++) {
				idx *= n - i;
				for (var j = i + 1; j < n; j++) arr[j] < arr[i] && idx++;
			}
			return even < 0 ? idx >> 1 : idx;
		}
		var vall = 1985229328;
		var valh = 4275878552;
		for (var i = 0; i < n - 1; i++) {
			var v = arr[i] << 2;
			idx *= n - i;
			if (v >= 32) {
				idx += valh >> v - 32 & 15;
				valh -= 286331152 << v - 32;
			} else {
				idx += vall >> v & 15;
				valh -= 286331153;
				vall -= 286331152 << v;
			}
		}
		return even < 0 ? idx >> 1 : idx;
	}
	function getNParity(idx, n) {
		var i, p = 0;
		for (i = n - 2; i >= 0; --i) {
			p ^= idx % (n - i);
			idx = ~~(idx / (n - i));
		}
		return p & 1;
	}
	function getNOri(arr, n, evenbase) {
		var base = Math.abs(evenbase);
		var idx = evenbase < 0 ? 0 : arr[0] % base;
		for (var i = n - 1; i > 0; i--) idx = idx * base + arr[i] % base;
		return idx;
	}
	function setNOri(arr, idx, n, evenbase) {
		var base = Math.abs(evenbase);
		var parity = base * n;
		for (var i = 1; i < n; i++) {
			arr[i] = idx % base;
			parity -= arr[i];
			idx = ~~(idx / base);
		}
		arr[0] = (evenbase < 0 ? parity : idx) % base;
		return arr;
	}
	function bitCount(x) {
		x -= x >> 1 & 1431655765;
		x = (x & 858993459) + (x >> 2 & 858993459);
		return (x + (x >> 4) & 252645135) * 16843009 >> 24;
	}
	function getMPerm(arr, n, cnts, cums) {
		var seen = -1;
		var idx = 0;
		var x = 1;
		for (var i = 0; i < n; i++) {
			var pi = arr[i];
			idx = idx * (n - i) + bitCount(seen & (1 << cums[pi]) - 1) * x;
			x = x * cnts[pi]--;
			seen &= ~(1 << cums[pi] + cnts[pi]);
		}
		return Math.round(idx / x);
	}
	function setMPerm(arr, idx, n, cnts, x) {
		for (var i = 0; i < n; i++) for (var j = 0; j < cnts.length; j++) {
			if (cnts[j] == 0) continue;
			var x2 = ~~(x * cnts[j] / (n - i));
			if (idx < x2) {
				cnts[j]--;
				arr[i] = j;
				x = x2;
				break;
			}
			idx -= x2;
		}
		return arr;
	}
	function Coord(type, length, evenbase) {
		this.length = length;
		this.evenbase = evenbase;
		if (type == "p") {
			this.get = function(arr) {
				return getNPerm(arr, this.length, this.evenbase);
			};
			this.set = function(arr, idx) {
				return setNPerm(arr, idx, this.length, this.evenbase);
			};
		} else if (type == "o") {
			this.get = function(arr) {
				return getNOri(arr, this.length, this.evenbase);
			};
			this.set = function(arr, idx) {
				return setNOri(arr, idx, this.length, this.evenbase);
			};
		} else if (type == "c") {
			var cnts = evenbase;
			this.cnts = cnts.slice();
			this.cntn = this.cnts.length;
			this.cums = [0];
			for (var i = 1; i <= this.cntn; i++) this.cums[i] = this.cums[i - 1] + cnts[i - 1];
			this.n = this.cums[this.cntn];
			var n = this.n;
			var x = 1;
			for (var i = 0; i < this.cntn; i++) for (var j = 1; j <= cnts[i]; j++, n--) x *= n / j;
			this.x = Math.round(x);
			this.get = function(arr) {
				return getMPerm(arr, this.n, this.cnts.slice(), this.cums);
			};
			this.set = function(arr, idx) {
				return setMPerm(arr, idx, this.n, this.cnts.slice(), this.x);
			};
		} else debugger;
	}
	function fillFacelet(facelets, f, perm, ori, divcol) {
		for (var i = 0; i < facelets.length; i++) {
			var cubie = facelets[i];
			var p = perm[i] === void 0 ? i : perm[i];
			if (typeof cubie == "number") {
				f[cubie] = ~~(facelets[p] / divcol);
				continue;
			}
			var o = ori[i] || 0;
			for (var j = 0; j < cubie.length; j++) f[cubie[(j + o) % cubie.length]] = ~~(facelets[p][j] / divcol);
		}
	}
	function detectFacelet(facelets, f, perm, ori, divcol) {
		for (var i = 0; i < facelets.length; i++) {
			var n_ori = facelets[i].length;
			out: for (var j = 0; j < facelets.length + 1; j++) {
				if (j == facelets.length) return -1;
				else if (facelets[j].length != n_ori) continue;
				for (var o = 0; o < n_ori; o++) {
					var isMatch = true;
					for (var t = 0; t < n_ori; t++) if (~~(facelets[j][t] / divcol) != f[facelets[i][(t + o) % n_ori]]) {
						isMatch = false;
						break;
					}
					if (isMatch) {
						perm[i] = j;
						ori[i] = o;
						break out;
					}
				}
			}
		}
		return 0;
	}
	function createMove(moveTable, size, doMove, N_MOVES) {
		N_MOVES = N_MOVES || 6;
		if (Array.isArray(doMove)) {
			var cord = new Coord(doMove[1], doMove[2], doMove[3]);
			doMove = doMove[0];
			for (var j = 0; j < N_MOVES; j++) {
				moveTable[j] = [];
				for (var i = 0; i < size; i++) {
					var arr = cord.set([], i);
					doMove(arr, j);
					moveTable[j][i] = cord.get(arr);
				}
			}
		} else for (var j = 0; j < N_MOVES; j++) {
			moveTable[j] = [];
			for (var i = 0; i < size; i++) moveTable[j][i] = doMove(i, j);
		}
	}
	function createMoveHash(initState, validMoves, hashFunc, moveFunc) {
		var states = [initState];
		var hash2idx = {};
		var depthEnds = [];
		hash2idx[hashFunc(initState)] = 0;
		depthEnds[0] = 1;
		var moveTable = [];
		for (var m = 0; m < validMoves.length; m++) moveTable[m] = [];
		+/* @__PURE__ */ new Date();
		for (var i = 0; i < states.length; i++) {
			if (i == depthEnds.at(-1)) depthEnds.push(states.length);
			if (i % 1e4 == 9999);
			var curState = states[i];
			for (var m = 0; m < validMoves.length; m++) {
				var newState = moveFunc(curState, validMoves[m]);
				if (!newState) {
					moveTable[m][i] = -1;
					continue;
				}
				var newHash = hashFunc(newState);
				if (!(newHash in hash2idx)) {
					hash2idx[newHash] = states.length;
					states.push(newState);
				}
				moveTable[m][i] = hash2idx[newHash];
			}
		}
		return [moveTable, hash2idx];
	}
	function edgeMove(arr, m) {
		if (m == 0) circleOri(arr, 0, 7, 8, 4, 1);
		else if (m == 1) circleOri(arr, 3, 6, 11, 7, 0);
		else if (m == 2) circleOri(arr, 0, 1, 2, 3, 0);
		else if (m == 3) circleOri(arr, 2, 5, 10, 6, 1);
		else if (m == 4) circleOri(arr, 1, 4, 9, 5, 0);
		else if (m == 5) circleOri(arr, 11, 10, 9, 8, 0);
	}
	function CubieCube() {
		this.ca = [
			0,
			1,
			2,
			3,
			4,
			5,
			6,
			7
		];
		this.ea = [
			0,
			2,
			4,
			6,
			8,
			10,
			12,
			14,
			16,
			18,
			20,
			22
		];
		this.ori = 0;
	}
	CubieCube.SOLVED = new CubieCube();
	CubieCube.EdgeMult = function(a, b, prod) {
		for (var ed = 0; ed < 12; ed++) prod.ea[ed] = a.ea[b.ea[ed] >> 1] ^ b.ea[ed] & 1;
	};
	CubieCube.CornMult = function(a, b, prod) {
		for (var corn = 0; corn < 8; corn++) {
			var ori = ((a.ca[b.ca[corn] & 7] >> 3) + (b.ca[corn] >> 3)) % 3;
			prod.ca[corn] = a.ca[b.ca[corn] & 7] & 7 | ori << 3;
		}
	};
	CubieCube.CubeMult = function(a, b, prod) {
		CubieCube.CornMult(a, b, prod);
		CubieCube.EdgeMult(a, b, prod);
	};
	CubieCube.CentMult = function(a, b, prod) {
		prod.ct = [];
		for (var cent = 0; cent < 6; cent++) prod.ct[cent] = a.ct[b.ct[cent]];
	};
	CubieCube.prototype.init = function(ca, ea) {
		this.ca = ca.slice();
		this.ea = ea.slice();
		return this;
	};
	CubieCube.prototype.hashCode = function() {
		var ret = 0;
		for (var i = 0; i < 20; i++) ret = 0 | ret * 31 + (i < 12 ? this.ea[i] : this.ca[i - 12]);
		return ret;
	};
	CubieCube.prototype.isEqual = function(c) {
		c = c || CubieCube.SOLVED;
		for (var i = 0; i < 8; i++) if (this.ca[i] != c.ca[i]) return false;
		for (var i = 0; i < 12; i++) if (this.ea[i] != c.ea[i]) return false;
		return true;
	};
	CubieCube.cFacelet = [
		[
			8,
			9,
			20
		],
		[
			6,
			18,
			38
		],
		[
			0,
			36,
			47
		],
		[
			2,
			45,
			11
		],
		[
			29,
			26,
			15
		],
		[
			27,
			44,
			24
		],
		[
			33,
			53,
			42
		],
		[
			35,
			17,
			51
		]
	];
	CubieCube.eFacelet = [
		[5, 10],
		[7, 19],
		[3, 37],
		[1, 46],
		[32, 16],
		[28, 25],
		[30, 43],
		[34, 52],
		[23, 12],
		[21, 41],
		[50, 39],
		[48, 14]
	];
	CubieCube.ctFacelet = [
		4,
		13,
		22,
		31,
		40,
		49
	];
	CubieCube.faceMap = (function() {
		var f = [];
		for (var c = 0; c < 8; c++) for (var n = 0; n < 3; n++) f[CubieCube.cFacelet[c][n]] = [
			0,
			c,
			n
		];
		for (var e = 0; e < 12; e++) for (var n = 0; n < 2; n++) f[CubieCube.eFacelet[e][n]] = [
			1,
			e,
			n
		];
		return f;
	})();
	CubieCube.prototype.toPerm = function(cFacelet, eFacelet, ctFacelet, withOri) {
		cFacelet = cFacelet || CubieCube.cFacelet;
		eFacelet = eFacelet || CubieCube.eFacelet;
		ctFacelet = ctFacelet || CubieCube.ctFacelet;
		var f = [];
		for (var i = 0; i < 54; i++) f[i] = i;
		var obj = this;
		if (withOri && obj.ori) {
			obj = new CubieCube();
			var rot = CubieCube.rotCube[CubieCube.rotMulI[0][this.ori]];
			CubieCube.CubeMult(this, rot, obj);
			for (var i = 0; i < 6; i++) f[ctFacelet[i]] = ctFacelet[rot.ct[i]];
		}
		for (var c = 0; c < 8; c++) {
			var j = obj.ca[c] & 7;
			var ori = obj.ca[c] >> 3;
			for (var n = 0; n < 3; n++) f[cFacelet[c][(n + ori) % 3]] = cFacelet[j][n];
		}
		for (var e = 0; e < 12; e++) {
			var j = obj.ea[e] >> 1;
			var ori = obj.ea[e] & 1;
			for (var n = 0; n < 2; n++) f[eFacelet[e][(n + ori) % 2]] = eFacelet[j][n];
		}
		return f;
	};
	CubieCube.prototype.toFaceCube = function(cFacelet, eFacelet, ctFacelet, withOri) {
		var perm = this.toPerm(cFacelet, eFacelet, ctFacelet, withOri);
		var ts = "URFDLB";
		var f = [];
		for (var i = 0; i < 54; i++) f[i] = ts[~~(perm[i] / 9)];
		return f.join("");
	};
	CubieCube.prototype.prettyString = function(withOri) {
		var facelet = this.toFaceCube(null, null, null, withOri);
		return "        U0U1U2\n        U3U4U5\n        U6U7U8\nL0L1L2  F0F1F2  R0R1R2  B0B1B2\nL3L4L5  F3F4F5  R3R4R5  B3B4B5\nL6L7L8  F6F7F8  R6R7R8  B6B7B8\n        D0D1D2\n        D3D4D5\n        D6D7D8\n".replace(/[URFDLB][0-8]/g, function(m) {
			return facelet["URFDLB".indexOf(m[0]) * 9 + ~~m[1]] + " ";
		});
	};
	CubieCube.prototype.invFrom = function(cc) {
		for (var edge = 0; edge < 12; edge++) this.ea[cc.ea[edge] >> 1] = edge << 1 | cc.ea[edge] & 1;
		for (var corn = 0; corn < 8; corn++) this.ca[cc.ca[corn] & 7] = corn | 32 >> (cc.ca[corn] >> 3) & 24;
		return this;
	};
	CubieCube.prototype.fromFacelet = function(facelet, cFacelet, eFacelet) {
		cFacelet = cFacelet || CubieCube.cFacelet;
		eFacelet = eFacelet || CubieCube.eFacelet;
		var count = 0;
		var f = [];
		var centers = facelet[4] + facelet[13] + facelet[22] + facelet[31] + facelet[40] + facelet[49];
		for (var i = 0; i < 54; ++i) {
			f[i] = centers.indexOf(facelet[i]);
			if (f[i] == -1) return -1;
			count += 1 << (f[i] << 2);
		}
		if (count != 10066329) return -1;
		var col1, col2, i = 0, j, ori;
		for (; i < 8; ++i) {
			for (ori = 0; ori < 3; ++ori) if (f[cFacelet[i][ori]] == 0 || f[cFacelet[i][ori]] == 3) break;
			col1 = f[cFacelet[i][(ori + 1) % 3]];
			col2 = f[cFacelet[i][(ori + 2) % 3]];
			for (j = 0; j < 8; ++j) if (col1 == ~~(cFacelet[j][1] / 9) && col2 == ~~(cFacelet[j][2] / 9)) {
				this.ca[i] = j | ori % 3 << 3;
				break;
			}
		}
		for (i = 0; i < 12; ++i) for (j = 0; j < 12; ++j) {
			if (f[eFacelet[i][0]] == ~~(eFacelet[j][0] / 9) && f[eFacelet[i][1]] == ~~(eFacelet[j][1] / 9)) {
				this.ea[i] = j << 1;
				break;
			}
			if (f[eFacelet[i][0]] == ~~(eFacelet[j][1] / 9) && f[eFacelet[i][1]] == ~~(eFacelet[j][0] / 9)) {
				this.ea[i] = j << 1 | 1;
				break;
			}
		}
		return this;
	};
	CubieCube.prototype.verify = function() {
		var mask = 0;
		var sum = 0;
		var ep = [];
		for (var e = 0; e < 12; e++) {
			mask |= 256 << (this.ea[e] >> 1);
			sum ^= this.ea[e] & 1;
			ep.push(this.ea[e] >> 1);
		}
		var cp = [];
		for (var c = 0; c < 8; c++) {
			mask |= 1 << (this.ca[c] & 7);
			sum += this.ca[c] >> 3 << 1;
			cp.push(this.ca[c] & 7);
		}
		if (mask != 1048575 || sum % 6 != 0 || getNParity(getNPerm(ep, 12), 12) != getNParity(getNPerm(cp, 8), 8)) return -1;
		return 0;
	};
	CubieCube.moveCube = (function() {
		var moveCube = [];
		for (var i = 0; i < 18; i++) moveCube[i] = new CubieCube();
		moveCube[0].init([
			3,
			0,
			1,
			2,
			4,
			5,
			6,
			7
		], [
			6,
			0,
			2,
			4,
			8,
			10,
			12,
			14,
			16,
			18,
			20,
			22
		]);
		moveCube[3].init([
			20,
			1,
			2,
			8,
			15,
			5,
			6,
			19
		], [
			16,
			2,
			4,
			6,
			22,
			10,
			12,
			14,
			8,
			18,
			20,
			0
		]);
		moveCube[6].init([
			9,
			21,
			2,
			3,
			16,
			12,
			6,
			7
		], [
			0,
			19,
			4,
			6,
			8,
			17,
			12,
			14,
			3,
			11,
			20,
			22
		]);
		moveCube[9].init([
			0,
			1,
			2,
			3,
			5,
			6,
			7,
			4
		], [
			0,
			2,
			4,
			6,
			10,
			12,
			14,
			8,
			16,
			18,
			20,
			22
		]);
		moveCube[12].init([
			0,
			10,
			22,
			3,
			4,
			17,
			13,
			7
		], [
			0,
			2,
			20,
			6,
			8,
			10,
			18,
			14,
			16,
			4,
			12,
			22
		]);
		moveCube[15].init([
			0,
			1,
			11,
			23,
			4,
			5,
			18,
			14
		], [
			0,
			2,
			4,
			23,
			8,
			10,
			12,
			21,
			16,
			18,
			7,
			15
		]);
		for (var a = 0; a < 18; a += 3) for (var p = 0; p < 2; p++) CubieCube.CubeMult(moveCube[a + p], moveCube[a], moveCube[a + p + 1]);
		return moveCube;
	})();
	CubieCube.rotCube = (function() {
		var u4 = new CubieCube().init([
			3,
			0,
			1,
			2,
			7,
			4,
			5,
			6
		], [
			6,
			0,
			2,
			4,
			14,
			8,
			10,
			12,
			23,
			17,
			19,
			21
		]);
		u4.ct = [
			0,
			5,
			1,
			3,
			2,
			4
		];
		var f2 = new CubieCube().init([
			5,
			4,
			7,
			6,
			1,
			0,
			3,
			2
		], [
			12,
			10,
			8,
			14,
			4,
			2,
			0,
			6,
			18,
			16,
			22,
			20
		]);
		f2.ct = [
			3,
			4,
			2,
			0,
			1,
			5
		];
		var urf = new CubieCube().init([
			8,
			20,
			13,
			17,
			19,
			15,
			22,
			10
		], [
			3,
			16,
			11,
			18,
			7,
			22,
			15,
			20,
			1,
			9,
			13,
			5
		]);
		urf.ct = [
			2,
			0,
			1,
			5,
			3,
			4
		];
		var c = new CubieCube();
		c.ct = [
			0,
			1,
			2,
			3,
			4,
			5
		];
		var d = new CubieCube();
		var rotCube = [];
		for (var i = 0; i < 24; i++) {
			rotCube[i] = new CubieCube().init(c.ca, c.ea);
			rotCube[i].ct = c.ct.slice();
			CubieCube.CubeMult(c, u4, d);
			CubieCube.CentMult(c, u4, d);
			c.init(d.ca, d.ea);
			c.ct = d.ct.slice();
			if (i % 4 == 3) {
				CubieCube.CubeMult(c, f2, d);
				CubieCube.CentMult(c, f2, d);
				c.init(d.ca, d.ea);
				c.ct = d.ct.slice();
			}
			if (i % 8 == 7) {
				CubieCube.CubeMult(c, urf, d);
				CubieCube.CentMult(c, urf, d);
				c.init(d.ca, d.ea);
				c.ct = d.ct.slice();
			}
		}
		var movHash = [];
		var rotHash = [];
		var rotMult = [];
		var rotMulI = [];
		var rotMulM = [];
		for (var i = 0; i < 24; i++) {
			rotHash[i] = rotCube[i].hashCode();
			rotMult[i] = [];
			rotMulI[i] = [];
			rotMulM[i] = [];
		}
		for (var i = 0; i < 18; i++) movHash[i] = CubieCube.moveCube[i].hashCode();
		for (var i = 0; i < 24; i++) for (var j = 0; j < 24; j++) {
			CubieCube.CubeMult(rotCube[i], rotCube[j], c);
			var k = rotHash.indexOf(c.hashCode());
			rotMult[i][j] = k;
			rotMulI[k][j] = i;
		}
		for (var i = 0; i < 24; i++) for (var j = 0; j < 18; j++) {
			CubieCube.CubeMult(rotCube[rotMulI[0][i]], CubieCube.moveCube[j], c);
			CubieCube.CubeMult(c, rotCube[i], d);
			var k = movHash.indexOf(d.hashCode());
			rotMulM[i][j] = k;
		}
		var rot2str = [
			"",
			"y'",
			"y2",
			"y",
			"z2",
			"y' z2",
			"y2 z2",
			"y z2",
			"y' x'",
			"y2 x'",
			"y x'",
			"x'",
			"y' x",
			"y2 x",
			"y x",
			"x",
			"y z",
			"z",
			"y' z",
			"y2 z",
			"y' z'",
			"y2 z'",
			"y z'",
			"z'"
		];
		CubieCube.rotMult = rotMult;
		CubieCube.rotMulI = rotMulI;
		CubieCube.rotMulM = rotMulM;
		CubieCube.rot2str = rot2str;
		return rotCube;
	})();
	CubieCube.prototype.edgeCycles = function() {
		var visited = [];
		var small_cycles = [
			0,
			0,
			0
		];
		var cycles = 0;
		var parity = false;
		for (var x = 0; x < 12; ++x) {
			if (visited[x]) continue;
			var length = -1;
			var flip = false;
			var y = x;
			do {
				visited[y] = true;
				++length;
				flip ^= this.ea[y] & 1;
				y = this.ea[y] >> 1;
			} while (y != x);
			cycles += length >> 1;
			if (length & 1) {
				parity = !parity;
				++cycles;
			}
			if (flip) {
				if (length == 0) ++small_cycles[0];
				else if (length & 1) small_cycles[2] ^= 1;
				else ++small_cycles[1];
			}
		}
		small_cycles[1] += small_cycles[2];
		if (small_cycles[0] < small_cycles[1]) cycles += small_cycles[0] + small_cycles[1] >> 1;
		else cycles += small_cycles[1] + [
			0,
			2,
			3,
			5,
			6,
			8,
			9
		][small_cycles[0] - small_cycles[1] >> 1];
		return cycles - parity;
	};
	var CubeMoveRE = /^\s*([URFDLB]w?|[EMSyxz]|2-2[URFDLB]w)(['2]?)(@\d+)?\s*$/;
	var tmpCubie = new CubieCube();
	CubieCube.prototype.selfMoveStr = function(moveStr, isInv) {
		var m = CubeMoveRE.exec(moveStr);
		if (!m) return;
		var face = m[1];
		var pow = "2'".indexOf(m[2] || "-") + 2;
		if (isInv) pow = 4 - pow;
		if (m[3]) this.tstamp = ~~m[3].slice(1);
		this.ori = this.ori || 0;
		var axis = "URFDLB".indexOf(face);
		if (axis != -1) {
			m = axis * 3 + pow % 4 - 1;
			m = CubieCube.rotMulM[this.ori][m];
			CubieCube.CubeMult(this, CubieCube.moveCube[m], tmpCubie);
			this.init(tmpCubie.ca, tmpCubie.ea);
			return m;
		}
		axis = "UwRwFwDwLwBw".indexOf(face);
		if (axis != -1) {
			axis >>= 1;
			m = (axis + 3) % 6 * 3 + pow % 4 - 1;
			m = CubieCube.rotMulM[this.ori][m];
			CubieCube.CubeMult(this, CubieCube.moveCube[m], tmpCubie);
			this.init(tmpCubie.ca, tmpCubie.ea);
			var rot = [
				3,
				15,
				17,
				1,
				11,
				23
			][axis];
			for (var i = 0; i < pow; i++) this.ori = CubieCube.rotMult[rot][this.ori];
			return m;
		}
		axis = [
			"2-2Uw",
			"2-2Rw",
			"2-2Fw",
			"2-2Dw",
			"2-2Lw",
			"2-2Bw"
		].indexOf(face);
		if (axis == -1) axis = [
			null,
			null,
			"S",
			"E",
			"M",
			null
		].indexOf(face);
		if (axis != -1) {
			var m1 = axis * 3 + (4 - pow) % 4 - 1;
			var m2 = (axis + 3) % 6 * 3 + pow % 4 - 1;
			m1 = CubieCube.rotMulM[this.ori][m1];
			CubieCube.CubeMult(this, CubieCube.moveCube[m1], tmpCubie);
			this.init(tmpCubie.ca, tmpCubie.ea);
			m2 = CubieCube.rotMulM[this.ori][m2];
			CubieCube.CubeMult(this, CubieCube.moveCube[m2], tmpCubie);
			this.init(tmpCubie.ca, tmpCubie.ea);
			var rot = [
				3,
				15,
				17,
				1,
				11,
				23
			][axis];
			for (var i = 0; i < pow; i++) this.ori = CubieCube.rotMult[rot][this.ori];
			return m1 + 18;
		}
		axis = "yxz".indexOf(face);
		if (axis != -1) {
			var rot = [
				3,
				15,
				17
			][axis];
			for (var i = 0; i < pow; i++) this.ori = CubieCube.rotMult[rot][this.ori];
			return;
		}
	};
	CubieCube.prototype.selfConj = function(conj) {
		if (conj === void 0) conj = this.ori;
		if (conj != 0) {
			CubieCube.CubeMult(CubieCube.rotCube[conj], this, tmpCubie);
			CubieCube.CubeMult(tmpCubie, CubieCube.rotCube[CubieCube.rotMulI[0][conj]], this);
			this.ori = CubieCube.rotMulI[this.ori][conj] || 0;
		}
	};
	var minx = (function() {
		var U = 0, R = 1, F = 2, L = 3, BL = 4, BR = 5, DR = 6, DL = 7, DBL = 8, B = 9, DBR = 10, D = 11;
		var oppFace = [
			D,
			DBL,
			B,
			DBR,
			DR,
			DL,
			BL,
			BR,
			R,
			F,
			L,
			U
		];
		var adjFaces = [
			[
				BR,
				R,
				F,
				L,
				BL
			],
			[
				DBR,
				DR,
				F,
				U,
				BR
			],
			[
				DR,
				DL,
				L,
				U,
				R
			],
			[
				DL,
				DBL,
				BL,
				U,
				F
			],
			[
				DBL,
				B,
				BR,
				U,
				L
			],
			[
				B,
				DBR,
				R,
				U,
				BL
			],
			[
				D,
				DL,
				F,
				R,
				DBR
			],
			[
				D,
				DBL,
				L,
				F,
				DR
			],
			[
				D,
				B,
				BL,
				L,
				DL
			],
			[
				D,
				DBR,
				BR,
				BL,
				DBL
			],
			[
				D,
				DR,
				R,
				BR,
				B
			],
			[
				DR,
				DBR,
				B,
				DBL,
				DL
			]
		];
		function doMove(state, face, pow, wide) {
			pow = (pow % 5 + 5) % 5;
			if (pow == 0) return;
			var base = face * 11;
			var swaps = [
				[],
				[],
				[],
				[],
				[]
			];
			for (var i = 0; i < 5; i++) {
				var aface = adjFaces[face][i];
				var ridx = adjFaces[aface].indexOf(face);
				if (wide == 0 || wide == 1) swaps[i].push(base + i, base + i + 5, aface * 11 + ridx % 5 + 5, aface * 11 + ridx % 5, aface * 11 + (ridx + 1) % 5);
				if (wide == 1 || wide == 2) {
					swaps[i].push(aface * 11 + 10);
					for (var j = 1; j < 5; j++) swaps[i].push(aface * 11 + (ridx + j) % 5 + 5);
					for (var j = 2; j < 5; j++) swaps[i].push(aface * 11 + (ridx + j) % 5);
					var ii = 4 - i;
					var opp = oppFace[face];
					var oaface = adjFaces[opp][ii];
					var oridx = adjFaces[oaface].indexOf(opp);
					swaps[i].push(opp * 11 + ii, opp * 11 + ii + 5, oaface * 11 + 10);
					for (var j = 0; j < 5; j++) swaps[i].push(oaface * 11 + (oridx + j) % 5 + 5, oaface * 11 + (oridx + j) % 5);
				}
			}
			for (var i = 0; i < swaps[0].length; i++) mathlib.acycle(state, [
				swaps[0][i],
				swaps[1][i],
				swaps[2][i],
				swaps[3][i],
				swaps[4][i]
			], pow);
		}
		return {
			doMove,
			oppFace,
			adjFaces
		};
	})();
	function createPrun(prun, init, size, maxd, doMove, N_MOVES, N_POWER, N_INV) {
		var isMoveTable = Array.isArray(doMove);
		N_MOVES = N_MOVES || 6;
		N_POWER = N_POWER || 3;
		N_INV = N_INV || 256;
		maxd = maxd || 256;
		for (var i = 0, len = size + 7 >>> 3; i < len; i++) prun[i] = -1;
		if (!Array.isArray(init)) init = [init];
		for (var i = 0; i < init.length; i++) prun[init[i] >> 3] ^= 15 << ((init[i] & 7) << 2);
		var val = 0;
		for (var l = 0; l <= maxd; l++) {
			var done = 0;
			var inv = l >= N_INV;
			var fill = l + 1 ^ 15;
			var find = inv ? 15 : l;
			var check = inv ? l : 15;
			out: for (var p = 0; p < size; p++, val >>= 4) {
				if ((p & 7) == 0) {
					val = prun[p >> 3];
					if (!inv && val == -1) {
						p += 7;
						continue;
					}
				}
				if ((val & 15) != find) continue;
				for (var m = 0; m < N_MOVES; m++) {
					var q = p;
					for (var c = 0; c < N_POWER; c++) {
						q = isMoveTable ? doMove[m][q] : doMove(q, m);
						if (q < 0) break;
						if (getPruning(prun, q) != check) continue;
						++done;
						if (inv) {
							prun[p >> 3] ^= fill << ((p & 7) << 2);
							continue out;
						}
						prun[q >> 3] ^= fill << ((q & 7) << 2);
					}
				}
			}
			if (done == 0) break;
		}
	}
	function Solver(N_MOVES, N_POWER, stateParams) {
		this.N_STATES = stateParams.length;
		this.N_MOVES = N_MOVES;
		this.N_POWER = N_POWER;
		this.stateParams = stateParams;
		this.coords = [];
		for (var i = 0; i < this.N_STATES; i++) {
			var doMove = stateParams[i][1];
			if (Array.isArray(doMove)) this.coords[i] = new Coord(doMove[1], doMove[2], doMove[3]);
		}
		this.inited = false;
	}
	var _ = Solver.prototype;
	_.init = function() {
		if (this.inited) return;
		this.move = [];
		this.prun = [];
		for (var i = 0; i < this.N_STATES; i++) {
			var stateParam = this.stateParams[i];
			var init = stateParam[0];
			var doMove = stateParam[1];
			var size = stateParam[2];
			var maxd = stateParam[3];
			var N_INV = stateParam[4];
			this.move[i] = [];
			this.prun[i] = [];
			createMove(this.move[i], size, doMove, this.N_MOVES);
			createPrun(this.prun[i], init, size, maxd, this.move[i], this.N_MOVES, this.N_POWER, N_INV);
		}
		this.solv = new Searcher(null, (state) => {
			var prun = 0;
			for (var i = 0; i < this.N_STATES; i++) prun = Math.max(prun, getPruning(this.prun[i], state[i]));
			return prun;
		}, (state, move) => {
			for (var i = 0; i < this.N_STATES; i++) state[i] = this.move[i][move][state[i]];
			return state;
		}, this.N_MOVES, this.N_POWER);
		this.inited = true;
	};
	_.search = function(state, minl, MAXL) {
		MAXL = (MAXL || 99) + 1;
		if (!this.inited) this.init();
		this.sol = this.solv.solve(state, minl, MAXL);
		return this.sol;
	};
	_.toStr = function(sol, move_map, power_map) {
		return sol.map((move) => move_map[move[0]] + power_map[move[1]]).join(" ").replace(/ +/g, " ");
	};
	function Searcher(isSolved, getPrun, doMove, N_AXIS, N_POWER, ckmv) {
		this.isSolved = isSolved || function() {
			return true;
		};
		this.getPrun = getPrun;
		this.doMove = doMove;
		this.N_AXIS = N_AXIS;
		this.N_POWER = N_POWER;
		this.ckmv = ckmv || valuedArray(N_AXIS, function(i) {
			return 1 << i;
		});
	}
	_ = Searcher.prototype;
	_.solve = function(idx, minl, MAXL, callback, cost) {
		var sols = this.solveMulti([idx], minl, MAXL, callback, cost);
		return sols == null ? null : sols[0];
	};
	_.solveMulti = function(idxs, minl, MAXL, callback, cost) {
		this.sidx = 0;
		this.sol = [];
		this.length = minl;
		this.idxs = idxs;
		return this.nextMulti(MAXL, callback, cost);
	};
	_.next = function(MAXL, callback, cost) {
		var sols = this.nextMulti(MAXL, callback, cost);
		return sols == null ? null : sols[0];
	};
	_.nextMulti = function(MAXL, callback, cost) {
		this.cost = (cost || 1e9) + 1;
		this.callback = callback || function() {
			return true;
		};
		for (; this.length <= MAXL; this.length++) {
			for (; this.sidx < this.idxs.length; this.sidx++) if (this.idaSearch(this.idxs[this.sidx], this.length, 0, -1, this.sol) == 0) return this.cost <= 0 ? null : [this.sol, this.sidx];
			this.sidx = 0;
		}
		return null;
	};
	_.idaSearch = function(idx, maxl, depth, lm, sol) {
		if (--this.cost <= 0) return 0;
		var prun = this.getPrun(idx);
		if (prun > maxl) return prun > maxl + 1 ? 2 : 1;
		else if (maxl == 0) return this.isSolved(idx) && this.callback(sol, this.sidx) ? 0 : 1;
		else if (prun == 0 && maxl == 1 && this.isSolved(idx)) return 1;
		var axis = sol.length > depth ? sol[depth][0] : 0;
		for (; axis < this.N_AXIS; axis++) {
			if (this.ckmv[lm] >> axis & 1) continue;
			var idx1 = Array.isArray(idx) ? idx.slice() : idx;
			var pow = sol.length > depth ? sol[depth][1] : 0;
			for (; pow < this.N_POWER; pow++) {
				idx1 = this.doMove(idx1, axis, pow);
				if (idx1 == null) break;
				sol[depth] = [axis, pow];
				var ret = this.idaSearch(idx1, maxl - 1, depth + 1, axis, sol);
				if (ret == 0) return 0;
				sol.pop();
				if (ret == 2) break;
			}
		}
		return 1;
	};
	function gSolver(solvedStates, doMove, moves) {
		this.solvedStates = solvedStates;
		this.doMove = doMove;
		this.movesList = [];
		for (var move in moves) this.movesList.push([move, moves[move]]);
		this.prunTable = {};
		this.toUpdateArr = null;
		this.prunTableSize = 0;
		this.prunDepth = -1;
		this.cost = 0;
		this.MAX_PRUN_SIZE = 1e5;
	}
	_ = gSolver.prototype;
	_.updatePrun = function(targetDepth) {
		targetDepth = targetDepth === void 0 ? this.prunDepth + 1 : targetDepth;
		for (var depth = this.prunDepth + 1; depth <= targetDepth; depth++) {
			if (this.prevSize >= this.MAX_PRUN_SIZE) break;
			+/* @__PURE__ */ new Date();
			if (depth < 1) {
				this.prevSize = 0;
				for (var i = 0; i < this.solvedStates.length; i++) {
					var state = this.solvedStates[i];
					if (!(state in this.prunTable)) {
						this.prunTable[state] = depth;
						this.prunTableSize++;
					}
				}
			} else this.updatePrunBFS(depth - 1);
			if (this.cost == 0) return;
			this.prunDepth = depth;
			this.prevSize = this.prunTableSize;
		}
	};
	_.updatePrunBFS = function(fromDepth) {
		if (this.toUpdateArr == null) {
			this.toUpdateArr = [];
			for (var state in this.prunTable) {
				if (this.prunTable[state] != fromDepth) continue;
				this.toUpdateArr.push(state);
			}
		}
		while (this.toUpdateArr.length != 0) {
			var state = this.toUpdateArr.pop();
			for (var moveIdx = 0; moveIdx < this.movesList.length; moveIdx++) {
				var newState = this.doMove(state, this.movesList[moveIdx][0]);
				if (!newState || newState in this.prunTable) continue;
				this.prunTable[newState] = fromDepth + 1;
				this.prunTableSize++;
			}
			if (this.cost >= 0) {
				if (this.cost == 0) return;
				this.cost--;
			}
		}
		this.toUpdateArr = null;
	};
	_.search = function(state, minl, MAXL) {
		this.sol = [];
		this.subOpt = false;
		this.state = state;
		this.visited = {};
		this.maxl = minl = minl || 0;
		return this.searchNext(MAXL);
	};
	_.searchNext = function(MAXL, cost) {
		MAXL = MAXL + 1 || 99;
		this.prevSolStr = this.solArr ? this.solArr.join(",") : null;
		this.solArr = null;
		this.cost = cost || -1;
		for (; this.maxl < MAXL; this.maxl++) {
			this.updatePrun(Math.ceil(this.maxl / 2));
			if (this.cost == 0) return null;
			if (this.idaSearch(this.state, this.maxl, null, 0)) break;
		}
		return this.solArr;
	};
	_.getPruning = function(state) {
		var prun = this.prunTable[state];
		return prun === void 0 ? this.prunDepth + 1 : prun;
	};
	_.idaSearch = function(state, maxl, lm, depth) {
		if (this.getPruning(state) > maxl) return false;
		if (maxl == 0) {
			if (this.solvedStates.indexOf(state) == -1) return false;
			var solArr = this.sol.map((move) => this.movesList[move][0]);
			this.subOpt = true;
			if (solArr.join(",") == this.prevSolStr) return false;
			this.solArr = solArr;
			return true;
		}
		if (!this.subOpt) {
			if (state in this.visited && this.visited[state] < depth) return false;
			this.visited[state] = depth;
		}
		if (this.cost >= 0) {
			if (this.cost == 0) return true;
			this.cost--;
		}
		var lastMove = lm == null ? "" : this.movesList[lm][0];
		var lastAxisFace = lm == null ? -1 : this.movesList[lm][1];
		for (var moveIdx = this.sol[depth] || 0; moveIdx < this.movesList.length; moveIdx++) {
			var moveArgs = this.movesList[moveIdx];
			var axisface = moveArgs[1] ^ lastAxisFace;
			var move = moveArgs[0];
			if (axisface == 0 || (axisface & 15) == 0 && move <= lastMove) continue;
			var newState = this.doMove(state, move);
			if (!newState || newState == state) continue;
			this.sol[depth] = moveIdx;
			if (this.idaSearch(newState, maxl - 1, moveIdx, depth + 1)) return true;
			this.sol.pop();
		}
		return false;
	};
	var randGen = (function() {
		var rndFunc;
		var rndCnt;
		var seedStr;
		function random() {
			rndCnt++;
			return rndFunc();
		}
		function getSeed() {
			return [rndCnt, seedStr];
		}
		function setSeed(_rndCnt, _seedStr) {
			if (_seedStr && (_seedStr != seedStr || rndCnt > _rndCnt)) {
				var seed = [];
				for (var i = 0; i < _seedStr.length; i++) seed[i] = _seedStr.charCodeAt(i);
				isaac.seed(seed);
				rndFunc = isaac.random;
				rndCnt = 0;
				seedStr = _seedStr;
			}
			while (rndCnt < _rndCnt) {
				rndFunc();
				rndCnt++;
			}
		}
		var seed = "" + (/* @__PURE__ */ new Date()).getTime();
		if (typeof crypto != "undefined" && crypto.getRandomValues) seed = String.fromCharCode.apply(null, crypto.getRandomValues(/* @__PURE__ */ new Uint16Array(256)));
		setSeed(256, seed);
		return {
			random,
			getSeed,
			setSeed
		};
	})();
	function rndEl(x) {
		return x[~~(randGen.random() * x.length)];
	}
	function rn(n) {
		return ~~(randGen.random() * n);
	}
	function rndHit(prob) {
		return randGen.random() < prob;
	}
	function rndPerm(n, isEven) {
		var p = 0;
		var arr = [];
		for (var i = 0; i < n; i++) arr[i] = i;
		for (var i = 0; i < n - 1; i++) {
			var k = rn(n - i);
			circle(arr, i, i + k);
			p ^= k != 0;
		}
		if (isEven && p) circle(arr, 0, 1);
		return arr;
	}
	function rndProb(plist) {
		var cum = 0;
		var curIdx = 0;
		for (var i = 0; i < plist.length; i++) {
			if (plist[i] == 0) continue;
			if (randGen.random() < plist[i] / (cum + plist[i])) curIdx = i;
			cum += plist[i];
		}
		return curIdx;
	}
	function time2str(unix, format) {
		if (!unix) return "N/A";
		format = format || "%Y-%M-%D %h:%m:%s";
		var date = /* @__PURE__ */ new Date(unix * 1e3);
		return format.replace("%Y", date.getFullYear()).replace("%M", ("0" + (date.getMonth() + 1)).slice(-2)).replace("%D", ("0" + date.getDate()).slice(-2)).replace("%h", ("0" + date.getHours()).slice(-2)).replace("%m", ("0" + date.getMinutes()).slice(-2)).replace("%s", ("0" + date.getSeconds()).slice(-2)).replace("%S", ("00" + date.getMilliseconds()).slice(-3));
	}
	var timeRe = /^\s*(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)\s*$/;
	function str2time(val) {
		var m = timeRe.exec(val);
		if (!m) return null;
		var date = new Date(1970, 0, 1);
		date.setFullYear(~~m[1]);
		date.setMonth(~~m[2] - 1);
		date.setDate(~~m[3]);
		date.setHours(~~m[4]);
		date.setMinutes(~~m[5]);
		date.setSeconds(~~m[6]);
		return ~~(date.getTime() / 1e3);
	}
	function obj2str(val) {
		if (typeof val == "string") return val;
		return JSON.stringify(val);
	}
	function str2obj(val) {
		if (typeof val != "string") return val;
		return JSON.parse(val);
	}
	function valuedArray(len, val) {
		var ret = [];
		var isFun = typeof val == "function";
		for (var i = 0; i < len; i++) ret[i] = isFun ? val(i) : val;
		return ret;
	}
	function idxArray(arr, idx) {
		return arr.map((elem) => elem[idx]);
	}
	function permOriMult(p1, p2, prod, o1, o2, ori, oriMod) {
		for (var i = 0; i < p2.length; i++) {
			if (oriMod) ori[i] = (o1[p2[i]] + o2[i]) % oriMod;
			prod[i] = p1[p2[i]];
		}
	}
	return {
		Cnk,
		fact,
		bitCount,
		getPruning,
		setNOri,
		getNOri,
		setNPerm,
		getNPerm,
		getNParity,
		permMul4,
		Coord,
		createMove,
		createMoveHash,
		edgeMove,
		circle,
		circleOri,
		acycle,
		createPrun,
		CubieCube,
		minx,
		SOLVED_FACELET: "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB",
		fillFacelet,
		detectFacelet,
		rn,
		rndEl,
		rndProb,
		rndHit,
		time2str,
		str2time,
		obj2str,
		str2obj,
		valuedArray,
		idxArray,
		Solver,
		Searcher,
		rndPerm,
		permOriMult,
		gSolver,
		getSeed: randGen.getSeed,
		setSeed: randGen.setSeed
	};
})();
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
//#region src/vendor/cstimer/svglib.js
var $$2 = {};
$$2.svg = (function() {
	function SVG(width, height) {
		this.elems = [];
		this.width = width;
		this.height = height;
	}
	function parseNumber(f) {
		return parseFloat(f.toFixed(3)).toString();
	}
	SVG.prototype.addElem = function(xml) {
		this.elems.push(xml);
	};
	SVG.prototype.addPoly = function(points, fillStyle, strokeStyle) {
		var cords = [];
		for (var i = 0; i < points[0].length; i++) cords.push(parseNumber(points[0][i]) + "," + parseNumber(points[1][i]));
		this.elems.push("<polygon points=\"" + cords.join(" ") + "\" style=\"fill:" + fillStyle + ";stroke:" + (strokeStyle || "#000") + ";\" />");
	};
	SVG.prototype.addText = function(text, points, styles, align) {
		var styleStr = "paint-order:stroke;";
		for (var key in styles) styleStr += key + ":" + styles[key] + ";";
		var alignKV = "dominant-baseline=\"middle\" text-anchor=\"middle\"";
		if (align == 1) alignKV = "dominant-baseline=\"hanging\" text-anchor=\"start\"";
		this.elems.push("<text x=\"" + parseNumber(points[0]) + "\" y=\"" + parseNumber(points[1]) + "\" style=\"" + styleStr + "\" " + alignKV + ">" + encodeURIComponent(text) + "</text>");
	};
	SVG.prototype.render = function() {
		return "<svg width=\"" + parseNumber(this.width) + "\" height=\"" + parseNumber(this.height) + "\" xmlns=\"http://www.w3.org/2000/svg\">" + this.elems.join("") + "</svg>";
	};
	SVG.prototype.renderGroup = function(x, y, width, height) {
		var scale = Math.min(width / this.width, height / this.height);
		(width - this.width * scale) / 2, (height - this.height * scale) / 2;
		return "<g transform=\"translate(" + parseNumber(x + (width - this.width * scale) / 2) + "," + parseNumber(y + (height - this.height * scale) / 2) + ") scale(" + parseNumber(scale) + ")\">" + this.elems.join("") + "</g>";
	};
	return SVG;
})();
$$2.ctxDrawPolygon = function(ctx, color, arr, trans) {
	if (!ctx) return;
	trans = trans || [
		1,
		0,
		0,
		0,
		1,
		0
	];
	arr = $$2.ctxTransform(arr, trans);
	if (ctx instanceof $$2.svg) return ctx.addPoly(arr, color);
	ctx.beginPath();
	ctx.fillStyle = color;
	ctx.moveTo(arr[0][0], arr[1][0]);
	for (var i = 1; i < arr[0].length; i++) ctx.lineTo(arr[0][i], arr[1][i]);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
};
$$2.ctxRotate = function(arr, theta) {
	return $$2.ctxTransform(arr, [
		Math.cos(theta),
		-Math.sin(theta),
		0,
		Math.sin(theta),
		Math.cos(theta),
		0
	]);
};
$$2.ctxTransform = function(arr) {
	var ret;
	for (var i = 1; i < arguments.length; i++) {
		var trans = arguments[i];
		if (trans.length == 3) trans = [
			trans[0],
			0,
			trans[1] * trans[0],
			0,
			trans[0],
			trans[2] * trans[0]
		];
		ret = [[], []];
		for (var i = 0; i < arr[0].length; i++) {
			ret[0][i] = arr[0][i] * trans[0] + arr[1][i] * trans[1] + trans[2];
			ret[1][i] = arr[0][i] * trans[3] + arr[1][i] * trans[4] + trans[5];
		}
	}
	return ret;
};
$$2.nearColor = function(color, ref, longFormat) {
	var col, m = /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/.exec(color);
	if (m) col = [
		m[1] + m[1],
		m[2] + m[2],
		m[3] + m[3]
	];
	m = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(color);
	if (m) col = [
		m[1],
		m[2],
		m[3]
	];
	for (var i = 0; i < 3; i++) {
		col[i] = parseInt(col[i], 16) + (ref || 0);
		col[i] = Math.min(Math.max(col[i], 0), 255);
		col[i] = Math.round(col[i] / 17).toString(16);
	}
	return "#" + (longFormat ? col[0] + col[0] + col[1] + col[1] + col[2] + col[2] : col[0] + col[1] + col[2]);
};
$$2.col2std = function(col, faceMap) {
	var ret = [];
	col = (col || "").match(/#[0-9a-fA-F]{3}/g) || [];
	for (var i = 0; i < col.length; i++) ret.push(~~$$2.nearColor(col[faceMap[i]], 0, true).replace("#", "0x"));
	return ret;
};
//#endregion
//#region src/vendor/cstimer/toolsutil.js
var curScramble = [
	"-",
	"",
	0
];
function scrambleType(scramble) {
	if (scramble.match(/^([\d]?[xyzFRUBLDfrubldSME]([w]|&sup[\d];)?[2']?\s*)+$/) == null) return "-";
	else if (scramble.match(/^([xyzFRU][2']?\s*)+$/)) return "222o";
	else if (scramble.match(/^([xyzFRUBLDSME][2']?\s*)+$/)) return "333";
	else if (scramble.match(/^(([xyzFRUBLDfru]|[FRU]w)[2']?\s*)+$/)) return "444";
	else if (scramble.match(/^(([xyzFRUBLDfrubld])[w]?[2']?\s*)+$/)) return "555";
	else return "-";
}
function carrot2poch(scramble) {
	return scramble.replace(/([+-])([+-]) /g, function(m, p1, p2) {
		return "R" + p1 + p1 + " D" + p2 + p2 + " ";
	});
}
function isPuzzle(puzzle, scramble) {
	scramble = scramble || curScramble;
	var scrPuzzle = puzzleType(scramble[0]);
	scramble = scramble[1];
	if (scrPuzzle) return scrPuzzle == puzzle;
	else if (puzzle == "222") return scramble.match(/^([xyzFRU][2']?\s*)+$/);
	else if (puzzle == "333") return scramble.match(/^([xyzFRUBLDSME][2']?\s*)+$/);
	else if (puzzle == "444") return scramble.match(/^(([xyzFRUBLDfru]|[FRU]w)[2']?\s*)+$/);
	else if (puzzle == "555") return scramble.match(/^(([xyzFRUBLDfrubld])[w]?[2']?\s*)+$/);
	else if (puzzle == "skb") return scramble.match(/^([RLUB]'?\s*)+$/);
	else if (puzzle == "pyr") return scramble.match(/^([RLUBrlub]'?\s*)+$/);
	else if (puzzle == "sq1") return scramble.match(/^$/);
	else if (puzzle == "fto") return scramble.match(/^(([FRUBLD]|(?:BL)|(?:BR))[']?\s*)+$/);
	return false;
}
function puzzleType(scrambleType) {
	if (/^222(so|[236o]|eg[012]?|tc[np]?|lsall|nb)$/.exec(scrambleType)) return "222";
	else if (/^(333(oh?|ni|f[mt]|drud|custom)?|(z[zb]|[coep]|c[om]|2g|ls|tt)?ll|lse(mu)?|2genl?|3gen_[LF]|edges|corners|f2l|lsll2|(zb|w?v|eo)ls|roux|RrU|half|easyx?c|eoline|eocross|sbrx|mt(3qb|eole|tdr|6cp|l5ep|cdrll)|nocache_333(bld|pat)spec)$/.exec(scrambleType)) return "333";
	else if (/^(444([mo]|wca|yj|bld|ctud|ctrl|ud3c|l8e|rlda|rlca|edo|cto|e?ll|p[op]ll)?|4edge|RrUu)$/.exec(scrambleType)) return "444";
	else if (/^(555(wca|bld)?|5edge)$/.exec(scrambleType)) return "555";
	else if (/^(666(si|[sp]|wca)?|6edge)$/.exec(scrambleType)) return "666";
	else if (/^(777(si|[sp]|wca)?|7edge)$/.exec(scrambleType)) return "777";
	else if (/^pyr(s?[om]|l4e|nb|4c)$/.exec(scrambleType)) return "pyr";
	else if (/^skb(s?o|nb)?$/.exec(scrambleType)) return "skb";
	else if (/^sq(rs|1pll|1[ht]|rcsp)$/.exec(scrambleType)) return "sq1";
	else if (/^clk(wcab?|o|nf)$/.exec(scrambleType)) return "clk";
	else if (/^(mgmp|mgmo|mgmc|minx2g|mlsll|mgmpll|mgmll|mgmso|mgms2l)$/.exec(scrambleType)) return "mgm";
	else if (/^(klmso|klmp)$/.exec(scrambleType)) return "klm";
	else if (/^(fto|fto(so|l[34]t|tcp|edge|cent|corn))$/.exec(scrambleType)) return "fto";
	else if (/^(dmdso)$/.exec(scrambleType)) return "dmd";
	else if (/^(mpyr|mpyrso)$/.exec(scrambleType)) return "mpyr";
	else if (/^15p(at|ra?p?)?$/.exec(scrambleType)) return "15p";
	else if (/^15p(rmp|m)$/.exec(scrambleType)) return "15b";
	else if (/^8p(at|ra?p?)?$/.exec(scrambleType)) return "8p";
	else if (/^8p(rmp|m)$/.exec(scrambleType)) return "8b";
	else if (/^heli2x2g?$/.exec(scrambleType)) return "heli2x2";
	else if (/^prc[po]$/.exec(scrambleType)) return "prc";
	else if (/^redi(m|so)?$/.exec(scrambleType)) return "redi";
	else if (/^dino(o|so)?$/.exec(scrambleType)) return "dino";
	else if (/^gear(o|so)?$/.exec(scrambleType)) return "gear";
	else return scrambleType;
}
var tools = {
	scrambleType,
	puzzleType,
	isPuzzle,
	carrot2poch,
	isCurTrainScramble: function() {
		return false;
	}
};
//#endregion
//#region src/vendor/cstimer/kernel.js
var kernel = {
	props: {
		"col-font": "#000000",
		"col-board": "#ffdddd",
		colcube: "#ff0#fa0#00f#fff#f00#0d0",
		colpyr: "#0f0#f00#00f#ff0",
		colskb: "#fff#00f#f00#ff0#0f0#f80",
		colmgm: "#fff#d00#060#81f#fc0#00b#ffb#8df#f83#7e0#f9f#999",
		colsq1: "#ff0#f80#0f0#fff#f00#00f",
		colclk: "#f00#37b#5cf#ff0#850",
		col15p: "#f99#9f9#99f#fff",
		colfto: "#fff#808#0d0#f00#00f#bbb#ff0#fa0",
		colico: "#fff#084#b36#a85#088#811#e71#b9b#05a#ed1#888#6a3#e8b#a52#6cb#c10#fa0#536#49c#ec9",
		imgSize: 15,
		imgRep: false,
		preScr: "",
		preScrT: ""
	},
	getProp: function(key, def) {
		return key in this.props ? this.props[key] : def;
	}
};
//#endregion
//#region src/vendor/cstimer/poly3dlib.js
var $$1 = {
	col2std: function(col, faceMap) {
		var ret = [];
		col = (col || "").match(/#[0-9a-fA-F]{3}/g) || [];
		for (var i = 0; i < col.length; i++) {
			var c = col[faceMap[i]].slice(1);
			ret.push(parseInt(c[0] + c[0] + c[1] + c[1] + c[2] + c[2], 16));
		}
		return ret;
	},
	UDPOLY_RE: "skb|m?pyr|prc|heli(?:2x2|cv)?|crz3a|giga|mgm|klm|redi|dino|fto|dmd|ctico"
};
var poly3d = (function() {
	var EPS = 1e-6;
	function Point(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
	}
	var _ = Point.prototype;
	_.abs = function(p) {
		return p ? Math.hypot(this.x - p.x, this.y - p.y, this.z - p.z) : Math.hypot(this.x, this.y, this.z);
	};
	_.add = function(p, scalar) {
		if (scalar === void 0) scalar = 1;
		return new Point(this.x + p.x * scalar, this.y + p.y * scalar, this.z + p.z * scalar);
	};
	_.scalar = function(w) {
		return new Point(this.x * w, this.y * w, this.z * w);
	};
	_.normalized = function() {
		var abs = Math.hypot(this.x, this.y, this.z);
		return abs < EPS ? new Point(1, 0, 0) : new Point(this.x / abs, this.y / abs, this.z / abs);
	};
	_.inprod = function(p) {
		return this.x * p.x + this.y * p.y + this.z * p.z;
	};
	_.outprod = function(p) {
		return new Point(this.y * p.z - this.z * p.y, this.z * p.x - this.x * p.z, this.x * p.y - this.y * p.x);
	};
	_.triangleArea = function(p1, p2) {
		var v10x = p1.x - this.x;
		var v10y = p1.y - this.y;
		var v10z = p1.z - this.z;
		var v20x = p2.x - this.x;
		var v20y = p2.y - this.y;
		var v20z = p2.z - this.z;
		return Math.hypot(v10y * v20z - v10z * v20y, v10z * v20x - v10x * v20z, v10x * v20y - v10y * v20x) / 2;
	};
	function RotTrans(norm, theta) {
		var c = Math.cos(theta), s = Math.sin(theta), t = 1 - c, x = norm.x, y = norm.y, z = norm.z, tx = t * x, ty = t * y;
		this.mat = [
			tx * x + c,
			tx * y - s * z,
			tx * z + s * y,
			tx * y + s * z,
			ty * y + c,
			ty * z - s * x,
			tx * z - s * y,
			ty * z + s * x,
			t * z * z + c
		];
	}
	_ = RotTrans.prototype;
	_.perform = function(p) {
		var mat = this.mat;
		return new Point(mat[0] * p.x + mat[1] * p.y + mat[2] * p.z, mat[3] * p.x + mat[4] * p.y + mat[5] * p.z, mat[6] * p.x + mat[7] * p.y + mat[8] * p.z);
	};
	function Plane(norm, dis) {
		this.norm = norm;
		this.dis = typeof dis == "number" ? dis : 1;
	}
	Plane.prototype.side = function(point) {
		return this.norm.inprod(point) - this.dis;
	};
	function Sphere(ct, radius, norm) {
		this.ct = ct;
		this.radius = radius;
		if (norm) this.norm = norm;
	}
	Sphere.prototype.side = function(point) {
		return (this.ct.abs(point) - Math.abs(this.radius)) * (this.radius > 0 ? 1 : -1);
	};
	function Segment(p1, p2) {
		this.p1 = p1;
		this.p2 = p2;
	}
	_ = Segment.prototype;
	_.getMid = function() {
		return this.p1.add(this.p2).scalar(.5);
	};
	_.genMids = function() {
		return [];
	};
	_.slice = function(p1, p2) {
		return new Segment(p1, p2);
	};
	_.revert = function() {
		return new Segment(this.p2, this.p1);
	};
	_.rankKey = function(p) {
		return this.p2.add(this.p1, -1).inprod(p);
	};
	_.intersect = function(obj) {
		var ret = [];
		if (obj instanceof Plane) {
			var prod1 = this.p1.inprod(obj.norm) - obj.dis;
			var prod2 = this.p2.inprod(obj.norm) - obj.dis;
			if (Math.abs(prod1 - prod2) < EPS) return [];
			var lambda = -prod1 / (prod2 - prod1);
			if (Math.abs(lambda) < EPS || Math.abs(lambda - 1) < EPS) ret.push(Math.abs(lambda) < EPS ? this.p1 : this.p2);
			else if (lambda > 0 && lambda < 1) ret.push(this.p1.scalar(1 - lambda).add(this.p2, lambda));
		} else if (obj instanceof Sphere) {
			var a = Math.pow(this.p1.abs(this.p2), 2);
			var b = this.p2.add(this.p1, -1).inprod(this.p1.add(obj.ct, -1)) * 2;
			var c = Math.pow(this.p1.abs(obj.ct), 2) - Math.pow(obj.radius, 2);
			var delta = b * b - 4 * a * c;
			if (delta <= 0) return [];
			for (var sign = -1; sign < 2; sign += 2) {
				var lambda = (-b + sign * Math.sqrt(delta)) / (2 * a);
				if (Math.abs(lambda) < EPS || Math.abs(lambda - 1) < EPS) ret.push(Math.abs(lambda) < EPS ? this.p1 : this.p2);
				else if (lambda > 0 && lambda < 1) ret.push(this.p1.scalar(1 - lambda).add(this.p2, lambda));
			}
		}
		return ret;
	};
	function Arc(p1, p2, ct, norm) {
		this.p1 = p1;
		this.p2 = p2;
		this.ct = ct;
		this.norm = norm;
		this._fu = this.p1.add(this.ct, -1).normalized();
		this._fv = this.norm.outprod(this._fu);
		this._radius = this.ct.abs(p1);
		var ctp2 = this.p2.add(this.ct, -1);
		this._ang = (Math.atan2(this._fv.inprod(ctp2), this._fu.inprod(ctp2)) + Math.PI * 2 + EPS) % (Math.PI * 2) - EPS;
	}
	_ = Arc.prototype;
	_.getMid = function() {
		return this.ct.add(this._fu, Math.cos(this._ang / 2) * this._radius).add(this._fv, Math.sin(this._ang / 2) * this._radius);
	};
	_.genMids = function() {
		var nSegs = Math.ceil(this._ang / Math.PI * 180 / 10);
		var mids = [];
		for (var i = 0; i < nSegs - 1; i++) {
			var theta = this._ang / nSegs * (i + 1);
			mids.push(this.ct.add(this._fu, Math.cos(theta) * this._radius).add(this._fv, Math.sin(theta) * this._radius));
		}
		return mids;
	};
	_.slice = function(p1, p2) {
		return new Arc(p1, p2, this.ct, this.norm);
	};
	_.revert = function() {
		return new Arc(this.p2, this.p1, this.ct, this.norm.scalar(-1));
	};
	_.rankKey = function(p) {
		var vec1 = p.add(this.ct, -1);
		return Math.atan2(this._fv.inprod(vec1), this._fu.inprod(vec1));
	};
	_.intersect = function(obj) {
		var a, b, c;
		if (obj instanceof Plane) {
			a = this._radius * obj.norm.inprod(this._fv);
			b = this._radius * obj.norm.inprod(this._fu);
			c = obj.dis - obj.norm.inprod(this.ct);
		} else if (obj instanceof Sphere) {
			var vec1 = this.ct.add(obj.ct, -1);
			a = this._radius * vec1.inprod(this._fv);
			b = this._radius * vec1.inprod(this._fu);
			c = ((obj.radius + this._radius) * (obj.radius - this._radius) - Math.pow(this.ct.abs(obj.ct), 2)) / 2;
		}
		var phi = Math.atan2(-a, b);
		var cos_t = c / Math.hypot(a, b);
		if (Math.abs(cos_t) >= 1) return [];
		var ret = [];
		var t0 = Math.acos(cos_t);
		for (var sign = -1; sign < 2; sign += 2) {
			var t = (sign * t0 - phi + Math.PI * 4 + EPS) % (Math.PI * 2) - EPS;
			if (t > -1e-6 && t < this._ang + EPS) ret.push(t);
		}
		ret.sort(function(a, b) {
			return a - b;
		});
		for (var i = 0; i < ret.length; i++) if (Math.abs(ret[i]) < EPS || Math.abs(ret[i] - this._ang) < EPS) ret[i] = Math.abs(ret[i]) < EPS ? this.p1 : this.p2;
		else ret[i] = this.ct.add(this._fu, Math.cos(ret[i]) * this._radius).add(this._fv, Math.sin(ret[i]) * this._radius);
		for (var i = 0; i < ret.length; i++) {
			if (Math.abs(obj.side(ret[i])) > EPS) debugger;
			if (Math.abs(this.ct.abs(ret[i]) - this._radius) > EPS) debugger;
			if (Math.abs(this.norm.inprod(this.ct) - this.norm.inprod(ret[i])) > EPS) debugger;
		}
		return ret;
	};
	function Polygon(paths) {
		this.paths = paths.slice();
		var norm;
		for (var i = 0; i < paths.length; i++) {
			if (paths[i].ct) {
				norm = paths[i].norm;
				break;
			}
			var candNorm = paths[0].p2.add(paths[0].p1, -1).outprod(paths[1].p2.add(paths[1].p1, -1));
			if (candNorm.abs() > EPS * 10) {
				norm = candNorm.normalized();
				break;
			}
		}
		this.area = 0;
		if (!norm) return;
		var center = new Point(0, 0, 0);
		for (var i = 1; i < paths.length - 1; i++) {
			var area = paths[i].p1.add(paths[0].p1, -1).outprod(paths[i].p2.add(paths[i].p1, -1)).inprod(norm) / 2;
			center = center.add(paths[0].p1, area / 3);
			center = center.add(paths[i].p1, area / 3);
			center = center.add(paths[i].p2, area / 3);
			this.area += area;
		}
		for (var i = 0; i < paths.length; i++) {
			if (!paths[i].ct) continue;
			var arc = paths[i];
			arc._ang / 2;
			var h = 4 * arc._radius * Math.pow(Math.sin(arc._ang / 2), 3) / 3 / (arc._ang - Math.sin(arc._ang));
			area = Math.pow(arc._radius, 2) * (arc._ang - Math.sin(arc._ang)) / 2 * arc.norm.inprod(norm);
			var centroid = arc.ct.add(arc.norm.outprod(arc.p2.add(arc.p1, -1)).normalized(), -h);
			center = center.add(centroid, area);
			this.area += area;
		}
		this.center = center.scalar(1 / this.area);
		this.norm = this.area > 0 ? norm : norm.scalar(-1);
		this.area = Math.abs(this.area);
		this.dis = this.norm.inprod(paths[0].p1);
	}
	_ = Polygon.prototype;
	Polygon.fromVertices = function(vertices) {
		var paths = [];
		for (var i = 0; i < vertices.length; i++) paths.push(new Segment(vertices[i], vertices[(i + 1) % vertices.length]));
		return new Polygon(paths);
	};
	_.projection = function(norms) {
		var ret = [];
		for (var i = 0; i < this.paths.length; i++) {
			var points = [this.paths[i].p1].concat(this.paths[i].genMids());
			for (var k = 0; k < points.length; k++) {
				var coord = [];
				for (var j = 0; j < norms.length; j++) coord.push(points[k].inprod(norms[j]));
				ret.push(coord);
			}
		}
		return ret;
	};
	_.split = function(obj) {
		var paths = [[], []];
		var nCuts = 0;
		var refSide = obj.side(this.center) < 0 ? 1 : 0;
		for (var i = 0; i < this.paths.length; i++) {
			var path = this.paths[i];
			var points = path.intersect(obj);
			nCuts += points.length;
			var start = path.p1;
			for (var j = 0; j < points.length; j++) if (start.abs(points[j]) > EPS) {
				var newPath = path.slice(start, points[j]);
				paths[obj.side(newPath.getMid()) < 0 ? 1 : 0].push(newPath);
				start = points[j];
			}
			if (start.abs(path.p2) > EPS) {
				var remainPath = start == path.p1 ? path : path.slice(start, path.p2);
				var sideFloat = obj.side(remainPath.getMid());
				paths[Math.abs(sideFloat) < EPS ? refSide : sideFloat < 0 ? 1 : 0].push(remainPath);
			}
		}
		var cutBound;
		if (obj instanceof Plane) {
			if (nCuts == 0) return paths[0].length == 0 ? [[], [this]] : [[this], []];
			cutBound = new Segment(new Point(0, 0, 0), obj.norm.outprod(this.norm));
		} else if (obj instanceof Sphere) {
			var ct = obj.ct.add(this.norm, -this.norm.inprod(obj.ct) + this.dis);
			var radius = Math.pow(obj.radius, 2) - Math.pow(this.dis - this.norm.inprod(obj.ct), 2);
			if (radius <= 0) return paths[0].length == 0 ? [[], [this]] : [[this], []];
			radius = Math.sqrt(radius);
			var p1 = this.paths[1].p1.add(this.paths[0].p1, -1).normalized().scalar(radius).add(ct);
			cutBound = new Arc(p1, p1, ct, this.norm.scalar(obj.radius > 0 ? -1 : 1));
		}
		var polys = [[], []];
		for (var side = 0; side < 2; side++) {
			side * 2 - 1;
			var pathStart = [];
			var pathsSide = paths[side];
			for (var i = 0, len = pathsSide.length; i < len; i++) {
				var nextIdx = (i + 1) % len;
				if (pathsSide[i].p2.abs(pathsSide[nextIdx].p1) > EPS) pathStart.push([
					nextIdx,
					cutBound.rankKey(pathsSide[nextIdx].p1),
					pathsSide[nextIdx].p1
				]);
			}
			pathStart.sort((a, b) => a[1] - b[1]);
			var usedCnt = 0;
			var used = [];
			while (usedCnt < pathsSide.length) {
				var curPaths = [];
				var idx = 0;
				while (used[idx]) idx++;
				while (true) {
					var path = pathsSide[idx];
					curPaths.push(path);
					used[idx] = 1;
					usedCnt++;
					if (path.p2.abs(curPaths[0].p1) < EPS) break;
					idx = (idx + 1) % len;
					if (path.p2.abs(pathsSide[idx].p1) < EPS) continue;
					var key = cutBound.rankKey(path.p2);
					var next = 0;
					for (var i = 0; i < pathStart.length; i++) if (pathStart[i][1] > key) {
						next = i;
						break;
					}
					idx = pathStart[next][0];
					pathStart.splice(next, 1);
					curPaths.push(cutBound.slice(path.p2, pathsSide[idx].p1));
					if (pathsSide[idx].p1.abs(curPaths[0].p1) < EPS) break;
				}
				var poly = new Polygon(curPaths);
				if (poly.area > EPS) polys[side].push(poly);
				else console.log("invalid path length", curPaths, poly);
			}
			cutBound = cutBound.revert();
		}
		return polys;
	};
	_.trim = function(gap) {
		this.paths.at(-1).p1;
		var poly = this;
		for (var i = 0; i < this.paths.length; i++) {
			var path = this.paths[i];
			if (path instanceof Arc) {
				var radius = (this.norm.inprod(path.norm) > 0 ? 1 : -1) * path._radius;
				poly = poly.split(new Sphere(path.ct, radius - gap / 2))[1][0];
			} else {
				var norm = path.p2.add(path.p1, -1).outprod(this.norm).normalized();
				var dis = norm.inprod(path.p2);
				poly = poly.split(new Plane(norm, dis - gap / 2))[1][0];
			}
			if (!poly) return null;
		}
		return poly;
	};
	function PolyhedronPuzzle(facePlanes, faceVs, faceNames) {
		this.facePlanes = facePlanes.slice();
		this.faceNames = faceNames.slice();
		this.faceUVs = [];
		for (var i = 0; i < facePlanes.length; i++) {
			var faceNorm = facePlanes[i].norm;
			var faceV = faceVs[i];
			faceV = faceV.add(faceNorm, -faceV.inprod(faceNorm)).normalized();
			var faceU = faceV.outprod(faceNorm);
			this.faceUVs[i] = [faceU, faceV];
		}
		this.makeFacePolygons();
	}
	_ = PolyhedronPuzzle.prototype;
	_.setTwisty = function(twistyPlanes, twistyDetails) {
		this.twistyPlanes = twistyPlanes.slice();
		this.twistyDetails = twistyDetails.slice();
		this._twistyCache = {};
		for (var i = 0; i < twistyDetails.length; i++) if (this.twistyDetails[i].length == 2) this.twistyDetails[i].push(i);
		this.cutFacePolygons();
		this.makeMoveTable();
	};
	_.getTwistyIdx = function(laxis) {
		if (laxis in this._twistyCache) return this._twistyCache[laxis];
		var m = /^(\d*)([A-Z][A-Za-z]*)$/.exec(laxis);
		if (!m) return -1;
		var layerRe = new RegExp(m[1] + "(?=[A-Z])");
		var axis = m[2].split(/(?=[A-Z])/g);
		var faceSet = {};
		var faceCnt = 0;
		for (var i = 0; i < axis.length; i++) if (faceSet[axis[i]] == void 0) {
			faceSet[axis[i]] = new RegExp(axis[i] + "(?=[A-Z]|$)");
			faceCnt++;
		}
		var minRemain = [99, -1];
		for (var i = 0; i < this.twistyDetails.length; i++) {
			var chkAxis = this.twistyDetails[i][0];
			if (!layerRe.exec(chkAxis)) continue;
			var remain = chkAxis.length - m[1].length;
			for (var face in faceSet) if (faceSet[face].exec(chkAxis)) remain -= face.length;
			else {
				remain = 99;
				break;
			}
			if (remain < minRemain[0]) minRemain = [remain, i];
		}
		this._twistyCache[laxis] = faceCnt == 1 && minRemain[0] != 0 ? -1 : minRemain[1];
		return this._twistyCache[laxis];
	};
	_.makeFacePolygons = function() {
		this.facesPolys = [];
		for (var face = 0; face < this.facePlanes.length; face++) {
			var norm = this.facePlanes[face].norm;
			var dis = this.facePlanes[face].dis;
			var faceCenter = norm.scalar(dis);
			var faceUV = this.faceUVs[face];
			var poly = Polygon.fromVertices([
				faceCenter.add(faceUV[0], 100),
				faceCenter.add(faceUV[1], 100),
				faceCenter.add(faceUV[0], -100),
				faceCenter.add(faceUV[1], -100)
			]);
			for (var fother = 0; fother < this.facePlanes.length; fother++) {
				if (fother == face) continue;
				poly = poly.split(this.facePlanes[fother])[1][0];
				if (!poly) {
					debugger;
					break;
				}
			}
			this.facesPolys[face] = [poly];
		}
	};
	_.cutFacePolygons = function() {
		var cuts = this.twistyPlanes.slice();
		cuts.sort(function(a, b) {
			return (a.ct ? 1 : 0) - (b.ct ? 1 : 0);
		});
		for (var i = 0; i < cuts.length; i++) {
			var plane = cuts[i];
			this.enumFacesPolys((face, p, poly) => {
				var polys = poly.split(plane);
				polys = Array.prototype.concat.apply([], polys);
				this.facesPolys[face][p] = polys[0];
				for (var j = 1; j < polys.length; j++) this.facesPolys[face].push(polys[j]);
			});
		}
	};
	_.enumFacesPolys = function(callback) {
		var idx = 0;
		for (var face = 0; face < this.facesPolys.length; face++) {
			var facePolys = this.facesPolys[face];
			var polyLen = facePolys.length;
			for (var p = 0; p < polyLen; p++) {
				if (callback(face, p, facePolys[p], idx)) return;
				idx++;
			}
		}
	};
	_.makeMoveTable = function() {
		this.moveTable = [];
		var proj1d = [];
		var projNorm = new Point(1, 2, 3).normalized();
		this.enumFacesPolys((face, p, poly, idx) => {
			proj1d[idx] = [
				idx,
				projNorm.inprod(poly.center),
				poly.center
			];
		});
		proj1d.sort(function(a, b) {
			return a[1] - b[1];
		});
		for (var i = 0; i < this.twistyDetails.length; i++) {
			var curMove = [];
			var planes = [];
			for (var j = 2; j < this.twistyDetails[i].length; j++) planes.push(this.twistyPlanes[this.twistyDetails[i][j]]);
			var trans = new RotTrans(planes[0].norm, Math.PI * 2 / this.twistyDetails[i][1]);
			this.enumFacesPolys((face, p, poly, idx) => {
				for (var j = 0; j < planes.length; j++) if (planes[j].side(poly.center) < 0) {
					curMove[idx] = -1;
					return;
				}
				var movedCenter = trans.perform(poly.center);
				var movedProj = projNorm.inprod(movedCenter);
				var left = 0, right = proj1d.length - 1;
				while (right > left) {
					var mid = right + left >> 1;
					if (proj1d[mid][1] < movedProj - EPS) left = mid + 1;
					else right = mid;
				}
				for (var j = left; j < proj1d.length; j++) {
					if (proj1d[j][1] > movedProj + EPS) debugger;
					if (movedCenter.abs(proj1d[j][2]) < EPS) {
						curMove[idx] = proj1d[j][0];
						break;
					}
				}
			});
			this.moveTable.push(curMove);
		}
	};
	function makePuzzle(nface, faceCuts, edgeCuts, cornCuts, faceMoves, edgeMoves, cornMoves) {
		var faceNorms = [];
		var faceVs = [];
		var faceNames = [];
		var facePow = 3;
		var edgePow = 2;
		var cornPow = 3;
		if (nface == 4) {
			faceNorms = [
				new Point(0, -1, 0),
				new Point(-Math.sqrt(6) / 3, 1 / 3, -Math.sqrt(2) / 3),
				new Point(Math.sqrt(6) / 3, 1 / 3, -Math.sqrt(2) / 3),
				new Point(0, 1 / 3, Math.sqrt(8) / 3)
			];
			faceVs = [
				3,
				2,
				1,
				new Point(0, 1, 0)
			];
			faceNames = [
				"D",
				"L",
				"R",
				"F"
			];
		} else if (nface == 6) {
			faceNorms = [
				new Point(0, 1, 0),
				new Point(1, 0, 0),
				new Point(0, 0, 1)
			];
			faceVs = [
				5,
				0,
				0,
				2,
				0,
				0
			];
			faceNames = [
				"U",
				"R",
				"F",
				"D",
				"L",
				"B"
			];
			facePow = 4;
		} else if (nface == 8) {
			faceNorms = [
				new Point(0, 1, 0),
				new Point(Math.sqrt(6) / 3, 1 / 3, Math.sqrt(2) / 3),
				new Point(-Math.sqrt(6) / 3, 1 / 3, Math.sqrt(2) / 3),
				new Point(0, -1 / 3, Math.sqrt(8) / 3)
			];
			var UBEdge = faceNorms[0].add(faceNorms[3], -1);
			faceVs = [
				7,
				UBEdge,
				UBEdge,
				0,
				7,
				UBEdge,
				UBEdge,
				0
			];
			faceNames = [
				"U",
				"R",
				"L",
				"F",
				"D",
				"Bl",
				"Br",
				"B"
			];
			cornPow = 4;
		} else if (nface == 12) {
			faceNorms = [new Point(0, Math.sqrt(5), 0)];
			for (var i = 0; i < 5; i++) faceNorms.push(new Point(2 * Math.sin(.4 * i * Math.PI), 1, 2 * Math.cos(.4 * i * Math.PI)));
			faceVs = [
				7,
				0,
				3,
				7,
				7,
				4,
				7,
				0,
				3,
				7,
				7,
				4
			];
			faceNames = [
				"U",
				"F",
				"R",
				"Br",
				"Bl",
				"L",
				"D",
				"B",
				"Dbl",
				"Dl",
				"Dr",
				"Dbr"
			];
			facePow = 5;
		} else if (nface == 20) {
			for (var i = 0; i < 5; i++) {
				var r1 = Math.sqrt(5) + 1;
				var r2 = Math.sqrt(5) + 3;
				faceNorms.push(new Point(r1 * Math.sin(.4 * i * Math.PI), Math.sqrt(5) + 2, r1 * Math.cos(.4 * i * Math.PI)));
				faceNorms.push(new Point(r2 * Math.sin(.4 * i * Math.PI), 1, r2 * Math.cos(.4 * i * Math.PI)));
				faceVs[i * 2] = i * 2 + 11;
				faceVs[i * 2 + 1] = i * 2;
				faceVs[i * 2 + 10] = i * 2 + 11;
				faceVs[i * 2 + 11] = i * 2;
			}
			faceNames = [
				"U",
				"F",
				"Ur",
				"R",
				"Ubr",
				"Br",
				"Ubl",
				"Bl",
				"Ul",
				"L",
				"D",
				"B",
				"Dl",
				"Lb",
				"Dfl",
				"Fl",
				"Dfr",
				"Fr",
				"Dr",
				"Rb"
			];
			cornPow = 5;
		} else debugger;
		if (nface != 4) for (var i = 0, length = faceNorms.length; i < length; i++) {
			faceNorms[i] = faceNorms[i].normalized();
			faceNorms.push(faceNorms[i].scalar(-1));
		}
		var facePlanes = [];
		for (var i = 0; i < faceNorms.length; i++) {
			facePlanes.push(new Plane(faceNorms[i]));
			if (typeof faceVs[i] == "number") faceVs[i] = faceNorms[faceVs[i]];
		}
		var puzzle = new PolyhedronPuzzle(facePlanes, faceVs, faceNames);
		var twistyPlanes = [];
		var twistyDetails = [];
		function addAxes(norms, names, pow, cuts, moves) {
			if (!cuts || cuts.length == 0) return;
			if (!moves) {
				moves = [];
				for (var i = 0; i < cuts.length; i++) moves[i] = i;
			}
			for (var i = 0; i < norms.length; i++) {
				var planeBase = twistyPlanes.length;
				for (var j = 0; j < cuts.length; j++) if (typeof cuts[j] == "number") twistyPlanes.push(new Plane(norms[i], cuts[j]));
				else twistyPlanes.push(new Sphere(norms[i].scalar(cuts[j][0]), cuts[j][1], norms[i]));
				for (var j = 0; j < moves.length; j++) {
					var detail = [j + "" + names[i], pow];
					var planes = typeof moves[j] == "number" ? [moves[j]] : moves[j];
					for (var k = 0; k < planes.length; k++) detail.push(planes[k] + planeBase);
					twistyDetails.push(detail);
				}
			}
		}
		addAxes(faceNorms, faceNames, facePow, faceCuts, faceMoves);
		if (edgeCuts && edgeCuts.length > 0) {
			var edgeNorms = [];
			var edgeNames = [];
			puzzle.enumFacesPolys(function(face, p, poly) {
				var _point = poly.paths.at(-1).p1;
				for (var i = 0; i < poly.paths.length; i++) {
					var point = poly.paths[i].p1;
					var edgeNorm = point.add(_point).normalized();
					for (var j = 0; j < edgeNorms.length; j++) if (edgeNorm.abs(edgeNorms[j]) < EPS) {
						edgeNames[j] += faceNames[face];
						edgeNorm = null;
						break;
					}
					if (edgeNorm) {
						edgeNorms.push(edgeNorm);
						edgeNames.push(faceNames[face]);
					}
					_point = point;
				}
			});
			addAxes(edgeNorms, edgeNames, edgePow, edgeCuts, edgeMoves);
		}
		if (cornCuts && cornCuts.length > 0) {
			var cornNorms = [];
			var cornNames = [];
			puzzle.enumFacesPolys(function(face, p, poly) {
				for (var i = 0; i < poly.paths.length; i++) {
					var cornNorm = poly.paths[i].p1.normalized();
					for (var j = 0; j < cornNorms.length; j++) if (cornNorm.abs(cornNorms[j]) < EPS) {
						cornNames[j] += faceNames[face];
						cornNorm = null;
						break;
					}
					if (cornNorm) {
						cornNorms.push(cornNorm);
						cornNames.push(faceNames[face]);
					}
				}
			});
			addAxes(cornNorms, cornNames, cornPow, cornCuts, cornMoves);
		}
		puzzle.setTwisty(twistyPlanes, twistyDetails);
		return puzzle;
	}
	function renderNet(puzzle, gap, minArea) {
		var faceTrans = [];
		var nface = puzzle.facePlanes.length;
		gap = gap || 0;
		var sizes = [0, 0];
		if (nface == 4) {
			var hw = Math.sqrt(6) * (1 + gap);
			var hwdsq3 = hw / Math.sqrt(3);
			faceTrans = [
				[hw * 2, hwdsq3 * 4],
				[hw * 1, hwdsq3 * 1],
				[hw * 3, hwdsq3 * 1],
				[hw * 2, hwdsq3 * 2]
			];
			sizes = [hw * 4, hwdsq3 * 6];
		} else if (nface == 6) {
			var hw = 1 + gap;
			faceTrans = [
				[hw * 3, hw],
				[hw * 5, hw * 3],
				[hw * 3, hw * 3],
				[hw * 3, hw * 5],
				[hw, hw * 3],
				[hw * 7, hw * 3]
			];
			sizes = [hw * 8, hw * 6];
		} else if (nface == 8) {
			var hwdsq3 = Math.sqrt(6) * (1 + gap) / 2 / Math.sqrt(3);
			var sq3 = Math.sqrt(3);
			faceTrans = [
				[
					hwdsq3 * 3,
					hwdsq3 * 1,
					sq3,
					1
				],
				[
					hwdsq3 * 5,
					hwdsq3 * 3,
					1,
					sq3
				],
				[
					hwdsq3 * 1,
					hwdsq3 * 3,
					1,
					sq3
				],
				[
					hwdsq3 * 3,
					hwdsq3 * 5,
					sq3,
					1
				],
				[
					hwdsq3 * 9,
					hwdsq3 * 5,
					sq3,
					1
				],
				[
					hwdsq3 * 11,
					hwdsq3 * 3,
					1,
					sq3
				],
				[
					hwdsq3 * 7,
					hwdsq3 * 3,
					1,
					sq3
				],
				[
					hwdsq3 * 9,
					hwdsq3 * 1,
					sq3,
					1
				]
			];
			sizes = [hwdsq3 * 12, hwdsq3 * 6];
		} else if (nface == 12) {
			var phi = (Math.sqrt(5) + 1) / 2;
			var hw = Math.sqrt(3 - phi) / Math.pow(phi, 2) * (1 + gap);
			var wec2 = hw * Math.tan(Math.PI * .3) * 2;
			var off1X = hw * (1 + 2 * phi);
			var off1Y = hw * (1 / Math.sin(Math.PI * .2) + Math.cos(Math.PI * .1) * 2);
			var off2X = hw * (4 + 5 * phi);
			var off2Y = wec2 + hw / Math.cos(Math.PI * .3);
			faceTrans[0] = [off1X, off1Y];
			faceTrans[6] = [off2X, off2Y];
			for (var i = 0; i < 5; i++) {
				faceTrans[1 + i] = [off1X + Math.cos(Math.PI * (.5 - .4 * i)) * wec2, off1Y + Math.sin(Math.PI * (.5 - .4 * i)) * wec2];
				faceTrans[7 + i] = [off2X + Math.cos(Math.PI * (1.5 + .4 * i)) * wec2, off2Y + Math.sin(Math.PI * (1.5 + .4 * i)) * wec2];
			}
			sizes = [off1X + off2X, off1Y + off2Y];
		} else if (nface == 20) {
			var phi = (Math.sqrt(5) + 1) / 2;
			var hw = Math.sqrt(3) / Math.pow(phi, 2) * (1 + gap);
			for (var i = 0; i < 5; i++) {
				faceTrans[i * 2] = [((5 + i * 2) % 10 + 1) * hw, 2 * hw / Math.sqrt(3)];
				faceTrans[i * 2 + 1] = [((5 + i * 2) % 10 + 1) * hw, 4 * hw / Math.sqrt(3)];
				faceTrans[i * 2 + 10] = [(1 + i * 2) % 10 * hw, 7 * hw / Math.sqrt(3)];
				faceTrans[i * 2 + 11] = [(1 + i * 2) % 10 * hw, 5 * hw / Math.sqrt(3)];
			}
			sizes = [hw * 11, 9 * hw / Math.sqrt(3)];
		} else debugger;
		var ret = [];
		var faceMeta = [];
		puzzle.enumFacesPolys(function(face, p, poly, idx) {
			if (poly.area < minArea) return;
			var cords = poly.projection(puzzle.faceUVs[face]);
			var trans = faceTrans[face];
			var arr = [[], []];
			for (var i = 0; i < cords.length; i++) {
				arr[0][i] = trans[0] + cords[i][0] * (trans[2] || 1);
				arr[1][i] = trans[1] - cords[i][1] * (trans[3] || 1);
			}
			arr[2] = face;
			ret[idx] = arr;
			faceMeta[face] = faceMeta[face] || [
				trans[0],
				trans[1],
				puzzle.faceNames[face]
			];
		});
		return [
			sizes,
			ret,
			faceMeta
		];
	}
	function makeParser(regexp, parseFunc, toStrFunc, preProcess) {
		return {
			parseScramble: function(regexp, parseFunc, preProcess, scramble) {
				if (!scramble || /^\s*$/.exec(scramble)) return [];
				if (preProcess) scramble = preProcess(scramble);
				var ret = [];
				scramble.replace(regexp, function() {
					var move = parseFunc.apply(null, arguments);
					if (move) ret.push(["" + move[0] + move[1], move[2]]);
				});
				return ret;
			}.bind(null, regexp, parseFunc, preProcess),
			move2str: function(toStrFunc, move) {
				var m = /^(\d+)([a-zA-Z]+)$/.exec(move[0]);
				if (!m) {
					debugger;
					return "";
				}
				return toStrFunc(~~m[1], m[2], move[1]);
			}.bind(null, toStrFunc)
		};
	}
	function makePuzzleParser(puzzle) {
		return makeParser(/(?:^|\s*)(?:\[([a-zA-Z]+)(\d*)(')?\]|(\d*)([A-Z][a-zA-Z]*)(\d*)(')?)(?:$|\s*)/g, function(puzzle, m, p1, p2, p3, p4, p5, p6, p7) {
			var layer = p1 ? "0" : p4 == "" ? "1" : p4;
			var axis = p1 || p5;
			var pow = (p1 ? p2 == "" ? 1 : ~~p2 : p6 == "" ? 1 : ~~p6) * (p3 || p7 ? -1 : 1);
			axis.match(/[A-Z][a-z]*/g);
			if (puzzle.getTwistyIdx(layer + axis) != -1) return [
				layer,
				axis,
				pow
			];
		}.bind(null, puzzle), function(layer, axis, pow) {
			var move = axis + (Math.abs(pow) == 1 ? "" : Math.abs(pow)) + (pow < 0 ? "'" : "");
			return layer == 0 ? "[" + move + "]" : move;
		});
	}
	function parsePolyParam(polyDef) {
		var paramCmd = polyDef.split(/\s+/g);
		var polyParam = [
			[
				4,
				6,
				8,
				12,
				20
			]["tcodi".indexOf(paramCmd[0])],
			[-5],
			[-5],
			[-5]
		];
		var cutIdx = 1;
		for (var i = 1; i < paramCmd.length; i++) if (/^[fev]$/.exec(paramCmd[i])) cutIdx = " fev".indexOf(paramCmd[i]);
		else if (/^[+-]?\d+(?:\.\d+)?$/.exec(paramCmd[i])) polyParam[cutIdx].push(parseFloat(paramCmd[i]));
		else if (/^\d+(?:\.\d+)?r[+-]?\d+(?:\.\d+)?$/.exec(paramCmd[i])) {
			var sphereCmd = paramCmd[i].split("r");
			polyParam[cutIdx].push([parseFloat(sphereCmd[0]), -parseFloat(sphereCmd[1])]);
		}
		return polyParam;
	}
	function getFamousPuzzle(name, bindObj) {
		var polyParam, parser, scale = 1, pieceGap = .075, colors = [];
		if (/^(\d)\1\1$/.exec(name)) {
			var dim = /^(\d)\1\1$/.exec(name);
			dim = ~~dim[1];
			polyParam = [6, [-5]];
			for (var i = 0; i < dim >> 1; i++) polyParam[1].push(1 - (i + 1) * 2 / dim);
		} else if (name == "pyr" || name == "mpyr") {
			polyParam = [
				4,
				[],
				[],
				{
					"pyr": [
						-5,
						5 / 3,
						1 / 3
					],
					"mpyr": [
						-5,
						2,
						1,
						0
					]
				}[name]
			];
			scale = .51;
			pieceGap = .14;
			parser = makeParser(/(?:^|\s*)(?:([URLBurlb])(w?)(')?|\[([urlb])(')?\])(?:$|\s*)/g, function(m, p1, p2, p3, p4, p5) {
				var face = [
					"LRF",
					"DRF",
					"DLF",
					"DLR"
				]["URLB".indexOf((p1 || p4).toUpperCase())];
				return [
					p4 ? 0 : p2 ? 3 : p1 == p1.toUpperCase() ? 2 : 1,
					face,
					p3 || p5 ? -1 : 1
				];
			}, function(layer, axis, pow) {
				var move = "urlb".charAt([
					"LRF",
					"DRF",
					"DLF",
					"DLR"
				].indexOf(axis));
				var powfix = pow < 0 ? "'" : "";
				return [
					"[" + move + powfix + "]",
					move + powfix,
					move.toUpperCase() + powfix,
					move.toUpperCase() + "w" + powfix
				][layer];
			});
		} else if (name == "fto" || name == "dmd") {
			polyParam = {
				"fto": [
					8,
					[
						-5,
						1 / 3,
						-1 / 3
					],
					[],
					[-5]
				],
				"dmd": [
					8,
					[-5, 0],
					[],
					[-5]
				]
			}[name];
			parser = makeParser(/(?:^|\s*)\[?([URFDLT]|(?:B[RL]?))(w)?(')?(\])?(?:$|\s*)/g, function(m, p1, p2, p3, p4) {
				return [
					p4 || p1 == "T" ? 0 : p2 ? 2 : 1,
					p1 == "T" ? "URLF" : p1[0] + p1.slice(1).toLowerCase(),
					p3 ? -1 : 1
				];
			}, function(layer, axis, pow) {
				var move = (axis.length > 3 ? "T" : axis.toUpperCase()) + (layer == 2 ? "w" : "") + (pow > 0 ? "" : "'");
				return layer == 0 ? "[" + move + "]" : move;
			});
		} else if (name == "klm" || name == "mgm" || name == "prc" || name == "giga") {
			polyParam = [12, {
				"klm": [
					-5,
					.57,
					-.57
				],
				"mgm": [
					-5,
					.72,
					-.72
				],
				"giga": [
					-5,
					.83,
					-.83,
					.66,
					-.66
				],
				"prc": [
					-5,
					.4472136,
					-.4472136
				]
			}[name]];
			scale = 1.18;
			pieceGap = .05;
			parser = makeParser(/(?:^|\s*)(?:([DLRdlr])(\+\+?|--?)|([UuFfy]|D?B?[RL]|d?b?[rl]|[DdBb])(\d?)('?)|\[([ufrl])(\d?)('?)\])(?:$|\s*)/g, function(m, p1, p2, p3, p4, p5, p6, p7, p8) {
				if (p1) {
					var fidx = "DLRdlr".indexOf(p1);
					return [
						fidx > 2 ? 4 : 2,
						[
							"D",
							"Dbl",
							"Dbr"
						][fidx % 3],
						(p2[0] == "-" ? -1 : 1) * p2.length
					];
				} else if (p3) {
					var pow = (p5 ? -1 : 1) * (~~p4 || 1);
					return p3[0] == "y" ? [
						0,
						"U",
						pow
					] : [
						p3[0] >= "a" ? 3 : 1,
						p3[0].toUpperCase() + p3.slice(1).toLowerCase(),
						pow
					];
				} else return [
					0,
					p6.toUpperCase(),
					(p8 ? -1 : 1) * (~~p7 || 1)
				];
			}, function(layer, axis, pow) {
				pow = (pow + 7) % 5 - 2;
				var powfix = (Math.abs(pow) == 1 ? "" : Math.abs(pow)) + (pow >= 0 ? "" : "'");
				if (layer == 0) return "[" + axis.toLowerCase() + powfix + "]";
				else if (layer == 2 || layer == 4) {
					powfix = pow > 0 ? "+" : "-";
					axis = "DLR".charAt([
						"D",
						"Dbl",
						"Dbr"
					].indexOf(axis));
					return (layer == 4 ? axis.toLowerCase() : axis) + powfix + (Math.abs(pow) == 2 ? powfix : "");
				} else if (layer == 1) return axis.toUpperCase() + powfix;
				else if (layer == 3) return axis.toLowerCase() + powfix;
			}, function(scramble) {
				if (/^(\s*([+-]{2}\s*)+U'?\s*\n?)*$/.exec(scramble)) scramble = tools.carrot2poch(scramble);
				return scramble;
			});
		} else if (name == "heli" || name == "helicv" || name == "heli2x2") {
			polyParam = {
				"heli": [
					6,
					[-5],
					[-5, Math.sqrt(.5)],
					[-5]
				],
				"helicv": [
					6,
					[-5],
					[-5, [2 * Math.sqrt(2), -Math.sqrt(5)]],
					[-5]
				],
				"heli2x2": [
					6,
					[-5, 0],
					[-5, [Math.sqrt(2), -.6]],
					[-5, [Math.sqrt(3), -.7]]
				]
			}[name];
			pieceGap = .05;
		} else if (/^crz3a$/.exec(name)) {
			polyParam = [
				6,
				[
					-5,
					.3333,
					[1, .75]
				],
				[],
				[],
				[0, [1, 2]]
			];
			parser = makeParser(/(?:^|\s*)([URFDLBxyz])(\d*)(')?(?:$|\s*)/g, function(m, p1, p2, p3) {
				var pow = (p2 == "" ? 1 : ~~p2) * (p3 ? -1 : 1);
				if ("xyz".indexOf(p1) != -1) return [
					0,
					"RUF".charAt("xyz".indexOf(p1)),
					pow
				];
				return [
					1,
					p1,
					pow
				];
			}, function(layer, axis, pow) {
				var powfix = (Math.abs(pow) == 1 ? "" : Math.abs(pow)) + (pow >= 0 ? "" : "'");
				return (layer == 0 ? "xyz".charAt("RUF".indexOf(axis)) : axis) + powfix;
			});
		} else if (/^(redi|dino)$/.exec(name)) {
			polyParam = name == "redi" ? [
				6,
				[-5],
				[],
				[-5, .85]
			] : [
				6,
				[-5],
				[],
				[-5, Math.sqrt(1 / 3)]
			];
			var rediShort = "FLBRflbrxyz";
			var rediLong = [
				"URF",
				"UFL",
				"ULB",
				"URB",
				"RFD",
				"FDL",
				"DLB",
				"RDB",
				"R",
				"U",
				"F"
			];
			parser = makeParser(/(?:^|\s*)([FLBRflbrxyz])(')?(?:$|\s*)/g, function(m, p1, p2, p3) {
				var midx = rediShort.indexOf(p1);
				return [
					midx >= 8 ? 0 : 1,
					rediLong[midx],
					p2 ? -1 : 1
				];
			}, function(layer, axis, pow) {
				return rediShort.charAt(rediLong.indexOf(axis)) + (pow >= 0 ? "" : "'");
			}, function(scramble) {
				if (/^(([LR]'? ){3,}x ){3,}/.exec(scramble)) return scramble.replace(/L/g, "B");
				return scramble;
			});
		} else if (/^skb$/.exec(name)) {
			polyParam = [
				6,
				[-5],
				[],
				[-5, 0]
			];
			var skbShort = "FlUrDLBRxyz";
			var skbLong = [
				"URF",
				"UFL",
				"ULB",
				"URB",
				"RFD",
				"FDL",
				"DLB",
				"RDB",
				"R",
				"U",
				"F"
			];
			parser = makeParser(/(?:^|\s*)([FlUrDLBRxyz])(')?(?:$|\s*)/g, function(m, p1, p2, p3) {
				var midx = skbShort.indexOf(p1);
				return [
					midx >= 8 ? 0 : 1,
					skbLong[midx],
					p2 ? -1 : 1
				];
			}, function(layer, axis, pow) {
				return skbShort.charAt(skbLong.indexOf(axis)) + (pow >= 0 ? "" : "'");
			});
		} else if (name == "ctico") polyParam = [
			20,
			[],
			[],
			[-5, 0]
		];
		else return null;
		var nFace = polyParam[0];
		if (nFace == 4) colors = $$1.col2std(kernel.getProp("colpyr"), [
			3,
			1,
			2,
			0
		]);
		else if (nFace == 6) colors = $$1.col2std(kernel.getProp("colcube"), [
			3,
			4,
			5,
			0,
			1,
			2
		]);
		else if (nFace == 8) colors = $$1.col2std(kernel.getProp("colfto"), [
			0,
			3,
			1,
			2,
			6,
			7,
			5,
			4
		]);
		else if (nFace == 12) colors = $$1.col2std(kernel.getProp("colmgm"), [
			0,
			2,
			1,
			5,
			4,
			3,
			11,
			9,
			8,
			7,
			6,
			10
		]);
		else if (nFace == 20) colors = $$1.col2std(kernel.getProp("colico"), [
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
			11,
			12,
			13,
			14,
			15,
			16,
			17,
			18,
			19
		]);
		bindObj = bindObj || {};
		bindObj.parser = parser;
		bindObj.polyParam = polyParam;
		bindObj.scale = (bindObj.scale || 1) * scale;
		bindObj.pieceGap = pieceGap;
		bindObj.colors = colors;
		return bindObj;
	}
	return {
		Point,
		RotTrans,
		Plane,
		Sphere,
		Segment,
		Arc,
		Polygon,
		makePuzzle,
		renderNet,
		makeParser,
		makePuzzleParser,
		getFamousPuzzle,
		udpolyre: new RegExp("^(" + $$1.UDPOLY_RE + ")$"),
		parsePolyParam
	};
})();
//#endregion
//#region src/vendor/cstimer/scrmgr.js
var scrMgr = (function(rn, rndEl) {
	function mega(turns, suffixes, length) {
		turns = turns || [[""]];
		suffixes = suffixes || [""];
		length = length || 0;
		var donemoves = 0;
		var lastaxis = -1;
		var s = [];
		var first, second;
		for (var i = 0; i < length; i++) {
			do {
				first = rn(turns.length);
				second = rn(turns[first].length);
				if (first != lastaxis) {
					donemoves = 0;
					lastaxis = first;
				}
			} while ((donemoves >> second & 1) != 0);
			donemoves |= 1 << second;
			if (turns[first][second].constructor == Array) s.push(rndEl(turns[first][second]) + rndEl(suffixes));
			else s.push(turns[first][second] + rndEl(suffixes));
		}
		return s.join(" ");
	}
	/**
	*	{type: callback(type, length, state)}
	*	callback return: scramble string or undefined means delay
	*/
	var scramblers = { "blank": function() {
		return "N/A";
	} };
	/**
	*  {type: func(idx) {return [filter, probs, imgGen][idx])
	*/
	var extra = {};
	/**
	*	filter_and_probs: [[str1, ..., strN], [prob1, ..., probN], imgGen]
	*/
	function regScrambler(type, callback, filter_and_probs) {
		if (Array.isArray(type)) for (var i = 0; i < type.length; i++) scramblers[type[i]] = callback;
		else {
			scramblers[type] = callback;
			if (Array.isArray(filter_and_probs)) extra[type] = function(ret, idx) {
				return ret[idx];
			}.bind(null, filter_and_probs);
			else if (filter_and_probs) extra[type] = filter_and_probs;
		}
		if (type == "333") scramblers["mrbl"] = scramblers["333oh"] = scramblers["333ft"] = callback;
		return regScrambler;
	}
	/**
	*	return extra info for specific type, idx: 0 => filter, 1 => probs, 2 => imgGen
	*/
	function getExtra(type, idx) {
		if (!(type in extra)) return;
		return extra[type](idx);
	}
	/**
	*	format string,
	*		${args} => scramblers[scrType](scrType, scrArg)
	*		#{args} => mega(args)
	*/
	function formatScramble(str) {
		var repfunc = function(match, p1) {
			if (match[0] == "$") {
				var args = [p1];
				if (p1[0] == "[") args = JSON.parse(p1);
				return scramblers[args[0]].apply(this, args);
			} else if (match[0] == "#") return mega.apply(this, JSON.parse("[" + p1 + "]"));
			else return "";
		};
		return str.replace(/[$#]\{([^\}]+)\}/g, repfunc);
	}
	function rndState(filter, probs) {
		if (probs == void 0) return;
		var ret = probs.slice();
		if (filter == void 0) filter = ret;
		if (probs[0] == 0) return filter.slice();
		var valids = [];
		for (var i = 0; i < filter.length; i++) {
			valids.push(i);
			if (!filter[i]) {
				ret[i] = 0;
				valids.pop();
			} else if (equalProb == 1) ret[i] = 1;
		}
		if (equalProb == 2) {
			if (millerCnt++ < 0) millerCnt = mathlib.rn(65536);
			return valids[MillerShuffle(millerCnt % valids.length, ~~(millerCnt / valids.length), valids.length)];
		}
		return mathlib.rndProb(ret);
	}
	function fixCase(cases, probs) {
		if (cases != void 0) return cases;
		if (equalProb == 2) {
			if (millerCnt++ < 0) millerCnt = mathlib.rn(65536);
			return MillerShuffle(millerCnt % probs.length, ~~(millerCnt / probs.length), probs.length);
		} else if (equalProb == 1) return mathlib.rn(probs.length);
		else return mathlib.rndProb(probs);
	}
	var equalProb = 0;
	var millerCnt = -1;
	function toTxt(scramble) {
		return scramble.replace(/<span[^>]*>(.*?)<\/span>/gi, "$1 ").replace(/~/g, "").replace(/\\n/g, "\n").replace(/`(.*?)`/g, "$1");
	}
	function MillerShuffle(idx, permIdx, length) {
		if (length <= 0 || idx < 0 || permIdx < 0) return 0;
		var p1 = 24317, p2 = 32141, p3 = 63629;
		var randR = permIdx + ~~(idx / length) * 131;
		var r1 = randR % p1 + 42;
		var r2 = (randR * 137 ^ r1) % p2;
		var r3 = (r1 + r2 + p3) % length;
		var r4 = r1 ^ r2 ^ r3;
		var rx = ~~(randR / length) % length + 1;
		var rx2 = ~~(randR / length / length) % length + 1;
		var sidx = (idx + randR) % length;
		if (sidx % 3 == 0) sidx = (sidx / 3 * p1 + r1) % ~~((length + 2) / 3) * 3;
		if (sidx % 2 == 0) sidx = (sidx / 2 * p2 + r2) % ~~((length + 1) / 2) * 2;
		if (sidx < ~~(length / 2)) sidx = (sidx * p3 + r4) % ~~(length / 2);
		if ((sidx ^ rx) < length) sidx ^= rx;
		sidx = (sidx * p3 + r3) % length;
		if ((sidx ^ rx2) < length) sidx ^= rx2;
		return sidx;
	}
	return {
		reg: regScrambler,
		scramblers,
		getExtra,
		mega,
		formatScramble,
		rndState,
		fixCase,
		setEqPr: function(ep) {
			equalProb = ~~ep;
		},
		getEqPr: function() {
			return equalProb;
		},
		toTxt
	};
})(mathlib.rn, mathlib.rndEl);
//#endregion
//#region src/vendor/cstimer/scramble_sq1_new.js
var sq1 = (function(setNPerm, getNPerm, circle, rn) {
	function SqCubie() {
		this.ul = 70195;
		this.ur = 4544119;
		this.dl = 10062778;
		this.dr = 14536702;
		this.ml = 0;
	}
	var _ = SqCubie.prototype;
	_.toString = function() {
		return this.ul.toString(16).padStart(6, 0) + this.ur.toString(16).padStart(6, 0) + "|/".charAt(this.ml) + this.dl.toString(16).padStart(6, 0) + this.dr.toString(16).padStart(6, 0);
	};
	_.pieceAt = function(idx) {
		var ret;
		if (idx < 6) ret = this.ul >> (5 - idx << 2);
		else if (idx < 12) ret = this.ur >> (11 - idx << 2);
		else if (idx < 18) ret = this.dl >> (17 - idx << 2);
		else ret = this.dr >> (23 - idx << 2);
		return ret & 15;
	};
	_.setPiece = function(idx, value) {
		if (idx < 6) {
			this.ul &= ~(15 << (5 - idx << 2));
			this.ul |= value << (5 - idx << 2);
		} else if (idx < 12) {
			this.ur &= ~(15 << (11 - idx << 2));
			this.ur |= value << (11 - idx << 2);
		} else if (idx < 18) {
			this.dl &= ~(15 << (17 - idx << 2));
			this.dl |= value << (17 - idx << 2);
		} else {
			this.dr &= ~(15 << (23 - idx << 2));
			this.dr |= value << (23 - idx << 2);
		}
	};
	_.copy = function(c) {
		this.ul = c.ul;
		this.ur = c.ur;
		this.dl = c.dl;
		this.dr = c.dr;
		this.ml = c.ml;
	};
	_.doMove = function(move) {
		var temp;
		move <<= 2;
		if (move > 24) {
			move = 48 - move;
			temp = this.ul;
			this.ul = (this.ul >> move | this.ur << 24 - move) & 16777215;
			this.ur = (this.ur >> move | temp << 24 - move) & 16777215;
		} else if (move > 0) {
			temp = this.ul;
			this.ul = (this.ul << move | this.ur >> 24 - move) & 16777215;
			this.ur = (this.ur << move | temp >> 24 - move) & 16777215;
		} else if (move == 0) {
			temp = this.ur;
			this.ur = this.dl;
			this.dl = temp;
			this.ml = 1 - this.ml;
		} else if (move >= -24) {
			move = -move;
			temp = this.dl;
			this.dl = (this.dl << move | this.dr >> 24 - move) & 16777215;
			this.dr = (this.dr << move | temp >> 24 - move) & 16777215;
		} else if (move < -24) {
			move = 48 + move;
			temp = this.dl;
			this.dl = (this.dl >> move | this.dr << 24 - move) & 16777215;
			this.dr = (this.dr >> move | temp << 24 - move) & 16777215;
		}
	};
	function FullCube_getParity(obj) {
		var a, b, cnt = 0, i, p, arr = [obj.pieceAt(0)];
		for (i = 1; i < 24; ++i) if (obj.pieceAt(i) != arr[cnt]) arr[++cnt] = obj.pieceAt(i);
		p = 0;
		for (a = 0; a < 16; ++a) for (b = a + 1; b < 16; ++b) arr[a] > arr[b] && (p ^= 1);
		return p;
	}
	function FullCube_getShapeIdx(obj) {
		var dlx, drx, ulx, urx = obj.ur & 1118481;
		urx |= urx >> 3;
		urx |= urx >> 6;
		urx = urx & 15 | urx >> 12 & 48;
		ulx = obj.ul & 1118481;
		ulx |= ulx >> 3;
		ulx |= ulx >> 6;
		ulx = ulx & 15 | ulx >> 12 & 48;
		drx = obj.dr & 1118481;
		drx |= drx >> 3;
		drx |= drx >> 6;
		drx = drx & 15 | drx >> 12 & 48;
		dlx = obj.dl & 1118481;
		dlx |= dlx >> 3;
		dlx |= dlx >> 6;
		dlx = dlx & 15 | dlx >> 12 & 48;
		return Shape_getShape2Idx(FullCube_getParity(obj) << 24 | ulx << 18 | urx << 12 | dlx << 6 | drx);
	}
	function FullCube_getSquare(obj, sq) {
		var a, b;
		var prm = [];
		for (a = 0; a < 8; ++a) prm[a] = obj.pieceAt(a * 3 + 1) >> 1;
		sq.cornperm = getNPerm(prm, 8);
		sq.topEdgeFirst = obj.pieceAt(0) == obj.pieceAt(1);
		a = sq.topEdgeFirst ? 2 : 0;
		for (b = 0; b < 4; a += 3, ++b) prm[b] = obj.pieceAt(a) >> 1;
		sq.botEdgeFirst = obj.pieceAt(12) == obj.pieceAt(13);
		a = sq.botEdgeFirst ? 14 : 12;
		for (; b < 8; a += 3, ++b) prm[b] = obj.pieceAt(a) >> 1;
		sq.edgeperm = getNPerm(prm, 8);
		sq.ml = obj.ml;
	}
	function FullCube_randomCube(indice) {
		var f, i, shape, edge, corner, n_edge, n_corner, rnd, m;
		if (indice === void 0) indice = rn(3678);
		f = new SqCubie();
		shape = Shape_ShapeIdx[indice];
		corner = 324508639;
		edge = 38177486;
		n_corner = n_edge = 8;
		for (i = 0; i < 24; i++) if ((shape >> i & 1) == 0) {
			rnd = rn(n_edge) << 2;
			f.setPiece(23 - i, edge >> rnd & 15);
			m = (1 << rnd) - 1;
			edge = (edge & m) + (edge >> 4 & ~m);
			--n_edge;
		} else {
			rnd = rn(n_corner) << 2;
			f.setPiece(23 - i, corner >> rnd & 15);
			f.setPiece(22 - i, corner >> rnd & 15);
			m = (1 << rnd) - 1;
			corner = (corner & m) + (corner >> 4 & ~m);
			--n_corner;
			++i;
		}
		f.ml = rn(2);
		return f;
	}
	function Search_init2(obj) {
		var corner, edge, i, j, ml, prun;
		obj.Search_d.copy(obj.Search_c);
		for (i = 0; i < obj.Search_length1; ++i) obj.Search_d.doMove(obj.Search_move[i]);
		FullCube_getSquare(obj.Search_d, obj.Search_sq);
		edge = obj.Search_sq.edgeperm;
		corner = obj.Search_sq.cornperm;
		ml = obj.Search_sq.ml;
		prun = Math.max(SquarePrun[obj.Search_sq.edgeperm << 1 | ml], SquarePrun[obj.Search_sq.cornperm << 1 | ml]);
		for (i = prun; i < obj.Search_maxlen2; ++i) if (Search_phase2(obj, edge, corner, obj.Search_sq.topEdgeFirst, obj.Search_sq.botEdgeFirst, ml, i, obj.Search_length1, 0)) {
			for (j = 0; j < i; ++j) obj.Search_d.doMove(obj.Search_move[obj.Search_length1 + j]);
			obj.Search_sol_string = Search_move2string(obj, i + obj.Search_length1);
			return true;
		}
		return false;
	}
	function Search_move2string(obj, len) {
		var s = "";
		var top = 0, bottom = 0;
		for (var i = len - 1; i >= 0; i--) {
			var val = obj.Search_move[i];
			if (val > 0) {
				val = 12 - val;
				top = val > 6 ? val - 12 : val;
			} else if (val < 0) {
				val = 12 + val;
				bottom = val > 6 ? val - 12 : val;
			} else {
				var twst = "/";
				if (i == obj.Search_length1 - 1) twst = "`/`";
				if (top == 0 && bottom == 0) s += twst;
				else s += " (" + top + "," + bottom + ")" + twst;
				top = bottom = 0;
			}
		}
		if (top == 0 && bottom == 0) {} else s += " (" + top + "," + bottom + ") ";
		return s;
	}
	function Search_phase1(obj, shape, prunvalue, maxl, depth, lm) {
		var m, prunx, shapex;
		if (prunvalue == 0 && maxl < 4) return maxl == 0 && Search_init2(obj);
		if (lm != 0) {
			shapex = Shape_TwistMove[shape];
			prunx = ShapePrun[shapex];
			if (prunx < maxl) {
				obj.Search_move[depth] = 0;
				if (Search_phase1(obj, shapex, prunx, maxl - 1, depth + 1, 0)) return true;
			}
		}
		shapex = shape;
		if (lm <= 0) {
			m = 0;
			while (true) {
				m += Shape_TopMove[shapex];
				shapex = m >> 4;
				m &= 15;
				if (m >= 12) break;
				prunx = ShapePrun[shapex];
				if (prunx > maxl) break;
				else if (prunx < maxl) {
					obj.Search_move[depth] = m;
					if (Search_phase1(obj, shapex, prunx, maxl - 1, depth + 1, 1)) return true;
				}
			}
		}
		shapex = shape;
		if (lm <= 1) {
			m = 0;
			while (true) {
				m += Shape_BottomMove[shapex];
				shapex = m >> 4;
				m &= 15;
				if (m >= 6) break;
				prunx = ShapePrun[shapex];
				if (prunx > maxl) break;
				else if (prunx < maxl) {
					obj.Search_move[depth] = -m;
					if (Search_phase1(obj, shapex, prunx, maxl - 1, depth + 1, 2)) return true;
				}
			}
		}
		return false;
	}
	function Search_phase2(obj, edge, corner, topEdgeFirst, botEdgeFirst, ml, maxl, depth, lm) {
		var botEdgeFirstx, cornerx, edgex, m, prun1, prun2, topEdgeFirstx;
		if (maxl == 0 && !topEdgeFirst && botEdgeFirst) return true;
		if (lm != 0 && topEdgeFirst == botEdgeFirst) {
			edgex = Square_TwistMove[edge];
			cornerx = Square_TwistMove[corner];
			if (SquarePrun[edgex << 1 | 1 - ml] < maxl && SquarePrun[cornerx << 1 | 1 - ml] < maxl) {
				obj.Search_move[depth] = 0;
				if (Search_phase2(obj, edgex, cornerx, topEdgeFirst, botEdgeFirst, 1 - ml, maxl - 1, depth + 1, 0)) return true;
			}
		}
		if (lm <= 0) {
			topEdgeFirstx = !topEdgeFirst;
			edgex = topEdgeFirstx ? Square_TopMove[edge] : edge;
			cornerx = topEdgeFirstx ? corner : Square_TopMove[corner];
			m = topEdgeFirstx ? 1 : 2;
			prun1 = SquarePrun[edgex << 1 | ml];
			prun2 = SquarePrun[cornerx << 1 | ml];
			while (m < 12 && prun1 <= maxl && prun1 <= maxl) {
				if (prun1 < maxl && prun2 < maxl) {
					obj.Search_move[depth] = m;
					if (Search_phase2(obj, edgex, cornerx, topEdgeFirstx, botEdgeFirst, ml, maxl - 1, depth + 1, 1)) return true;
				}
				topEdgeFirstx = !topEdgeFirstx;
				if (topEdgeFirstx) {
					edgex = Square_TopMove[edgex];
					prun1 = SquarePrun[edgex << 1 | ml];
					m += 1;
				} else {
					cornerx = Square_TopMove[cornerx];
					prun2 = SquarePrun[cornerx << 1 | ml];
					m += 2;
				}
			}
		}
		if (lm <= 1) {
			botEdgeFirstx = !botEdgeFirst;
			edgex = botEdgeFirstx ? Square_BottomMove[edge] : edge;
			cornerx = botEdgeFirstx ? corner : Square_BottomMove[corner];
			m = botEdgeFirstx ? 1 : 2;
			prun1 = SquarePrun[edgex << 1 | ml];
			prun2 = SquarePrun[cornerx << 1 | ml];
			while (m < (maxl > 6 ? 6 : 12) && prun1 <= maxl && prun1 <= maxl) {
				if (prun1 < maxl && prun2 < maxl) {
					obj.Search_move[depth] = -m;
					if (Search_phase2(obj, edgex, cornerx, topEdgeFirst, botEdgeFirstx, ml, maxl - 1, depth + 1, 2)) return true;
				}
				botEdgeFirstx = !botEdgeFirstx;
				if (botEdgeFirstx) {
					edgex = Square_BottomMove[edgex];
					prun1 = SquarePrun[edgex << 1 | ml];
					m += 1;
				} else {
					cornerx = Square_BottomMove[cornerx];
					prun2 = SquarePrun[cornerx << 1 | ml];
					m += 2;
				}
			}
		}
		return false;
	}
	function Search_solution(obj, c) {
		var shape;
		obj.Search_c = c;
		shape = FullCube_getShapeIdx(c);
		for (obj.Search_length1 = ShapePrun[shape]; obj.Search_length1 < 100; ++obj.Search_length1) {
			obj.Search_maxlen2 = Math.min(32 - obj.Search_length1, 17);
			if (Search_phase1(obj, shape, ShapePrun[shape], obj.Search_length1, 0, -1)) break;
		}
		return obj.Search_sol_string;
	}
	function Search_Search() {
		this.Search_move = [];
		this.Search_d = new SqCubie();
		this.Search_sq = new Square_Square();
	}
	function Search() {}
	_ = Search_Search.prototype = Search.prototype;
	_.Search_c = null;
	_.Search_length1 = 0;
	_.Search_maxlen2 = 0;
	_.Search_sol_string = null;
	function Shape_$clinit() {
		Shape_$clinit = function() {};
		Shape_halflayer = [
			0,
			3,
			6,
			12,
			15,
			24,
			27,
			30,
			48,
			51,
			54,
			60,
			63
		];
		Shape_ShapeIdx = [];
		ShapePrun = [];
		Shape_TopMove = [];
		Shape_BottomMove = [];
		Shape_TwistMove = [];
		Shape_init();
	}
	function Shape_bottomMove(obj) {
		var move = 0, moveParity = 0;
		do {
			if ((obj.bottom & 2048) == 0) {
				move += 1;
				obj.bottom = obj.bottom << 1;
			} else {
				move += 2;
				obj.bottom = obj.bottom << 2 ^ 12291;
			}
			moveParity = 1 - moveParity;
		} while ((bitCount(obj.bottom & 63) & 1) != 0);
		!(bitCount(obj.bottom) & 2) && (obj.Shape_parity ^= moveParity);
		return move;
	}
	function Shape_getIdx(obj) {
		return binarySearch(Shape_ShapeIdx, obj.top << 12 | obj.bottom) << 1 | obj.Shape_parity;
	}
	function Shape_setIdx(obj, idx) {
		obj.Shape_parity = idx & 1;
		obj.top = Shape_ShapeIdx[idx >> 1];
		obj.bottom = obj.top & 4095;
		obj.top >>= 12;
	}
	function Shape_topMove(obj) {
		var move = 0, moveParity = 0;
		do {
			if ((obj.top & 2048) == 0) {
				move += 1;
				obj.top = obj.top << 1;
			} else {
				move += 2;
				obj.top = obj.top << 2 ^ 12291;
			}
			moveParity = 1 - moveParity;
		} while ((bitCount(obj.top & 63) & 1) != 0);
		!(bitCount(obj.top) & 2) && (obj.Shape_parity ^= moveParity);
		return move;
	}
	function Shape_Shape() {}
	function Shape_getShape2Idx(shp) {
		return binarySearch(Shape_ShapeIdx, shp & 16777215) << 1 | shp >> 24;
	}
	function Shape_init() {
		var count = 0, depth, dl, done, done0, dr, i = 0, idx, m, s, ul, ur, value, p1, p3, temp;
		for (; i < 28561; ++i) {
			dr = Shape_halflayer[i % 13];
			dl = Shape_halflayer[~~(i / 13) % 13];
			ur = Shape_halflayer[~~(~~(i / 13) / 13) % 13];
			ul = Shape_halflayer[~~(~~(~~(i / 13) / 13) / 13)];
			value = ul << 18 | ur << 12 | dl << 6 | dr;
			bitCount(value) == 16 && (Shape_ShapeIdx[count++] = value);
		}
		s = new Shape_Shape();
		for (i = 0; i < 7356; ++i) {
			Shape_setIdx(s, i);
			Shape_TopMove[i] = Shape_topMove(s);
			Shape_TopMove[i] |= Shape_getIdx(s) << 4;
			Shape_setIdx(s, i);
			Shape_BottomMove[i] = Shape_bottomMove(s);
			Shape_BottomMove[i] |= Shape_getIdx(s) << 4;
			Shape_setIdx(s, i);
			temp = s.top & 63;
			p1 = bitCount(temp);
			p3 = bitCount(s.bottom & 4032);
			s.Shape_parity ^= 1 & (p1 & p3) >> 1;
			s.top = s.top & 4032 | s.bottom >> 6 & 63;
			s.bottom = s.bottom & 63 | temp << 6;
			Shape_TwistMove[i] = Shape_getIdx(s);
		}
		for (i = 0; i < 7536; ++i) ShapePrun[i] = -1;
		ShapePrun[Shape_getShape2Idx(14378715)] = 0;
		ShapePrun[Shape_getShape2Idx(31157686)] = 0;
		ShapePrun[Shape_getShape2Idx(23967451)] = 0;
		ShapePrun[Shape_getShape2Idx(7191990)] = 0;
		done = 4;
		done0 = 0;
		depth = -1;
		while (done != done0) {
			done0 = done;
			++depth;
			for (i = 0; i < 7536; ++i) if (ShapePrun[i] == depth) {
				m = 0;
				idx = i;
				do {
					idx = Shape_TopMove[idx];
					m += idx & 15;
					idx >>= 4;
					if (ShapePrun[idx] == -1) {
						++done;
						ShapePrun[idx] = depth + 1;
					}
				} while (m != 12);
				m = 0;
				idx = i;
				do {
					idx = Shape_BottomMove[idx];
					m += idx & 15;
					idx >>= 4;
					if (ShapePrun[idx] == -1) {
						++done;
						ShapePrun[idx] = depth + 1;
					}
				} while (m != 12);
				idx = Shape_TwistMove[i];
				if (ShapePrun[idx] == -1) {
					++done;
					ShapePrun[idx] = depth + 1;
				}
			}
		}
	}
	function Shape() {}
	_ = Shape_Shape.prototype = Shape.prototype;
	_.bottom = 0;
	_.Shape_parity = 0;
	_.top = 0;
	var Shape_BottomMove, Shape_ShapeIdx, ShapePrun, Shape_TopMove, Shape_TwistMove, Shape_halflayer;
	function Square_$clinit() {
		Square_$clinit = function() {};
		SquarePrun = [];
		Square_TwistMove = [];
		Square_TopMove = [];
		Square_BottomMove = [];
		Square_init();
	}
	function Square_Square() {}
	function Square_init() {
		var check, depth, done, find, i, idx, idxx, inv, m, ml, pos = [];
		for (i = 0; i < 40320; ++i) {
			setNPerm(pos, i, 8);
			circle(pos, 2, 4)(pos, 3, 5);
			Square_TwistMove[i] = getNPerm(pos, 8);
			setNPerm(pos, i, 8);
			circle(pos, 0, 3, 2, 1);
			Square_TopMove[i] = getNPerm(pos, 8);
			setNPerm(pos, i, 8);
			circle(pos, 4, 7, 6, 5);
			Square_BottomMove[i] = getNPerm(pos, 8);
		}
		for (i = 0; i < 80640; ++i) SquarePrun[i] = -1;
		SquarePrun[0] = 0;
		depth = 0;
		done = 1;
		while (done < 80640) {
			inv = depth >= 11;
			find = inv ? -1 : depth;
			check = inv ? depth : -1;
			++depth;
			OUT: for (i = 0; i < 80640; ++i) if (SquarePrun[i] == find) {
				idx = i >> 1;
				ml = i & 1;
				idxx = Square_TwistMove[idx] << 1 | 1 - ml;
				if (SquarePrun[idxx] == check) {
					++done;
					SquarePrun[inv ? i : idxx] = depth;
					if (inv) continue OUT;
				}
				idxx = idx;
				for (m = 0; m < 4; ++m) {
					idxx = Square_TopMove[idxx];
					if (SquarePrun[idxx << 1 | ml] == check) {
						++done;
						SquarePrun[inv ? i : idxx << 1 | ml] = depth;
						if (inv) continue OUT;
					}
				}
				for (m = 0; m < 4; ++m) {
					idxx = Square_BottomMove[idxx];
					if (SquarePrun[idxx << 1 | ml] == check) {
						++done;
						SquarePrun[inv ? i : idxx << 1 | ml] = depth;
						if (inv) continue OUT;
					}
				}
			}
		}
	}
	function Square() {}
	_ = Square_Square.prototype = Square.prototype;
	_.botEdgeFirst = false;
	_.cornperm = 0;
	_.edgeperm = 0;
	_.ml = 0;
	_.topEdgeFirst = false;
	var Square_BottomMove, SquarePrun, Square_TopMove, Square_TwistMove;
	function bitCount(x) {
		x -= x >> 1 & 1431655765;
		x = (x >> 2 & 858993459) + (x & 858993459);
		x = (x >> 4) + x & 252645135;
		x += x >> 8;
		x += x >> 16;
		return x & 63;
	}
	function binarySearch(sortedArray, key) {
		var high, low = 0, mid, midVal;
		high = sortedArray.length - 1;
		while (low <= high) {
			mid = low + (high - low >> 1);
			midVal = sortedArray[mid];
			if (midVal < key) low = mid + 1;
			else if (midVal > key) high = mid - 1;
			else return mid;
		}
		return -low - 1;
	}
	var cspcases = [
		0,
		1,
		3,
		18,
		19,
		1004,
		1005,
		1006,
		1007,
		1008,
		1009,
		1011,
		1015,
		1016,
		1018,
		1154,
		1155,
		1156,
		1157,
		1158,
		1159,
		1161,
		1166,
		1168,
		424,
		425,
		426,
		427,
		428,
		429,
		431,
		436,
		95,
		218,
		341,
		482,
		528,
		632,
		1050,
		342,
		343,
		345,
		346,
		348,
		353,
		223,
		487,
		533,
		535,
		1055,
		219,
		225,
		483,
		489,
		639,
		1051,
		1057,
		486,
		1054,
		1062,
		6,
		21,
		34,
		46,
		59,
		71,
		144,
		157,
		182,
		305,
		7,
		22,
		35,
		47,
		60,
		72,
		145,
		158,
		183,
		306,
		8,
		23,
		36,
		48,
		61,
		73,
		146,
		159,
		184,
		307
	];
	function CSPInit() {
		CSPInit = function() {};
		var s = new Shape_Shape();
		for (var csp = 0; csp < cspcases.length; csp++) {
			var curCases = [cspcases[csp]];
			for (var i = 0; i < curCases.length; i++) {
				var shape = curCases[i];
				do {
					shape = Shape_TopMove[shape << 1] >> 5;
					if (curCases.indexOf(shape) == -1) curCases.push(shape);
				} while (shape != curCases[i]);
				do {
					shape = Shape_BottomMove[shape << 1] >> 5;
					if (curCases.indexOf(shape) == -1) curCases.push(shape);
				} while (shape != curCases[i]);
				Shape_setIdx(s, shape << 1);
				var tmp = s.top;
				s.top = s.bottom;
				s.bottom = tmp;
				shape = Shape_getIdx(s) >> 1;
				if (curCases.indexOf(shape) == -1) curCases.push(shape);
			}
			cspcases[csp] = curCases;
		}
	}
	var cspfilter = [
		"Star-x8",
		"Star-x71",
		"Star-x62",
		"Star-x44",
		"Star-x53",
		"Square-Scallop",
		"Square-rPawn",
		"Square-Shield",
		"Square-Barrel",
		"Square-rFist",
		"Square-Mushroom",
		"Square-lPawn",
		"Square-Square",
		"Square-lFist",
		"Square-Kite",
		"Kite-Scallop",
		"Kite-rPawn",
		"Kite-Shield",
		"Kite-Barrel",
		"Kite-rFist",
		"Kite-Mushroom",
		"Kite-lPawn",
		"Kite-lFist",
		"Kite-Kite",
		"Barrel-Scallop",
		"Barrel-rPawn",
		"Barrel-Shield",
		"Barrel-Barrel",
		"Barrel-rFist",
		"Barrel-Mushroom",
		"Barrel-lPawn",
		"Barrel-lFist",
		"Scallop-Scallop",
		"Scallop-rPawn",
		"Scallop-Shield",
		"Scallop-rFist",
		"Scallop-Mushroom",
		"Scallop-lPawn",
		"Scallop-lFist",
		"Shield-rPawn",
		"Shield-Shield",
		"Shield-rFist",
		"Shield-Mushroom",
		"Shield-lPawn",
		"Shield-lFist",
		"Mushroom-rPawn",
		"Mushroom-rFist",
		"Mushroom-Mushroom",
		"Mushroom-lPawn",
		"Mushroom-lFist",
		"Pawn-rPawn-rPawn",
		"Pawn-rPawn-lPawn",
		"Pawn-rPawn-rFist",
		"Pawn-lPawn-rFist",
		"Pawn-lPawn-lPawn",
		"Pawn-rPawn-lFist",
		"Pawn-lPawn-lFist",
		"Fist-rFist-rFist",
		"Fist-lFist-rFist",
		"Fist-lFist-lFist",
		"Pair-x6",
		"Pair-r42",
		"Pair-x411",
		"Pair-r51",
		"Pair-l42",
		"Pair-l51",
		"Pair-x33",
		"Pair-x312",
		"Pair-x321",
		"Pair-x222",
		"L-x6",
		"L-r42",
		"L-x411",
		"L-r51",
		"L-l42",
		"L-l51",
		"L-x33",
		"L-x312",
		"L-x321",
		"L-x222",
		"Line-x6",
		"Line-r42",
		"Line-x411",
		"Line-r51",
		"Line-l42",
		"Line-l51",
		"Line-x33",
		"Line-x312",
		"Line-x321",
		"Line-x222"
	];
	var cspprobs = [
		16,
		16,
		16,
		10,
		16,
		24,
		16,
		24,
		16,
		24,
		16,
		16,
		4,
		24,
		16,
		48,
		32,
		48,
		32,
		48,
		32,
		32,
		48,
		16,
		48,
		32,
		48,
		16,
		48,
		32,
		32,
		48,
		36,
		48,
		72,
		72,
		48,
		48,
		72,
		48,
		36,
		72,
		48,
		48,
		72,
		32,
		48,
		16,
		32,
		48,
		16,
		32,
		48,
		48,
		16,
		48,
		48,
		36,
		72,
		36,
		72,
		96,
		96,
		72,
		96,
		72,
		72,
		72,
		72,
		24,
		48,
		64,
		64,
		48,
		64,
		48,
		48,
		48,
		48,
		16,
		24,
		32,
		32,
		24,
		32,
		24,
		24,
		24,
		24,
		8
	];
	var search = new Search_Search();
	function square1SolverGetRandomScramble(type, length, cases) {
		Shape_$clinit();
		Square_$clinit();
		return Search_solution(search, FullCube_randomCube());
	}
	function getCSPScramble(type, length, cases) {
		Shape_$clinit();
		Square_$clinit();
		CSPInit();
		return Search_solution(search, FullCube_randomCube(mathlib.rndEl(cspcases[scrMgr.fixCase(cases, cspprobs)])));
	}
	var pll_map = [
		[4146, 12816],
		[12546, 12816],
		[12321, 12816],
		[8961, 12816],
		[12816, 12321],
		[12816, 12546],
		[12816, 8961],
		[12306, 12801],
		[8496, 12321],
		[4896, 12546],
		[12321, 12546],
		[12546, 12321],
		[12801, 12801],
		[12576, 12801],
		[4656, 12306],
		[12306, 12306],
		[531, 12801],
		[8976, 12801],
		[4656, 12801],
		[12576, 12306],
		[12801, 12306]
	];
	var pllprobs = [
		1,
		4,
		4,
		2,
		4,
		4,
		2,
		4,
		4,
		4,
		4,
		4,
		4,
		4,
		1,
		1,
		4,
		4,
		4,
		4,
		4
	];
	var pllfilter = [
		"H",
		"Ua",
		"Ub",
		"Z",
		"Aa",
		"Ab",
		"E",
		"F",
		"Ga",
		"Gb",
		"Gc",
		"Gd",
		"Ja",
		"Jb",
		"Na",
		"Nb",
		"Ra",
		"Rb",
		"T",
		"V",
		"Y"
	];
	function getPLLScramble(type, length, cases) {
		Shape_$clinit();
		Square_$clinit();
		var pllcase = pll_map[scrMgr.fixCase(cases, pllprobs)];
		var cc = new SqCubie();
		var rn = mathlib.rn(4) * 4369;
		var rn2 = mathlib.rn(4) * 4;
		var ep = 17476 - pllcase[0] + rn & 13107;
		var cp = 13107 - pllcase[1] + rn & 13107;
		ep = (ep | ep << 16) >> rn2;
		cp = (cp | cp << 16) >> rn2;
		for (var i = 0; i < 4; i++) {
			var c = (cp >> 12 - i * 4 & 15) << 1 | 1;
			cc.setPiece(i * 3 + 1, c);
			cc.setPiece(i * 3 + 2, c);
			cc.setPiece((i * 3 + 3) % 12, (ep >> 12 - i * 4 & 15) << 1);
		}
		if (mathlib.rn(2) != 0) cc.doMove(1);
		cc.ml = mathlib.rn(2);
		return Search_solution(search, cc);
	}
	function getPLLImage(cases, canvas) {
		Shape_$clinit();
		Square_$clinit();
		var pllcase = pll_map[scrMgr.fixCase(cases, pllprobs)];
		var cc = new SqCubie();
		var ep = 17476 - pllcase[0] & 13107;
		var cp = 13107 - pllcase[1] & 13107;
		for (var i = 0; i < 4; i++) {
			var c = (cp >> 12 - i * 4 & 15) << 1 | 1;
			cc.setPiece(i * 3 + 1, c);
			cc.setPiece(i * 3 + 2, c);
			cc.setPiece((i * 3 + 3) % 12, (ep >> 12 - i * 4 & 15) << 1);
		}
		if (!canvas) return [
			cc,
			false,
			null
		];
		image.sqllImage(cc, false, canvas);
	}
	scrMgr.reg("sqrs", square1SolverGetRandomScramble);
	scrMgr.reg("sqrcsp", getCSPScramble, [cspfilter, cspprobs]);
	scrMgr.reg("sq1pll", getPLLScramble, [
		pllfilter,
		pllprobs,
		getPLLImage
	]);
	return {
		initialize: function() {},
		SqCubie,
		getRandomScramble: square1SolverGetRandomScramble
	};
})(mathlib.setNPerm, mathlib.getNPerm, mathlib.circle, mathlib.rn);
//#endregion
//#region src/vendor/cstimer/clock.js
var clock = (function(rn, Cnk) {
	var moveArr = [
		[
			0,
			1,
			1,
			0,
			1,
			1,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0
		],
		[
			0,
			0,
			0,
			0,
			1,
			1,
			0,
			1,
			1,
			0,
			0,
			0,
			0,
			0
		],
		[
			0,
			0,
			0,
			1,
			1,
			0,
			1,
			1,
			0,
			0,
			0,
			0,
			0,
			0
		],
		[
			1,
			1,
			0,
			1,
			1,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0
		],
		[
			1,
			1,
			1,
			1,
			1,
			1,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0
		],
		[
			0,
			1,
			1,
			0,
			1,
			1,
			0,
			1,
			1,
			0,
			0,
			0,
			0,
			0
		],
		[
			0,
			0,
			0,
			1,
			1,
			1,
			1,
			1,
			1,
			0,
			0,
			0,
			0,
			0
		],
		[
			1,
			1,
			0,
			1,
			1,
			0,
			1,
			1,
			0,
			0,
			0,
			0,
			0,
			0
		],
		[
			1,
			1,
			1,
			1,
			1,
			1,
			1,
			1,
			1,
			0,
			0,
			0,
			0,
			0
		],
		[
			11,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			1,
			0,
			1,
			1,
			0
		],
		[
			0,
			0,
			0,
			0,
			0,
			0,
			11,
			0,
			0,
			0,
			0,
			1,
			1,
			1
		],
		[
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			11,
			0,
			1,
			1,
			0,
			1
		],
		[
			0,
			0,
			11,
			0,
			0,
			0,
			0,
			0,
			0,
			1,
			1,
			1,
			0,
			0
		],
		[
			11,
			0,
			11,
			0,
			0,
			0,
			0,
			0,
			0,
			1,
			1,
			1,
			1,
			0
		],
		[
			11,
			0,
			0,
			0,
			0,
			0,
			11,
			0,
			0,
			1,
			0,
			1,
			1,
			1
		],
		[
			0,
			0,
			0,
			0,
			0,
			0,
			11,
			0,
			11,
			0,
			1,
			1,
			1,
			1
		],
		[
			0,
			0,
			11,
			0,
			0,
			0,
			0,
			0,
			11,
			1,
			1,
			1,
			0,
			1
		],
		[
			11,
			0,
			11,
			0,
			0,
			0,
			11,
			0,
			11,
			1,
			1,
			1,
			1,
			1
		]
	];
	function select(n, k, idx) {
		var r = k;
		var val = 0;
		for (var i = n - 1; i >= 0; i--) if (idx >= Cnk[i][r]) {
			idx -= Cnk[i][r--];
			val |= 1 << i;
		}
		return val;
	}
	var invert = [
		-1,
		1,
		-1,
		-1,
		-1,
		5,
		-1,
		7,
		-1,
		-1,
		-1,
		11
	];
	function randomState() {
		var ret = [];
		for (var i = 0; i < 14; i++) ret[i] = rn(12);
		return ret;
	}
	/**
	*	@return the length of the solution (the number of non-zero elements in the solution array)
	*		-1: invalid input
	*/
	function Solution(clock, solution) {
		if (clock.length != 14 || solution.length != 18) return -1;
		return solveIn(14, clock, solution);
	}
	function swap(arr, row1, row2) {
		var tmp = arr[row1];
		arr[row1] = arr[row2];
		arr[row2] = tmp;
	}
	function addTo(arr, row1, row2, startidx, mul) {
		var length = arr[0].length;
		for (var i = startidx; i < length; i++) arr[row2][i] = (arr[row2][i] + arr[row1][i] * mul) % 12;
	}
	var ld_list = [
		7695,
		42588,
		47187,
		85158,
		86697,
		156568,
		181700,
		209201,
		231778
	];
	function solveIn(k, numbers, solution) {
		var n = 18;
		var min_nz = k + 1;
		for (var idx = 0; idx < Cnk[n][k]; idx++) {
			var val = select(n, k, idx);
			var isLD = false;
			for (var r = 0; r < ld_list.length; r++) if ((val & ld_list[r]) == ld_list[r]) {
				isLD = true;
				break;
			}
			if (isLD) continue;
			var map = [];
			var cnt = 0;
			for (var j = 0; j < n; j++) if ((val >> j & 1) == 1) map[cnt++] = j;
			var arr = [];
			for (var i = 0; i < 14; i++) {
				arr[i] = [];
				for (var j = 0; j < k; j++) arr[i][j] = moveArr[map[j]][i];
				arr[i][k] = numbers[i];
			}
			if (GaussianElimination(arr) != 0) continue;
			var isSolved = true;
			for (var i = k; i < 14; i++) if (arr[i][k] != 0) {
				isSolved = false;
				break;
			}
			if (!isSolved) continue;
			backSubstitution(arr);
			var cnt_nz = 0;
			for (var i = 0; i < k; i++) if (arr[i][k] != 0) cnt_nz++;
			if (cnt_nz < min_nz) {
				for (var i = 0; i < 18; i++) solution[i] = 0;
				for (var i = 0; i < k; i++) solution[map[i]] = arr[i][k];
				min_nz = cnt_nz;
			}
		}
		return min_nz == k + 1 ? -1 : min_nz;
	}
	function GaussianElimination(arr) {
		var m = 14;
		var n = arr[0].length;
		for (var i = 0; i < n - 1; i++) {
			if (invert[arr[i][i]] == -1) {
				var ivtidx = -1;
				for (var j = i + 1; j < m; j++) if (invert[arr[j][i]] != -1) {
					ivtidx = j;
					break;
				}
				if (ivtidx == -1) {
					OUT: for (var j1 = i; j1 < m - 1; j1++) for (var j2 = j1 + 1; j2 < m; j2++) if (invert[(arr[j1][i] + arr[j2][i]) % 12] != -1) {
						addTo(arr, j2, j1, i, 1);
						ivtidx = j1;
						break OUT;
					}
				}
				if (ivtidx == -1) {
					for (var j = i + 1; j < m; j++) if (arr[j][i] != 0) return -1;
					return i + 1;
				}
				swap(arr, i, ivtidx);
			}
			var inv = invert[arr[i][i]];
			for (var j = i; j < n; j++) arr[i][j] = arr[i][j] * inv % 12;
			for (var j = i + 1; j < m; j++) addTo(arr, i, j, i, 12 - arr[j][i]);
		}
		return 0;
	}
	function backSubstitution(arr) {
		for (var i = arr[0].length - 2; i > 0; i--) for (var j = i - 1; j >= 0; j--) if (arr[j][i] != 0) addTo(arr, i, j, i, 12 - arr[j][i]);
	}
	var turns = [
		"UR",
		"DR",
		"DL",
		"UL",
		"U",
		"R",
		"D",
		"L",
		"ALL"
	];
	function getScramble(type) {
		var rndarr = randomState();
		var solution = [];
		solution.length = 18;
		Solution(rndarr, solution);
		var scramble = "";
		for (var x = 0; x < 9; x++) {
			var turn = solution[x];
			if (turn == 0) continue;
			var clockwise = turn <= 6;
			if (turn > 6) turn = 12 - turn;
			scramble += turns[x] + turn + (clockwise ? "+" : "-") + " ";
		}
		scramble += "y2 ";
		for (var x = 0; x < 9; x++) {
			var turn = solution[x + 9];
			if (turn == 0) continue;
			var clockwise = turn <= 6;
			if (turn > 6) turn = 12 - turn;
			scramble += turns[x] + turn + (clockwise ? "+" : "-") + " ";
		}
		var isFirst = true;
		for (var x = 0; x < 4; x++) if (rn(2) == 1) {
			scramble += (isFirst ? "" : " ") + turns[x];
			isFirst = false;
		}
		return scramble;
	}
	scrMgr.reg("clko", getScramble);
	return { moveArr };
})(mathlib.rn, mathlib.Cnk);
//#endregion
//#region src/vendor/cstimer/cubeutil.js
var cubeutil = (function() {
	function toEqus(facelet) {
		var col2equ = {};
		for (var i = 0; i < facelet.length; i++) {
			var col = facelet[i];
			if (col == "-") continue;
			col2equ[col] = col2equ[col] || [];
			col2equ[col].push(i);
		}
		var equs = [];
		for (var col in col2equ) if (col2equ[col].length > 1) equs.push(col2equ[col]);
		return equs;
	}
	var crossMask = toEqus("----U--------R--R-----F--F--D-DDD-D-----L--L-----B--B-");
	var f2l1Mask = toEqus("----U-------RR-RR-----FF-FF-DDDDD-D-----L--L-----B--B-");
	var f2l2Mask = toEqus("----U--------R--R----FF-FF-DD-DDD-D-----LL-LL----B--B-");
	var f2l3Mask = toEqus("----U--------RR-RR----F--F--D-DDD-DD----L--L----BB-BB-");
	var f2l4Mask = toEqus("----U--------R--R-----F--F--D-DDDDD----LL-LL-----BB-BB");
	var f2lMask = toEqus("----U-------RRRRRR---FFFFFFDDDDDDDDD---LLLLLL---BBBBBB");
	var ollMask = toEqus("UUUUUUUUU---RRRRRR---FFFFFFDDDDDDDDD---LLLLLL---BBBBBB");
	var eollMask = toEqus("-U-UUU-U----RRRRRR---FFFFFFDDDDDDDDD---LLLLLL---BBBBBB");
	var cpllMask = toEqus("UUUUUUUUUr-rRRRRRRf-fFFFFFFDDDDDDDDDl-lLLLLLLb-bBBBBBB");
	var roux1Mask = toEqus("---------------------F--F--D--D--D-----LLLLLL-----B--B");
	var roux2Mask = toEqus("------------RRRRRR---F-FF-FD-DD-DD-D---LLLLLL---B-BB-B");
	var roux3Mask = toEqus("U-U---U-Ur-rRRRRRRf-fF-FF-FD-DD-DD-Dl-lLLLLLLb-bB-BB-B");
	var LLPattern = "012345678cdeRRRRRR9abFFFFFFDDDDDDDDDijkLLLLLLfghBBBBBB";
	var c2LLPattern = "0-1---2-36-7---R-R4-5---F-FD-D---D-Da-b---L-L8-9---B-B";
	var c2LLMask = toEqus("---------------R-R------F-FD-D---D-D------L-L------B-B");
	var solvedMask = toEqus(mathlib.SOLVED_FACELET);
	var cubeRots = (function genRots() {
		function faceletRot(facelet, rot) {
			var ret = [];
			for (var i = 0; i < 54; i++) ret[rot[i]] = facelet[i];
			return ret;
		}
		var cubeRotY = mathlib.CubieCube.rotCube[3].toPerm();
		mathlib.circle(cubeRotY, 13, 49, 40, 22);
		var cubeRotX = mathlib.CubieCube.rotCube[15].toPerm();
		mathlib.circle(cubeRotX, 4, 22, 31, 49);
		var cubeRotZ = mathlib.CubieCube.rotCube[17].toPerm();
		mathlib.circle(cubeRotZ, 4, 40, 31, 13);
		var ret = [];
		var cur = [];
		for (var i = 0; i < 54; i++) cur[i] = i;
		for (var a = 0; a < 24; a++) {
			ret[a] = cur.slice();
			cur = faceletRot(cur, a & 1 ? cubeRotX : cubeRotZ);
			if (a % 6 == 5) {
				cur = faceletRot(cur, cubeRotZ);
				cur = faceletRot(cur, cubeRotZ);
			}
			if (a % 12 == 11) {
				cur = faceletRot(cur, cubeRotY);
				cur = faceletRot(cur, cubeRotY);
			}
		}
		return ret;
	})();
	function solvedProgressCubie(param, mask) {
		var faceGetter = function(i) {
			var src = mathlib.CubieCube.faceMap[i];
			var ret = 0;
			if (!src) ret = i;
			else if (src[0] == 0) {
				var val = facelet.ca[src[1]];
				ret = mathlib.CubieCube.cFacelet[val & 7][(3 - (val >> 3) + src[2]) % 3];
			} else if (src[0] == 1) {
				var val = facelet.ea[src[1]];
				ret = mathlib.CubieCube.eFacelet[val >> 1][val & 1 ^ src[2]];
			}
			return ~~(ret / 9);
		};
		var cubeRot = cubeRots[param[1]];
		var facelet = param[0];
		mask = mask || solvedMask;
		for (var i = 0; i < mask.length; i++) {
			var equ = mask[i];
			var col = faceGetter(cubeRot[equ[0]]);
			for (var j = 1; j < equ.length; j++) if (faceGetter(cubeRot[equ[j]]) != col) return 1;
		}
		return 0;
	}
	function solvedProgress(param, mask) {
		if (param[0] instanceof mathlib.CubieCube) return solvedProgressCubie(param, mask);
		var cubeRot = cubeRots[param[1]];
		var facelet = param[0];
		mask = mask || solvedMask;
		for (var i = 0; i < mask.length; i++) {
			var equ = mask[i];
			var col = facelet[cubeRot[equ[0]]];
			for (var j = 1; j < equ.length; j++) if (facelet[cubeRot[equ[j]]] != col) return 1;
		}
		return 0;
	}
	function getCF4O2P2Progress(param) {
		if (solvedProgress(param, crossMask)) return 9;
		else if (solvedProgress(param, f2lMask)) return 4 + solvedProgress(param, f2l1Mask) + solvedProgress(param, f2l2Mask) + solvedProgress(param, f2l3Mask) + solvedProgress(param, f2l4Mask);
		else if (solvedProgress(param, eollMask)) return 4;
		else if (solvedProgress(param, ollMask)) return 3;
		else if (solvedProgress(param, cpllMask)) return 2;
		else if (solvedProgress(param)) return 1;
		return 0;
	}
	function getCF4OPProgress(param) {
		if (solvedProgress(param, crossMask)) return 7;
		else if (solvedProgress(param, f2lMask)) return 2 + solvedProgress(param, f2l1Mask) + solvedProgress(param, f2l2Mask) + solvedProgress(param, f2l3Mask) + solvedProgress(param, f2l4Mask);
		else if (solvedProgress(param, ollMask)) return 2;
		else if (solvedProgress(param)) return 1;
		return 0;
	}
	function getCFOPProgress(param) {
		if (solvedProgress(param, crossMask)) return 4;
		else if (solvedProgress(param, f2lMask)) return 3;
		else if (solvedProgress(param, ollMask)) return 2;
		else if (solvedProgress(param)) return 1;
		return 0;
	}
	function getCF3ZBProgress(param) {
		if (solvedProgress(param, crossMask)) return 6;
		else if (solvedProgress(param, eollMask)) return 1 + Math.max(1, solvedProgress(param, f2l1Mask) + solvedProgress(param, f2l2Mask) + solvedProgress(param, f2l3Mask) + solvedProgress(param, f2l4Mask));
		else if (solvedProgress(param)) return 1;
		return 0;
	}
	function getFPProgress(param) {
		if (solvedProgress(param, f2lMask)) return 2;
		else if (solvedProgress(param)) return 1;
		return 0;
	}
	function getRouxProgress(param) {
		if (solvedProgress(param, roux1Mask)) return 4;
		else if (solvedProgress(param, roux2Mask)) return 3;
		else if (solvedProgress(param, roux3Mask)) return 2;
		else if (solvedProgress(param)) return 1;
		return 0;
	}
	var stepParams = {
		"cross": [6, crossMask],
		"f2l": [6, f2lMask],
		"oll": [6, ollMask],
		"eoll": [6, eollMask],
		"cpll": [6, cpllMask],
		"fb": [24, roux1Mask],
		"sb": [24, roux2Mask],
		"cmll": [24, roux3Mask]
	};
	function calcStepProgress(step, param) {
		if (step in stepParams) return solvedProgress(param, stepParams[step][1]);
		return solvedProgress(param);
	}
	function getStepProgress(step, facelet, n_axis) {
		if (!n_axis) n_axis = step in stepParams ? stepParams[step][0] : 1;
		return getProgressNAxis(facelet, calcStepProgress.bind(null, step), n_axis);
	}
	function getProgressNAxis(facelet, process, n_axis) {
		var minRet = 99;
		for (var a = 0; a < n_axis; a++) minRet = Math.min(minRet, process([facelet, a]));
		return minRet;
	}
	var centerRot = [
		[
			0,
			2,
			4,
			3,
			5,
			1
		],
		[
			5,
			1,
			0,
			2,
			4,
			3
		],
		[
			4,
			0,
			2,
			1,
			3,
			5
		]
	];
	function moveSeq2str(moveSeq) {
		return $.map(moveSeq, function(val) {
			return val[0].trim() + "@" + val[1];
		}).join(" ");
	}
	function getPrettyMoves(rawMoveSeqs) {
		var center = [
			0,
			1,
			2,
			3,
			4,
			5
		];
		return $.map(rawMoveSeqs, function(moveSeq, seqIdx) {
			var ret = [];
			function pushSol(axis, pow) {
				if (ret.length == 0 || ~~(ret.at(-1) / 3) != axis) {
					ret.push(axis * 3 + pow);
					return;
				}
				pow = (pow + ret.at(-1) % 3 + 1) % 4;
				if (pow == 3) ret.pop();
				else ret.splice(-1, 1, axis * 3 + pow);
			}
			for (var i = 0; i < moveSeq.length; i++) {
				var axis = center.indexOf("URFDLB".indexOf(moveSeq[i][0][0]));
				var pow = " 2'".indexOf(moveSeq[i][0][1]) % 3;
				if (i == moveSeq.length - 1 || moveSeq[i + 1][1] - moveSeq[i][1] > 100) {
					pushSol(axis, pow);
					continue;
				}
				var axis2 = center.indexOf("URFDLB".indexOf(moveSeq[i + 1][0][0]));
				var pow2 = " 2'".indexOf(moveSeq[i + 1][0][1]) % 3;
				if (axis != axis2 && axis % 3 == axis2 % 3 && pow + pow2 == 2) {
					var axisM = axis % 3;
					var powM = (pow - 1) * [
						1,
						1,
						-1,
						-1,
						-1,
						1
					][axis] + 1;
					pushSol(axisM + 6, powM);
					for (var p = 0; p < powM + 1; p++) {
						var center_ = [];
						for (var c = 0; c < 6; c++) center_[c] = center[centerRot[axisM][c]];
						center = center_;
					}
					i++;
					continue;
				}
				pushSol(axis, pow);
			}
			return [[$.map(ret, function(val) {
				return "URFDLBEMS".charAt(~~(val / 3)) + " 2'".charAt(val % 3);
			}).join(""), ret.length]];
		});
	}
	var identPLL = (function() {
		var pllPattern = [];
		return function(facelet) {
			for (var i = pllPattern.length; i < 22; i++) {
				var param = i == 21 ? "UUUUUUUUUFFFRRRBBBLLL" : scramble_333.getPLLImage(i)[0];
				pllPattern.push(toEqus(LLPattern.replace(/[0-9a-z]/g, function(v) {
					return param[parseInt(v, 36)].toLowerCase();
				})));
			}
			return searchCaseByPattern(facelet, ollMask, pllPattern);
		};
	})();
	var identOLL = (function() {
		var ollPattern = [];
		return function(facelet) {
			for (var i = ollPattern.length; i < 58; i++) {
				var param = scramble_333.getOLLImage(i)[0].replace(/G/g, "-");
				ollPattern.push(toEqus(LLPattern.replace(/[0-9a-z]/g, function(v) {
					return param[parseInt(v, 36)].toLowerCase();
				})));
			}
			return searchCaseByPattern(facelet, f2lMask, ollPattern);
		};
	})();
	var identCOLL = (function() {
		var collPattern = [];
		return function(facelet) {
			for (var i = collPattern.length; i < 43; i++) {
				var param = scramble_333.getCOLLImage("D", i)[0].replace(/G/g, "-");
				collPattern.push(toEqus(LLPattern.replace(/[0-9a-z]/g, function(v) {
					return param[parseInt(v, 36)].toLowerCase();
				})));
			}
			return searchCaseByPattern(facelet, eollMask, collPattern);
		};
	})();
	var identZBLL = (function() {
		var zbllPattern = [];
		return function(facelet) {
			for (var i = zbllPattern.length; i < 493; i++) {
				var param = scramble_333.getZBLLImage(i)[0].replace(/G/g, "-");
				zbllPattern.push(toEqus(LLPattern.replace(/[0-9a-z]/g, function(v) {
					return param[parseInt(v, 36)].toLowerCase();
				})));
			}
			return searchCaseByPattern(facelet, eollMask, zbllPattern);
		};
	})();
	var identC2CLL = (function() {
		var cllPattern = [];
		return function(facelet) {
			for (var i = cllPattern.length; i < 40; i++) {
				var param = scramble_222.getEGLLImage(i)[0].replace(/G/g, "-");
				cllPattern.push(toEqus(c2LLPattern.replace(/[0-9a-z]/g, function(v) {
					return param[parseInt(v, 36)].toLowerCase();
				})));
			}
			return searchCaseByPattern(facelet, c2LLMask, cllPattern);
		};
	})();
	function searchCaseByPattern(facelet, baseMask, patterns) {
		var chkList = [];
		for (var a = 0; a < 24; a++) if (solvedProgress([facelet, a], baseMask) == 0) chkList.push(a);
		for (var i = 0; i < patterns.length; i++) for (var j = 0; j < chkList.length; j++) if (solvedProgress([facelet, chkList[j]], patterns[i]) == 0) return i;
		return -1;
	}
	function identStep(step, facelet) {
		switch (step) {
			case "PLL": return identPLL(facelet);
			case "OLL": return identOLL(facelet);
			case "COLL": return identCOLL(facelet);
			case "ZBLL": return identZBLL(facelet);
			case "C2CLL": return identC2CLL(facelet);
		}
	}
	function getIdentData(method) {
		var identData = {
			"PLL": [
				identPLL,
				scramble_333.getPLLImage,
				0,
				21,
				0
			],
			"OLL": [
				identOLL,
				scramble_333.getOLLImage,
				1,
				58,
				1
			],
			"COLL": [
				identCOLL,
				scramble_333.getCOLLImage.bind(null, "D"),
				0,
				40,
				1
			],
			"ZBLL": [
				identZBLL,
				scramble_333.getZBLLImage,
				0,
				493,
				0
			],
			"CLL": [
				identC2CLL,
				scramble_222.getEGLLImage,
				0,
				40,
				1
			]
		};
		return method ? identData[method] : identData;
	}
	function getScrambledState(scramble, reqFace) {
		scramble[0];
		var scrSeq = scramble[1];
		if (!tools.isPuzzle("333", scramble)) return;
		var scr = parseScramble(scrSeq, "URFDLB");
		var c = new mathlib.CubieCube();
		var d = new mathlib.CubieCube();
		c.ori = 0;
		for (var i = 0; i < scr.length; i++) {
			var axis = scr[i][0];
			var pow = scr[i][2];
			var m = axis * 3 + pow - 1;
			if (m < 0 || m >= 18) continue;
			if (scr[i][1] == 2) {
				var rot = [
					3,
					15,
					17,
					1,
					11,
					23
				][axis];
				for (var j = 0; j < pow; j++) c.ori = mathlib.CubieCube.rotMult[rot][c.ori];
				m = mathlib.CubieCube.rotMulM[c.ori][(axis + 3) % 6 * 3 + pow - 1];
			}
			mathlib.CubieCube.CubeMult(c, mathlib.CubieCube.moveCube[m], d);
			c.init(d.ca, d.ea);
		}
		return reqFace ? c.toFaceCube() : c;
	}
	function getProgress(facelet, method) {
		switch (method) {
			case "cfop": return getProgressNAxis(facelet, getCFOPProgress, 6);
			case "fp": return getProgressNAxis(facelet, getFPProgress, 6);
			case "cf4op": return getProgressNAxis(facelet, getCF4OPProgress, 6);
			case "roux": return getProgressNAxis(facelet, getRouxProgress, 24);
			case "cf4o2p2": return getProgressNAxis(facelet, getCF4O2P2Progress, 6);
			case "cf3zb": return getProgressNAxis(facelet, getCF3ZBProgress, 6);
			case "n": return getProgressNAxis(facelet, solvedProgress, 1);
		}
	}
	function getStepNames(method) {
		switch (method) {
			case "cfop": return [
				"pll",
				"oll",
				"f2l",
				"cross"
			];
			case "fp": return ["op", "cf"];
			case "cf4op": return [
				"pll",
				"oll",
				"f2l-4",
				"f2l-3",
				"f2l-2",
				"f2l-1",
				"cross"
			];
			case "roux": return [
				"l6e",
				"cmll",
				"sb",
				"fb"
			];
			case "cf4o2p2": return [
				"pll",
				"cpll",
				"oll",
				"eoll",
				"f2l-4",
				"f2l-3",
				"f2l-2",
				"f2l-1",
				"cross"
			];
			case "cf3zb": return [
				"zbll",
				"zbf2l",
				"f2l-3",
				"f2l-2",
				"f2l-1",
				"cross"
			];
			case "n": return ["solve"];
		}
	}
	function getStepCount(method) {
		var stepNames = getStepNames(method);
		return stepNames ? stepNames.length : 0;
	}
	function getPrettyReconstruction(rawMoves, method) {
		var prettySolve = "";
		var prettyMoves = getPrettyMoves(rawMoves);
		var stepNames = getStepNames(method).reverse();
		var totalMoves = 0;
		for (var i = 0; i < prettyMoves.length; i++) {
			totalMoves += prettyMoves[i][1];
			prettySolve += prettyMoves[i][0].replace(/ /g, "") + (stepNames[i] ? " // " + stepNames[i] + " " + prettyMoves[i][1] + " move(s)" : "") + "\n";
		}
		return {
			prettySolve,
			totalMoves
		};
	}
	var scrambleReg = /^([\d]+(?:-\d+)?)?([FRUBLDfrubldzxySME])(?:([w])|&sup([\d]);)?([2'])?$/;
	function parseScramble(scramble, moveMap, addPreScr) {
		scramble = scramble || "";
		if (addPreScr) scramble = kernel.getProp(tools.isCurTrainScramble() ? "preScrT" : "preScr") + " " + scramble;
		var moveseq = [];
		var moves = scramble.split(" ");
		var m, w, f, p;
		for (var s = 0; s < moves.length; s++) {
			m = scrambleReg.exec(moves[s]);
			if (m == null) continue;
			f = "FRUBLDfrubldzxySME".indexOf(m[2]);
			if (f > 14) {
				p = "2'".indexOf(m[5] || "X") + 2;
				f = [
					0,
					4,
					5
				][f % 3];
				moveseq.push([
					moveMap.indexOf("FRUBLD".charAt(f)),
					2,
					p
				]);
				moveseq.push([
					moveMap.indexOf("FRUBLD".charAt(f)),
					1,
					4 - p
				]);
				continue;
			}
			w = (m[1] || "").split("-");
			var w2 = ~~w[1] || -1;
			w = f < 12 ? ~~w[0] || ~~m[4] || (m[3] == "w" || f > 5) && 2 || 1 : -1;
			p = (f < 12 ? 1 : -1) * ("2'".indexOf(m[5] || "X") + 2);
			moveseq.push([
				moveMap.indexOf("FRUBLD".charAt(f % 6)),
				w,
				p,
				w2
			]);
		}
		return moveseq;
	}
	function getConjMoves(moves, inv, conj) {
		if (!moves) return moves;
		if (conj === void 0) conj = getPreConj();
		if (inv) conj = mathlib.CubieCube.rotMulI[0][conj || 0];
		return moves.replace(/[URFDLB]/g, function(face) {
			return "URFDLB".charAt(mathlib.CubieCube.rotMulM[conj]["URFDLB".indexOf(face) * 3] / 3);
		});
	}
	function getPreConj() {
		var preScr = kernel.getProp(tools.isCurTrainScramble() ? "preScrT" : "preScr", "").split(" ");
		var cc = new mathlib.CubieCube();
		for (var i = 0; i < preScr.length; i++) cc.selfMoveStr(preScr[i]);
		return cc.ori || 0;
	}
	function getAlgCubingUrl(alg, setup, puzzle) {
		var dim = {
			"222": "2x2x2",
			"333": "3x3x3",
			"444": "4x4x4",
			"555": "5x5x5",
			"666": "6x6x6",
			"777": "7x7x7"
		};
		if (puzzle && !dim[puzzle] && typeof tools != "undefined" && tools.puzzleType) puzzle = tools.puzzleType(puzzle) || puzzle;
		if (!puzzle || !dim[puzzle]) puzzle = typeof tools != "undefined" && tools.getCurPuzzle && tools.getCurPuzzle() || "333";
		var url = "https://alg.cubing.net/?alg=" + encodeURIComponent(alg || "") + "&setup=" + encodeURIComponent(setup || "");
		if (dim[puzzle]) url += "&puzzle=" + dim[puzzle];
		return url;
	}
	function cornersEqual(a, b) {
		for (var i = 0; i < 8; i++) if (a.ca[i] != b.ca[i]) return false;
		return true;
	}
	function cubiesMatch(a, b, cornerOnly) {
		return cornerOnly ? cornersEqual(a, b) : a.isEqual(b);
	}
	function isFaceletSolved(facelet, cornerOnly) {
		if (!cornerOnly) return facelet == mathlib.SOLVED_FACELET;
		for (var i = 0; i < 54; i++) if (i % 9 % 2 == 0 && facelet[i] != mathlib.SOLVED_FACELET[i]) return false;
		return true;
	}
	return {
		getProgress,
		getStepNames,
		getStepCount,
		getStepProgress,
		getPrettyMoves,
		getPrettyReconstruction,
		moveSeq2str,
		getScrambledState,
		identStep,
		getIdentData,
		parseScramble,
		getConjMoves,
		getPreConj,
		getAlgCubingUrl,
		cubiesMatch,
		isFaceletSolved
	};
})();
//#endregion
//#region src/vendor/cstimer/image.js
var image$1 = (function() {
	var img;
	var hsq3 = Math.sqrt(3) / 2;
	var PI = Math.PI;
	var Rotate = $$2.ctxRotate;
	var Transform = $$2.ctxTransform;
	var drawPolygon = $$2.ctxDrawPolygon;
	var clkImage = (function() {
		function drawClock(svg, color, trans, time) {
			var points = Transform(Rotate([[
				1,
				1,
				0,
				-1,
				-1,
				-1,
				1,
				0
			], [
				0,
				-1,
				-8,
				-1,
				0,
				1,
				1,
				0
			]], time / 6 * PI), trans);
			var x = points[0];
			var y = points[1];
			svg.addElem("<circle cx=\"" + x[7] + "\" cy=\"" + y[7] + "\" r=\"" + trans[0] * 9 + "\" style=\"fill:" + color + "\" />");
			var path = [];
			path.push("M" + x[0] + " " + y[0]);
			path.push("Q" + x[1] + " " + y[1] + "," + x[2] + " " + y[2]);
			path.push("Q" + x[3] + " " + y[3] + "," + x[4] + " " + y[4]);
			path.push("C" + x[5] + " " + y[5] + "," + x[6] + " " + y[6] + "," + x[0] + " " + y[0]);
			svg.addElem("<path d=\"" + path.join(" ") + "\" style=\"fill:" + colors[3] + ";stroke:" + colors[0] + "\" />");
		}
		function drawButton(svg, color, trans) {
			var points = Transform([[0], [0]], trans);
			svg.addElem("<circle cx=\"" + points[0][0] + "\" cy=\"" + points[1][0] + "\" r=\"" + trans[0] * 3 + "\" style=\"fill:" + color + ";stroke:#000;\" />");
		}
		var width = 3;
		var movere = /([UD][RL]|ALL|[UDRLy]|all)(?:(\d[+-]?)|\((\d[+-]?),(\d[+-]?)\))?/;
		var movestr = [
			"UR",
			"DR",
			"DL",
			"UL",
			"U",
			"R",
			"D",
			"L",
			"ALL"
		];
		var colors = [
			"#f00",
			"#37b",
			"#5cf",
			"#ff0",
			"#850"
		];
		return function(svg, moveseq) {
			colors = kernel.getProp("colclk").match(colre);
			var moves = moveseq.split(/\s+/);
			var moveArr = clock.moveArr;
			var flip = 9;
			var buttons = [
				0,
				0,
				0,
				0
			];
			var clks = [
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0
			];
			for (var i = 0; i < moves.length; i++) {
				var m = movere.exec(moves[i]);
				if (!m) continue;
				if (m[0] == "y2") {
					flip = 9 - flip;
					continue;
				}
				var axis = movestr.indexOf(m[1]) + flip;
				if (m[2] == void 0 && m[3] == void 0) {
					buttons[axis % 9] = 1;
					continue;
				}
				var power;
				var actions = [];
				if (m[1] == "all") {
					power = ~~m[2][0] * (m[2][1] == "+" ? -1 : 1) + 12;
					actions.push(17 - flip, power);
				} else if (m[2]) {
					power = ~~m[2][0] * (m[2][1] == "+" ? 1 : -1) + 12;
					actions.push(axis, power);
				} else {
					power = ~~m[3][0] * (m[3][1] == "+" ? 1 : -1) + 12;
					actions.push(axis, power);
					power = ~~m[4][0] * (m[4][1] == "+" ? -1 : 1) + 12;
					axis = (10 - axis % 9) % 4 + 4 + 9 - flip;
					actions.push(axis, power);
				}
				for (var k = 0; k < actions.length; k += 2) for (var j = 0; j < 14; j++) clks[j] = (clks[j] + moveArr[actions[k]][j] * actions[k + 1]) % 12;
			}
			clks = [
				clks[0],
				clks[3],
				clks[6],
				clks[1],
				clks[4],
				clks[7],
				clks[2],
				clks[5],
				clks[8],
				12 - clks[2],
				clks[10],
				12 - clks[8],
				clks[9],
				clks[11],
				clks[13],
				12 - clks[0],
				clks[12],
				12 - clks[6]
			];
			buttons = [
				buttons[3],
				buttons[2],
				buttons[0],
				buttons[1],
				1 - buttons[0],
				1 - buttons[1],
				1 - buttons[3],
				1 - buttons[2]
			];
			svg.width = 375;
			svg.height = 180;
			var y = [
				10,
				30,
				50
			];
			var x = [
				10,
				30,
				50,
				75,
				95,
				115
			];
			for (var ii = 0; ii < 18; ii++) {
				var i = (ii + flip) % 18;
				drawClock(svg, [colors[1], colors[2]][~~(ii / 9)], [
					width,
					x[~~(i / 3)],
					y[i % 3]
				], clks[ii]);
			}
			y = [20, 40];
			x = [
				20,
				40,
				85,
				105
			];
			for (var i = 0; i < 8; i++) drawButton(svg, [colors[4], colors[3]][buttons[i]], [
				width,
				x[~~(i / 2)],
				y[i % 2]
			]);
		};
	})();
	var sq1Image = (function() {
		var sqa = hsq3 + 1;
		var sqb = sqa * Math.sqrt(2);
		var ep = [[
			0,
			-.5,
			.5
		], [
			0,
			-sqa,
			-sqa
		]];
		var cp = [[
			0,
			-.5,
			-sqa,
			-sqa
		], [
			0,
			-sqa,
			-sqa,
			-.5
		]];
		var cpr = [[
			0,
			-.5,
			-sqa
		], [
			0,
			-sqa,
			-sqa
		]];
		var cpl = [[
			0,
			-sqa,
			-sqa
		], [
			0,
			-sqa,
			-.5
		]];
		var eps = Transform(ep, [
			.66,
			0,
			0
		]);
		var cps = Transform(cp, [
			.66,
			0,
			0
		]);
		var cprs = Transform(cpr, [
			.66,
			0,
			0
		]);
		var cpls = Transform(cpl, [
			.66,
			0,
			0
		]);
		var udcol = "UD";
		var ecol = "R-B-L-F-F-L-B-R-";
		var ccol = "RBBLLFFRRFFLLBBR";
		var colors = {
			"U": "#ff0",
			"R": "#f80",
			"F": "#0f0",
			"D": "#fff",
			"L": "#f00",
			"B": "#00f"
		};
		var width = 45;
		var movere = /^\s*\(\s*(-?\d+),\s*(-?\d+)\s*\)\s*$/;
		function doMove(move, sc) {
			if (move[0] != 0) sc.doMove(move[0]);
			if (move[1] != 0) sc.doMove(-move[1]);
			if (move[2] != 0) sc.doMove(0);
		}
		function drawPosit(svg, sc, colors, sq2sc, half) {
			for (var i = 0; i < (half ? 12 : 24); i++) {
				var trans = i < 12 ? [
					width,
					sqb,
					sqb
				] : [
					width,
					sqb * 3,
					sqb
				];
				var val = sc.pieceAt(i);
				var colorUD = colors[udcol[val >= 8 ? 1 : 0]];
				var cRot = -(i < 12 ? i - 1 : i - 6) * PI / 6;
				var eRot = -(i < 12 ? i : i - 5) * PI / 6;
				if (val % 2 == 1) {
					if (sq2sc) {
						var cLR = sq2sc.pieceAt(i) & 1;
						cRot += cLR ? 0 : PI / 6;
						drawPolygon(svg, colors[ccol[val - cLR]], Rotate(cLR ? cpr : cpl, cRot), trans);
						drawPolygon(svg, colorUD, Rotate(cLR ? cprs : cpls, cRot), trans);
					} else {
						drawPolygon(svg, colors[ccol[val - 1]], Rotate(cpr, cRot), trans);
						drawPolygon(svg, colors[ccol[val]], Rotate(cpl, cRot), trans);
						drawPolygon(svg, colorUD, Rotate(cps, cRot), trans);
						i++;
					}
				} else {
					drawPolygon(svg, colors[ecol[val]], Rotate(ep, eRot), trans);
					drawPolygon(svg, colorUD, Rotate(eps, eRot), trans);
				}
			}
		}
		function llImage(sc, sq2sc, img) {
			var svg = new $$2.svg();
			var cols = kernel.getProp("colsq1").match(colre);
			colors = {
				"U": cols[0],
				"R": cols[1],
				"F": cols[2],
				"D": cols[3],
				"L": cols[4],
				"B": cols[5]
			};
			svg.width = 2 * sqb * width;
			svg.height = 2 * sqb * width;
			drawPosit(svg, sc, colors, sq2sc, true);
			if (img) img.attr("src", "data:image/svg+xml;base64," + btoa(svg.render()));
			return svg;
		}
		function scrImage(svg, moveseq, isSQ2) {
			var cols = kernel.getProp("colsq1").match(colre);
			colors = {
				"U": cols[0],
				"R": cols[1],
				"F": cols[2],
				"D": cols[3],
				"L": cols[4],
				"B": cols[5]
			};
			var sc = new sq1.SqCubie();
			var sq2sc = null;
			if (isSQ2) {
				sq2sc = new sq1.SqCubie();
				sq2sc.ul = sq2sc.ur = 65552;
				sq2sc.dl = sq2sc.dr = 1048832;
			}
			var moves = moveseq.split("/");
			var tomove = [];
			for (var i = 0; i < moves.length; i++) {
				if (/^\s*$/.exec(moves[i])) {
					tomove.push([
						0,
						0,
						1
					]);
					continue;
				}
				var m = movere.exec(moves[i]);
				tomove.push([
					(~~m[1] + 12) % 12,
					(~~m[2] + 12) % 12,
					1
				]);
			}
			tomove.push([
				0,
				0,
				1
			]);
			for (var i = 0; i < tomove.length; i++) {
				doMove(tomove[i], sc);
				sq2sc && doMove(tomove[i], sq2sc);
			}
			svg.width = 4 * sqb * width;
			svg.height = 2 * sqb * width;
			for (var i = 0; i < 2; i++) {
				var trans = i == 0 ? [
					width,
					sqb,
					sqb + sqa
				] : [
					width,
					sqb * 3,
					sqb - sqa - .7
				];
				drawPolygon(svg, colors["L"], [[
					-sqa,
					-sqa,
					-.5,
					-.5
				], [
					0,
					.7,
					.7,
					0
				]], trans);
				if (sc.ml == 0) drawPolygon(svg, colors["L"], [[
					sqa,
					sqa,
					-.5,
					-.5
				], [
					0,
					.7,
					.7,
					0
				]], trans);
				else drawPolygon(svg, colors["R"], [[
					hsq3,
					hsq3,
					-.5,
					-.5
				], [
					0,
					.7,
					.7,
					0
				]], trans);
			}
			drawPosit(svg, sc, colors, sq2sc);
			var recons = [];
			for (var i = 0; i < moves.length; i++) {
				if (/^\s*$/.exec(moves[i])) {
					recons.push("/");
					continue;
				}
				var m = movere.exec(moves[i]);
				if (~~m[1]) recons.push("(" + m[1] + ",0)");
				if (~~m[2]) recons.push("(0," + m[2] + ")");
				recons.push("/");
			}
			if (recons.at(-1) == "/") recons.pop();
			else recons.push("/");
			return [
				"~",
				recons,
				"sq1"
			];
		}
		return {
			scrImage,
			llImage
		};
	})();
	var nnnImage = (function() {
		var width = 30;
		var posit = [];
		var colors = [
			"#ff0",
			"#fa0",
			"#00f",
			"#fff",
			"#f00",
			"#0d0"
		];
		function face(svg, f, size) {
			var offx = 10 / 9, offy = 10 / 9;
			if (f == 0) {
				offx *= size;
				offy *= size * 2;
			} else if (f == 1) {
				offx *= 0;
				offy *= size;
			} else if (f == 2) {
				offx *= size * 3;
				offy *= size;
			} else if (f == 3) {
				offx *= size;
				offy *= 0;
			} else if (f == 4) {
				offx *= size * 2;
				offy *= size;
			} else if (f == 5) {
				offx *= size;
				offy *= size;
			}
			for (var i = 0; i < size; i++) {
				var x = f == 1 || f == 2 ? size - 1 - i : i;
				for (var j = 0; j < size; j++) {
					var y = f == 0 ? size - 1 - j : j;
					drawPolygon(svg, colors[posit[(f * size + y) * size + x]], [[
						i,
						i,
						i + 1,
						i + 1
					], [
						j,
						j + 1,
						j + 1,
						j
					]], [
						width,
						offx + .1,
						offy + .1
					]);
				}
			}
		}
		/**
		*  f: face, [ D L B U R F ]
		*  d: which slice, in [0, size-1)
		*  q: [  2 ']
		*/
		function doslice(f, d, q, size) {
			var f1, f2, f3, f4;
			var s2 = size * size;
			var c, i, j, k;
			if (f > 5) f -= 6;
			for (k = 0; k < q; k++) {
				for (i = 0; i < size; i++) {
					if (f == 0) {
						f1 = 6 * s2 - size * d - size + i;
						f2 = 2 * s2 - size * d - 1 - i;
						f3 = 3 * s2 - size * d - 1 - i;
						f4 = 5 * s2 - size * d - size + i;
					} else if (f == 1) {
						f1 = 3 * s2 + d + size * i;
						f2 = 3 * s2 + d - size * (i + 1);
						f3 = s2 + d - size * (i + 1);
						f4 = 5 * s2 + d + size * i;
					} else if (f == 2) {
						f1 = 3 * s2 + d * size + i;
						f2 = 4 * s2 + size - 1 - d + size * i;
						f3 = d * size + size - 1 - i;
						f4 = 2 * s2 - 1 - d - size * i;
					} else if (f == 3) {
						f1 = 4 * s2 + d * size + size - 1 - i;
						f2 = 2 * s2 + d * size + i;
						f3 = s2 + d * size + i;
						f4 = 5 * s2 + d * size + size - 1 - i;
					} else if (f == 4) {
						f1 = 6 * s2 - 1 - d - size * i;
						f2 = size - 1 - d + size * i;
						f3 = 2 * s2 + size - 1 - d + size * i;
						f4 = 4 * s2 - 1 - d - size * i;
					} else if (f == 5) {
						f1 = 4 * s2 - size - d * size + i;
						f2 = 2 * s2 - size + d - size * i;
						f3 = s2 - 1 - d * size - i;
						f4 = 4 * s2 + d + size * i;
					}
					c = posit[f1];
					posit[f1] = posit[f2];
					posit[f2] = posit[f3];
					posit[f3] = posit[f4];
					posit[f4] = c;
				}
				if (d == 0) for (i = 0; i + i < size; i++) for (j = 0; j + j < size - 1; j++) {
					f1 = f * s2 + i + j * size;
					f3 = f * s2 + (size - 1 - i) + (size - 1 - j) * size;
					if (f < 3) {
						f2 = f * s2 + (size - 1 - j) + i * size;
						f4 = f * s2 + j + (size - 1 - i) * size;
					} else {
						f4 = f * s2 + (size - 1 - j) + i * size;
						f2 = f * s2 + j + (size - 1 - i) * size;
					}
					c = posit[f1];
					posit[f1] = posit[f2];
					posit[f2] = posit[f3];
					posit[f3] = posit[f4];
					posit[f4] = c;
				}
			}
		}
		function genPosit(size, moveseq) {
			var cnt = 0;
			posit = [];
			for (var i = 0; i < 6; i++) for (var f = 0; f < size * size; f++) posit[cnt++] = i;
			var moves = cubeutil.parseScramble(moveseq, "DLBURF", true);
			for (var s = 0; s < moves.length; s++) {
				for (var d = 0; d < moves[s][1]; d++) doslice(moves[s][0], d, moves[s][2], size);
				if (moves[s][1] == -1) {
					for (var d = 0; d < size - 1; d++) doslice(moves[s][0], d, -moves[s][2], size);
					doslice((moves[s][0] + 3) % 6, 0, moves[s][2] + 4, size);
				}
			}
			return posit;
		}
		function draw(svg, size, moveseq) {
			genPosit(size, moveseq);
			svg.width = (39 * size / 9 + .2) * width;
			svg.height = (29 * size / 9 + .2) * width;
			colors = kernel.getProp("colcube").match(colre);
			for (var i = 0; i < 6; i++) face(svg, i, size);
			var moves = moveseq.split(/\s+/);
			var recons = [];
			for (var i = 0; i < moves.length; i++) if (moves[i]) recons.push(moves[i]);
			return [
				"~",
				recons,
				[
					size,
					size,
					size
				].join("")
			];
		}
		return {
			draw,
			genPosit
		};
	})();
	var mrblImage = (function() {
		var width = 30;
		var posit = [];
		var colors = [];
		function getBoundOffset(f, size, i, j) {
			if (i != 0 && i != size - 1 && j != 0 && j != size - 1) return [
				-1,
				-1,
				-1,
				-1
			];
			var D = 0, L = 4, B = 8, U = 12, R = 16, F = 20;
			var neighbor = [
				[
					F + 1,
					B + 1,
					L + 1,
					R + 1
				],
				[
					U + 2,
					D + 2,
					B + 3,
					F + 2
				],
				[
					U + 0,
					D + 1,
					R + 3,
					L + 2
				],
				[
					B + 0,
					F + 0,
					L + 0,
					R + 0
				],
				[
					U + 3,
					D + 3,
					F + 3,
					B + 2
				],
				[
					U + 1,
					D + 0,
					L + 3,
					R + 2
				]
			][f];
			var isBound = [
				i == 0,
				i == size - 1,
				j == 0,
				j == size - 1
			];
			var ret = [
				-1,
				-1,
				-1,
				-1
			];
			for (var i1 = 0; i1 < 4; i1++) {
				if (!isBound[i1]) continue;
				var idx = [
					size - 1 - j,
					j,
					i,
					size - 1 - i
				][i1];
				var rij = [
					[0, idx],
					[size - 1, size - 1 - idx],
					[size - 1 - idx, 0],
					[idx, size - 1]
				][neighbor[i1] & 3];
				var fidx = neighbor[i1] >> 2;
				if (fidx == 1 || fidx == 2) rij[1] = size - 1 - rij[1];
				if (fidx == 0) rij[0] = size - 1 - rij[0];
				ret[i1] = posit[fidx * size * size + rij[0] * size + rij[1]];
			}
			return ret;
		}
		function face(svg, f, size) {
			var offx = (size + 1) / size, offy = (size + 1) / size;
			if (f == 0) {
				offx *= size;
				offy *= size * 2;
			} else if (f == 1) {
				offx *= 0;
				offy *= size;
			} else if (f == 2) {
				offx *= size * 3;
				offy *= size;
			} else if (f == 3) {
				offx *= size;
				offy *= 0;
			} else if (f == 4) {
				offx *= size * 2;
				offy *= size;
			} else if (f == 5) {
				offx *= size;
				offy *= size;
			}
			var heights = [
				.45,
				.15,
				.3,
				-.45,
				-.15,
				-.3
			];
			for (var i = 0; i < size; i++) {
				var x = f == 1 || f == 2 ? size - 1 - i : i;
				for (var j = 0; j < size; j++) {
					var y = f == 0 ? size - 1 - j : j;
					var off = getBoundOffset(f, size, j, i);
					for (var i1 = 0; i1 < 4; i1++) off[i1] = off[i1] == -1 ? 0 : heights[off[i1]];
					drawPolygon(svg, colors[posit[(f * size + y) * size + x]], [[
						i - off[2],
						i - off[2],
						i + 1 + off[3],
						i + 1 + off[3]
					], [
						j - off[0],
						j + 1 + off[1],
						j + 1 + off[1],
						j - off[0]
					]], [
						width,
						offx + .6,
						offy + .6
					]);
				}
			}
		}
		return function(svg, size, moveseq) {
			posit = nnnImage.genPosit(size, moveseq);
			svg.width = (4 * size + 4 + .2) * width;
			svg.height = (3 * size + 3 + .2) * width;
			colors = kernel.getProp("colcube").match(colre);
			for (var i = 0; i < 6; i++) face(svg, i, size);
		};
	})();
	var gearImage = (function() {
		var moveMaps = [
			[
				3,
				2,
				1,
				0,
				4,
				11,
				12,
				13,
				14,
				15,
				16,
				5,
				6,
				7,
				8,
				9,
				10,
				68,
				69,
				19,
				20,
				89,
				73,
				74,
				75,
				94,
				95,
				82,
				28,
				29,
				30,
				100,
				101,
				25,
				85,
				86,
				36,
				37,
				21,
				90,
				91,
				92,
				26,
				27,
				99,
				45,
				46,
				47,
				32,
				33,
				42,
				51,
				52,
				53,
				54,
				55,
				56,
				57,
				58,
				59,
				60,
				61,
				62,
				63,
				64,
				65,
				66,
				67,
				17,
				18,
				70,
				71,
				38,
				22,
				23,
				24,
				43,
				44,
				31,
				79,
				80,
				81,
				49,
				50,
				76,
				34,
				35,
				87,
				88,
				72,
				39,
				40,
				41,
				77,
				78,
				48,
				96,
				97,
				98,
				83,
				84,
				93
			],
			[
				0,
				52,
				2,
				54,
				38,
				40,
				41,
				11,
				59,
				60,
				61,
				46,
				47,
				56,
				14,
				15,
				16,
				20,
				19,
				18,
				17,
				21,
				28,
				29,
				30,
				31,
				32,
				33,
				22,
				23,
				24,
				25,
				26,
				27,
				34,
				87,
				36,
				85,
				55,
				57,
				58,
				45,
				99,
				100,
				101,
				63,
				64,
				96,
				48,
				49,
				50,
				51,
				1,
				53,
				3,
				89,
				97,
				98,
				62,
				8,
				9,
				10,
				91,
				92,
				5,
				65,
				66,
				67,
				68,
				69,
				70,
				71,
				72,
				73,
				74,
				75,
				76,
				77,
				78,
				79,
				80,
				81,
				82,
				83,
				84,
				37,
				86,
				35,
				88,
				4,
				12,
				13,
				39,
				93,
				94,
				95,
				6,
				7,
				90,
				42,
				43,
				44
			],
			[
				0,
				1,
				52,
				51,
				72,
				5,
				6,
				7,
				74,
				75,
				14,
				56,
				57,
				58,
				80,
				81,
				65,
				71,
				18,
				69,
				20,
				4,
				15,
				16,
				73,
				25,
				26,
				27,
				9,
				10,
				22,
				76,
				77,
				78,
				37,
				36,
				35,
				34,
				38,
				45,
				46,
				47,
				48,
				49,
				50,
				39,
				40,
				41,
				42,
				43,
				44,
				3,
				2,
				53,
				54,
				21,
				11,
				12,
				13,
				23,
				24,
				8,
				62,
				63,
				64,
				29,
				30,
				59,
				68,
				19,
				70,
				17,
				55,
				66,
				67,
				79,
				31,
				32,
				33,
				60,
				61,
				28,
				82,
				83,
				84,
				85,
				86,
				87,
				88,
				89,
				90,
				91,
				92,
				93,
				94,
				95,
				96,
				97,
				98,
				99,
				100,
				101
			]
		];
		return function(svg, moveseq) {
			var width = 30;
			svg.width = 13.2 * width;
			svg.height = (87 / 9 + .2) * width;
			var state = [];
			for (var i = 0; i < 102; i++) state[i] = ~~(i / 17);
			moveseq.replace(/([URF])([23456]?)('?)/g, function(m, g1, g2, g3) {
				var move = moveMaps["URF".indexOf(g1)];
				var pow = ~~g2 || 1;
				pow = g3 ? 12 - pow : pow;
				for (var p = 0; p < pow; p++) {
					var tmp = [];
					for (var i = 0; i < 102; i++) tmp[i] = state[move[i]];
					state = tmp;
				}
			});
			var colors = kernel.getProp("colcube").match(colre);
			for (var f = 0; f < 6; f++) {
				var offx = 10 / 3 * [
					1,
					2,
					1,
					1,
					0,
					3
				][f], offy = 10 / 3 * [
					0,
					1,
					1,
					2,
					1,
					1
				][f];
				for (var s = 0; s < 5; s++) {
					var x = [
						0,
						2,
						0,
						2,
						1
					][s], y = [
						0,
						0,
						2,
						2,
						1
					][s];
					drawPolygon(svg, colors[(state[f * 17 + s] + 3) % 6], [[
						x,
						x,
						x + 1,
						x + 1
					], [
						y,
						y + 1,
						y + 1,
						y
					]], [
						width,
						offx + .1,
						offy + .1
					]);
				}
				for (var s = 0; s < 4; s++) {
					var c1 = state[f * 17 + s * 3 + 5];
					var c2 = state[f * 17 + s * 3 + 6];
					var c3 = state[f * 17 + s * 3 + 7];
					var rot = [
						[
							1,
							0,
							0,
							0,
							1,
							0
						],
						[
							0,
							-1,
							3,
							1,
							0,
							0
						],
						[
							-1,
							0,
							3,
							0,
							-1,
							3
						],
						[
							0,
							1,
							0,
							-1,
							0,
							3
						]
					][s];
					if (c1 == c2 && c2 == c3) drawPolygon(svg, colors[(c1 + 3) % 6], Transform([[
						1,
						1,
						2,
						2
					], [
						0,
						1,
						1,
						0
					]], rot), [
						width,
						offx + .1,
						offy + .1
					]);
					else if (c1 == c2) {
						drawPolygon(svg, colors[(c1 + 3) % 6], Transform([[
							1,
							1,
							2,
							1.5
						], [
							0,
							1,
							1,
							0
						]], rot), [
							width,
							offx + .1,
							offy + .1
						]);
						drawPolygon(svg, colors[(c3 + 3) % 6], Transform([[
							1.5,
							2,
							2
						], [
							0,
							1,
							0
						]], rot), [
							width,
							offx + .1,
							offy + .1
						]);
					} else {
						drawPolygon(svg, colors[(c1 + 3) % 6], Transform([[
							1,
							1,
							1.5
						], [
							0,
							1,
							0
						]], rot), [
							width,
							offx + .1,
							offy + .1
						]);
						drawPolygon(svg, colors[(c3 + 3) % 6], Transform([[
							1.5,
							1,
							2,
							2
						], [
							0,
							1,
							1,
							0
						]], rot), [
							width,
							offx + .1,
							offy + .1
						]);
					}
				}
			}
			return svg;
		};
	})();
	/**
	*	last layer image
	*	pieces = U1U2...U9F1..F3R1..L3
	*	   B3 B2 B1
	*	L1 U1 U2 U3 R3
	*	L2 U4 U5 U6 R2
	*	L3 U7 U8 U9 R1
	*	   F1 F2 F3
	*/
	var llImage = (function() {
		function drawImage(pieces, arrows, img) {
			var svg = new $$2.svg();
			var colors = kernel.getProp("colcube").match(colre);
			var dim = 3;
			if (pieces.length == 12) dim = 2;
			else if (pieces.length == 32) dim = 4;
			var width = 50;
			svg.width = (dim + 1.2) * width;
			svg.height = (dim + 1.2) * width;
			for (var i = 0; i < dim * dim; i++) {
				var x = i % dim + .5;
				var y = ~~(i / dim) + .5;
				drawPolygon(svg, colors["DLBURF".indexOf(pieces[i])] || "#888", [[
					x,
					x + 1,
					x + 1,
					x
				], [
					y,
					y,
					y + 1,
					y + 1
				]], [
					width,
					.1,
					.1
				]);
			}
			for (var i = 0; i < dim * 4; i++) {
				var x = i % dim;
				var rot = ~~(i / dim);
				drawPolygon(svg, colors["DLBURF".indexOf(pieces[i + dim * dim])] || "#888", Rotate([[
					x - dim / 2,
					x - dim / 2 + 1,
					(x - dim / 2 + 1) * .9,
					(x - dim / 2) * .9
				], [
					dim / 2 + .05,
					dim / 2 + .05,
					dim / 2 + .5,
					dim / 2 + .5
				]], -rot * PI / 2), [
					width,
					.6 + dim / 2,
					.6 + dim / 2
				]);
			}
			arrows = arrows || [];
			for (var i = 0; i < arrows.length; i++) {
				var arrow = arrows[i];
				var x1, y1, x2, y2;
				if (typeof arrow[0] === "number") {
					x1 = arrow[0] % dim + 1.1;
					y1 = ~~(arrow[0] / dim) + 1.1;
				} else {
					x1 = arrow[0][0] + 1.1;
					y1 = arrow[0][1] + 1.1;
				}
				if (typeof arrow[1] === "number") {
					x2 = arrow[1] % dim + 1.1;
					y2 = ~~(arrow[1] / dim) + 1.1;
				} else {
					x2 = arrow[1][0] + 1.1;
					y2 = arrow[1][1] + 1.1;
				}
				var length = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
				drawPolygon(svg, "#000", Rotate([[
					.2,
					length - .4,
					length - .4,
					length - .1,
					length - .4,
					length - .4,
					.2
				], [
					.05,
					.05,
					.15,
					0,
					-.15,
					-.05,
					-.05
				]], Math.atan2(y2 - y1, x2 - x1)), [
					width,
					x1,
					y1
				]);
			}
			if (img) img.attr("src", "data:image/svg+xml;base64," + btoa(svg.render()));
			return svg;
		}
		function draw(size, moveseq, img) {
			var state = nnnImage.genPosit(size, moveseq);
			var pieces = [];
			for (var i = 0; i < size * size; i++) pieces.push("DLBURF"[state[3 * size * size + i]]);
			for (var j = 0; j < 4; j++) {
				var offset = [
					5,
					4,
					2,
					1
				][j] * size * size;
				for (var i = 0; i < size; i++) {
					var ii = [
						i,
						i,
						size - 1 - i,
						size - 1 - i
					][j];
					pieces.push("DLBURF"[state[offset + ii]]);
				}
			}
			return drawImage(pieces.join(""), [], img);
		}
		return {
			drawImage,
			draw
		};
	})();
	/**
	*	cube image of URF faces
	*	pieces = U1U2...U9R1..R9F1..F9
	*	U1 U3 R3 R9
	*	U7 U9 R1 R7
	*	F1 F3
	* 	F7 F9
	*/
	var face3Image = (function() {
		var width = 20;
		var gap = 1;
		var ftrans = [
			[
				width * hsq3,
				-width * hsq3,
				(width * 3 + gap) * hsq3,
				width / 2,
				width / 2,
				0
			],
			[
				width * hsq3,
				0,
				(width * 3 + gap * 2) * hsq3,
				-width / 2,
				width,
				width * 3 + gap * 1.5
			],
			[
				width * hsq3,
				0,
				0,
				width / 2,
				width,
				width * 1.5 + gap * 1.5
			]
		];
		function drawImage(pieces, img) {
			var svg = new $$2.svg();
			var colors = kernel.getProp("colcube").match(colre);
			svg.width = (6 * width + gap * 2) * hsq3;
			svg.height = 6 * width + gap * 1.5;
			for (var i = 0; i < 27; i++) {
				var x = i % 3;
				var y = ~~(i / 3) % 3;
				drawPolygon(svg, colors["DLBURF".indexOf(pieces[i])] || "#888", [[
					x,
					x + 1,
					x + 1,
					x
				], [
					y,
					y,
					y + 1,
					y + 1
				]], ftrans[~~(i / 9)]);
			}
			if (img) img.attr("src", "data:image/svg+xml;base64," + btoa(svg.render()));
			return svg;
		}
		return drawImage;
	})();
	/**
	*  F1 R1 L1 F2 F3 F4 R L F5..
	*/
	var pyrllImage = (function() {
		var width = 20;
		function drawImage(pieces, img) {
			var svg = new $$2.svg();
			svg.width = 6 * hsq3 * width;
			svg.height = 6 * hsq3 * width;
			var colors = kernel.getProp("colpyr").match(colre);
			var idx = 0;
			for (var i = 0; i < 3; i++) for (var f = 0; f < 3; f++) for (var j = 0; j < i * 2 + 1; j++) {
				var piece;
				var x = -hsq3 * i + hsq3 * j;
				var y = i / 2;
				if (j % 2 == 0) piece = [[
					x,
					x - hsq3,
					x + hsq3
				], [
					y,
					y + .5,
					y + .5
				]];
				else piece = [[
					x - hsq3,
					x,
					x + hsq3
				], [
					y,
					y + .5,
					y
				]];
				drawPolygon(svg, colors["FLRD".indexOf(pieces[idx])] || "#888", Rotate(piece, PI / 3 * 4 * f), [
					width,
					3 * hsq3,
					3 + (6 * hsq3 - 4.5) / 2
				]);
				idx++;
			}
			if (img) img.attr("src", "data:image/svg+xml;base64," + btoa(svg.render()));
			return svg;
		}
		return drawImage;
	})();
	var polyhedronImage = (function() {
		var puzzleCache = {};
		return function(svg, type, moveseq, faceNameMask, minArea) {
			var colors = [];
			var moves = [];
			minArea = minArea || 0;
			var gap = .05;
			var puzzle = puzzleCache[type];
			var params = poly3d.getFamousPuzzle(type);
			if (params != null) {
				puzzle = puzzle || poly3d.makePuzzle.apply(poly3d, params.polyParam);
				params.parser = params.parser || poly3d.makePuzzleParser(puzzle);
				moves = params.parser.parseScramble(moveseq);
				gap = params.pieceGap;
				colors = params.colors;
			} else debugger;
			puzzleCache[type] = puzzle;
			var poly2d = poly3d.renderNet(puzzle, gap, minArea);
			var sizes = poly2d[0];
			var polys = poly2d[1];
			var faces = poly2d[2];
			var posit = [];
			for (var i = 0; i < polys.length; i++) posit[i] = polys[i] && polys[i][2];
			for (var midx = 0; midx < moves.length; midx++) {
				var move = moves[midx];
				var moveIdx = puzzle.getTwistyIdx(move[0]);
				if (moveIdx == -1) debugger;
				var perm = puzzle.moveTable[moveIdx];
				var maxPow = puzzle.twistyDetails[moveIdx][1];
				var pow = (move[1] % maxPow + maxPow) % maxPow;
				var posit2 = [];
				for (var i = 0; i < posit.length; i++) {
					var val = i;
					for (var j = 0; j < pow; j++) val = perm[val] < 0 ? val : perm[val];
					posit2[i] = posit[val];
				}
				posit = posit2;
			}
			if (type == "skb") {
				colors = $$2.col2std(kernel.getProp("colskb"), [
					0,
					2,
					4,
					3,
					5,
					1
				]);
				var trans = [
					[
						hsq3,
						-hsq3,
						hsq3 * 2,
						.5,
						.5,
						-1
					],
					[
						hsq3,
						0,
						0,
						-.5,
						1,
						2
					],
					[
						hsq3,
						0,
						0,
						.5,
						1,
						-2
					],
					[
						hsq3,
						0,
						0,
						.5,
						1,
						-2
					],
					[
						hsq3,
						0,
						0,
						.5,
						1,
						-2
					],
					[
						hsq3,
						0,
						0,
						-.5,
						1,
						2
					]
				];
				for (var i = 0; i < 6; i++) for (var j = 0; j < 6; j++) if (j % 3 != 2) trans[i][j] *= 8 / sizes[0];
				for (var i = 0; i < polys.length; i++) {
					if (!polys[i]) continue;
					var poly = Transform(polys[i], trans[polys[i][2]]);
					polys[i][0] = poly[0];
					polys[i][1] = poly[1];
				}
				sizes = [8 * hsq3, 6];
			}
			var scale = Math.min(1.6 / sizes[0], 1 / sizes[1]) * 300;
			svg.width = sizes[0] * scale;
			svg.height = sizes[1] * scale;
			for (var i = 0; i < colors.length; i++) colors[i] = "#" + colors[i].toString(16).padStart(6, "0");
			for (var i = 0; i < posit.length; i++) polys[i] && drawPolygon(svg, colors[posit[i]], polys[i], [
				scale,
				0,
				0,
				0,
				scale,
				0
			]);
			for (var i = 0; i < faces.length; i++) {
				if ((faceNameMask >> i & 1) == 0) continue;
				var face = faces[i];
				svg.addText(face[2].toUpperCase(), [face[0] * scale, face[1] * scale], {
					"font": "20px Arial",
					"fill": kernel.getProp("col-font"),
					"stroke": kernel.getProp("col-board"),
					"stroke-width": "3px"
				});
			}
			var recons = [];
			for (var midx = 0; midx < moves.length; midx++) recons.push(params.parser.move2str(moves[midx]));
			return [
				"~",
				recons,
				type
			];
		};
	})();
	var sldImage = (function() {
		return function(svg, type, size, moveseq) {
			var width = 50;
			var gap = .05;
			var state = [];
			var effect = [
				[1, 0],
				[0, 1],
				[0, -1],
				[-1, 0]
			];
			for (var i = 0; i < size * size; i++) state[i] = i;
			var x = size - 1;
			var y = size - 1;
			var movere = /([ULRD\uFFEA\uFFE9\uFFEB\uFFEC])([\d]?)/;
			moveseq = moveseq.split(" ");
			for (var s = 0; s < moveseq.length; s++) {
				var m = movere.exec(moveseq[s]);
				if (!m) continue;
				var turn = "ULRD￪￩￫￬".indexOf(m[1]) % 4;
				var pow = ~~m[2] || 1;
				var eff = effect[type == "b" ? 3 - turn : turn];
				for (var p = 0; p < pow; p++) {
					mathlib.circle(state, x * size + y, (x + eff[0]) * size + y + eff[1]);
					x += eff[0];
					y += eff[1];
				}
			}
			svg.width = (size + gap * 4) * width;
			svg.height = (size + gap * 4) * width;
			var cols = kernel.getProp("col15p").match(colre);
			cols[size - 1] = cols.at(-1);
			for (var i = 0; i < size; i++) for (var j = 0; j < size; j++) {
				var val = state[j * size + i];
				var colorIdx = Math.min(~~(val / size), val % size);
				val++;
				drawPolygon(svg, cols[colorIdx], [[
					i + gap,
					i + gap,
					i + 1 - gap,
					i + 1 - gap
				], [
					j + gap,
					j + 1 - gap,
					j + 1 - gap,
					j + gap
				]], [
					width,
					gap * 2,
					gap * 2
				]);
				if (val == size * size) continue;
				svg.addText(val, [width * (i + .5 + gap * 2), width * (j + .5 + gap * 2)], {
					"font": width * .6 + "px Arial",
					"fill": "#000"
				});
			}
		};
	})();
	var types_nnn = [
		"222",
		"333",
		"444",
		"555",
		"666",
		"777",
		"888",
		"999",
		"101010",
		"111111"
	];
	function renderSVG(svg, scramble) {
		var type = scramble[0];
		if (type == "input") type = tools.scrambleType(scramble[1]);
		type = tools.puzzleType(type);
		var size = types_nnn.indexOf(type);
		var recons = 0;
		if (size >= 0) recons = nnnImage.draw(svg, size + 2, scramble[1]);
		else if (type == "cubennn") nnnImage.draw(svg, scramble[2], scramble[1]);
		else if (poly3d.udpolyre.exec(type)) {
			var faceNameMask = 0;
			if (/^prc|giga|mgm|klm$/.exec(type)) faceNameMask = 3;
			else if (type == "fto") faceNameMask = 255;
			else if (type == "ctico") faceNameMask = 1048575;
			recons = polyhedronImage(svg, type, scramble[1], faceNameMask, type == "klm" ? .1 : 0);
		} else if (type == "sq1" || type == "sq2") recons = sq1Image.scrImage(svg, scramble[1], type == "sq2");
		else if (type == "clk") clkImage(svg, scramble[1]);
		else if (type == "gear") gearImage(svg, scramble[1]);
		else if (type == "mrbl") mrblImage(svg, 3, scramble[1]);
		else if (type == "15b" || type == "15p") sldImage(svg, type[2], 4, scramble[1]);
		else if (type == "8b" || type == "8p") sldImage(svg, type[1], 3, scramble[1]);
		else if (/^r(3(ni)?|23\d+w?|mngf)$/.exec(type)) {
			var subScrs = [];
			scramble[1].replaceAll(/(?:^|\n)\s*(\d+|3oh|pyr|skb|sq1|clk|mgm)\)\s*([^\0]*?)\s*(?=\n.*\)|$)/g, function(m, p1, p2) {
				var subType = type.startsWith("r3") ? "333" : type == "rmngf" ? p1.replace("3oh", "333").padEnd(3, p1) : types_nnn[subScrs.length];
				subScrs.push([
					subType,
					p2,
					0
				]);
			});
			var n_height = Math.ceil(Math.sqrt(subScrs.length));
			var n_width = Math.ceil(subScrs.length / n_height);
			var GRID_WIDTH = 240;
			var GRID_HEIGHT = 150;
			svg.width = n_width * GRID_WIDTH;
			svg.height = n_height * GRID_HEIGHT;
			for (var i = 0; i < subScrs.length; i++) {
				var x = i % n_width * GRID_WIDTH;
				var y = ~~(i / n_width) * GRID_HEIGHT;
				var subSvg = new $$2.svg();
				renderSVG(subSvg, subScrs[i]);
				svg.addElem(subSvg.renderGroup(x, y, GRID_WIDTH, GRID_HEIGHT));
				svg.addText((i + 1).toString(), [x, y], {
					"font": "40px Arial",
					"fill": kernel.getProp("col-font")
				}, 1);
			}
		} else return -1;
		return recons;
	}
	function genImage(scramble, renderTool) {
		var svg = new $$2.svg();
		var recons = renderSVG(svg, scramble);
		if (recons == -1) return false;
		if (!renderTool) return svg;
		var scale = Math.min(1.6 / svg.width, 1 / svg.height) * kernel.getProp("imgSize") * .6;
		img.attr("src", "data:image/svg+xml;base64," + btoa(svg.render()));
		img.width(svg.width * scale + "em");
		img.height(svg.height * scale + "em");
		if (recons && kernel.getProp("imgRep")) {
			for (var i = 0; i < recons[1].length; i++) recons[1][i] = recons[1][i] + "@" + (i + 1) * 1e3;
			recons[1] = recons[1].join(" ");
			img.click(function(recons) {
				replay.popupReplay.apply(null, recons);
			}.bind(null, recons));
		} else img.click(function(svg, scale) {
			var popImg = $$2("<img style=\"display:block;\">");
			popImg.attr("src", "data:image/svg+xml;base64," + btoa(svg.render()));
			popImg.css("object-fit", "contain");
			kernel.showDialog([
				popImg,
				function() {},
				void 0,
				function() {}
			], "share", TOOLS_IMAGE);
		}.bind(null, svg, scale));
		return true;
	}
	var colre = /#[0-9a-fA-F]{3}/g;
	return {
		draw: genImage,
		nnnPosit: nnnImage.genPosit,
		llImage,
		pyrllImage,
		face3Image,
		sqllImage: sq1Image.llImage
	};
})();
//#endregion
//#region src/styling.ts
const IMAGE_PARTS = [
	"image",
	"face",
	"tile"
];
/** `strokeWidth` and `stroke-width` both become `stroke-width`. */
function kebab(property) {
	return property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}
/**
* The CSS for one part, from every style that is for it; later styles win over earlier
* ones. `face` and `tile` are the part's own, when it has them.
*/
function cssFor(styles, part, face, tile) {
	const css = /* @__PURE__ */ new Map();
	for (const style of styles) {
		if (style.part !== part) continue;
		if (style.face !== void 0 && style.face !== face) continue;
		if (style.tile !== void 0 && style.tile !== tile) continue;
		for (const [property, value] of Object.entries(style.css)) {
			css.delete(kebab(property));
			css.set(kebab(property), value);
		}
	}
	return css;
}
function escapeAttribute(text) {
	return text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
/**
* Adds the styles to an SVG drawn with the class names above, at the end of each part's
* `style` attribute, so they win over the picture's own colors and sizes.
*/
function styleSvg(svg, styles) {
	if (styles.length === 0) return svg;
	return svg.replace(/<(\w+)([^>]*?)(\/?)>/g, (tag, name, attrs, end) => {
		const part = attrs.match(/class="cstimer-(image|face|tile)"/)?.[1];
		if (!part) return tag;
		const face = attrs.match(/data-face="([^"]*)"/)?.[1];
		const tile = attrs.match(/data-tile="(\d+)"/)?.[1];
		const css = cssFor(styles, part, face, tile === void 0 ? void 0 : Number(tile));
		if (css.size === 0) return tag;
		const added = [...css].map(([property, value]) => `${property}:${value};`).join("");
		const own = attrs.match(/ style="([^"]*)"/);
		const style = ` style="${own ? own[1] : ""}${escapeAttribute(added)}"`;
		return `<${name}${own ? attrs.replace(own[0], "") : attrs}${style}${end}>`;
	});
}
/** Marks the parts of one of csTimer's pictures: the `<svg>` as the image, each shape as a tile. */
function markCstimerSvg(svg) {
	return svg.replace("<svg ", "<svg class=\"cstimer-image\" ").replace(/<(polygon|circle|path|rect) /g, "<$1 class=\"cstimer-tile\" ");
}
/** The CSS each element got from `styleElement`, with what it had before, to put back. */
const applied = /* @__PURE__ */ new WeakMap();
/** Takes away the styles `styleElement` gave an element, putting back what it had before. */
function unstyleElement(element) {
	for (const [property, value] of applied.get(element) ?? []) element.style.setProperty(property, value);
	applied.delete(element);
}
/** Gives an element of the 3D view the styles that are for it. */
function styleElement(element, styles, part, face, tile) {
	const css = cssFor(styles, part, face, tile);
	if (css.size === 0) return;
	const before = /* @__PURE__ */ new Map();
	for (const [property, value] of css) {
		before.set(property, element.style.getPropertyValue(property));
		element.style.setProperty(property, value);
	}
	applied.set(element, before);
}
//#endregion
//#region src/image.ts
/**
* Puzzles csTimer's image code can draw, as csTimer's puzzle type ids (what
* `tools.puzzleType(type)` returns). Mirrors `renderSVG` in csTimer's image.js.
*/
const IMAGE_PUZZLES = [
	"222",
	"333",
	"444",
	"555",
	"666",
	"777",
	"888",
	"999",
	"101010",
	"111111",
	"pyr",
	"mpyr",
	"skb",
	"mgm",
	"klm",
	"giga",
	"prc",
	"fto",
	"dmd",
	"ctico",
	"redi",
	"dino",
	"heli",
	"heli2x2",
	"helicv",
	"crz3a",
	"sq1",
	"sq2",
	"clk",
	"gear",
	"mrbl",
	"15p",
	"15b",
	"8p",
	"8b"
];
/** Relays and multi-blind: a grid with one image per scramble. */
const MULTI_TYPES = /^r(3(ni)?|23\d+w?|mngf)$/;
/** Whether `getScrambleImage` can draw scrambles of this csTimer scramble type id. */
function hasScrambleImage(type) {
	return MULTI_TYPES.test(type) || IMAGE_PUZZLES.includes(tools.puzzleType(type));
}
/**
* Draws the scrambled puzzle as an SVG string, the same picture csTimer shows in its
* "Draw Scramble" tool, e.g. an unfolded cube with the U face on top and F in the middle.
*
* `type` is the scramble type id the scramble was made for, e.g. `'333'` or `'pll'`.
* The SVG has a viewBox, so it can be resized with CSS, and no background. The `<svg>` has
* the class `cstimer-image` and each shape the class `cstimer-tile`, for styling with CSS.
*
* Throws for types csTimer has no image for (see `hasScrambleImage`).
*/
function getScrambleImage(type, scramble) {
	return drawImage(type, scramble);
}
/**
* Like `getScrambleImage`, with some of csTimer's settings changed for this one drawing,
* e.g. `{ colcube: '#fff#f00...' }` for other cube colors. `width` sets the SVG's width
* in pixels (the height follows the picture's shape); by default csTimer's size is kept.
*/
function drawImage(type, scramble, settings = {}, width) {
	if (!hasScrambleImage(type)) throw new Error(`No scramble image for "${type}"`);
	const saved = { ...kernel.props };
	Object.assign(kernel.props, settings);
	let svg;
	try {
		svg = image$1.draw([
			type,
			scramble,
			0
		]);
	} finally {
		kernel.props = saved;
	}
	if (!svg) throw new Error(`csTimer has no scramble image for "${type}"`);
	const height = width === void 0 ? svg.height : svg.height * width / svg.width;
	return markCstimerSvg(svg.render().replace(/ width="[^"]*"/, width === void 0 ? "$&" : ` width="${round$1(width)}"`).replace(/ height="[^"]*"/, width === void 0 ? "$&" : ` height="${round$1(height)}"`).replace("<svg ", `<svg viewBox="0 0 ${round$1(svg.width)} ${round$1(svg.height)}" `));
}
function round$1(n) {
	return parseFloat(n.toFixed(3)).toString();
}
//#endregion
//#region src/cubestyle.ts
const CUBE_STYLES = [
	"classic",
	"stickered",
	"stickered-round",
	"stickerless",
	"stickerless-round"
];
/** How round the rounded corners are, as a part of a tile's width. */
const CLASSIC_RADIUS = .15;
const RADIUS = .28;
const ROUND_RADIUS = .32;
function isStickerless(style) {
	return style.startsWith("stickerless");
}
/**
* How round each corner of tile `index` is (counted row by row from the top left) on a
* face `size` tiles wide. A corner is rounded when it points into the face, away from all
* its borders; corner tiles keep that one square except in the round styles.
*/
function tileCorners(style, size, index) {
	if (style === "classic") return [
		CLASSIC_RADIUS,
		CLASSIC_RADIUS,
		CLASSIC_RADIUS,
		CLASSIC_RADIUS
	];
	const round = style.endsWith("-round");
	const radius = round ? ROUND_RADIUS : RADIUS;
	const row = Math.floor(index / size);
	const col = index % size;
	const top = row === 0;
	const bottom = row === size - 1;
	const left = col === 0;
	const right = col === size - 1;
	const cornerTile = (top || bottom) && (left || right);
	const inner = (onBorder) => onBorder || cornerTile && !round ? 0 : radius;
	return [
		inner(top || left),
		inner(top || right),
		inner(bottom || right),
		inner(bottom || left)
	];
}
//#endregion
//#region src/net2d.ts
/** Where each face sits in the unfolded cube, as [column, row]: U on top of F, D below. */
const NET = [
	[
		"U",
		1,
		0
	],
	[
		"L",
		0,
		1
	],
	[
		"F",
		1,
		1
	],
	[
		"R",
		2,
		1
	],
	[
		"B",
		3,
		1
	],
	[
		"D",
		1,
		2
	]
];
/**
* One face is this many units wide in the SVG. The borders are a little thicker than the
* 3D view's, which shows each face bigger, so they look as thick.
*/
const SIDE = 100;
const PADDING = SIDE * .035;
const GAP = SIDE * .03;
/** Space between faces when they are separated. */
const FACE_GAP = SIDE * .06;
const BLACK = "#111";
function round(n) {
	return parseFloat(n.toFixed(3)).toString();
}
/** A `w` x `w` square at `x`, `y` with each corner rounded by its own radius, as a path. */
function roundedSquare(x, y, w, corners) {
	const [tl = 0, tr = 0, br = 0, bl = 0] = corners;
	const arc = (r, toX, toY) => r > 0 ? `A${round(r)} ${round(r)} 0 0 1 ${round(toX)} ${round(toY)}` : "";
	return `M${round(x + tl)} ${round(y)}H${round(x + w - tr)}${arc(tr, x + w, y + tr)}V${round(y + w - br)}${arc(br, x + w - br, y + w)}H${round(x + bl)}${arc(bl, x, y + w - bl)}V${round(y + tl)}${arc(tl, x + tl, y)}Z`;
}
/**
* Draws a size x size x size cube unfolded, as an SVG string, with each face's sticker
* colors in the order `Puzzle.getStickers()` gives them. A face is `width / 4` pixels wide,
* the same as in the 3D view, so the joined faces are `width` pixels wide and the separated
* ones a little wider for the gaps; without it a face is 100 pixels wide. The picture, each
* face and each tile carry the class names and data attributes of styling.ts. `style`
* picks the tiles' look (see `CubeStyle`).
*/
function drawCubeNet(size, stickers, layout = "separated", width, style = "classic") {
	const step = SIDE + (layout === "joined" ? 0 : FACE_GAP);
	const w = 3 * step + SIDE;
	const h = 2 * step + SIDE;
	const stickerless = isStickerless(style);
	const gap = stickerless ? 0 : GAP;
	const padding = stickerless ? 0 : PADDING;
	const cell = (SIDE - 2 * padding - (size - 1) * gap) / size;
	const radius = round(cell * CLASSIC_RADIUS);
	const parts = [];
	if (layout === "joined") parts.push(`<rect class="cstimer-background" x="0" y="${SIDE}" width="${w}" height="${SIDE}" fill="${BLACK}"/>`, `<rect class="cstimer-background" x="${SIDE}" y="0" width="${SIDE}" height="${h}" fill="${BLACK}"/>`);
	for (const [face, col, row] of NET) {
		const x0 = col * step;
		const y0 = row * step;
		parts.push(`<g class="cstimer-face" data-face="${face}" fill="${BLACK}">`, `<rect class="cstimer-face-bg" x="${x0}" y="${y0}" width="${SIDE}" height="${SIDE}"/>`);
		const colors = stickers[face] ?? [];
		for (let i = 0; i < size * size; i++) {
			const x = x0 + padding + i % size * (cell + gap);
			const y = y0 + padding + Math.floor(i / size) * (cell + gap);
			if (style !== "classic") {
				const corners = tileCorners(style, size, i).map((r) => r * cell);
				parts.push(`<path class="cstimer-tile" data-face="${face}" data-tile="${i}" d="${roundedSquare(x, y, cell, corners)}" fill="${colors[i] ?? BLACK}"/>`);
				continue;
			}
			parts.push(`<rect class="cstimer-tile" data-face="${face}" data-tile="${i}" x="${round(x)}" y="${round(y)}" width="${round(cell)}" height="${round(cell)}" rx="${radius}" fill="${colors[i] ?? BLACK}"/>`);
		}
		parts.push("</g>");
	}
	const pxWidth = width === void 0 ? w : width / 4 * (w / SIDE);
	return `<svg class="cstimer-image" viewBox="0 0 ${w} ${h}" width="${round(pxWidth)}" height="${round(pxWidth * h / w)}" xmlns="http://www.w3.org/2000/svg">${parts.join("")}</svg>`;
}
/**
* Gives one of csTimer's pictures the same look: its thin black outlines become thick,
* dark ones with rounded corners. Only the outlined shapes change, so the clock's dials
* and hands, which csTimer draws differently, stay as they are.
*/
function thickenBorders(svg) {
	return svg.replace(/stroke:#000;/g, `stroke:${BLACK};stroke-width:2.5;stroke-linejoin:round;`);
}
//#endregion
//#region src/view3d.ts
/**
* The faces in the order their stickers are given, and where each one sits on the cube:
* turned from the front (F) about an axis, by some degrees.
*/
const FACES$1 = [
	[
		"U",
		"x",
		90
	],
	[
		"R",
		"y",
		90
	],
	[
		"F",
		"y",
		0
	],
	[
		"D",
		"x",
		-90
	],
	[
		"L",
		"y",
		-90
	],
	[
		"B",
		"y",
		180
	]
];
const place = (axis, degrees) => `rotate${axis.toUpperCase()}(${degrees}deg)`;
/** How far the camera is from the cube's center, in cube sides. */
const CAMERA = 5.8;
/**
* How wide the view is, in cube sides: room for the cube from any angle, and with floating
* faces room for the copies around it too. With a width set, a face is `width / 4` pixels,
* as in the flat picture, so the view with floating faces is `width` pixels wide.
*/
const VIEW_SIDES = {
	hidden: 2.4,
	floating: 4
};
/**
* The camera angle the view starts at: the U R F corner in the middle, pointing straight
* at the camera.
*/
const DEFAULT_CAMERA_ANGLE = {
	x: -(Math.atan(Math.SQRT1_2) * 180) / Math.PI,
	y: -45
};
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
.cstimer-3d.cstimer-3d-fixed {
  cursor: auto;
}
/* The camera. Its distance is in cqmin, which only follows the box from inside it (on the
   box itself it would follow the window), so the camera moves back as the cube grows. */
.cstimer-3d-scene {
  --side: ${100 / VIEW_SIDES.hidden}cqmin;
  position: absolute;
  inset: 0;
  perspective: calc(var(--side) * ${CAMERA});
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
  box-sizing: border-box;
  border-radius: 12%;
}
.cstimer-3d-floating .cstimer-3d-scene {
  --side: ${100 / VIEW_SIDES.floating}cqmin;
}
/* A copy of a face at the back, a little way out from it and seen from behind, so it shows
   the face as it would look through a glass cube (shown by placeCopies). */
.cstimer-3d-copy {
  backface-visibility: visible;
  display: none;
}
`;
/** The turn CSS's `rotateX` or `rotateY` makes, as a matrix (y points down, z at you). */
function rotation(axis, degrees) {
	const a = degrees * Math.PI / 180;
	const c = Math.cos(a);
	const s = Math.sin(a);
	return axis === "x" ? [
		[
			1,
			0,
			0
		],
		[
			0,
			c,
			-s
		],
		[
			0,
			s,
			c
		]
	] : [
		[
			c,
			0,
			s
		],
		[
			0,
			1,
			0
		],
		[
			-s,
			0,
			c
		]
	];
}
function multiply(a, b) {
	const cell = (i, j) => a[i][0] * b[0][j] + a[i][1] * b[1][j] + a[i][2] * b[2][j];
	return [
		0,
		1,
		2
	].map((i) => [
		cell(i, 0),
		cell(i, 1),
		cell(i, 2)
	]);
}
/** Column `j` of a matrix: where it sends the x (0), y (1) or z (2) direction. */
function column(m, j) {
	return [
		m[0][j],
		m[1][j],
		m[2][j]
	];
}
/**
* With floating faces, shows the copies of the faces at the back: those whose plane the
* camera is behind.
*/
function placeCopies(view) {
	const turned = multiply(rotation("x", view.angle.x), rotation("y", view.angle.y));
	FACES$1.forEach(([, axis, degrees], i) => {
		const out = column(multiply(turned, rotation(axis, degrees)), 2);
		const back = view.floating && out[2] < .5 / CAMERA;
		view.copies[i].style.display = back ? "grid" : "none";
	});
}
/**
* Puts each face (or floating copy) `out` cube sides out from the cube's center, then moves
* and turns it by its offset. CSS's y points down, so the offset's y (toward U) and its turn
* about y flip.
*/
function moveFaces(faces, out, offsets) {
	FACES$1.forEach(([name, axis, degrees], i) => {
		const offset = offsets[name];
		const [x, y, z] = column(rotation(axis, degrees), 2).map((n) => n * out);
		const center = [
			x + (offset?.x ?? 0),
			y - (offset?.y ?? 0),
			z + (offset?.z ?? 0)
		];
		const turns = offset ? `rotateZ(${offset.rotateZ}deg) rotateY(${-offset.rotateY}deg) rotateX(${offset.rotateX}deg) ` : "";
		const [cx, cy, cz] = center.map((n) => `calc(var(--side) * ${n})`);
		faces[i].style.transform = `translate3d(${cx}, ${cy}, ${cz}) ${turns}${place(axis, degrees)}`;
	});
}
/** The views already drawn, by the element they are in, so drawing again updates them. */
const views = /* @__PURE__ */ new WeakMap();
function addStyle(doc) {
	if (doc.getElementById("cstimer-3d-style")) return;
	const style = doc.createElement("style");
	style.id = "cstimer-3d-style";
	style.textContent = STYLE;
	doc.head.append(style);
}
function turn(view) {
	view.cube.style.transform = `rotateX(${view.angle.x}deg) rotateY(${view.angle.y}deg)`;
	placeCopies(view);
}
/**
* Turns the view while it is dragged: sideways all the way round, up and down to the top
* and bottom. Not with a fixed camera.
*/
function makeDraggable(box, view) {
	let last;
	box.addEventListener("pointerdown", (e) => {
		last = {
			x: e.clientX,
			y: e.clientY
		};
		box.setPointerCapture(e.pointerId);
	});
	box.addEventListener("pointermove", (e) => {
		if (!last || view.fixed) return;
		view.angle.y += (e.clientX - last.x) * .5;
		view.angle.x = Math.max(-90, Math.min(90, view.angle.x - (e.clientY - last.y) * .5));
		last = {
			x: e.clientX,
			y: e.clientY
		};
		turn(view);
	});
	const stop = () => last = void 0;
	box.addEventListener("pointerup", stop);
	box.addEventListener("pointercancel", stop);
}
function createView(element, size, angle, setAngle) {
	const doc = element.ownerDocument;
	addStyle(doc);
	const box = doc.createElement("div");
	box.className = "cstimer-3d cstimer-image";
	const cube = doc.createElement("div");
	cube.className = "cstimer-3d-cube";
	const makeFace = (name, className) => {
		const face = doc.createElement("div");
		face.className = `${className} cstimer-face`;
		face.dataset.face = name;
		face.style.gridTemplate = `repeat(${size}, 1fr) / repeat(${size}, 1fr)`;
		for (let i = 0; i < size * size; i++) {
			const tile = doc.createElement("div");
			tile.className = "cstimer-tile";
			tile.dataset.face = name;
			tile.dataset.tile = String(i);
			face.append(tile);
		}
		return face;
	};
	const faces = FACES$1.map(([name]) => {
		const face = makeFace(name, "cstimer-3d-face");
		cube.append(face);
		return face;
	});
	for (const [, axis, degrees] of FACES$1) {
		const core = doc.createElement("div");
		core.className = "cstimer-3d-core";
		core.style.transform = `${place(axis, degrees)} translateZ(calc(var(--side) * 0.48))`;
		cube.append(core);
	}
	const copies = FACES$1.map(([name]) => {
		const copy = makeFace(name, "cstimer-3d-face cstimer-3d-copy");
		cube.append(copy);
		return copy;
	});
	const scene = doc.createElement("div");
	scene.className = "cstimer-3d-scene";
	scene.append(cube);
	box.append(scene);
	element.replaceChildren(box);
	const view = {
		box,
		cube,
		faces,
		copies,
		floating: false,
		fixed: false,
		size,
		angle,
		setAngle
	};
	turn(view);
	makeDraggable(box, view);
	return view;
}
/**
* Draws a size x size x size cube in `element` (replacing what is in it), with each
* face's sticker colors in the order U R F D L B, as `Puzzle.getStickers()` gives them.
* With a `width`, a face is `width / 4` pixels wide, as in the flat picture (the view is
* square and `width` pixels wide with floating faces, a bit over half that without).
* Drawing in the same element again only changes the colors and options, so the angle
* the cube was dragged to is kept, unless the camera is fixed or its angle changed.
*/
function drawCube3D(element, size, stickers, options = {}) {
	const { width, hidden = "hidden", camera = "mouse", offsets = {}, faceOffsets = {}, styles = [], cubeStyle = "classic" } = options;
	const angle = options.angle ?? DEFAULT_CAMERA_ANGLE;
	const angleKey = `${angle.x} ${angle.y}`;
	let view = views.get(element);
	if (!view || view.size !== size || !element.contains(view.cube)) {
		view = view ? createView(element, size, view.angle, view.setAngle) : createView(element, size, { ...angle }, angleKey);
		views.set(element, view);
	}
	const tiles = [...view.faces, ...view.copies].flatMap((face) => [...face.children]);
	[
		view.box,
		...view.faces,
		...view.copies,
		...tiles
	].forEach(unstyleElement);
	view.fixed = camera === "fixed";
	if (view.fixed || view.setAngle !== angleKey) {
		view.angle = {
			x: angle.x,
			y: angle.y
		};
		view.setAngle = angleKey;
	}
	view.floating = hidden === "floating";
	const sides = VIEW_SIDES[view.floating ? "floating" : "hidden"];
	view.box.style.width = width === void 0 ? "" : `${width / 4 * sides}px`;
	view.box.classList.toggle("cstimer-3d-floating", view.floating);
	view.box.classList.toggle("cstimer-3d-fixed", view.fixed);
	moveFaces(view.faces, .5, faceOffsets);
	moveFaces(view.copies, 1.5, offsets);
	turn(view);
	const stickerless = isStickerless(cubeStyle);
	const corners = Array.from({ length: size * size }, (_, j) => tileCorners(cubeStyle, size, j).map((r) => `${parseFloat((r * 100).toFixed(3))}%`).join(" "));
	FACES$1.forEach(([name], i) => {
		const colors = stickers[name] ?? [];
		for (const face of [view.faces[i], view.copies[i]]) {
			face.style.padding = stickerless ? "0" : "";
			face.style.gap = stickerless ? "0" : "";
			[...face.children].forEach((sticker, j) => {
				const tile = sticker;
				const color = colors[j] ?? "#111";
				tile.style.background = color;
				tile.style.borderRadius = corners[j];
			});
		}
	});
	if (styles.length > 0) {
		styleElement(view.box, styles, "image");
		for (const face of [...view.faces, ...view.copies]) {
			styleElement(face, styles, "face", face.dataset.face);
			for (const tile of face.children) styleElement(tile, styles, "tile", tile.dataset.face, Number(tile.dataset.tile));
		}
	}
}
//#endregion
//#region src/solution.ts
const SLICE_MOVES = [
	"one-move",
	"two-moves",
	"not-allowed"
];
const WIDE_MOVES = ["Rw-or-r", "Rw-only"];
/** The WCA Fewest Moves rules: rotations are free, no slice moves, wide moves only as `Rw`. */
const FMC_RULES = {
	countRotations: false,
	sliceMoves: "not-allowed",
	wideMoves: "Rw-only"
};
const MOVE = /^(?:\d+(?:-\d+)?)?([FRUBLDfrubldxyzSME])w?[2']?$/;
/** The moves in `moves`, without relay numbers like `2)`. */
function splitMoves(moves) {
	return moves.split(/\s+/).filter((move) => move && !/^\w+\)$/.test(move));
}
/** How many moves `moves` has under `rules`. Moves csTimer can't read count as 1. */
function countSolutionMoves(moves, rules) {
	let count = 0;
	for (const move of splitMoves(moves)) {
		const letter = MOVE.exec(move)?.[1];
		if (letter && "xyz".includes(letter)) count += rules.countRotations ? 1 : 0;
		else if (letter && "SME".includes(letter)) count += rules.sliceMoves === "two-moves" ? 2 : 1;
		else count += 1;
	}
	return count;
}
/** The moves in `moves` that csTimer can't read or that `rules` don't allow, in order. */
function invalidSolutionMoves(moves, rules) {
	return splitMoves(moves).filter((move) => {
		const letter = MOVE.exec(move)?.[1];
		if (letter === void 0) return true;
		if ("SME".includes(letter)) return rules.sliceMoves === "not-allowed";
		if ("frubld".includes(letter)) return rules.wideMoves === "Rw-only";
		return false;
	});
}
/**
* `moves` without the ones csTimer can read but `rules` don't allow (e.g. `M` with slice
* moves not allowed, `r` with wide moves only as `Rw`), so they aren't done on the cube.
*/
function allowedSolutionMoves(moves, rules) {
	const notAllowed = new Set(invalidSolutionMoves(moves, rules).filter((move) => MOVE.test(move)));
	return splitMoves(moves).filter((move) => !notAllowed.has(move)).join(" ");
}
/** Whether every face of csTimer's sticker list (`size` x `size` per face) is one color. */
function isSolved(posit, size) {
	const n = size * size;
	for (let face = 0; face < 6; face++) for (let i = 1; i < n; i++) if (posit[face * n + i] !== posit[face * n]) return false;
	return true;
}
/**
* Whether the cube of `size` is solved after `moves`, one outer block turn from it ('+2'),
* or further ('DNF'). With `plusTwo` false it is only ever 'solved' or 'DNF'.
*/
function cubeSolveStatus(size, moves, plusTwo) {
	if (isSolved(image$1.nnnPosit(size, moves), size)) return "solved";
	if (!plusTwo) return "DNF";
	for (const face of [
		"R",
		"U",
		"F"
	]) for (let width = 1; width < size; width++) {
		const block = width === 1 ? face : `${width}${face}w`;
		for (const turn of [
			"",
			"2",
			"'"
		]) if (isSolved(image$1.nnnPosit(size, `${moves} ${block}${turn}`), size)) return "+2";
	}
	return "DNF";
}
//#endregion
//#region src/vendor/cstimer/min2phase.js
var min2phase = (function() {
	var USE_TWST_FLIP_PRUN = true;
	var PARTIAL_INIT_LEVEL = 2;
	var MAX_PRE_MOVES = 20;
	var USE_CONJ_PRUN = USE_TWST_FLIP_PRUN;
	var MIN_P1LENGTH_PRE = 7;
	var MAX_DEPTH2 = 13;
	var INVERSE_SOLUTION = 2;
	function Search() {
		this.move = [];
		this.moveSol = [];
		this.nodeUD = [];
		this.valid1 = 0;
		this.allowShorter = false;
		this.cc = new CubieCube();
		this.urfCubieCube = [];
		this.urfCoordCube = [];
		this.phase1Cubie = [];
		this.preMoveCubes = [];
		this.preMoves = [];
		this.preMoveLen = 0;
		this.maxPreMoves = 0;
		this.isRec = false;
		for (var i = 0; i < 21; i++) {
			this.nodeUD[i] = new CoordCube();
			this.phase1Cubie[i] = new CubieCube();
		}
		for (var i = 0; i < 6; i++) {
			this.urfCubieCube[i] = new CubieCube();
			this.urfCoordCube[i] = new CoordCube();
		}
		for (var i = 0; i < MAX_PRE_MOVES; i++) this.preMoveCubes[i + 1] = new CubieCube();
	}
	var Ux1 = 0;
	var Ux2 = 1;
	var Ux3 = 2;
	var Rx1 = 3;
	var Rx2 = 4;
	var Rx3 = 5;
	var Fx1 = 6;
	var Fx2 = 7;
	var Fx3 = 8;
	var Dx1 = 9;
	var Dx2 = 10;
	var Dx3 = 11;
	var Lx1 = 12;
	var Lx2 = 13;
	var Lx3 = 14;
	var Bx1 = 15;
	var Bx2 = 16;
	var Bx3 = 17;
	var N_MOVES = 18;
	var N_MOVES2 = 10;
	var N_FLIP = 2048;
	var N_FLIP_SYM = 336;
	var N_TWST = 2187;
	var N_TWST_SYM = 324;
	var N_PERM = 40320;
	var N_PERM_SYM = 2768;
	var N_MPERM = 24;
	var N_SLICE = 495;
	var N_COMB = 140;
	var SYM_E2C_MAGIC = 14540032;
	var Cnk = [];
	var fact = [1];
	var move2str = [
		"U ",
		"U2",
		"U'",
		"R ",
		"R2",
		"R'",
		"F ",
		"F2",
		"F'",
		"D ",
		"D2",
		"D'",
		"L ",
		"L2",
		"L'",
		"B ",
		"B2",
		"B'"
	];
	var ud2std = [
		Ux1,
		Ux2,
		Ux3,
		Rx2,
		Fx2,
		Dx1,
		Dx2,
		Dx3,
		Lx2,
		Bx2,
		Rx1,
		Rx3,
		Fx1,
		Fx3,
		Lx1,
		Lx3,
		Bx1,
		Bx3
	];
	var std2ud = [];
	var ckmv2bit = [];
	var urfMove = [
		[
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
			11,
			12,
			13,
			14,
			15,
			16,
			17
		],
		[
			6,
			7,
			8,
			0,
			1,
			2,
			3,
			4,
			5,
			15,
			16,
			17,
			9,
			10,
			11,
			12,
			13,
			14
		],
		[
			3,
			4,
			5,
			6,
			7,
			8,
			0,
			1,
			2,
			12,
			13,
			14,
			15,
			16,
			17,
			9,
			10,
			11
		],
		[
			2,
			1,
			0,
			5,
			4,
			3,
			8,
			7,
			6,
			11,
			10,
			9,
			14,
			13,
			12,
			17,
			16,
			15
		],
		[
			8,
			7,
			6,
			2,
			1,
			0,
			5,
			4,
			3,
			17,
			16,
			15,
			11,
			10,
			9,
			14,
			13,
			12
		],
		[
			5,
			4,
			3,
			8,
			7,
			6,
			2,
			1,
			0,
			14,
			13,
			12,
			17,
			16,
			15,
			11,
			10,
			9
		]
	];
	for (var i = 0; i < 18; i++) std2ud[ud2std[i]] = i;
	for (var i = 0; i < 10; i++) {
		var ix = ~~(ud2std[i] / 3);
		ckmv2bit[i] = 0;
		for (var j = 0; j < 10; j++) {
			var jx = ~~(ud2std[j] / 3);
			ckmv2bit[i] |= (ix == jx || ix % 3 == jx % 3 && ix >= jx ? 1 : 0) << j;
		}
	}
	ckmv2bit[10] = 0;
	for (var i = 0; i < 13; i++) {
		Cnk[i] = [];
		fact[i + 1] = fact[i] * (i + 1);
		Cnk[i][0] = Cnk[i][i] = 1;
		for (var j = 1; j < 13; j++) Cnk[i][j] = j <= i ? Cnk[i - 1][j - 1] + Cnk[i - 1][j] : 0;
	}
	function setPruning(table, index, value) {
		table[index >> 3] ^= value << (index << 2);
	}
	function getPruning(table, index) {
		return table[index >> 3] >> (index << 2) & 15;
	}
	function getPruningMax(maxValue, table, index) {
		return Math.min(maxValue, table[index >> 3] >> (index << 2) & 15);
	}
	function hasZero(val) {
		return (val - 286331153 & ~val & 2290649224) != 0;
	}
	function ESym2CSym(idx) {
		return idx ^ SYM_E2C_MAGIC >> ((idx & 15) << 1) & 3;
	}
	function getPermSymInv(idx, sym, isCorner) {
		var idxi = PermInvEdgeSym[idx];
		if (isCorner) idxi = ESym2CSym(idxi);
		return idxi & 65520 | SymMult[idxi & 15][sym];
	}
	function CubieCube() {
		this.ca = [
			0,
			1,
			2,
			3,
			4,
			5,
			6,
			7
		];
		this.ea = [
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
	}
	function setNPerm(arr, idx, n) {
		n--;
		var val = 1985229328;
		for (var i = 0; i < n; ++i) {
			var p = fact[n - i];
			var v = ~~(idx / p);
			idx %= p;
			v <<= 2;
			arr[i] = arr[i] & 240 | val >> v & 15;
			var m = (1 << v) - 1;
			val = (val & m) + (val >> 4 & ~m);
		}
		arr[n] = arr[n] & 240 | val & 15;
	}
	function getNPerm(arr, n) {
		var idx = 0, val = 1985229328;
		for (var i = 0; i < n - 1; ++i) {
			var v = (arr[i] & 15) << 2;
			idx = (n - i) * idx + (val >> v & 15);
			val -= 286331152 << v;
		}
		return idx;
	}
	function setNPermFull(arr, idx, n) {
		arr[n - 1] = arr[n - 1] & 240;
		for (var i = n - 2; i >= 0; --i) {
			arr[i] = arr[i] & 240 | idx % (n - i);
			idx = ~~(idx / (n - i));
			for (var j = i + 1; j < n; ++j) if ((arr[j] & 15) >= (arr[i] & 15)) arr[j] += 1;
		}
	}
	function getNPermFull(arr, n) {
		var idx = 0;
		for (var i = 0; i < n; ++i) {
			idx *= n - i;
			for (var j = i + 1; j < n; ++j) if ((arr[j] & 15) < (arr[i] & 15)) ++idx;
		}
		return idx;
	}
	function getComb(arr, mask) {
		var end = arr.length - 1;
		var idxC = 0, r = 4;
		for (var i = end; i >= 0; i--) if ((arr[i] & 12) == mask) idxC += Cnk[i][r--];
		return idxC;
	}
	function setComb(arr, idxC, mask) {
		var end = arr.length - 1;
		var r = 4, fill = end;
		for (var i = end; i >= 0; i--) if (idxC >= Cnk[i][r]) {
			idxC -= Cnk[i][r--];
			arr[i] = arr[i] & 240 | r | mask;
		} else {
			if ((fill & 12) == mask) fill -= 4;
			arr[i] = arr[i] & 240 | fill--;
		}
	}
	function getNParity(idx, n) {
		var p = 0;
		for (var i = n - 2; i >= 0; i--) {
			p ^= idx % (n - i);
			idx = ~~(idx / (n - i));
		}
		return p & 1;
	}
	CubieCube.EdgeMult = function(a, b, prod) {
		for (var ed = 0; ed < 12; ed++) prod.ea[ed] = a.ea[b.ea[ed] & 15] ^ b.ea[ed] & 16;
	};
	CubieCube.CornMult = function(a, b, prod) {
		for (var corn = 0; corn < 8; corn++) {
			var ori = ((a.ca[b.ca[corn] & 15] >> 4) + (b.ca[corn] >> 4)) % 3;
			prod.ca[corn] = a.ca[b.ca[corn] & 15] & 15 | ori << 4;
		}
	};
	CubieCube.CornMultFull = function(a, b, prod) {
		for (var corn = 0; corn < 8; corn++) {
			var oriA = a.ca[b.ca[corn] & 15] >> 4;
			var oriB = b.ca[corn] >> 4;
			var ori = oriA + (oriA < 3 ? oriB : 6 - oriB);
			ori = ori % 3 + (oriA < 3 == oriB < 3 ? 0 : 3);
			prod.ca[corn] = a.ca[b.ca[corn] & 15] & 15 | ori << 4;
		}
	};
	CubieCube.CornConjugate = function(a, idx, b) {
		var sinv = SymCube[SymMultInv[0][idx]];
		var s = SymCube[idx];
		for (var corn = 0; corn < 8; corn++) {
			var oriA = sinv.ca[a.ca[s.ca[corn] & 15] & 15] >> 4;
			var oriB = a.ca[s.ca[corn] & 15] >> 4;
			var ori = oriA < 3 ? oriB : (3 - oriB) % 3;
			b.ca[corn] = sinv.ca[a.ca[s.ca[corn] & 15] & 15] & 15 | ori << 4;
		}
	};
	CubieCube.EdgeConjugate = function(a, idx, b) {
		var sinv = SymCube[SymMultInv[0][idx]];
		var s = SymCube[idx];
		for (var ed = 0; ed < 12; ed++) b.ea[ed] = sinv.ea[a.ea[s.ea[ed] & 15] & 15] ^ a.ea[s.ea[ed] & 15] & 16 ^ s.ea[ed] & 16;
	};
	CubieCube.prototype.init = function(ca, ea) {
		this.ca = ca.slice();
		this.ea = ea.slice();
		return this;
	};
	CubieCube.prototype.initCoord = function(cperm, twst, eperm, flip) {
		setNPerm(this.ca, cperm, 8);
		this.setTwst(twst);
		setNPermFull(this.ea, eperm, 12);
		this.setFlip(flip);
		return this;
	};
	CubieCube.prototype.isEqual = function(c) {
		for (var i = 0; i < 8; i++) if (this.ca[i] != c.ca[i]) return false;
		for (var i = 0; i < 12; i++) if (this.ea[i] != c.ea[i]) return false;
		return true;
	};
	CubieCube.prototype.setFlip = function(idx) {
		var parity = 0;
		for (var i = 10; i >= 0; i--, idx >>= 1) {
			this.ea[i] = this.ea[i] & 15 | (idx & 1) << 4;
			parity ^= this.ea[i];
		}
		this.ea[11] = this.ea[11] & 15 | parity & 16;
	};
	CubieCube.prototype.getFlip = function() {
		var idx = 0;
		for (var i = 0; i < 11; i++) idx = idx << 1 | this.ea[i] >> 4 & 1;
		return idx;
	};
	CubieCube.prototype.getFlipSym = function() {
		return FlipR2S[this.getFlip()];
	};
	CubieCube.prototype.setTwst = function(idx) {
		var twst = 15;
		for (var i = 6; i >= 0; i--, idx = ~~(idx / 3)) {
			this.ca[i] = this.ca[i] & 15 | idx % 3 << 4;
			twst -= this.ca[i] >> 4;
		}
		this.ca[7] = this.ca[7] & 15 | twst % 3 << 4;
	};
	CubieCube.prototype.getTwst = function() {
		var idx = 0;
		for (var i = 0; i < 7; i++) idx += (idx << 1) + (this.ca[i] >> 4);
		return idx;
	};
	CubieCube.prototype.getTwstSym = function() {
		return TwstR2S[this.getTwst()];
	};
	CubieCube.prototype.setCPerm = function(idx) {
		setNPerm(this.ca, idx, 8);
	};
	CubieCube.prototype.getCPerm = function() {
		return getNPerm(this.ca, 8);
	};
	CubieCube.prototype.getCPermSym = function() {
		return ESym2CSym(EPermR2S[getNPerm(this.ca, 8)]);
	};
	CubieCube.prototype.setEPerm = function(idx) {
		setNPerm(this.ea, idx, 8);
	};
	CubieCube.prototype.getEPerm = function() {
		return getNPerm(this.ea, 8);
	};
	CubieCube.prototype.getEPermSym = function() {
		return EPermR2S[getNPerm(this.ea, 8)];
	};
	CubieCube.prototype.getSlice = function() {
		return 494 - getComb(this.ea, 8);
	};
	CubieCube.prototype.setSlice = function(idx) {
		setComb(this.ea, 494 - idx, 8);
	};
	CubieCube.prototype.getMPerm = function() {
		return getNPermFull(this.ea, 12) % 24;
	};
	CubieCube.prototype.setMPerm = function(idx) {
		setNPermFull(this.ea, idx, 12);
	};
	CubieCube.prototype.getCComb = function() {
		return getComb(this.ca, 0);
	};
	CubieCube.prototype.setCComb = function(idx) {
		setComb(this.ca, idx, 0);
	};
	CubieCube.prototype.URFConjugate = function() {
		var temps = new CubieCube();
		CubieCube.CornMult(CubieCube.urf2, this, temps);
		CubieCube.CornMult(temps, CubieCube.urf1, this);
		CubieCube.EdgeMult(CubieCube.urf2, this, temps);
		CubieCube.EdgeMult(temps, CubieCube.urf1, this);
	};
	var cornerFacelet = [
		[
			8,
			9,
			20
		],
		[
			6,
			18,
			38
		],
		[
			0,
			36,
			47
		],
		[
			2,
			45,
			11
		],
		[
			29,
			26,
			15
		],
		[
			27,
			44,
			24
		],
		[
			33,
			53,
			42
		],
		[
			35,
			17,
			51
		]
	];
	var edgeFacelet = [
		[5, 10],
		[7, 19],
		[3, 37],
		[1, 46],
		[32, 16],
		[28, 25],
		[30, 43],
		[34, 52],
		[23, 12],
		[21, 41],
		[50, 39],
		[48, 14]
	];
	CubieCube.prototype.toFaceCube = function(cFacelet, eFacelet) {
		cFacelet = cFacelet || cornerFacelet;
		eFacelet = eFacelet || edgeFacelet;
		var ts = "URFDLB";
		var f = [];
		for (var i = 0; i < 54; i++) f[i] = ts[~~(i / 9)];
		for (var c = 0; c < 8; c++) {
			var j = this.ca[c] & 15;
			var ori = this.ca[c] >> 4;
			for (var n = 0; n < 3; n++) f[cFacelet[c][(n + ori) % 3]] = ts[~~(cFacelet[j][n] / 9)];
		}
		for (var e = 0; e < 12; e++) {
			var j = this.ea[e] & 15;
			var ori = this.ea[e] >> 4;
			for (var n = 0; n < 2; n++) f[eFacelet[e][(n + ori) % 2]] = ts[~~(eFacelet[j][n] / 9)];
		}
		return f.join("");
	};
	CubieCube.prototype.invFrom = function(cc) {
		for (var edge = 0; edge < 12; edge++) this.ea[cc.ea[edge] & 15] = edge & 15 | cc.ea[edge] & 16;
		for (var corn = 0; corn < 8; corn++) this.ca[cc.ca[corn] & 15] = corn | 64 >> (cc.ca[corn] >> 4) & 48;
		return this;
	};
	CubieCube.prototype.fromFacelet = function(facelet, cFacelet, eFacelet) {
		cFacelet = cFacelet || cornerFacelet;
		eFacelet = eFacelet || edgeFacelet;
		var count = 0;
		var f = [];
		var centers = facelet[4] + facelet[13] + facelet[22] + facelet[31] + facelet[40] + facelet[49];
		for (var i = 0; i < 54; ++i) {
			f[i] = centers.indexOf(facelet[i]);
			if (f[i] == -1) return -1;
			count += 1 << (f[i] << 2);
		}
		if (count != 10066329) return -1;
		var col1, col2, i = 0, j, ori;
		for (; i < 8; ++i) {
			for (ori = 0; ori < 3; ++ori) if (f[cFacelet[i][ori]] == 0 || f[cFacelet[i][ori]] == 3) break;
			col1 = f[cFacelet[i][(ori + 1) % 3]];
			col2 = f[cFacelet[i][(ori + 2) % 3]];
			for (j = 0; j < 8; ++j) if (col1 == ~~(cFacelet[j][1] / 9) && col2 == ~~(cFacelet[j][2] / 9)) {
				this.ca[i] = j | ori % 3 << 4;
				break;
			}
		}
		for (i = 0; i < 12; ++i) for (j = 0; j < 12; ++j) {
			if (f[eFacelet[i][0]] == ~~(eFacelet[j][0] / 9) && f[eFacelet[i][1]] == ~~(eFacelet[j][1] / 9)) {
				this.ea[i] = j;
				break;
			}
			if (f[eFacelet[i][0]] == ~~(eFacelet[j][1] / 9) && f[eFacelet[i][1]] == ~~(eFacelet[j][0] / 9)) {
				this.ea[i] = j | 16;
				break;
			}
		}
	};
	function CoordCube() {
		this.twst = 0;
		this.flip = 0;
		this.slice = 0;
		this.prun = 0;
		this.twstc = 0;
		this.flipc = 0;
	}
	CoordCube.prototype.set = function(node) {
		this.twst = node.twst;
		this.flip = node.flip;
		this.slice = node.slice;
		this.prun = node.prun;
		if (USE_CONJ_PRUN) {
			this.twstc = node.twstc;
			this.flipc = node.flipc;
		}
	};
	CoordCube.prototype.calcPruning = function(isPhase1) {
		this.prun = Math.max(getPruningMax(SliceTwstPrunMax, SliceTwstPrun, (this.twst >> 3) * N_SLICE + SliceConj[this.slice << 3 | this.twst & 7]), getPruningMax(SliceFlipPrunMax, SliceFlipPrun, (this.flip >> 3) * N_SLICE + SliceConj[this.slice << 3 | this.flip & 7]), USE_CONJ_PRUN ? getPruningMax(TwstFlipPrunMax, TwstFlipPrun, this.twstc >> 3 << 11 | FlipS2RF[this.flipc ^ this.twstc & 7]) : 0, USE_TWST_FLIP_PRUN ? getPruningMax(TwstFlipPrunMax, TwstFlipPrun, this.twst >> 3 << 11 | FlipS2RF[this.flip ^ this.twst & 7]) : 0);
	};
	CoordCube.prototype.setWithPrun = function(cc, depth) {
		this.twst = cc.getTwstSym();
		this.flip = cc.getFlipSym();
		this.prun = USE_TWST_FLIP_PRUN ? getPruningMax(TwstFlipPrunMax, TwstFlipPrun, this.twst >> 3 << 11 | FlipS2RF[this.flip ^ this.twst & 7]) : 0;
		if (this.prun > depth) return false;
		this.slice = cc.getSlice();
		this.prun = Math.max(this.prun, getPruningMax(SliceTwstPrunMax, SliceTwstPrun, (this.twst >> 3) * N_SLICE + SliceConj[this.slice << 3 | this.twst & 7]), getPruningMax(SliceFlipPrunMax, SliceFlipPrun, (this.flip >> 3) * N_SLICE + SliceConj[this.slice << 3 | this.flip & 7]));
		if (this.prun > depth) return false;
		if (USE_CONJ_PRUN) {
			var pc = new CubieCube();
			CubieCube.CornConjugate(cc, 1, pc);
			CubieCube.EdgeConjugate(cc, 1, pc);
			this.twstc = pc.getTwstSym();
			this.flipc = pc.getFlipSym();
			this.prun = Math.max(this.prun, getPruningMax(TwstFlipPrunMax, TwstFlipPrun, this.twstc >> 3 << 11 | FlipS2RF[this.flipc ^ this.twstc & 7]));
		}
		return this.prun <= depth;
	};
	CoordCube.prototype.doMovePrun = function(cc, m, isPhase1) {
		this.slice = SliceMove[cc.slice * N_MOVES + m];
		this.flip = FlipMove[(cc.flip >> 3) * N_MOVES + Sym8Move[m << 3 | cc.flip & 7]] ^ cc.flip & 7;
		this.twst = TwstMove[(cc.twst >> 3) * N_MOVES + Sym8Move[m << 3 | cc.twst & 7]] ^ cc.twst & 7;
		this.prun = Math.max(getPruningMax(SliceTwstPrunMax, SliceTwstPrun, (this.twst >> 3) * N_SLICE + SliceConj[this.slice << 3 | this.twst & 7]), getPruningMax(SliceFlipPrunMax, SliceFlipPrun, (this.flip >> 3) * N_SLICE + SliceConj[this.slice << 3 | this.flip & 7]), USE_TWST_FLIP_PRUN ? getPruningMax(TwstFlipPrunMax, TwstFlipPrun, this.twst >> 3 << 11 | FlipS2RF[this.flip ^ this.twst & 7]) : 0);
		return this.prun;
	};
	CoordCube.prototype.doMovePrunConj = function(cc, m) {
		m = SymMove[3][m];
		this.flipc = FlipMove[(cc.flipc >> 3) * N_MOVES + Sym8Move[m << 3 | cc.flipc & 7]] ^ cc.flipc & 7;
		this.twstc = TwstMove[(cc.twstc >> 3) * N_MOVES + Sym8Move[m << 3 | cc.twstc & 7]] ^ cc.twstc & 7;
		return getPruningMax(TwstFlipPrunMax, TwstFlipPrun, this.twstc >> 3 << 11 | FlipS2RF[this.flipc ^ this.twstc & 7]);
	};
	Search.prototype.solution = function(facelets, maxDepth, probeMax, probeMin, verbose, firstAxisFilter, lastAxisFilter) {
		initPrunTables();
		var check = this.verify(facelets);
		if (check != 0) return "Error " + Math.abs(check);
		if (maxDepth === void 0) maxDepth = 21;
		if (probeMax === void 0) probeMax = 1e9;
		if (probeMin === void 0) probeMin = 0;
		if (verbose === void 0) verbose = 0;
		this.sol = maxDepth + 1;
		this.probe = 0;
		this.probeMax = probeMax;
		this.probeMin = Math.min(probeMin, probeMax);
		this.verbose = verbose;
		this.moveSol = null;
		this.isRec = false;
		this.firstFilters = [
			0,
			0,
			0,
			0,
			0,
			0
		];
		this.lastFilters = [
			0,
			0,
			0,
			0,
			0,
			0
		];
		for (var i = 0; i < 3; i++) {
			if (firstAxisFilter !== void 0) {
				this.firstFilters[i] |= 3591 << ~~(urfMove[(3 - i) % 3][firstAxisFilter * 3] / 3) * 3;
				this.lastFilters[i + 3] |= 3591 << ~~(urfMove[(3 - i) % 3][firstAxisFilter * 3] / 3) * 3;
			}
			if (lastAxisFilter !== void 0) {
				this.lastFilters[i] |= 3591 << ~~(urfMove[(3 - i) % 3][lastAxisFilter * 3] / 3) * 3;
				this.firstFilters[i + 3] |= 3591 << ~~(urfMove[(3 - i) % 3][lastAxisFilter * 3] / 3) * 3;
			}
		}
		this.initSearch();
		return this.search();
	};
	Search.prototype.initSearch = function() {
		this.conjMask = 0;
		this.maxPreMoves = this.conjMask > 7 ? 0 : MAX_PRE_MOVES;
		for (var i = 0; i < 6; i++) {
			this.urfCubieCube[i].init(this.cc.ca, this.cc.ea);
			this.urfCoordCube[i].setWithPrun(this.urfCubieCube[i], 20);
			this.cc.URFConjugate();
			if (i % 3 == 2) {
				var tmp = new CubieCube().invFrom(this.cc);
				this.cc.init(tmp.ca, tmp.ea);
			}
		}
	};
	Search.prototype.next = function(probeMax, probeMin, verbose) {
		this.probe = 0;
		this.probeMax = probeMax;
		this.probeMin = Math.min(probeMin, probeMax);
		this.moveSol = null;
		this.isRec = true;
		this.verbose = verbose;
		return this.search();
	};
	Search.prototype.verify = function(facelets) {
		if (this.cc.fromFacelet(facelets) == -1) return -1;
		var sum = 0;
		var edgeMask = 0;
		for (var e = 0; e < 12; e++) {
			edgeMask |= 1 << (this.cc.ea[e] & 15);
			sum ^= this.cc.ea[e] >> 4;
		}
		if (edgeMask != 4095) return -2;
		if (sum != 0) return -3;
		var cornMask = 0;
		sum = 0;
		for (var c = 0; c < 8; c++) {
			cornMask |= 1 << (this.cc.ca[c] & 15);
			sum += this.cc.ca[c] >> 4;
		}
		if (cornMask != 255) return -4;
		if (sum % 3 != 0) return -5;
		if ((getNParity(getNPermFull(this.cc.ea, 12), 12) ^ getNParity(this.cc.getCPerm(), 8)) != 0) return -6;
		return 0;
	};
	Search.prototype.phase1PreMoves = function(maxl, lm, cc) {
		if (maxl == this.maxPreMoves - 1 && (this.lastFilter >> lm & 1) != 0) return 1;
		this.preMoveLen = this.maxPreMoves - maxl;
		if (this.isRec ? this.depth1 == this.length1 - this.preMoveLen : this.preMoveLen == 0 || (225207 >> lm & 1) == 0) {
			this.depth1 = this.length1 - this.preMoveLen;
			this.phase1Cubie[0].init(cc.ca, cc.ea);
			this.allowShorter = this.depth1 == MIN_P1LENGTH_PRE && this.preMoveLen != 0;
			if (this.nodeUD[this.depth1 + 1].setWithPrun(cc, this.depth1) && this.phase1(this.nodeUD[this.depth1 + 1], this.depth1, -1) == 0) return 0;
		}
		if (maxl == 0 || this.preMoveLen + MIN_P1LENGTH_PRE >= this.length1) return 1;
		var skipMoves = 0;
		if (maxl == 1 || this.preMoveLen + 1 + MIN_P1LENGTH_PRE >= this.length1) skipMoves |= 225207;
		lm = ~~(lm / 3) * 3;
		for (var m = 0; m < 18; m++) {
			if (m == lm || m == lm - 9 || m == lm + 9) {
				m += 2;
				continue;
			}
			if (this.isRec && m != this.preMoves[this.maxPreMoves - maxl] || (skipMoves & 1 << m) != 0) continue;
			CubieCube.CornMult(moveCube[m], cc, this.preMoveCubes[maxl]);
			CubieCube.EdgeMult(moveCube[m], cc, this.preMoveCubes[maxl]);
			this.preMoves[this.maxPreMoves - maxl] = m;
			if (this.phase1PreMoves(maxl - 1, m, this.preMoveCubes[maxl]) == 0) return 0;
		}
		return 1;
	};
	Search.prototype.search = function() {
		for (this.length1 = this.isRec ? this.length1 : 0; this.length1 < this.sol; this.length1++) for (this.urfIdx = this.isRec ? this.urfIdx : 0; this.urfIdx < 6; this.urfIdx++) {
			if ((this.conjMask & 1 << this.urfIdx) != 0) continue;
			this.firstFilter = this.firstFilters[this.urfIdx];
			this.lastFilter = this.lastFilters[this.urfIdx];
			if (this.phase1PreMoves(this.maxPreMoves, -30, this.urfCubieCube[this.urfIdx], 0) == 0) return this.moveSol == null ? "Error 8" : this.moveSol;
		}
		return this.moveSol == null ? "Error 7" : this.moveSol;
	};
	Search.prototype.initPhase2Pre = function() {
		this.isRec = false;
		if (this.probe >= (this.moveSol == null ? this.probeMax : this.probeMin)) return 0;
		++this.probe;
		for (var i = this.valid1; i < this.depth1; i++) {
			CubieCube.CornMult(this.phase1Cubie[i], moveCube[this.move[i]], this.phase1Cubie[i + 1]);
			CubieCube.EdgeMult(this.phase1Cubie[i], moveCube[this.move[i]], this.phase1Cubie[i + 1]);
		}
		this.valid1 = this.depth1;
		var ret = this.initPhase2(this.phase1Cubie[this.depth1]);
		if (ret == 0 || this.preMoveLen == 0 || ret == 2) return ret;
		var m = ~~(this.preMoves[this.preMoveLen - 1] / 3) * 3 + 1;
		CubieCube.CornMult(moveCube[m], this.phase1Cubie[this.depth1], this.phase1Cubie[this.depth1 + 1]);
		CubieCube.EdgeMult(moveCube[m], this.phase1Cubie[this.depth1], this.phase1Cubie[this.depth1 + 1]);
		this.preMoves[this.preMoveLen - 1] += 2 - this.preMoves[this.preMoveLen - 1] % 3 * 2;
		ret = this.initPhase2(this.phase1Cubie[this.depth1 + 1]);
		this.preMoves[this.preMoveLen - 1] += 2 - this.preMoves[this.preMoveLen - 1] % 3 * 2;
		return ret;
	};
	Search.prototype.initPhase2 = function(phase2Cubie) {
		var p2corn = phase2Cubie.getCPermSym();
		var p2csym = p2corn & 15;
		p2corn >>= 4;
		var p2edge = phase2Cubie.getEPermSym();
		var p2esym = p2edge & 15;
		p2edge >>= 4;
		var p2mid = phase2Cubie.getMPerm();
		var prun = Math.max(getPruningMax(EPermCCombPPrunMax, EPermCCombPPrun, p2edge * N_COMB + CCombPConj[(Perm2CombP[p2corn] & 255) << 4 | SymMultInv[p2esym][p2csym]]), getPruningMax(MCPermPrunMax, MCPermPrun, p2corn * N_MPERM + MPermConj[p2mid << 4 | p2csym]));
		var maxDep2 = Math.min(MAX_DEPTH2, this.sol - this.length1);
		if (prun >= maxDep2) return prun > maxDep2 ? 2 : 1;
		var depth2 = maxDep2 - 1;
		for (; depth2 >= prun; depth2--) {
			var ret = this.phase2(p2edge, p2esym, p2corn, p2csym, p2mid, depth2, this.depth1, 10);
			if (ret < 0) break;
			depth2 -= ret;
			this.moveSol = [];
			for (var i = 0; i < this.depth1 + depth2; i++) this.appendSolMove(this.move[i]);
			for (var i = this.preMoveLen - 1; i >= 0; i--) this.appendSolMove(this.preMoves[i]);
			this.sol = this.moveSol.length;
			this.moveSol = this.solutionToString();
		}
		if (depth2 != maxDep2 - 1) return this.probe >= this.probeMin ? 0 : 1;
		else return 1;
	};
	Search.prototype.phase1 = function(node, maxl, lm) {
		if (maxl == this.depth1 - 1 && (this.firstFilter >> lm & 1) != 0) return 1;
		if (node.prun == 0 && maxl < 5) {
			if (this.allowShorter || maxl == 0) {
				this.depth1 -= maxl;
				var ret = this.initPhase2Pre();
				this.depth1 += maxl;
				return ret;
			} else return 1;
		}
		for (var axis = 0; axis < 18; axis += 3) {
			if (axis == lm || axis == lm - 9) continue;
			for (var power = 0; power < 3; power++) {
				var m = axis + power;
				if (this.isRec && m != this.move[this.depth1 - maxl]) continue;
				var prun = this.nodeUD[maxl].doMovePrun(node, m, true);
				if (prun > maxl) break;
				else if (prun == maxl) continue;
				if (USE_CONJ_PRUN) {
					prun = this.nodeUD[maxl].doMovePrunConj(node, m);
					if (prun > maxl) break;
					else if (prun == maxl) continue;
				}
				this.move[this.depth1 - maxl] = m;
				this.valid1 = Math.min(this.valid1, this.depth1 - maxl);
				var ret = this.phase1(this.nodeUD[maxl], maxl - 1, axis);
				if (ret == 0) return 0;
				else if (ret == 2) break;
			}
		}
		return 1;
	};
	Search.prototype.appendSolMove = function(curMove) {
		if (this.moveSol.length == 0) {
			this.moveSol.push(curMove);
			return;
		}
		var axisCur = ~~(curMove / 3);
		var axisLast = ~~(this.moveSol.at(-1) / 3);
		if (axisCur == axisLast) {
			var pow = (curMove % 3 + this.moveSol.at(-1) % 3 + 1) % 4;
			if (pow == 3) this.moveSol.pop();
			else this.moveSol.splice(-1, 1, axisCur * 3 + pow);
			return;
		}
		if (this.moveSol.length > 1 && axisCur % 3 == axisLast % 3 && axisCur == ~~(this.moveSol.at(-2) / 3)) {
			var pow = (curMove % 3 + this.moveSol.at(-2) % 3 + 1) % 4;
			if (pow == 3) {
				this.moveSol.splice(-2, 1, this.moveSol.at(-1));
				this.moveSol.pop();
			} else this.moveSol.splice(-2, 1, axisCur * 3 + pow);
			return;
		}
		this.moveSol.push(curMove);
	};
	Search.prototype.phase2 = function(edge, esym, corn, csym, mid, maxl, depth, lm) {
		if (this.depth1 == 0 && depth == 1 && (this.firstFilter >> ud2std[lm] & 1) != 0) return -1;
		if (edge == 0 && corn == 0 && mid == 0 && (this.preMoveLen > 0 || (this.lastFilter >> ud2std[lm] & 1) == 0)) return maxl;
		var moveMask = ckmv2bit[lm];
		for (var m = 0; m < 10; m++) {
			if ((moveMask >> m & 1) != 0) {
				m += 66 >> m & 3;
				continue;
			}
			var midx = MPermMove[mid * N_MOVES2 + m];
			var cornx = CPermMove[corn * N_MOVES2 + SymMoveUD[csym][m]];
			var csymx = SymMult[cornx & 15][csym];
			cornx >>= 4;
			if (getPruningMax(MCPermPrunMax, MCPermPrun, cornx * N_MPERM + MPermConj[midx << 4 | csymx]) >= maxl) continue;
			var edgex = EPermMove[edge * N_MOVES2 + SymMoveUD[esym][m]];
			var esymx = SymMult[edgex & 15][esym];
			edgex >>= 4;
			if (getPruningMax(EPermCCombPPrunMax, EPermCCombPPrun, edgex * N_COMB + CCombPConj[(Perm2CombP[cornx] & 255) << 4 | SymMultInv[esymx][csymx]]) >= maxl) continue;
			var edgei = getPermSymInv(edgex, esymx, false);
			var corni = getPermSymInv(cornx, csymx, true);
			if (getPruningMax(EPermCCombPPrunMax, EPermCCombPPrun, (edgei >> 4) * N_COMB + CCombPConj[(Perm2CombP[corni >> 4] & 255) << 4 | SymMultInv[edgei & 15][corni & 15]]) >= maxl) continue;
			var ret = this.phase2(edgex, esymx, cornx, csymx, midx, maxl - 1, depth + 1, m);
			if (ret >= 0) {
				this.move[depth] = ud2std[m];
				return ret;
			}
		}
		return -1;
	};
	Search.prototype.solutionToString = function() {
		var sb = "";
		var urf = (this.verbose & INVERSE_SOLUTION) != 0 ? (this.urfIdx + 3) % 6 : this.urfIdx;
		if (urf < 3) for (var s = 0; s < this.moveSol.length; ++s) sb += move2str[urfMove[urf][this.moveSol[s]]] + " ";
		else for (var s = this.moveSol.length - 1; s >= 0; --s) sb += move2str[urfMove[urf][this.moveSol[s]]] + " ";
		return sb;
	};
	var moveCube = [];
	var SymCube = [];
	var SymMult = [];
	var SymMultInv = [];
	var SymMove = [];
	var SymMoveUD = [];
	var Sym8Move = [];
	var FlipS2R = [];
	var FlipR2S = [];
	var FlipSelfSym = [];
	var FlipS2RF = [];
	var TwstS2R = [];
	var TwstR2S = [];
	var TwstSelfSym = [];
	var EPermS2R = [];
	var EPermR2S = [];
	var PermSelfSym = [];
	var Perm2CombP = [];
	var PermInvEdgeSym = [];
	var TwstMove = [];
	var FlipMove = [];
	var SliceMove = [];
	var SliceConj = [];
	var SliceTwstPrun = [];
	var SliceFlipPrun = [];
	var TwstFlipPrun = [];
	var CPermMove = [];
	var EPermMove = [];
	var MPermMove = [];
	var MPermConj = [];
	var CCombPMove = [];
	var CCombPConj = [];
	var MCPermPrun = [];
	var EPermCCombPPrun = [];
	var TwstFlipPrunMax = 15;
	var SliceTwstPrunMax = 15;
	var SliceFlipPrunMax = 15;
	var MCPermPrunMax = 15;
	var EPermCCombPPrunMax = 15;
	for (var i = 0; i < 18; i++) moveCube[i] = new CubieCube();
	moveCube[0].initCoord(15120, 0, 119750400, 0);
	moveCube[3].initCoord(21021, 1494, 323403417, 0);
	moveCube[6].initCoord(8064, 1236, 29441808, 550);
	moveCube[9].initCoord(9, 0, 5880, 0);
	moveCube[12].initCoord(1230, 412, 2949660, 0);
	moveCube[15].initCoord(224, 137, 328552, 137);
	for (var a = 0; a < 18; a += 3) for (var p = 0; p < 2; p++) {
		CubieCube.EdgeMult(moveCube[a + p], moveCube[a], moveCube[a + p + 1]);
		CubieCube.CornMult(moveCube[a + p], moveCube[a], moveCube[a + p + 1]);
	}
	CubieCube.urf1 = new CubieCube().initCoord(2531, 1373, 67026819, 1367);
	CubieCube.urf2 = new CubieCube().initCoord(2089, 1906, 322752913, 2040);
	function initBasic() {
		var c = new CubieCube();
		var d = new CubieCube();
		var f2 = new CubieCube().initCoord(28783, 0, 259268407, 0);
		var u4 = new CubieCube().initCoord(15138, 0, 119765538, 7);
		var lr2 = new CubieCube().initCoord(5167, 0, 83473207, 0);
		for (var i = 0; i < 8; i++) lr2.ca[i] |= 48;
		for (var i = 0; i < 16; i++) {
			SymCube[i] = new CubieCube().init(c.ca, c.ea);
			CubieCube.CornMultFull(c, u4, d);
			CubieCube.EdgeMult(c, u4, d);
			c.init(d.ca, d.ea);
			if (i % 4 == 3) {
				CubieCube.CornMultFull(c, lr2, d);
				CubieCube.EdgeMult(c, lr2, d);
				c.init(d.ca, d.ea);
			}
			if (i % 8 == 7) {
				CubieCube.CornMultFull(c, f2, d);
				CubieCube.EdgeMult(c, f2, d);
				c.init(d.ca, d.ea);
			}
		}
		for (var i = 0; i < 16; i++) {
			SymMult[i] = [];
			SymMultInv[i] = [];
			SymMove[i] = [];
			Sym8Move[i] = [];
			SymMoveUD[i] = [];
		}
		for (var i = 0; i < 16; i++) for (var j = 0; j < 16; j++) {
			SymMult[i][j] = i ^ j ^ 84660 >> j & i << 1 & 2;
			SymMultInv[SymMult[i][j]][j] = i;
		}
		c = new CubieCube();
		for (var s = 0; s < 16; s++) for (var j = 0; j < 18; j++) {
			CubieCube.CornConjugate(moveCube[j], SymMultInv[0][s], c);
			outloop: for (var m = 0; m < 18; m++) {
				for (var k = 0; k < 8; k++) if (moveCube[m].ca[k] != c.ca[k]) continue outloop;
				SymMove[s][j] = m;
				SymMoveUD[s][std2ud[j]] = std2ud[m];
				break;
			}
			if (s % 2 == 0) Sym8Move[j << 3 | s >> 1] = SymMove[s][j];
		}
		function initSym2Raw(N_RAW, Sym2Raw, Raw2Sym, SelfSym, coord, setFunc, getFunc) {
			N_RAW + 1 >> 1;
			var c = new CubieCube();
			var d = new CubieCube();
			var count = 0;
			var sym_inc = coord >= 2 ? 1 : 2;
			var conjFunc = coord != 1 ? CubieCube.EdgeConjugate : CubieCube.CornConjugate;
			for (var i = 0; i < N_RAW; i++) {
				if (Raw2Sym[i] !== void 0) continue;
				setFunc.call(c, i);
				for (var s = 0; s < 16; s += sym_inc) {
					conjFunc(c, s, d);
					var idx = getFunc.call(d);
					if (USE_TWST_FLIP_PRUN && coord == 0) FlipS2RF[count << 3 | s >> 1] = idx;
					if (idx == i) SelfSym[count] |= 1 << s / sym_inc;
					Raw2Sym[idx] = (count << 4 | s) / sym_inc;
				}
				Sym2Raw[count++] = i;
			}
			return count;
		}
		initSym2Raw(N_FLIP, FlipS2R, FlipR2S, FlipSelfSym, 0, CubieCube.prototype.setFlip, CubieCube.prototype.getFlip);
		initSym2Raw(N_TWST, TwstS2R, TwstR2S, TwstSelfSym, 1, CubieCube.prototype.setTwst, CubieCube.prototype.getTwst);
		initSym2Raw(N_PERM, EPermS2R, EPermR2S, PermSelfSym, 2, CubieCube.prototype.setEPerm, CubieCube.prototype.getEPerm);
		var cc = new CubieCube();
		for (var i = 0; i < N_PERM_SYM; i++) {
			setNPerm(cc.ea, EPermS2R[i], 8);
			Perm2CombP[i] = getComb(cc.ea, 0) + getNParity(EPermS2R[i], 8) * 70;
			c.invFrom(cc);
			PermInvEdgeSym[i] = EPermR2S[c.getEPerm()];
		}
		c = new CubieCube();
		d = new CubieCube();
		function initSymMoveTable(moveTable, SymS2R, N_SIZE, N_MOVES, setFunc, getFunc, multFunc, ud2std) {
			for (var i = 0; i < N_SIZE; i++) {
				setFunc.call(c, SymS2R[i]);
				for (var j = 0; j < N_MOVES; j++) {
					multFunc(c, moveCube[ud2std ? ud2std[j] : j], d);
					moveTable[i * N_MOVES + j] = getFunc.call(d);
				}
			}
		}
		initSymMoveTable(FlipMove, FlipS2R, N_FLIP_SYM, N_MOVES, CubieCube.prototype.setFlip, CubieCube.prototype.getFlipSym, CubieCube.EdgeMult);
		initSymMoveTable(TwstMove, TwstS2R, N_TWST_SYM, N_MOVES, CubieCube.prototype.setTwst, CubieCube.prototype.getTwstSym, CubieCube.CornMult);
		initSymMoveTable(EPermMove, EPermS2R, N_PERM_SYM, N_MOVES2, CubieCube.prototype.setEPerm, CubieCube.prototype.getEPermSym, CubieCube.EdgeMult, ud2std);
		initSymMoveTable(CPermMove, EPermS2R, N_PERM_SYM, N_MOVES2, CubieCube.prototype.setCPerm, CubieCube.prototype.getCPermSym, CubieCube.CornMult, ud2std);
		for (var i = 0; i < N_SLICE; i++) {
			c.setSlice(i);
			for (var j = 0; j < N_MOVES; j++) {
				CubieCube.EdgeMult(c, moveCube[j], d);
				SliceMove[i * N_MOVES + j] = d.getSlice();
			}
			for (var j = 0; j < 16; j += 2) {
				CubieCube.EdgeConjugate(c, SymMultInv[0][j], d);
				SliceConj[i << 3 | j >> 1] = d.getSlice();
			}
		}
		for (var i = 0; i < N_MPERM; i++) {
			c.setMPerm(i);
			for (var j = 0; j < N_MOVES2; j++) {
				CubieCube.EdgeMult(c, moveCube[ud2std[j]], d);
				MPermMove[i * N_MOVES2 + j] = d.getMPerm();
			}
			for (var j = 0; j < 16; j++) {
				CubieCube.EdgeConjugate(c, SymMultInv[0][j], d);
				MPermConj[i << 4 | j] = d.getMPerm();
			}
		}
		for (var i = 0; i < N_COMB; i++) {
			c.setCComb(i % 70);
			for (var j = 0; j < N_MOVES2; j++) {
				CubieCube.CornMult(c, moveCube[ud2std[j]], d);
				CCombPMove[i * N_MOVES2 + j] = d.getCComb() + 70 * (165 >> j & 1 ^ ~~(i / 70));
			}
			for (var j = 0; j < 16; j++) {
				CubieCube.CornConjugate(c, SymMultInv[0][j], d);
				CCombPConj[i << 4 | j] = d.getCComb() + 70 * ~~(i / 70);
			}
		}
	}
	var InitPrunProgress = -1;
	function initRawSymPrun(PrunTable, N_RAW, N_SYM, RawMove, RawConj, SymMove, SelfSym, PrunFlag) {
		var SYM_SHIFT = PrunFlag & 15;
		var SYM_E2C_MAGIC = (PrunFlag >> 4 & 1) == 1 ? 14540032 : 0;
		var IS_PHASE2 = (PrunFlag >> 5 & 1) == 1;
		var INV_DEPTH = PrunFlag >> 8 & 15;
		var MAX_DEPTH = PrunFlag >> 12 & 15;
		var MIN_DEPTH = PrunFlag >> 16 & 15;
		var SYM_MASK = (1 << SYM_SHIFT) - 1;
		var ISTFP = RawMove == null;
		var N_SIZE = N_RAW * N_SYM;
		var N_MOVES = IS_PHASE2 ? 10 : 18;
		var NEXT_AXIS_MAGIC = N_MOVES == 10 ? 66 : 599186;
		var depth = getPruning(PrunTable, N_SIZE) - 1;
		if (depth == -1) {
			for (var i = 0; i < (N_SIZE >> 3) + 1; i++) PrunTable[i] = -1;
			setPruning(PrunTable, 0, 15);
			depth = 0;
		} else setPruning(PrunTable, N_SIZE, 15 ^ depth + 1);
		var SEARCH_DEPTH = PARTIAL_INIT_LEVEL > 0 ? Math.min(Math.max(depth + 1, MIN_DEPTH), MAX_DEPTH) : MAX_DEPTH;
		while (depth < SEARCH_DEPTH) {
			var inv = depth > INV_DEPTH;
			var select = inv ? 15 : depth;
			var selArrMask = select * 286331153;
			var check = inv ? depth : 15;
			depth++;
			InitPrunProgress++;
			var xorVal = depth ^ 15;
			var done = 0;
			var val = 0;
			for (var i = 0; i < N_SIZE; i++, val >>= 4) {
				if ((i & 7) == 0) {
					val = PrunTable[i >> 3];
					if (!hasZero(val ^ selArrMask)) {
						i += 7;
						continue;
					}
				}
				if ((val & 15) != select) continue;
				var raw = i % N_RAW;
				var sym = ~~(i / N_RAW);
				var flip = 0, fsym = 0;
				if (ISTFP) {
					flip = FlipR2S[raw];
					fsym = flip & 7;
					flip >>= 3;
				}
				for (var m = 0; m < N_MOVES; m++) {
					var symx = SymMove[sym * N_MOVES + m];
					var rawx;
					if (ISTFP) rawx = FlipS2RF[FlipMove[flip * N_MOVES + Sym8Move[m << 3 | fsym]] ^ fsym ^ symx & SYM_MASK];
					else rawx = RawConj[RawMove[raw * N_MOVES + m] << SYM_SHIFT | symx & SYM_MASK];
					symx >>= SYM_SHIFT;
					var idx = symx * N_RAW + rawx;
					var prun = getPruning(PrunTable, idx);
					if (prun != check) {
						if (prun < depth - 1) m += NEXT_AXIS_MAGIC >> m & 3;
						continue;
					}
					done++;
					if (inv) {
						setPruning(PrunTable, i, xorVal);
						break;
					}
					setPruning(PrunTable, idx, xorVal);
					for (var j = 1, selfSym = SelfSym[symx]; (selfSym >>= 1) != 0; j++) {
						if ((selfSym & 1) != 1) continue;
						var idxx = symx * N_RAW;
						if (ISTFP) idxx += FlipS2RF[FlipR2S[rawx] ^ j];
						else idxx += RawConj[rawx << SYM_SHIFT | j ^ SYM_E2C_MAGIC >> (j << 1) & 3];
						if (getPruning(PrunTable, idxx) == check) {
							setPruning(PrunTable, idxx, xorVal);
							done++;
						}
					}
				}
			}
		}
		setPruning(PrunTable, N_SIZE, depth + 1 ^ 15);
		return depth + 1;
	}
	function doInitPrunTables(targetProgress) {
		if (USE_TWST_FLIP_PRUN) TwstFlipPrunMax = initRawSymPrun(TwstFlipPrun, N_FLIP, N_TWST_SYM, null, null, TwstMove, TwstSelfSym, 103939);
		if (InitPrunProgress > targetProgress) return;
		SliceTwstPrunMax = initRawSymPrun(SliceTwstPrun, N_SLICE, N_TWST_SYM, SliceMove, SliceConj, TwstMove, TwstSelfSym, 431619);
		if (InitPrunProgress > targetProgress) return;
		SliceFlipPrunMax = initRawSymPrun(SliceFlipPrun, N_SLICE, N_FLIP_SYM, SliceMove, SliceConj, FlipMove, FlipSelfSym, 431619);
		if (InitPrunProgress > targetProgress) return;
		MCPermPrunMax = initRawSymPrun(MCPermPrun, 24, N_PERM_SYM, MPermMove, MPermConj, CPermMove, PermSelfSym, 584244);
		if (InitPrunProgress > targetProgress) return;
		EPermCCombPPrunMax = initRawSymPrun(EPermCCombPPrun, N_COMB, N_PERM_SYM, CCombPMove, CCombPConj, EPermMove, PermSelfSym, 514084);
	}
	function initPrunTables() {
		if (InitPrunProgress < 0) {
			initBasic();
			InitPrunProgress = 0;
		}
		if (InitPrunProgress == 0) doInitPrunTables(99);
		else if (InitPrunProgress < 54) doInitPrunTables(InitPrunProgress);
		else return true;
		return false;
	}
	function randomCube() {
		var ep, cp;
		var eo = ~~(Math.random() * 2048);
		var co = ~~(Math.random() * 2187);
		do {
			ep = ~~(Math.random() * fact[12]);
			cp = ~~(Math.random() * fact[8]);
		} while (getNParity(cp, 8) != getNParity(ep, 12));
		return new CubieCube().initCoord(cp, co, ep, eo).toFaceCube();
	}
	function fromScramble(s) {
		var axis = -1;
		var c1 = new CubieCube();
		var c2 = new CubieCube();
		for (var i = 0; i < s.length; i++) switch (s[i]) {
			case "U":
			case "R":
			case "F":
			case "D":
			case "L":
			case "B":
				axis = "URFDLB".indexOf(s[i]) * 3;
				break;
			case " ":
				if (axis != -1) {
					CubieCube.CornMult(c1, moveCube[axis], c2);
					CubieCube.EdgeMult(c1, moveCube[axis], c2);
					c1.init(c2.ca, c2.ea);
				}
				axis = -1;
				break;
			case "2":
				axis++;
				break;
			case "'":
				axis += 2;
				break;
			default: continue;
		}
		if (axis != -1) {
			CubieCube.CornMult(c1, moveCube[axis], c2);
			CubieCube.EdgeMult(c1, moveCube[axis], c2);
			c1.init(c2.ca, c2.ea);
		}
		return c2.toFaceCube();
	}
	return {
		Search,
		solve: function(facelet) {
			return new Search().solution(facelet);
		},
		randomCube,
		fromScramble,
		initFull: function() {
			PARTIAL_INIT_LEVEL = 0;
			initPrunTables();
		},
		INVERSE_SOLUTION
	};
})();
//#endregion
//#region src/vendor/cstimer/2x2x2.js
var scramble_222$1 = (function(rn) {
	var solv = new mathlib.Solver(3, 3, [[
		0,
		[
			doPermMove,
			"p",
			7
		],
		5040
	], [
		0,
		[
			doOriMove,
			"o",
			7,
			-3
		],
		729
	]]);
	var movePieces = [
		[
			0,
			2,
			3,
			1
		],
		[
			0,
			1,
			5,
			4
		],
		[
			0,
			4,
			6,
			2
		]
	];
	var moveOris = [
		null,
		[
			0,
			1,
			0,
			1,
			3
		],
		[
			1,
			0,
			1,
			0,
			3
		]
	];
	var oriCoord = new mathlib.Coord("o", 7, -3);
	function doPermMove(arr, m) {
		mathlib.acycle(arr, movePieces[m]);
	}
	function doOriMove(arr, m) {
		mathlib.acycle(arr, movePieces[m], 1, moveOris[m]);
	}
	var cFacelet = [
		[
			3,
			4,
			9
		],
		[
			1,
			20,
			5
		],
		[
			2,
			8,
			17
		],
		[
			0,
			16,
			21
		],
		[
			13,
			11,
			6
		],
		[
			15,
			7,
			22
		],
		[
			12,
			19,
			10
		]
	];
	var llFaces = [
		0,
		1,
		2,
		3,
		8,
		9,
		4,
		5,
		20,
		21,
		16,
		17
	];
	function checkNoBar(pidx, oidx) {
		var perm = mathlib.setNPerm([], pidx, 7);
		var ori = oriCoord.set([], oidx);
		var f = [];
		for (var i = 0; i < 24; i++) f[i] = i >> 2;
		mathlib.fillFacelet(cFacelet, f, perm, ori, 4);
		for (var i = 0; i < 24; i += 4) if ((1 << f[i] | 1 << f[i + 3]) & (1 << f[i + 1] | 1 << f[i + 2])) return false;
		return true;
	}
	var egprobs = [
		1,
		2,
		4,
		4,
		4,
		4,
		4,
		4,
		1,
		2,
		4,
		4,
		4,
		4,
		4,
		4,
		1,
		2,
		4,
		4,
		4,
		4,
		4,
		4,
		1,
		2,
		4,
		4,
		4,
		4,
		4,
		4,
		1,
		2,
		4,
		4,
		4,
		4,
		4,
		4,
		1,
		2,
		4,
		4,
		4,
		4,
		4,
		4
	];
	var egmap = [
		0,
		17,
		5,
		14,
		8,
		1,
		2,
		4
	];
	var egfilter = [
		"EG0-O",
		"EG0-H",
		"EG0-L",
		"EG0-Pi",
		"EG0-S",
		"EG0-T",
		"EG0-U",
		"EG0-aS",
		"EG1B-O",
		"EG1B-H",
		"EG1B-L",
		"EG1B-Pi",
		"EG1B-S",
		"EG1B-T",
		"EG1B-U",
		"EG1B-aS",
		"EG1L-O",
		"EG1L-H",
		"EG1L-L",
		"EG1L-Pi",
		"EG1L-S",
		"EG1L-T",
		"EG1L-U",
		"EG1L-aS",
		"EG1F-O",
		"EG1F-H",
		"EG1F-L",
		"EG1F-Pi",
		"EG1F-S",
		"EG1F-T",
		"EG1F-U",
		"EG1F-aS",
		"EG1R-O",
		"EG1R-H",
		"EG1R-L",
		"EG1R-Pi",
		"EG1R-S",
		"EG1R-T",
		"EG1R-U",
		"EG1R-aS",
		"EG2-O",
		"EG2-H",
		"EG2-L",
		"EG2-Pi",
		"EG2-S",
		"EG2-T",
		"EG2-U",
		"EG2-aS"
	];
	var egperms = [
		[
			4,
			5,
			6
		],
		[
			4,
			6,
			5
		],
		[
			6,
			5,
			4
		],
		[
			5,
			4,
			6
		],
		[
			5,
			6,
			4
		],
		[
			6,
			4,
			5
		]
	];
	var egll_map = [
		[
			12816,
			4641,
			2,
			"H-1"
		],
		[
			12576,
			4641,
			2,
			"H-2"
		],
		[
			8976,
			4641,
			4,
			"H-3"
		],
		[
			12306,
			4641,
			4,
			"H-4"
		],
		[
			786,
			528,
			4,
			"L-1"
		],
		[
			8976,
			528,
			4,
			"L-2"
		],
		[
			531,
			528,
			4,
			"L-3"
		],
		[
			12816,
			528,
			4,
			"L-4"
		],
		[
			8211,
			528,
			4,
			"L-5"
		],
		[
			12306,
			528,
			4,
			"L-6"
		],
		[
			12816,
			4626,
			4,
			"Pi-1"
		],
		[
			531,
			4626,
			4,
			"Pi-2"
		],
		[
			8976,
			4626,
			4,
			"Pi-3"
		],
		[
			8211,
			4626,
			4,
			"Pi-4"
		],
		[
			12306,
			4626,
			4,
			"Pi-5"
		],
		[
			786,
			4626,
			4,
			"Pi-6"
		],
		[
			12816,
			8736,
			4,
			"S-1"
		],
		[
			531,
			8736,
			4,
			"S-2"
		],
		[
			786,
			8736,
			4,
			"S-3"
		],
		[
			12306,
			8736,
			4,
			"S-4"
		],
		[
			8211,
			8736,
			4,
			"S-5"
		],
		[
			8976,
			8736,
			4,
			"S-6"
		],
		[
			8976,
			4128,
			4,
			"T-1"
		],
		[
			8211,
			4128,
			4,
			"T-2"
		],
		[
			531,
			4128,
			4,
			"T-3"
		],
		[
			12816,
			4128,
			4,
			"T-4"
		],
		[
			12306,
			4128,
			4,
			"T-5"
		],
		[
			786,
			4128,
			4,
			"T-6"
		],
		[
			531,
			8208,
			4,
			"U-1"
		],
		[
			12816,
			8208,
			4,
			"U-2"
		],
		[
			786,
			8208,
			4,
			"U-3"
		],
		[
			12306,
			8208,
			4,
			"U-4"
		],
		[
			8976,
			8208,
			4,
			"U-5"
		],
		[
			8211,
			8208,
			4,
			"U-6"
		],
		[
			12816,
			4113,
			4,
			"aS-1"
		],
		[
			531,
			4113,
			4,
			"aS-2"
		],
		[
			786,
			4113,
			4,
			"aS-3"
		],
		[
			12306,
			4113,
			4,
			"aS-4"
		],
		[
			8976,
			4113,
			4,
			"aS-5"
		],
		[
			8211,
			4113,
			4,
			"aS-6"
		]
	];
	var tcllp_map = [
		[
			291,
			545,
			4,
			"Hammer-1"
		],
		[
			12321,
			545,
			4,
			"Hammer-2"
		],
		[
			306,
			545,
			4,
			"Hammer-3"
		],
		[
			561,
			545,
			4,
			"Hammer-4"
		],
		[
			801,
			545,
			4,
			"Hammer-5"
		],
		[
			8961,
			545,
			4,
			"Hammer-6"
		],
		[
			291,
			4130,
			4,
			"Spaceship-1"
		],
		[
			8961,
			4130,
			4,
			"Spaceship-2"
		],
		[
			4896,
			4130,
			4,
			"Spaceship-3"
		],
		[
			12321,
			4130,
			4,
			"Spaceship-4"
		],
		[
			12306,
			4130,
			4,
			"Spaceship-5"
		],
		[
			561,
			4130,
			4,
			"Spaceship-6"
		],
		[
			8241,
			2,
			4,
			"Stollery-1"
		],
		[
			12576,
			2,
			4,
			"Stollery-2"
		],
		[
			12801,
			2,
			4,
			"Stollery-3"
		],
		[
			8451,
			2,
			4,
			"Stollery-4"
		],
		[
			561,
			2,
			4,
			"Stollery-5"
		],
		[
			8496,
			2,
			4,
			"Stollery-6"
		],
		[
			291,
			8738,
			1,
			"Pinwheel-1"
		],
		[
			4146,
			8738,
			1,
			"Pinwheel-2"
		],
		[
			12801,
			8738,
			4,
			"Pinwheel-3"
		],
		[
			8241,
			272,
			2,
			"2Face-1"
		],
		[
			12546,
			272,
			4,
			"2Face-2"
		],
		[
			531,
			272,
			2,
			"2Face-3"
		],
		[
			12321,
			272,
			4,
			"2Face-4"
		],
		[
			4866,
			290,
			4,
			"Turtle-1"
		],
		[
			4146,
			290,
			4,
			"Turtle-2"
		],
		[
			12801,
			290,
			4,
			"Turtle-3"
		],
		[
			4656,
			290,
			4,
			"Turtle-4"
		],
		[
			8976,
			290,
			4,
			"Turtle-5"
		],
		[
			801,
			290,
			4,
			"Turtle-6"
		],
		[
			12816,
			4370,
			4,
			"Pinwheel Poser-1"
		],
		[
			12576,
			4370,
			4,
			"Pinwheel Poser-2"
		],
		[
			12801,
			4370,
			4,
			"Pinwheel Poser-3"
		],
		[
			8451,
			4370,
			4,
			"Pinwheel Poser-4"
		],
		[
			8976,
			4370,
			4,
			"Pinwheel Poser-5"
		],
		[
			8496,
			4370,
			4,
			"Pinwheel Poser-6"
		],
		[
			8241,
			17,
			4,
			"Gun-1"
		],
		[
			4146,
			17,
			4,
			"Gun-2"
		],
		[
			306,
			17,
			4,
			"Gun-3"
		],
		[
			12321,
			17,
			4,
			"Gun-4"
		],
		[
			8976,
			17,
			4,
			"Gun-5"
		],
		[
			8496,
			17,
			4,
			"Gun-6"
		]
	];
	var tclln_map = [
		[
			4866,
			4609,
			4,
			"Hammer-1"
		],
		[
			12321,
			4609,
			4,
			"Hammer-2"
		],
		[
			8976,
			4609,
			4,
			"Hammer-3"
		],
		[
			12801,
			4609,
			4,
			"Hammer-4"
		],
		[
			4611,
			4609,
			4,
			"Hammer-5"
		],
		[
			12576,
			4609,
			4,
			"Hammer-6"
		],
		[
			291,
			4114,
			4,
			"Spaceship-1"
		],
		[
			4146,
			4114,
			4,
			"Spaceship-2"
		],
		[
			786,
			4114,
			4,
			"Spaceship-3"
		],
		[
			12801,
			4114,
			4,
			"Spaceship-4"
		],
		[
			4131,
			4114,
			4,
			"Spaceship-5"
		],
		[
			8496,
			4114,
			4,
			"Spaceship-6"
		],
		[
			291,
			1,
			4,
			"Stollery-1"
		],
		[
			12576,
			1,
			4,
			"Stollery-2"
		],
		[
			306,
			1,
			4,
			"Stollery-3"
		],
		[
			8451,
			1,
			4,
			"Stollery-4"
		],
		[
			12546,
			1,
			4,
			"Stollery-5"
		],
		[
			4611,
			1,
			4,
			"Stollery-6"
		],
		[
			291,
			4369,
			1,
			"Pinwheel-1"
		],
		[
			4146,
			4369,
			1,
			"Pinwheel-2"
		],
		[
			4896,
			4369,
			4,
			"Pinwheel-3"
		],
		[
			8241,
			8194,
			2,
			"2Face-1"
		],
		[
			306,
			8194,
			4,
			"2Face-2"
		],
		[
			4146,
			8194,
			2,
			"2Face-3"
		],
		[
			12321,
			8194,
			4,
			"2Face-4"
		],
		[
			8241,
			4354,
			4,
			"Turtle-1"
		],
		[
			12576,
			4354,
			4,
			"Turtle-2"
		],
		[
			4131,
			4354,
			4,
			"Turtle-3"
		],
		[
			12321,
			4354,
			4,
			"Turtle-4"
		],
		[
			306,
			4354,
			4,
			"Turtle-5"
		],
		[
			4611,
			4354,
			4,
			"Turtle-6"
		],
		[
			4866,
			8482,
			4,
			"Pinwheel Poser-1"
		],
		[
			531,
			8482,
			4,
			"Pinwheel Poser-2"
		],
		[
			8211,
			8482,
			4,
			"Pinwheel Poser-3"
		],
		[
			786,
			8482,
			4,
			"Pinwheel Poser-4"
		],
		[
			8976,
			8482,
			4,
			"Pinwheel Poser-5"
		],
		[
			801,
			8482,
			4,
			"Pinwheel Poser-6"
		],
		[
			291,
			34,
			4,
			"Gun-1"
		],
		[
			4146,
			34,
			4,
			"Gun-2"
		],
		[
			306,
			34,
			4,
			"Gun-3"
		],
		[
			8976,
			34,
			4,
			"Gun-4"
		],
		[
			786,
			34,
			4,
			"Gun-5"
		],
		[
			8496,
			34,
			4,
			"Gun-6"
		]
	];
	var tcll_map = [
		[
			291,
			545,
			4,
			"TCLL1-Hammer"
		],
		[
			291,
			4130,
			4,
			"TCLL1-Spaceship"
		],
		[
			8241,
			2,
			4,
			"TCLL1-Stollery"
		],
		[
			291,
			8738,
			1,
			"TCLL1-Pinwheel"
		],
		[
			8241,
			272,
			2,
			"TCLL1-2Face"
		],
		[
			4866,
			290,
			4,
			"TCLL1-Turtle"
		],
		[
			12816,
			4370,
			4,
			"TCLL1-Pinwheel Poser"
		],
		[
			8241,
			17,
			4,
			"TCLL1-Gun"
		],
		[
			4866,
			4609,
			4,
			"TCLL2-Hammer"
		],
		[
			291,
			4114,
			4,
			"TCLL2-Spaceship"
		],
		[
			291,
			1,
			4,
			"TCLL2-Stollery"
		],
		[
			291,
			4369,
			1,
			"TCLL2-Pinwheel"
		],
		[
			8241,
			8194,
			2,
			"TCLL2-2Face"
		],
		[
			8241,
			4354,
			4,
			"TCLL2-Turtle"
		],
		[
			4866,
			8482,
			4,
			"TCLL2-Pinwheel Poser"
		],
		[
			291,
			34,
			4,
			"TCLL2-Gun"
		]
	];
	var lsall_map = [
		[0, "LS1-PBL"],
		[546, "LS1-Sune"],
		[273, "LS1-aSune"],
		[258, "LS1-Ua"],
		[33, "LS1-Ub"],
		[288, "LS1-La"],
		[528, "LS1-Lb"],
		[513, "LS1-Ta"],
		[18, "LS1-Tb"],
		[66081, "LS2-Hammer"],
		[66066, "LS2-Spaceship"],
		[66048, "LS2-StolleryA"],
		[65538, "LS2-StolleryB"],
		[65568, "LS2-StolleryC"],
		[65808, "LS2-2Face"],
		[65826, "LS2-Turtle"],
		[65553, "LS2-GunA"],
		[65793, "LS2-GunB"],
		[131346, "LS3-Hammer"],
		[131601, "LS3-Spaceship"],
		[131328, "LS3-StolleryA"],
		[131073, "LS3-StolleryB"],
		[131088, "LS3-StolleryC"],
		[131616, "LS3-2Face"],
		[131361, "LS3-Turtle"],
		[131106, "LS3-GunA"],
		[131586, "LS3-GunB"],
		[8226, "LS4-SuneA"],
		[8736, "LS4-SuneB"],
		[8706, "LS4-SuneC"],
		[8721, "LS4-PiA"],
		[8481, "LS4-PiB"],
		[8208, "LS4-U"],
		[8193, "LS4-L"],
		[8448, "LS4-T"],
		[8466, "LS4-H"],
		[73746, "LS5-HammerA"],
		[73986, "LS5-HammerB"],
		[74016, "LS5-SpaceshipA"],
		[74241, "LS5-SpaceshipB"],
		[73728, "LS5-Stollery"],
		[74274, "LS5-Pinwheel"],
		[73761, "LS5-TurtleA"],
		[74256, "LS5-TurtleB"],
		[74001, "LS5-Pinwheel Poser"],
		[139536, "LS6-Hammer"],
		[139521, "LS6-Spaceship"],
		[139266, "LS6-2Face"],
		[139281, "LS6-Turtle"],
		[139554, "LS6-Pinwheel PoserA"],
		[139809, "LS6-Pinwheel PoserB"],
		[139794, "LS6-Pinwheel PoserC"],
		[139776, "LS6-GunA"],
		[139296, "LS6-GunB"],
		[4113, "LS7-aSuneA"],
		[4368, "LS7-aSuneB"],
		[4353, "LS7-aSuneC"],
		[4626, "LS7-PiA"],
		[4386, "LS7-PiB"],
		[4608, "LS7-U"],
		[4098, "LS7-L"],
		[4128, "LS7-T"],
		[4641, "LS7-H"],
		[70176, "LS8-Hammer"],
		[69666, "LS8-Spaceship"],
		[69633, "LS8-2Face"],
		[70146, "LS8-Turtle"],
		[69921, "LS8-Pinwheel PoserA"],
		[69906, "LS8-Pinwheel PoserB"],
		[70161, "LS8-Pinwheel PoserC"],
		[69648, "LS8-GunA"],
		[69888, "LS8-GunB"],
		[135681, "LS9-HammerA"],
		[135201, "LS9-HammerB"],
		[135186, "LS9-SpaceshipA"],
		[135456, "LS9-SpaceshipB"],
		[135168, "LS9-Stollery"],
		[135441, "LS9-Pinwheel"],
		[135426, "LS9-TurtleA"],
		[135696, "LS9-TurtleB"],
		[135714, "LS9-Pinwheel Poser"]
	];
	var egllprobs = mathlib.idxArray(egll_map, 2);
	var egllfilter = mathlib.idxArray(egll_map, 3);
	var tcllpprobs = mathlib.idxArray(tcllp_map, 2);
	var tcllpfilter = mathlib.idxArray(tcllp_map, 3);
	var tcllnprobs = mathlib.idxArray(tclln_map, 2);
	var tcllnfilter = mathlib.idxArray(tclln_map, 3);
	var tcllprobs = mathlib.idxArray(tcll_map, 2);
	var tcllfilter = mathlib.idxArray(tcll_map, 3);
	var lsallprobs = mathlib.valuedArray(lsall_map.length, 1);
	var lsallfilter = mathlib.idxArray(lsall_map, 1);
	function getLLScramble(type, length, cases) {
		var llcase = 0;
		var ncubie = 4;
		var perm = [
			0,
			1,
			2,
			3
		];
		var ori = [
			0,
			0,
			0,
			0,
			0,
			0,
			0
		];
		if (type == "222tcp") {
			llcase = tcllp_map[scrMgr.fixCase(cases, tcllpprobs)];
			ori = [
				0,
				0,
				0,
				0,
				1,
				0,
				0
			];
			perm = perm.concat(egperms[0]);
		} else if (type == "222tcn") {
			llcase = tclln_map[scrMgr.fixCase(cases, tcllnprobs)];
			ori = [
				0,
				0,
				0,
				0,
				2,
				0,
				0
			];
			perm = perm.concat(egperms[0]);
		} else if (type == "222tc") {
			var tcllIdx = scrMgr.fixCase(cases, tcllprobs);
			llcase = tcll_map[tcllIdx].slice();
			ori = [
				0,
				0,
				0,
				0,
				tcllIdx < 8 ? 1 : 2,
				0,
				0
			];
			perm = perm.concat(egperms[0]);
			var perm4 = mathlib.rndPerm(4);
			llcase[0] = 0;
			for (var i = 0; i < 4; i++) llcase[0] |= perm4[i] << i * 4;
		} else if (type == "222eg0") {
			llcase = egll_map[scrMgr.fixCase(cases, egllprobs)];
			perm = perm.concat(egperms[0]);
		} else if (type == "222eg1") {
			llcase = egll_map[scrMgr.fixCase(cases, egllprobs)];
			perm = perm.concat(egperms[2 + rn(4)]);
		} else if (type == "222eg2") {
			llcase = egll_map[scrMgr.fixCase(cases, egllprobs)];
			perm = perm.concat(egperms[1]);
		} else if (type == "222lsall") {
			perm = perm.concat(egperms[0]);
			var perm4 = mathlib.rndPerm(4);
			perm4.push(perm4[3]);
			perm4[3] = 4;
			llcase = [0, lsall_map[scrMgr.fixCase(cases, lsallprobs)][0]];
			for (var i = 0; i < 5; i++) llcase[0] |= perm4[i] << i * 4;
			ncubie = 5;
		}
		var rndA = rn(4);
		while (rndA-- > 0) doPermMove(perm, 0);
		var perm0 = perm.slice();
		for (var i = 0; i < ncubie; i++) {
			perm[i] = perm0[llcase[0] >> i * 4 & 15];
			ori[i] = llcase[1] >> i * 4 & 15;
		}
		var rndU = rn(4);
		while (rndU-- > 0) {
			doOriMove(ori, 0);
			doPermMove(perm, 0);
		}
		perm = mathlib.getNPerm(perm, 7);
		ori = oriCoord.get(ori);
		return solv.toStr(solv.search([perm, ori], 9).reverse(), "URF", "'2 ");
	}
	function getLLImage(type, ll_map, llfilter, cases, canvas) {
		var llcase = ll_map[cases];
		var llface = [];
		for (var i = 0; i < 4; i++) if (!type || type == "all" || type == "ori") {
			var perm = llcase[0] >> (i << 2) & 15;
			var ori = llcase[1] >> (i << 2) & 15;
			var cols = type == "all" ? "DLFURB" : "DGGUGG";
			for (var j = 0; j < 3; j++) {
				var pos = llFaces.indexOf(cFacelet[i][j]);
				llface[pos] = cols.charAt(cFacelet[perm][(j + 3 - ori) % 3] >> 2);
			}
		} else if (type == "ls") {
			var ori = llcase[0] >> (i << 2) & 15;
			for (var j = 0; j < 3; j++) {
				var pos = llFaces.indexOf(cFacelet[i][j]);
				llface[pos] = "DGU".charAt((j + 3 - ori) % 3 == 0 ? i == 3 ? 2 : 0 : 1);
			}
		}
		llface = llface.join("");
		if (!canvas) return [
			llface,
			null,
			llfilter[cases]
		];
		image.llImage.drawImage(llface, null, canvas);
	}
	function getScramble(type, length, state) {
		var ori, perm, lim;
		var maxl = type == "222o" ? 0 : 9;
		do {
			lim = 2;
			if (type == "222o" || type == "222so") {
				perm = rn(5040);
				ori = rn(729);
				lim = 3;
			} else if (type == "222eg") {
				ori = egmap[state & 7];
				perm = [
					0,
					2,
					3,
					4,
					5,
					1
				][state >> 3];
				var arr = mathlib.setNPerm([
					0,
					0,
					0,
					0
				].concat(egperms[perm]), rn(24), 4);
				perm = mathlib.getNPerm(arr, 7);
				var rndU = rn(4);
				ori = oriCoord.set([], ori);
				while (rndU-- > 0) doOriMove(ori, 0);
				ori = oriCoord.get(ori);
			} else if (/^222eg[012]$/.exec(type)) return getScramble("222eg", length, [
				0,
				8,
				40
			][~~type[5]] + state);
			else if (type == "222nb") do {
				perm = rn(5040);
				ori = rn(729);
			} while (!checkNoBar(perm, ori));
		} while (perm == 0 && ori == 0 || solv.search([perm, ori], 0, lim) != null);
		return solv.toStr(solv.search([perm, ori], maxl).reverse(), "URF", "'2 ");
	}
	scrMgr.reg([
		"222o",
		"222so",
		"222nb"
	], getScramble)("222eg0", getLLScramble, [
		egllfilter,
		egllprobs,
		getLLImage.bind(null, "all", egll_map, egllfilter)
	])("222eg1", getLLScramble, [
		egllfilter,
		egllprobs,
		getLLImage.bind(null, "all", egll_map, egllfilter)
	])("222eg2", getLLScramble, [
		egllfilter,
		egllprobs,
		getLLImage.bind(null, "all", egll_map, egllfilter)
	])("222tcp", getLLScramble, [
		tcllpfilter,
		tcllpprobs,
		getLLImage.bind(null, "all", tcllp_map, tcllpfilter)
	])("222tcn", getLLScramble, [
		tcllnfilter,
		tcllnprobs,
		getLLImage.bind(null, "all", tclln_map, tcllnfilter)
	])("222tc", getLLScramble, [
		tcllfilter,
		tcllprobs,
		getLLImage.bind(null, "ori", tcll_map, tcllfilter)
	])("222lsall", getLLScramble, [
		lsallfilter,
		lsallprobs,
		getLLImage.bind(null, "ls", lsall_map, lsallfilter)
	])("222eg", getScramble, [egfilter, egprobs]);
	return {
		solveFacelet: function(f) {
			var perm = [];
			var ori = [];
			if (mathlib.detectFacelet(cFacelet, f, perm, ori, 4) == -1) return null;
			var sol = solv.search([mathlib.getNPerm(perm, 7), oriCoord.get(ori)], 0);
			return sol && solv.toStr(sol, "URF", " 2'").trim();
		},
		getEGLLImage: getLLImage.bind(null, false, egll_map, egllfilter)
	};
})(mathlib.rn);
//#endregion
//#region \0@oxc-project+runtime@0.152.0/helpers/esm/checkPrivateRedeclaration.js
function _checkPrivateRedeclaration(e, t) {
	if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object");
}
//#endregion
//#region \0@oxc-project+runtime@0.152.0/helpers/esm/classPrivateMethodInitSpec.js
function _classPrivateMethodInitSpec(e, a) {
	_checkPrivateRedeclaration(e, a), a.add(e);
}
//#endregion
//#region \0@oxc-project+runtime@0.152.0/helpers/esm/classPrivateFieldInitSpec.js
function _classPrivateFieldInitSpec(e, t, a) {
	_checkPrivateRedeclaration(e, t), t.set(e, a);
}
//#endregion
//#region \0@oxc-project+runtime@0.152.0/helpers/esm/assertClassBrand.js
function _assertClassBrand(e, t, n) {
	if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n;
	throw new TypeError("Private element is not present on this object");
}
//#endregion
//#region \0@oxc-project+runtime@0.152.0/helpers/esm/classPrivateFieldSet2.js
function _classPrivateFieldSet2(s, a, r) {
	return s.set(_assertClassBrand(s, a), r), r;
}
//#endregion
//#region \0@oxc-project+runtime@0.152.0/helpers/esm/classPrivateFieldGet2.js
function _classPrivateFieldGet2(s, a) {
	return s.get(_assertClassBrand(s, a));
}
//#endregion
//#region src/solver.ts
/** Face order of min2phase's facelet strings; a face's opposite is 3 places further. */
const FACES = "URFDLB";
/** Face order of csTimer's stickers (see `image.nnnPosit`). */
const CSTIMER_FACES = "DLBURF";
/** The cube sizes `solveCube` can solve. */
const SOLVER_SIZES = [2, 3];
/**
* The stickers of a size x size x size cube after `moves`, as face numbers (0-5, the face in
* FACES each sticker's color started on), face by face in FACES order, each face read row
* by row as in min2phase's facelet strings: U with its top row next to B, D with its top
* row next to F, and L and B as seen from their own side.
*/
function cubeFacelets(size, moves) {
	const posit = image$1.nnnPosit(size, moves);
	const facelets = [];
	for (const face of FACES) {
		const f = CSTIMER_FACES.indexOf(face);
		for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) {
			const x = face === "L" || face === "B" ? size - 1 - col : col;
			const y = face === "D" ? size - 1 - row : row;
			facelets.push(FACES.indexOf(CSTIMER_FACES[posit[(f * size + y) * size + x]]));
		}
	}
	return facelets;
}
/**
* Renames the colors of `facelets` so each of `faces` gets the color its sticker at `at`
* has now (and its opposite face the opposite color), which turns a cube held any way into
* the same cube held with those stickers in place.
*/
function holdBy(facelets, faces, at) {
	const name = [];
	faces.forEach((face, i) => {
		const color = facelets[at[i]];
		name[color] = face;
		name[(color + 3) % 6] = (face + 3) % 6;
	});
	return facelets.map((color) => name[color]);
}
/** Phase-2 tries min2phase makes per search step (each step takes well under 0.2 s). */
const PROBES_PER_STEP = 500;
var _facelets = /* @__PURE__ */ new WeakMap();
var _search = /* @__PURE__ */ new WeakMap();
var _CubeSearch_brand = /* @__PURE__ */ new WeakSet();
/**
* A search for the shortest solution of a size x size x size cube after `moves` (cube
* notation as csTimer reads it, rotations and wide moves included), for the cube as it is
* held after them. It holds a solution from the start and finds shorter ones step by step:
* - 2x2x2: csTimer's optimal solver (only U, R and F turns), so the first is the shortest.
* - 3x3x3: min2phase finds a solution of at most 21 face turns, then is asked again and
*   again for one at least a move shorter. When it has looked everywhere without finding
*   one, the solution it has is the shortest there is (half-turn metric: R2 is one move).
*   That can take minutes, but a solution of the usual 17 to 19 moves comes in seconds.
* `solution` is `''` when the cube is already solved. Only for the sizes in SOLVER_SIZES.
*/
var CubeSearch = class {
	constructor(size, moves) {
		_classPrivateMethodInitSpec(this, _CubeSearch_brand);
		this.shortest = false;
		_classPrivateFieldInitSpec(this, _facelets, "");
		_classPrivateFieldInitSpec(this, _search, void 0);
		this.scramble = moves;
		if (size === 2) {
			const facelets = holdBy(cubeFacelets(2, moves), [
				3,
				4,
				5
			], [
				14,
				18,
				23
			]);
			const solution = scramble_222$1.solveFacelet(facelets);
			if (solution === null) throw new Error(`Can't solve this 2x2x2: "${moves}"`);
			this.solution = solution;
			this.shortest = true;
			return;
		}
		if (size !== 3) throw new Error(`No solver for ${size}x${size}x${size} cubes yet`);
		const facelets = holdBy(cubeFacelets(3, moves), [
			0,
			1,
			2
		], [
			4,
			13,
			22
		]);
		_classPrivateFieldSet2(_facelets, this, facelets.map((f) => FACES[f]).join(""));
		_classPrivateFieldSet2(_search, this, new min2phase.Search());
		const first = _classPrivateFieldGet2(_search, this).solution(_classPrivateFieldGet2(_facelets, this));
		if (first.startsWith("Error")) throw new Error(`Can't solve this 3x3x3: "${moves}"`);
		this.solution = "";
		_assertClassBrand(_CubeSearch_brand, this, _found).call(this, first);
	}
	/**
	* Searches a little more (well under 0.2 s each time min2phase is asked). Returns whether
	* `solution` got shorter or is now known to be the shortest.
	*/
	step() {
		if (this.shortest) return false;
		const result = _classPrivateFieldGet2(_search, this).next(PROBES_PER_STEP, 0, 0);
		if (result === "Error 8") return false;
		if (result === "Error 7") this.shortest = true;
		else _assertClassBrand(_CubeSearch_brand, this, _found).call(this, result);
		return true;
	}
};
/**
* Takes `result`, a solution from min2phase, and asks for one at least a move shorter,
* taking that too if it comes at once, and so on.
*/
function _found(result) {
	for (;;) {
		this.solution = _assertClassBrand(_CubeSearch_brand, this, _read).call(this, result);
		const length = this.solution ? this.solution.split(" ").length : 0;
		if (length === 0) {
			this.shortest = true;
			return;
		}
		result = _classPrivateFieldGet2(_search, this).solution(_classPrivateFieldGet2(_facelets, this), length - 1, PROBES_PER_STEP, 0, 0);
		if (result === "Error 8") return;
		if (result === "Error 7") {
			this.shortest = true;
			return;
		}
	}
}
/** min2phase pads its moves to two characters, e.g. "U  R2". */
function _read(solution) {
	return solution.trim().replace(/ +/g, " ");
}
//#endregion
//#region src/puzzle.ts
const IMAGE_STYLES = [
	"separated",
	"joined",
	"cstimer"
];
const HIDDEN_FACES = ["hidden", "floating"];
const CAMERA_MODES = ["mouse", "fixed"];
const CUBE_FACES = [
	"U",
	"R",
	"F",
	"D",
	"L",
	"B"
];
const NO_OFFSET = {
	x: 0,
	y: 0,
	z: 0,
	rotateX: 0,
	rotateY: 0,
	rotateZ: 0
};
function cube(n, methods) {
	return {
		name: `${n}x${n}x${n}`,
		colorSetting: "colcube",
		defaultColors: {
			U: "#fff",
			R: "#f00",
			F: "#0d0",
			D: "#ff0",
			L: "#fa0",
			B: "#00f"
		},
		cstimerOrder: [
			"D",
			"L",
			"B",
			"U",
			"R",
			"F"
		],
		methods,
		cubeSize: n
	};
}
/** The puzzles `Puzzle` supports, by id (the same ids as `ScrambleEvent.puzzle`). */
const PUZZLES = {
	"222": cube(2, {
		default: "222so",
		"random-state": "222so",
		"random-move": "2223"
	}),
	"333": cube(3, {
		default: "333",
		"random-state": "333",
		"random-move": "333o"
	}),
	"444": cube(4, {
		default: "444wca",
		"random-state": "444wca",
		"random-move": "444m"
	}),
	"555": cube(5, {
		default: "555wca",
		"random-move": "555wca"
	}),
	"666": cube(6, {
		default: "666wca",
		"random-move": "666wca"
	}),
	"777": cube(7, {
		default: "777wca",
		"random-move": "777wca"
	}),
	clock: {
		name: "Clock",
		colorSetting: "colclk",
		defaultColors: {
			front: "#5cf",
			back: "#37b",
			hand: "#ff0",
			handOutline: "#f00",
			pin: "#850"
		},
		cstimerOrder: [
			"handOutline",
			"back",
			"front",
			"hand",
			"pin"
		],
		methods: {
			default: "clkwca",
			"random-state": "clkwca"
		}
	},
	minx: {
		name: "Megaminx",
		colorSetting: "colmgm",
		defaultColors: {
			U: "#fff",
			F: "#060",
			R: "#d00",
			L: "#81f",
			BR: "#00b",
			BL: "#fc0",
			DR: "#ffb",
			DL: "#8df",
			DBR: "#f9f",
			DBL: "#f83",
			B: "#7e0",
			D: "#999"
		},
		cstimerOrder: [
			"U",
			"R",
			"F",
			"L",
			"BL",
			"BR",
			"DR",
			"DL",
			"DBL",
			"B",
			"DBR",
			"D"
		],
		methods: {
			default: "mgmp",
			"random-state": "mgmso",
			"random-move": "mgmp"
		}
	},
	pyram: {
		name: "Pyraminx",
		colorSetting: "colpyr",
		defaultColors: {
			F: "#0f0",
			L: "#f00",
			R: "#00f",
			D: "#ff0"
		},
		cstimerOrder: [
			"F",
			"L",
			"R",
			"D"
		],
		methods: {
			default: "pyrso",
			"random-state": "pyrso",
			"random-move": "pyrm"
		}
	},
	skewb: {
		name: "Skewb",
		colorSetting: "colskb",
		defaultColors: {
			U: "#fff",
			R: "#f00",
			F: "#0f0",
			D: "#ff0",
			L: "#f80",
			B: "#00f"
		},
		cstimerOrder: [
			"U",
			"B",
			"R",
			"D",
			"F",
			"L"
		],
		methods: {
			default: "skbso",
			"random-state": "skbso",
			"random-move": "skb"
		}
	},
	sq1: {
		name: "Square-1",
		colorSetting: "colsq1",
		defaultColors: {
			U: "#ff0",
			R: "#f80",
			F: "#0f0",
			D: "#fff",
			L: "#f00",
			B: "#00f"
		},
		cstimerOrder: [
			"U",
			"R",
			"F",
			"D",
			"L",
			"B"
		],
		methods: {
			default: "sqrs",
			"random-state": "sqrs",
			"random-move": "sq1h"
		}
	}
};
/** Cubes bigger than 7x7x7: csTimer only has random-move scrambles for them. */
const BIG_CUBES = Object.fromEntries([
	8,
	9,
	10,
	11
].map((n) => {
	const id = String(n).repeat(3);
	return [id, cube(n, {
		default: id,
		"random-move": id
	})];
}));
/** Names of the other puzzles, by the `puzzle` group of their scramble types. */
const OTHER_NAMES = {
	fto: "FTO",
	"15p": "15 puzzle",
	"8p": "8 puzzle",
	"133": "1x3x3 (Floppy Cube)",
	"223": "2x2x3 (Tower Cube)",
	"233": "2x3x3 (Domino)",
	nnn: "NxNxN",
	mrbl: "Mirror Blocks",
	gear: "Gear Cube",
	klm: "Kilominx",
	giga: "Gigaminx",
	crz3a: "Crazy 3x3x3",
	cmetrick: "Cmetrick",
	heli: "Helicopter Cube",
	redi: "Redi Cube",
	dino: "Dino Cube",
	ivy: "Ivy Cube",
	mpyr: "Master Pyraminx",
	prc: "Pyraminx Crystal",
	sia: "Siamese Cube",
	sq2: "Square-2",
	sfl: "Super Floppy",
	ufo: "UFO",
	ico: "Icosahedron",
	bandaged: "Bandaged puzzles",
	dmd: "Diamond",
	relay: "Relays",
	joke: "Joke scrambles"
};
/**
* The puzzle info for an id: a WCA puzzle, a big cube, or any other `puzzle` group of
* csTimer's scramble types. The others have csTimer's colors only, and their methods
* come from their types' names ("random state", "random move").
*/
function puzzleInfo(id) {
	const known = PUZZLES[id] ?? BIG_CUBES[id];
	if (known) return known;
	const types = listEvents().filter((event) => event.puzzle === id);
	if (types.length === 0) return void 0;
	const methods = { default: types[0].id };
	const state = types.find((type) => /random state/.test(type.name));
	const move = types.find((type) => /random move/.test(type.name));
	if (state) methods["random-state"] = state.id;
	if (move) methods["random-move"] = move.id;
	return {
		name: OTHER_NAMES[id] ?? types[0].name,
		colorSetting: "",
		defaultColors: {},
		cstimerOrder: [],
		methods
	};
}
const METHODS = [
	"default",
	"random-state",
	"random-move"
];
const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
/**
* csTimer draws with 3-digit colors (#rgb), so a 6-digit color becomes the nearest one,
* e.g. "#ff8000" -> "#f80".
*/
function toCstimerColor(color) {
	const hex = color.slice(1);
	if (hex.length === 3) return color;
	let short = "#";
	for (let i = 0; i < 6; i += 2) short += Math.round(parseInt(hex.slice(i, i + 2), 16) / 17).toString(16);
	return short;
}
/**
* csTimer's Square-1 drawing reads one turn like `(1,0)` between slashes, so turns in a
* row, e.g. where a scramble ends and a solution starts, are added up into one turn.
* Anything else is left as it is.
*/
function joinSq1Turns(moves) {
	const tokens = moves.match(/\(\s*-?\d+\s*,\s*-?\d+\s*\)|\/|\S/g) ?? [];
	if (tokens.some((token) => token !== "/" && !token.startsWith("("))) return moves;
	const out = [];
	for (const token of tokens) {
		const last = out[out.length - 1];
		if (token === "/") out.push(token);
		else {
			const [top, bottom] = token.slice(1, -1).split(",").map(Number);
			if (Array.isArray(last)) {
				last[0] += top;
				last[1] += bottom;
			} else out.push([top, bottom]);
		}
	}
	const turn = (n) => ((n + 5) % 12 + 12) % 12 - 5;
	return out.map((token) => typeof token === "string" ? token : ` (${turn(token[0])},${turn(token[1])})`).join("").trim();
}
/**
* Counts the moves in `moves`, written in the puzzle's notation: the moves between
* spaces, except on Square-1, where each slash `/` is one move (twist metric) and the
* turns between them are free. Relay numbers like `2)` are not moves.
*/
function countMoves(puzzleId, moves) {
	if (puzzleId === "sq1") return (moves.match(/\//g) ?? []).length;
	return moves.split(/\s+/).filter((move) => move && !/^\w+\)$/.test(move)).length;
}
/**
* Ids of the puzzles `new Puzzle(id)` accepts, e.g. `'333'`, `'pyram'`: the WCA puzzles
* first, then every other puzzle csTimer has scrambles for (the `puzzle` groups of
* `listEvents()`, in the same order).
*/
function listPuzzles() {
	const ids = new Set(Object.keys(PUZZLES));
	for (const event of listEvents()) ids.add(event.puzzle);
	return [...ids];
}
var _info = /* @__PURE__ */ new WeakMap();
var _colors = /* @__PURE__ */ new WeakMap();
var _imageSize = /* @__PURE__ */ new WeakMap();
var _imageStyle = /* @__PURE__ */ new WeakMap();
var _hiddenFaces = /* @__PURE__ */ new WeakMap();
var _cubeStyle = /* @__PURE__ */ new WeakMap();
var _cameraMode = /* @__PURE__ */ new WeakMap();
var _cameraAngle = /* @__PURE__ */ new WeakMap();
var _floatingOffsets = /* @__PURE__ */ new WeakMap();
var _faceOffsets = /* @__PURE__ */ new WeakMap();
var _styles = /* @__PURE__ */ new WeakMap();
var _method = /* @__PURE__ */ new WeakMap();
var _length = /* @__PURE__ */ new WeakMap();
var _scramble = /* @__PURE__ */ new WeakMap();
var _solution = /* @__PURE__ */ new WeakMap();
var _rules = /* @__PURE__ */ new WeakMap();
var _fmc = /* @__PURE__ */ new WeakMap();
var _solveTimeLimit = /* @__PURE__ */ new WeakMap();
var _solved = /* @__PURE__ */ new WeakMap();
var _stopSolving = /* @__PURE__ */ new WeakMap();
var _scrambleType = /* @__PURE__ */ new WeakMap();
var _type = /* @__PURE__ */ new WeakMap();
var _Puzzle_brand = /* @__PURE__ */ new WeakSet();
/**
* One physical puzzle, e.g. `new Puzzle('333')`. Each puzzle keeps its own settings
* (colors, image size, scramble method and length), so two puzzles never affect each other.
*
* Settings are changed with `set...` methods, which return the puzzle so they can be
* chained: `new Puzzle('333').setColor('U', '#ff0').setImageSize(200)`.
*/
var Puzzle = class {
	constructor(id) {
		_classPrivateMethodInitSpec(this, _Puzzle_brand);
		_classPrivateFieldInitSpec(this, _info, void 0);
		_classPrivateFieldInitSpec(this, _colors, void 0);
		_classPrivateFieldInitSpec(this, _imageSize, void 0);
		_classPrivateFieldInitSpec(this, _imageStyle, "separated");
		_classPrivateFieldInitSpec(this, _hiddenFaces, "hidden");
		_classPrivateFieldInitSpec(this, _cubeStyle, "classic");
		_classPrivateFieldInitSpec(this, _cameraMode, "mouse");
		_classPrivateFieldInitSpec(this, _cameraAngle, { ...DEFAULT_CAMERA_ANGLE });
		_classPrivateFieldInitSpec(this, _floatingOffsets, {});
		_classPrivateFieldInitSpec(this, _faceOffsets, {});
		_classPrivateFieldInitSpec(this, _styles, []);
		_classPrivateFieldInitSpec(this, _method, "default");
		_classPrivateFieldInitSpec(this, _length, void 0);
		_classPrivateFieldInitSpec(this, _scramble, "");
		_classPrivateFieldInitSpec(this, _solution, "");
		_classPrivateFieldInitSpec(this, _rules, {
			countRotations: true,
			sliceMoves: "one-move",
			wideMoves: "Rw-or-r"
		});
		_classPrivateFieldInitSpec(this, _fmc, false);
		_classPrivateFieldInitSpec(this, _solveTimeLimit, 3e3);
		_classPrivateFieldInitSpec(this, _solved, void 0);
		_classPrivateFieldInitSpec(this, _stopSolving, void 0);
		_classPrivateFieldInitSpec(this, _scrambleType, "");
		_classPrivateFieldInitSpec(this, _type, void 0);
		const info = puzzleInfo(id);
		if (!info) throw new Error(`Unknown puzzle "${id}". Puzzles: ${listPuzzles().join(", ")}`);
		this.id = id;
		this.name = info.name;
		_classPrivateFieldSet2(_info, this, info);
		_classPrivateFieldSet2(_colors, this, { ...info.defaultColors });
	}
	/** Names `setColor` accepts, e.g. `['U', 'R', 'F', 'D', 'L', 'B']` for cubes. */
	getFaces() {
		return Object.keys(_classPrivateFieldGet2(_info, this).defaultColors);
	}
	/**
	* Sets the color of one face (or part, for clock), as a hex color like `'#ff0'` or
	* `'#ffaa00'`. csTimer draws with 3-digit colors, so 6-digit ones are rounded to the
	* nearest of those.
	*/
	setColor(face, color) {
		if (!Object.prototype.hasOwnProperty.call(_classPrivateFieldGet2(_colors, this), face)) throw new Error(`${this.name} has no face "${face}". Faces: ${this.getFaces().join(", ")}`);
		if (!HEX_COLOR.test(color)) throw new Error(`"${color}" is not a hex color like "#ff0" or "#ffaa00"`);
		_classPrivateFieldGet2(_colors, this)[face] = color.toLowerCase();
		return this;
	}
	/** Sets several colors at once, e.g. `{ U: '#ff0', D: '#fff' }`. */
	setColors(colors) {
		for (const [face, color] of Object.entries(colors)) this.setColor(face, color);
		return this;
	}
	/** Every face's color, e.g. `{ D: '#ff0', L: '#fa0', ... }`. */
	getColors() {
		return { ..._classPrivateFieldGet2(_colors, this) };
	}
	/** Goes back to csTimer's default colors. */
	resetColors() {
		_classPrivateFieldSet2(_colors, this, { ..._classPrivateFieldGet2(_info, this).defaultColors });
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
	setImageSize(width) {
		if (!(width > 0) || !Number.isFinite(width)) throw new Error(`Image size must be a positive number of pixels, not ${width}`);
		_classPrivateFieldSet2(_imageSize, this, width);
		return this;
	}
	/** The width set with `setImageSize`, or `undefined` for the default sizes. */
	getImageSize() {
		return _classPrivateFieldGet2(_imageSize, this);
	}
	/**
	* Picks how `getImage()` draws the puzzle: `'separated'` (the default), `'joined'` or
	* `'cstimer'` (see `ImageStyle`). Cubes are drawn by this library in the style of the
	* 3D view; the other puzzles keep csTimer's drawing, with thicker black borders.
	*/
	setImageStyle(style) {
		if (!IMAGE_STYLES.includes(style)) throw new Error(`Unknown image style "${style}". Styles: ${IMAGE_STYLES.join(", ")}`);
		_classPrivateFieldSet2(_imageStyle, this, style);
		return this;
	}
	/** The style set with `setImageStyle`, `'separated'` by default. */
	getImageStyle() {
		return _classPrivateFieldGet2(_imageStyle, this);
	}
	/**
	* Picks a ready-made look for a cube's tiles, in `getImage()` (with any image style but
	* `'cstimer'`) and in `show3D` alike: `'classic'` (the default), `'stickered'`,
	* `'stickered-round'`, `'stickerless'` or `'stickerless-round'` (see `CubeStyle`).
	* Styles from `setElementStyle` still win over it. Only cubes have it (see `has3DView`);
	* the other puzzles are drawn as before.
	*/
	setCubeStyle(style) {
		if (!CUBE_STYLES.includes(style)) throw new Error(`Unknown cube style "${style}". Styles: ${CUBE_STYLES.join(", ")}`);
		_classPrivateFieldSet2(_cubeStyle, this, style);
		return this;
	}
	/** The style set with `setCubeStyle`, `'classic'` by default. */
	getCubeStyle() {
		return _classPrivateFieldGet2(_cubeStyle, this);
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
	setHiddenFaces(mode) {
		if (!HIDDEN_FACES.includes(mode)) throw new Error(`Unknown hidden faces mode "${mode}". Modes: ${HIDDEN_FACES.join(", ")}`);
		_classPrivateFieldSet2(_hiddenFaces, this, mode);
		return this;
	}
	/** The mode set with `setHiddenFaces`, `'hidden'` by default. */
	getHiddenFaces() {
		return _classPrivateFieldGet2(_hiddenFaces, this);
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
	setFloatingFaceOffset(face, offset) {
		_classPrivateFieldGet2(_floatingOffsets, this)[face] = _assertClassBrand(_Puzzle_brand, this, _checkOffset).call(this, face, offset);
		return this;
	}
	/** The offset set with `setFloatingFaceOffset` for one face, all 0 by default. */
	getFloatingFaceOffset(face) {
		return { ..._classPrivateFieldGet2(_floatingOffsets, this)[face] ?? NO_OFFSET };
	}
	/** Puts every floating face back where it floats by default. */
	resetFloatingFaceOffsets() {
		_classPrivateFieldSet2(_floatingOffsets, this, {});
		return this;
	}
	/**
	* Moves and turns one face of the cube itself in the `show3D` view, the way
	* `setFloatingFaceOffset` moves a floating copy, e.g. `setFaceOffset('U', { y: 0.5 })` to
	* lift the top face off the cube. It works with hidden and floating back faces alike.
	* Only for cubes (see `has3DView`).
	*/
	setFaceOffset(face, offset) {
		_classPrivateFieldGet2(_faceOffsets, this)[face] = _assertClassBrand(_Puzzle_brand, this, _checkOffset).call(this, face, offset);
		return this;
	}
	/** The offset set with `setFaceOffset` for one face, all 0 by default. */
	getFaceOffset(face) {
		return { ..._classPrivateFieldGet2(_faceOffsets, this)[face] ?? NO_OFFSET };
	}
	/** Puts every face of the cube back in its place. */
	resetFaceOffsets() {
		_classPrivateFieldSet2(_faceOffsets, this, {});
		return this;
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
	setElementStyle(part, css, where = {}) {
		if (!IMAGE_PARTS.includes(part)) throw new Error(`Unknown part "${part}". Parts: ${IMAGE_PARTS.join(", ")}`);
		for (const [property, value] of Object.entries(css)) if (typeof value !== "string" || !/^[a-zA-Z-]+$/.test(property)) throw new Error(`CSS must be property names with text values, not ${property}: ${value}`);
		if ((where.face !== void 0 || where.tile !== void 0) && !this.has3DView()) throw new Error(`Only cubes have faces and tile numbers to style, not ${this.name}`);
		if (where.face !== void 0 && !CUBE_FACES.includes(where.face)) throw new Error(`${this.name} has no face "${where.face}". Faces: ${CUBE_FACES.join(", ")}`);
		if (where.tile !== void 0 && !(Number.isInteger(where.tile) && where.tile >= 0)) throw new Error(`A tile number must be a whole number from 0, not ${where.tile}`);
		const style = {
			part,
			css: { ...css }
		};
		if (where.face !== void 0) style.face = where.face;
		if (where.tile !== void 0) style.tile = where.tile;
		_classPrivateFieldGet2(_styles, this).push(style);
		return this;
	}
	/** The styles added with `setElementStyle`, in the order they were added. */
	getElementStyles() {
		return _classPrivateFieldGet2(_styles, this).map((style) => ({
			...style,
			css: { ...style.css }
		}));
	}
	/** Takes away every style added with `setElementStyle`. */
	resetElementStyles() {
		_classPrivateFieldSet2(_styles, this, []);
		return this;
	}
	/**
	* Picks how the camera of the `show3D` view moves: `'mouse'` (the default) lets the
	* cube be dragged with the mouse or a finger to look at every side, `'fixed'` keeps it
	* at the camera angle (see `setCameraAngle`).
	*/
	setCameraMode(mode) {
		if (!CAMERA_MODES.includes(mode)) throw new Error(`Unknown camera mode "${mode}". Modes: ${CAMERA_MODES.join(", ")}`);
		_classPrivateFieldSet2(_cameraMode, this, mode);
		return this;
	}
	/** The mode set with `setCameraMode`, `'mouse'` by default. */
	getCameraMode() {
		return _classPrivateFieldGet2(_cameraMode, this);
	}
	/**
	* Sets where the camera of the `show3D` view looks from, in degrees: `x` tilts the cube
	* (negative shows its top), then `y` turns it sideways (negative shows its right side).
	* By default the U R F corner is in the middle, pointing straight at the camera
	* (`{ x: -35.26..., y: -45 }`). With the `'mouse'` camera the view goes there the next
	* time `show3D` is called, and can then be dragged away from it.
	*/
	setCameraAngle(angle) {
		for (const value of [angle.x, angle.y]) if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Camera angles must be numbers of degrees, not ${value}`);
		_classPrivateFieldSet2(_cameraAngle, this, {
			x: angle.x,
			y: angle.y
		});
		return this;
	}
	/** The angle set with `setCameraAngle`, the U R F corner by default. */
	getCameraAngle() {
		return { ..._classPrivateFieldGet2(_cameraAngle, this) };
	}
	/** Goes back to the default camera angle, the U R F corner. */
	resetCameraAngle() {
		_classPrivateFieldSet2(_cameraAngle, this, { ...DEFAULT_CAMERA_ANGLE });
		return this;
	}
	/** Which methods `setScrambleMethod` accepts for this puzzle. */
	getScrambleMethods() {
		return METHODS.filter((method) => method in _classPrivateFieldGet2(_info, this).methods);
	}
	/**
	* Picks how `scramble()` makes scrambles: `'default'` (the WCA way), `'random-state'`
	* or `'random-move'`. Throws if csTimer has no such scrambler for this puzzle
	* (see `getScrambleMethods`). It replaces a type picked with `setScrambleType`.
	*/
	setScrambleMethod(method) {
		if (!(method in _classPrivateFieldGet2(_info, this).methods)) throw new Error(`${this.name} has no "${method}" scrambles. Methods: ${this.getScrambleMethods().join(", ")}`);
		_classPrivateFieldSet2(_method, this, method);
		_classPrivateFieldSet2(_type, this, void 0);
		return this;
	}
	/** The method `scramble()` uses, or `undefined` when a type was picked with `setScrambleType`. */
	getScrambleMethod() {
		return _classPrivateFieldGet2(_type, this) === void 0 ? _classPrivateFieldGet2(_method, this) : void 0;
	}
	/**
	* The csTimer scramble type `scramble()` uses, e.g. `'333o'`: the one picked with
	* `setScrambleType`, or else the current method's.
	*/
	getScrambleType() {
		return _classPrivateFieldGet2(_type, this) ?? _classPrivateFieldGet2(_info, this).methods[_classPrivateFieldGet2(_method, this)];
	}
	/**
	* Every csTimer scramble type for this puzzle, e.g. for 3x3x3 `{ id: 'pll', name:
	* '3x3x3 CFOP PLL' }` and 48 more, in csTimer's menu order. Any of them can be picked with
	* `setScrambleType`.
	*/
	getScrambleTypes() {
		return listEvents().filter((event) => event.puzzle === this.id).map(({ id, name }) => ({
			id,
			name
		}));
	}
	/**
	* Makes `scramble()` use one of csTimer's scramble types for this puzzle, e.g.
	* `setScrambleType('pll')` for PLL cases (see `getScrambleTypes`), instead of the
	* method's. `setScrambleMethod` goes back to the methods.
	*/
	setScrambleType(type) {
		if (getEvent(type)?.puzzle !== this.id) throw new Error(`"${type}" is not a ${this.name} scramble type`);
		_classPrivateFieldSet2(_type, this, type);
		return this;
	}
	/**
	* Sets how many moves `scramble()` makes, e.g. `setScrambleLength(30)`. It is used by
	* methods that make random moves; random-state scrambles are as long as they need to
	* be, so they ignore it (see `getScrambleLength`). Megaminx rounds it up to whole
	* lines of 10 moves.
	*/
	setScrambleLength(length) {
		if (!Number.isInteger(length) || length < 1) throw new Error(`Scramble length must be a whole number of moves, at least 1, not ${length}`);
		_classPrivateFieldSet2(_length, this, length);
		return this;
	}
	/**
	* How many moves `scramble()` will make with the current method: the length set with
	* `setScrambleLength`, or csTimer's default for the method. `undefined` when the method
	* picks its own length (random-state scrambles).
	*/
	getScrambleLength() {
		const defaultLength = getEvent(this.getScrambleType())?.length;
		return defaultLength === void 0 ? void 0 : _classPrivateFieldGet2(_length, this) ?? defaultLength;
	}
	/** Goes back to csTimer's default scramble length. */
	resetScrambleLength() {
		_classPrivateFieldSet2(_length, this, void 0);
		return this;
	}
	/**
	* Makes a new scramble with the current method and length, and scrambles the puzzle
	* with it (clearing any solution), so `getImage()` then shows it.
	*/
	scramble() {
		_classPrivateFieldSet2(_scrambleType, this, this.getScrambleType());
		_classPrivateFieldSet2(_scramble, this, getScramble(_classPrivateFieldGet2(_scrambleType, this), this.getScrambleLength()));
		_classPrivateFieldSet2(_solution, this, "");
		return _classPrivateFieldGet2(_scramble, this);
	}
	/**
	* Scrambles the puzzle with a scramble of your own, e.g. `setScramble("R U R' U'")`,
	* written in csTimer's notation for this puzzle. The solution is kept.
	*/
	setScramble(scramble) {
		_classPrivateFieldSet2(_scrambleType, this, this.getScrambleType());
		_classPrivateFieldSet2(_scramble, this, scramble.trim());
		return this;
	}
	/** The scramble the puzzle was last scrambled with, or `''` when it is solved. */
	getScramble() {
		return _classPrivateFieldGet2(_scramble, this);
	}
	/**
	* Sets the moves done after the scramble, e.g. a solution being typed, so `getImage()`
	* shows the puzzle after the scramble and then these moves. Same notation as the scramble.
	*/
	setSolution(moves) {
		_classPrivateFieldSet2(_solution, this, moves.trim());
		return this;
	}
	/** The moves set with `setSolution`, or `''`. */
	getSolution() {
		return _classPrivateFieldGet2(_solution, this);
	}
	/**
	* How many moves the scramble has. Moves are counted between spaces, except on
	* Square-1, where each slash is one move (twist metric).
	*/
	getScrambleMoveCount() {
		return countMoves(this.id, _classPrivateFieldGet2(_scramble, this));
	}
	/**
	* How many moves the solution has, counted like `getScrambleMoveCount`. On cubes the
	* solution options change this: rotations may be free (`setCountRotations`) and slice
	* moves may count as 2 (`setSliceMoves`), and FMC mode (`setFmcMode`) uses its own rules.
	*/
	getSolutionMoveCount() {
		if (!_assertClassBrand(_Puzzle_brand, this, _hasCubeNotation).call(this)) return countMoves(this.id, _classPrivateFieldGet2(_solution, this));
		return countSolutionMoves(_classPrivateFieldGet2(_solution, this), _assertClassBrand(_Puzzle_brand, this, _solutionRules).call(this));
	}
	/**
	* Whether the rotations x, y and z count toward the solution's move count: `true` (the
	* default) or `false`. Cubes only; FMC mode never counts them.
	*/
	setCountRotations(count) {
		_classPrivateFieldGet2(_rules, this).countRotations = count;
		return this;
	}
	/** What was set with `setCountRotations`, `true` by default. */
	getCountRotations() {
		return _classPrivateFieldGet2(_rules, this).countRotations;
	}
	/**
	* Whether the slice moves M, S and E are allowed in the solution, and if so whether each
	* counts as 1 or 2 moves: `'one-move'` (the default), `'two-moves'` or `'not-allowed'`
	* (see `SliceMoves`). Cubes only; FMC mode never allows them.
	*/
	setSliceMoves(mode) {
		if (!SLICE_MOVES.includes(mode)) throw new Error(`Unknown slice moves mode "${mode}". Modes: ${SLICE_MOVES.join(", ")}`);
		_classPrivateFieldGet2(_rules, this).sliceMoves = mode;
		return this;
	}
	/** The mode set with `setSliceMoves`, `'one-move'` by default. */
	getSliceMoves() {
		return _classPrivateFieldGet2(_rules, this).sliceMoves;
	}
	/**
	* How wide moves may be written in the solution: `'Rw-or-r'` (the default) or
	* `'Rw-only'`, where `r` is not allowed (see `WideMoves`). Cubes only; FMC mode always
	* uses `'Rw-only'`.
	*/
	setWideMoves(mode) {
		if (!WIDE_MOVES.includes(mode)) throw new Error(`Unknown wide moves mode "${mode}". Modes: ${WIDE_MOVES.join(", ")}`);
		_classPrivateFieldGet2(_rules, this).wideMoves = mode;
		return this;
	}
	/** The mode set with `setWideMoves`, `'Rw-or-r'` by default. */
	getWideMoves() {
		return _classPrivateFieldGet2(_rules, this).wideMoves;
	}
	/**
	* Turns FMC mode on or off (off by default). While it is on, the solution follows the WCA
	* Fewest Moves rules, whatever the other solution options say: rotations don't count,
	* M, S and E are not allowed, wide moves are written only as `Rw`, and the solve status is
	* only `'solved'` or `'DNF'`, never `'+2'`. The other options are kept and apply again
	* when it is turned off. Cubes only.
	*/
	setFmcMode(on) {
		_classPrivateFieldSet2(_fmc, this, on);
		return this;
	}
	/** Whether FMC mode is on, `false` by default. */
	getFmcMode() {
		return _classPrivateFieldGet2(_fmc, this);
	}
	/**
	* The moves of the solution that aren't allowed by the solution options, or that can't be
	* read as cube moves at all, in the order they are typed, e.g. `['M', 'r']`. Always `[]`
	* for puzzles other than the cubes. Moves the options don't allow aren't done on the
	* cube: `getImage`, `getStickers` and `show3D` show it without them.
	*/
	getInvalidMoves() {
		if (!_assertClassBrand(_Puzzle_brand, this, _hasCubeNotation).call(this)) return [];
		return invalidSolutionMoves(_classPrivateFieldGet2(_solution, this), _assertClassBrand(_Puzzle_brand, this, _solutionRules).call(this));
	}
	/**
	* Whether the scramble and then the solution leave the cube solved: `'solved'`, `'+2'`
	* when one more outer block turn would solve it, or `'DNF'` (see `SolveStatus`). A
	* solution with a move that isn't allowed is a DNF (see `getInvalidMoves`), and FMC mode
	* has no +2. `undefined` for puzzles other than the cubes, which can't be checked yet.
	*/
	getSolveStatus() {
		const size = _classPrivateFieldGet2(_info, this).cubeSize;
		if (size === void 0 || !_assertClassBrand(_Puzzle_brand, this, _hasCubeNotation).call(this)) return void 0;
		if (this.getInvalidMoves().length > 0) return "DNF";
		return cubeSolveStatus(size, [_classPrivateFieldGet2(_scramble, this), _classPrivateFieldGet2(_solution, this)].filter(Boolean).join(" "), !_classPrivateFieldGet2(_fmc, this));
	}
	/**
	* Whether `solve` works for this puzzle with its current scramble type: 2x2x2 and 3x3x3,
	* with their own scramble types (not relays or other notations). More puzzles later.
	*/
	hasSolver() {
		return SOLVER_SIZES.includes(_classPrivateFieldGet2(_info, this).cubeSize ?? 0) && _assertClassBrand(_Puzzle_brand, this, _hasCubeNotation).call(this);
	}
	/**
	* How long `solve` and `solveAsync` may search for a shorter 3x3x3 solution, in
	* milliseconds (default 3000). A few seconds usually gets 17 to 19 moves, often the
	* shortest there is, but proving that nothing shorter exists can take many minutes.
	* `Infinity` searches until it has that proof, so the solution is always the shortest.
	* 2x2x2 is always solved in the fewest moves at once.
	*/
	setSolveTimeLimit(ms) {
		if (!(ms > 0)) throw new Error(`The solve time limit must be more than 0 ms, not ${ms}`);
		_classPrivateFieldSet2(_solveTimeLimit, this, ms);
		return this;
	}
	getSolveTimeLimit() {
		return _classPrivateFieldGet2(_solveTimeLimit, this);
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
	solve() {
		const search = _assertClassBrand(_Puzzle_brand, this, _startSearch).call(this);
		const end = performance.now() + _classPrivateFieldGet2(_solveTimeLimit, this);
		while (!search.shortest && performance.now() < end) search.step();
		return _assertClassBrand(_Puzzle_brand, this, _finishSearch).call(this, search);
	}
	/**
	* The same as `solve`, but searches in small steps, letting the page carry on between
	* them, and calls `onProgress` with each shorter solution it finds. `stopSolving` ends it
	* early with the shortest found so far. The solution only becomes the puzzle's if its
	* scramble is still the same at the end.
	*/
	async solveAsync(onProgress) {
		const search = _assertClassBrand(_Puzzle_brand, this, _startSearch).call(this);
		_classPrivateFieldGet2(_stopSolving, this)?.call(this);
		let stopped = false;
		const stop = () => {
			stopped = true;
		};
		_classPrivateFieldSet2(_stopSolving, this, stop);
		const end = performance.now() + _classPrivateFieldGet2(_solveTimeLimit, this);
		onProgress?.(search.solution);
		while (!search.shortest && !stopped && performance.now() < end) {
			await new Promise((resolve) => setTimeout(resolve, 0));
			if (stopped) break;
			if (search.step() && !search.shortest) onProgress?.(search.solution);
		}
		if (_classPrivateFieldGet2(_stopSolving, this) === stop) _classPrivateFieldSet2(_stopSolving, this, void 0);
		return _assertClassBrand(_Puzzle_brand, this, _finishSearch).call(this, search);
	}
	/** Ends the running `solveAsync`, if any, with the shortest solution found so far. */
	stopSolving() {
		_classPrivateFieldGet2(_stopSolving, this)?.call(this);
		_classPrivateFieldSet2(_stopSolving, this, void 0);
		return this;
	}
	/**
	* Whether the puzzle's solution is the one the last solve found and that solve made sure
	* no shorter solution exists. Always true after solving a 2x2x2; on 3x3x3 only when the
	* search finished within the time limit (see `setSolveTimeLimit`).
	*/
	isSolutionShortest() {
		const solved = _classPrivateFieldGet2(_solved, this);
		return solved !== void 0 && solved.shortest && solved.scramble === _classPrivateFieldGet2(_scramble, this) && solved.solution === _classPrivateFieldGet2(_solution, this);
	}
	/** Puts the puzzle back to solved: no scramble and no solution. */
	reset() {
		_classPrivateFieldSet2(_scramble, this, "");
		_classPrivateFieldSet2(_solution, this, "");
		return this;
	}
	/** Whether `getStickers` and `show3D` work for this puzzle: the cubes, 2x2x2 to 11x11x11. */
	has3DView() {
		return _classPrivateFieldGet2(_info, this).cubeSize !== void 0;
	}
	/**
	* The color of every sticker of a cube as it is now (after the scramble and then the
	* solution), by face: `{ U: [...], R: [...], F, D, L, B }`, each with size x size colors.
	* Each face is read row by row, from the top left, as you see it in `getImage()`'s
	* unfolded picture: U with its top row next to B, D with its top row next to F, and the
	* side faces upright. Only for cubes (see `has3DView`).
	*/
	getStickers() {
		const size = _classPrivateFieldGet2(_info, this).cubeSize;
		if (size === void 0) throw new Error(`${this.name} has no 3D view yet, only cubes do`);
		const moves = _assertClassBrand(_Puzzle_brand, this, _movesDone).call(this);
		const posit = image$1.nnnPosit(size, moves);
		const order = _classPrivateFieldGet2(_info, this).cstimerOrder;
		const stickers = {};
		for (const face of this.getFaces()) {
			const f = order.indexOf(face);
			const colors = [];
			for (let row = 0; row < size; row++) for (let col = 0; col < size; col++) {
				const x = face === "L" || face === "B" ? size - 1 - col : col;
				const y = face === "D" ? size - 1 - row : row;
				colors.push(_classPrivateFieldGet2(_colors, this)[order[posit[(f * size + y) * size + x]]]);
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
	show3D(element) {
		drawCube3D(element, _classPrivateFieldGet2(_info, this).cubeSize ?? 0, this.getStickers(), {
			width: _classPrivateFieldGet2(_imageSize, this),
			hidden: _classPrivateFieldGet2(_hiddenFaces, this),
			camera: _classPrivateFieldGet2(_cameraMode, this),
			angle: _classPrivateFieldGet2(_cameraAngle, this),
			offsets: _classPrivateFieldGet2(_floatingOffsets, this),
			faceOffsets: _classPrivateFieldGet2(_faceOffsets, this),
			styles: _classPrivateFieldGet2(_styles, this),
			cubeStyle: _classPrivateFieldGet2(_cubeStyle, this)
		});
		return this;
	}
	/** Whether `getImage()` can draw the puzzle with its current scramble type. */
	hasImage() {
		return hasScrambleImage(_classPrivateFieldGet2(_scramble, this) ? _classPrivateFieldGet2(_scrambleType, this) : this.getScrambleType());
	}
	/**
	* Draws the puzzle as it is now (solved, or after the scramble and then the solution)
	* as an SVG string, with this puzzle's colors, image size and image style (see
	* `setImageStyle`). With the `'cstimer'` style it is the same picture as
	* `getScrambleImage`. Throws if csTimer can't read the moves.
	*/
	getImage() {
		const type = _classPrivateFieldGet2(_scramble, this) ? _classPrivateFieldGet2(_scrambleType, this) : this.getScrambleType();
		if (!hasScrambleImage(type)) throw new Error(`csTimer has no picture for "${type}" scrambles`);
		const style = _classPrivateFieldGet2(_imageStyle, this);
		const size = _classPrivateFieldGet2(_info, this).cubeSize;
		if (style !== "cstimer" && size !== void 0 && tools.puzzleType(type) === this.id) return styleSvg(drawCubeNet(size, this.getStickers(), style, _classPrivateFieldGet2(_imageSize, this), _classPrivateFieldGet2(_cubeStyle, this)), _classPrivateFieldGet2(_styles, this));
		const colors = _classPrivateFieldGet2(_info, this).cstimerOrder.map((face) => toCstimerColor(_classPrivateFieldGet2(_colors, this)[face])).join("");
		let moves = _assertClassBrand(_Puzzle_brand, this, _movesDone).call(this);
		if (this.id === "sq1") moves = joinSq1Turns(moves);
		try {
			const svg = drawImage(type, moves, _classPrivateFieldGet2(_info, this).colorSetting ? { [_classPrivateFieldGet2(_info, this).colorSetting]: colors } : {}, _classPrivateFieldGet2(_imageSize, this));
			return styleSvg(style === "cstimer" ? svg : thickenBorders(svg), _classPrivateFieldGet2(_styles, this));
		} catch {
			throw new Error(`Can't read these moves as ${this.name} moves: "${moves}"`);
		}
	}
};
/** Checks a face offset, filling in 0 for the values left out. */
function _checkOffset(face, offset) {
	if (!this.has3DView()) throw new Error(`${this.name} has no 3D view yet, only cubes do`);
	if (!CUBE_FACES.includes(face)) throw new Error(`${this.name} has no face "${face}". Faces: ${CUBE_FACES.join(", ")}`);
	const full = {
		...NO_OFFSET,
		...offset
	};
	for (const [key, value] of Object.entries(full)) {
		if (!(key in NO_OFFSET)) throw new Error(`Unknown offset "${key}". Offsets: ${Object.keys(NO_OFFSET).join(", ")}`);
		if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Offset ${key} must be a number, not ${value}`);
	}
	return full;
}
function _startSearch() {
	if (!this.hasSolver()) throw new Error(`No solver for ${this.name} with "${this.getScrambleType()}" scrambles yet`);
	return new CubeSearch(_classPrivateFieldGet2(_info, this).cubeSize, _classPrivateFieldGet2(_scramble, this));
}
function _finishSearch(search) {
	if (search.scramble === _classPrivateFieldGet2(_scramble, this)) {
		_classPrivateFieldSet2(_solution, this, search.solution);
		_classPrivateFieldSet2(_solved, this, {
			scramble: search.scramble,
			solution: search.solution,
			shortest: search.shortest
		});
	}
	return search.solution;
}
/**
* The scramble and then the solution, as done on the puzzle: on cubes, the solution's
* moves that the solution options don't allow (see `getInvalidMoves`) are left out, so
* `getStickers`, `getImage` and `show3D` show the cube without them.
*/
function _movesDone() {
	const solution = _assertClassBrand(_Puzzle_brand, this, _hasCubeNotation).call(this) ? allowedSolutionMoves(_classPrivateFieldGet2(_solution, this), _assertClassBrand(_Puzzle_brand, this, _solutionRules).call(this)) : _classPrivateFieldGet2(_solution, this);
	return [_classPrivateFieldGet2(_scramble, this), solution].filter(Boolean).join(" ");
}
/** The rules the solution follows: FMC's in FMC mode, the options set otherwise. */
function _solutionRules() {
	return _classPrivateFieldGet2(_fmc, this) ? FMC_RULES : _classPrivateFieldGet2(_rules, this);
}
/**
* Whether the moves are written in cube notation: on a cube, with one of its own scramble
* types (not, say, 3x3x3's relays or its words-only "noob" scrambles).
*/
function _hasCubeNotation() {
	if (_classPrivateFieldGet2(_info, this).cubeSize === void 0) return false;
	const type = _classPrivateFieldGet2(_scramble, this) ? _classPrivateFieldGet2(_scrambleType, this) : this.getScrambleType();
	return tools.puzzleType(type) === this.id;
}
//#endregion
//#region src/vendor/cstimer/grouplib.js
var DEBUG$2 = false;
var grouplib = (function(rn) {
	function permMult(permA, permB) {
		var ret = [];
		for (var i = 0; i < permA.length; i++) ret[i] = permB[permA[i]];
		return ret;
	}
	function permInv(perm) {
		var ret = [];
		for (var i = 0; i < perm.length; i++) ret[perm[i]] = i;
		return ret;
	}
	function permCmp(perm1, perm2) {
		if (perm1.length != perm2.length) return perm1.length - perm2.length;
		for (var i = perm1.length - 1; i >= 0; i--) if (perm1[i] != perm2[i]) return perm1[i] - perm2[i];
		return 0;
	}
	function SchreierSims(gen, shuffle) {
		if (gen.sgs) {
			this.copy(gen);
			return;
		}
		this.sgs = [];
		this.sgsi = [];
		this.t2i = [];
		this.i2t = [];
		this.keyIdx = [];
		this.Tk = [];
		this.e = [];
		var n = gen[0].length;
		for (var i = 0; i < n; i++) this.e[i] = i;
		for (var i = 0; i < n; i++) {
			this.sgs.push([]);
			this.sgsi.push([]);
			this.t2i.push([]);
			this.i2t.push([i]);
			this.Tk.push([]);
			this.sgs[i][i] = this.e;
			this.sgsi[i][i] = this.e;
			this.t2i[i][i] = 0;
		}
		this.extend(gen, shuffle);
	}
	SchreierSims.prototype.extend = function(gen, shuffle) {
		for (var i = 0; i < gen.length; i++) {
			var g = gen[i];
			if (shuffle) g = permMult(permMult(permInv(shuffle), g), shuffle);
			if (this.isMember(g) < 0) this.knutha(this.e.length - 1, g);
		}
	};
	SchreierSims.prototype.copy = function(obj) {
		this.sgs = [];
		this.sgsi = [];
		this.t2i = [];
		this.i2t = [];
		this.keyIdx = obj.keyIdx.slice();
		this.Tk = [];
		this.e = obj.e;
		var n = this.e.length;
		for (var i = 0; i < n; i++) {
			this.sgs[i] = obj.sgs[i].slice();
			this.sgsi[i] = obj.sgsi[i].slice();
			this.t2i[i] = obj.t2i[i].slice();
			this.i2t[i] = obj.i2t[i].slice();
			this.Tk[i] = obj.Tk[i].slice();
		}
	};
	SchreierSims.prototype.toKeyIdx = function(perm) {
		var ret = [];
		perm = perm || this.e;
		for (var i = 0; i < this.keyIdx.length; i++) ret[i] = perm[this.keyIdx[i]];
		return ret;
	};
	SchreierSims.prototype.isMember = function(p, depth) {
		depth = depth || 0;
		var idx = 0;
		var ps = [];
		for (var i = p.length - 1; i >= depth; i--) {
			var j = p[i];
			for (var k = 0; k < ps.length; k++) j = ps[k][j];
			if (j !== i) {
				if (!this.sgs[i][j]) return -1;
				ps.push(this.sgsi[i][j]);
			}
			idx = idx * this.i2t[i].length + this.t2i[i][j];
		}
		return idx;
	};
	SchreierSims.prototype.isSubgroupMemberByKey = function(permKey, sgsH) {
		var idx = 0;
		var ps = [];
		for (var ii = 0; ii < this.keyIdx.length; ii++) {
			var i = this.keyIdx[ii];
			var j = permKey[ii];
			for (var k = 0; k < ps.length; k++) j = ps[k][j];
			if (j !== i) {
				if (!sgsH.sgs[i][j]) return -1;
				ps.push(sgsH.sgsi[i][j]);
			}
			idx = idx * sgsH.i2t[i].length + sgsH.t2i[i][j];
		}
		return idx;
	};
	SchreierSims.prototype.knutha = function(k, p) {
		this.Tk[k].push(p);
		for (var i = 0; i < this.sgs[k].length; i++) if (this.sgs[k][i]) this.knuthb(k, permMult(this.sgs[k][i], p));
	};
	SchreierSims.prototype.knuthb = function(k, p) {
		var j = p[k];
		if (!this.sgs[k][j]) {
			this.sgs[k][j] = p;
			this.sgsi[k][j] = permInv(p);
			this.t2i[k][j] = this.i2t[k].length;
			this.i2t[k].push(j);
			if (this.i2t[k].length == 2) {
				this.keyIdx.push(k);
				this.keyIdx.sort(function(a, b) {
					return b - a;
				});
			}
			for (var i = 0; i < this.Tk[k].length; i++) this.knuthb(k, permMult(p, this.Tk[k][i]));
			return;
		}
		var p2 = permMult(p, this.sgsi[k][j]);
		if (this.isMember(p2) < 0) this.knutha(k - 1, p2);
	};
	SchreierSims.prototype.size = function(accuracy) {
		var n = this.sgs.length;
		var size = accuracy ? BigInt(1) : 1;
		for (var j = 0; j < n; j++) size *= accuracy ? BigInt(this.i2t[j].length) : this.i2t[j].length;
		return size;
	};
	SchreierSims.prototype.minElem = function(p, depth) {
		p = permInv(p);
		for (var ii = 0; ii < this.keyIdx.length; ii++) {
			var i = this.keyIdx[ii];
			var maxi = p[i];
			var j = i;
			for (var k = 1; k < this.i2t[i].length; k++) {
				var m = this.i2t[i][k];
				if (p[m] > maxi) {
					maxi = p[m];
					j = m;
				}
			}
			if (j !== i) p = permMult(this.sgs[i][j], p);
		}
		return permInv(p);
	};
	SchreierSims.prototype.listCoset = function(subH) {
		var cosetReps = [this.e.slice()];
		var targetSize = 1;
		out: for (var ii = this.keyIdx.length - 1; ii >= 0; ii--) {
			var i = this.keyIdx[ii];
			if (this.i2t[i].length == subH.i2t[i].length) continue;
			targetSize *= this.i2t[i].length;
			targetSize /= subH.i2t[i].length;
			for (var ci = 0, len = cosetReps.length; ci < len; ci++) {
				var coset = cosetReps[ci];
				expand: for (var jj = 1; jj < this.i2t[i].length; jj++) {
					var j = this.i2t[i][jj];
					var newCoset = permMult(coset, this.sgs[i][j]);
					for (var ss = 1; ss < subH.i2t[i].length; ss++) if (newCoset[subH.i2t[i][ss]] > j) continue expand;
					cosetReps.push(newCoset);
					if (cosetReps.length >= targetSize) continue out;
				}
			}
			console.log("[grouplib] listCoset ERROR, Not enough coset representatives");
		}
		return cosetReps;
	};
	SchreierSims.prototype.rndElem = function() {
		var perm = this.e.slice();
		for (var i = this.e.length - 1; i >= 0; i--) {
			var cnt = 0;
			var p = 0;
			for (var j = 0; j <= i; j++) {
				if (!this.sgs[i][j]) continue;
				if (rn(++cnt) < 1) p = j;
			}
			if (p !== i) perm = permMult(perm, this.sgsi[i][p]);
		}
		return perm;
	};
	function CanonSeqGen(gens) {
		this.gens = gens;
		this.glen = gens.length;
		this.trieNodes = [null];
		this.trieNodes.push([]);
		this.skipSeqs = [];
	}
	CanonSeqGen.prototype.addSkipSeq = function(seq) {
		this.skipSeqs.push(seq.slice());
		var node = 1;
		for (var i = 0; i < seq.length; i++) {
			var next = ~~this.trieNodes[node][seq[i]];
			if (next == -1) return;
			if (i == seq.length - 1) {
				this.trieNodes[node][seq[i]] = -1;
				break;
			}
			if (next <= 0) {
				next = this.trieNodes.length;
				this.trieNodes.push([]);
				this.trieNodes[node][seq[i]] = next;
				for (var m = 0; m < this.glen; m++) this.updateNext(seq.slice(0, i + 1).concat(m));
			}
			node = next;
		}
	};
	CanonSeqGen.prototype.traversalTrie = function(node, seq, callback) {
		if (node <= 0) return;
		for (var i = 0; i < this.glen; i++) {
			seq.push(i);
			this.traversalTrie(~~this.trieNodes[node][i], seq, callback);
			seq.pop();
		}
		callback(node, seq);
	};
	CanonSeqGen.prototype.updateNext = function(seq) {
		var node = 1;
		for (var i = 0; i < seq.length; i++) {
			var next = ~~this.trieNodes[node][seq[i]];
			if (next == 0) {
				next = this.updateNext(seq.slice(1, i + 1));
				next = next > 0 ? ~next : next;
				this.trieNodes[node][seq[i]] = next;
			}
			if (next == -1) return -1;
			else if (next < 0) next = ~next;
			node = next;
		}
		return node;
	};
	CanonSeqGen.prototype.refillNext = function() {
		this.traversalTrie(1, [], (node, seq) => {
			for (var i = 0; i < this.glen; i++) {
				var next = ~~this.trieNodes[node][i];
				if (next != -1 && next <= node) this.trieNodes[node][i] = 0;
			}
		});
		this.traversalTrie(1, [], (node, seq) => {
			for (var i = 0; i < this.glen; i++) {
				if ((i & 31) == 0) this.trieNodes[node][this.glen + (i >> 5)] = 0;
				var next = ~~this.trieNodes[node][i];
				if (next != -1 && next <= node) this.updateNext(seq.concat(i));
				if (~~this.trieNodes[node][i] == -1) this.trieNodes[node][this.glen + (i >> 5)] |= 1 << (i & 31);
			}
		});
	};
	CanonSeqGen.prototype.countSeq = function(depth, accuracy) {
		var ZERO = accuracy ? BigInt(0) : 0;
		var counts = accuracy ? [BigInt(0), BigInt(1)] : [0, 1];
		var ret = accuracy ? [BigInt(0), BigInt(1)] : [1];
		for (var d = 0; d < depth; d++) {
			var newCounts = [];
			var depthCnt = ZERO;
			for (var node = 1; node < this.trieNodes.length; node++) {
				var curCount = counts[node] || ZERO;
				if (curCount == 0) continue;
				for (var i = 0; i < this.glen; i++) {
					var next = ~~this.trieNodes[node][i];
					if (next != -1) {
						next = next < 0 ? ~next : next;
						newCounts[next] = (newCounts[next] || ZERO) + curCount;
						depthCnt += curCount;
					}
				}
			}
			counts = newCounts;
			ret.push(depthCnt);
		}
		return ret;
	};
	CanonSeqGen.prototype.countSeqMove = function(depth, moveTable, initState) {
		var counts = [];
		counts[initState * this.trieNodes.length + 1 - 1] = 1;
		var ret = [];
		for (var d = 0; d < depth; d++) {
			var newCounts = [];
			var depthCnts = [];
			var depthCnt = 0;
			for (var state = 0; state < moveTable[0].length; state++) for (var node = 1; node < this.trieNodes.length; node++) {
				var curCount = counts[state * this.trieNodes.length + node - 1] || 0;
				if (curCount == 0) continue;
				for (var i = 0; i < this.glen; i++) {
					var next = ~~this.trieNodes[node][i];
					if (next != -1) {
						next = next < 0 ? ~next : next;
						var newState = moveTable[i][state];
						var idx = newState * this.trieNodes.length + next - 1;
						newCounts[idx] = (newCounts[idx] || 0) + curCount;
						depthCnts[newState] = (depthCnts[newState] || 0) + curCount;
						depthCnt += curCount;
					}
				}
			}
			counts = newCounts;
			ret.push(depthCnts, depthCnt);
		}
		return ret;
	};
	CanonSeqGen.prototype.initTrie = function(depth) {
		this.trieNodes = [null];
		this.trieNodes.push([]);
		this.refillNext();
		var e = [];
		for (var i = 0; i < this.gens[0].length; i++) e[i] = i;
		var visited = /* @__PURE__ */ new Map();
		for (var seqlen = 0; seqlen <= depth; seqlen++) {
			this.searchSkip(e, seqlen, [], 1, visited);
			this.refillNext();
		}
	};
	CanonSeqGen.prototype.searchSkip = function(perm, maxl, seq, node, visited) {
		if (maxl == 0) {
			var key = String.fromCharCode.apply(null, perm);
			if (visited.has(key)) this.addSkipSeq(seq);
			else visited.set(key, seq.slice());
			return;
		}
		for (var i = 0; i < this.glen; i++) {
			var next = this.trieNodes[node][i];
			if (next == -1) continue;
			else if (next < 0) next = ~next;
			var gen = this.gens[i];
			var permNew = permMult(gen, perm);
			seq.push(i);
			this.searchSkip(permNew, maxl - 1, seq, next, visited);
			seq.pop();
		}
	};
	function SubgroupSolver(genG, genH, genM) {
		this.genG = genG;
		this.genH = genH;
		this.genM = genM;
		if (!genH) {
			var e = [];
			for (var i = 0; i < genG[0].length; i++) e[i] = i;
			this.genH = [e];
		}
	}
	SubgroupSolver.prototype.permHash = function(perm) {
		return String.fromCharCode.apply(null, perm);
	};
	SubgroupSolver.prototype.midCosetHash = function(perm) {
		return this.sgsM == null ? this.sgsG.isMember(permInv(perm), this.sgsMdepth) : this.permHash(this.sgsM.minElem(perm));
	};
	SubgroupSolver.prototype.initTables = function(maxCosetSize) {
		if (this.coset2idx) return;
		maxCosetSize = maxCosetSize || 1e5;
		this.sgsH = new SchreierSims(this.genH);
		this.sgsG = new SchreierSims(this.sgsH);
		this.sgsG.extend(this.genG);
		var cosetSize = this.sgsG.size() / this.sgsH.size();
		this.isCosetSearch = this.sgsH.size() > 1;
		var midCosetSize = 1;
		if (this.genM) {
			this.sgsM = new SchreierSims(this.genM);
			midCosetSize = this.sgsG.size() / this.sgsM.size();
		} else if (this.sgsH.size() == 1) {
			this.sgsM = null;
			this.sgsMdepth = 0;
			for (var i = this.sgsG.e.length - 1; i >= 0; i--) {
				if (midCosetSize * this.sgsG.i2t[i].length > maxCosetSize) break;
				this.sgsMdepth = i;
				midCosetSize *= this.sgsG.i2t[i].length;
			}
		} else if (cosetSize <= maxCosetSize) {
			this.sgsM = new SchreierSims(this.genH);
			midCosetSize = cosetSize;
		} else {
			this.sgsM = null;
			this.sgsMdepth = this.sgsG.e.length;
		}
		this.clen = midCosetSize;
		this.genEx = [];
		this.genExi = [];
		this.genExMap = [];
		var genExSet = /* @__PURE__ */ new Map();
		genExSet.set(this.permHash(this.sgsG.e), -1);
		for (var i = 0; i < this.genG.length; i++) {
			var perm = this.genG[i];
			var pow = 1;
			while (true) {
				var key = this.permHash(perm);
				if (genExSet.has(key)) break;
				genExSet.set(key, this.genEx.length);
				this.genEx.push(perm);
				this.genExi.push(permInv(perm));
				this.genExMap.push([i, pow]);
				perm = permMult(this.genG[i], perm);
				pow++;
			}
		}
		this.glen = this.genEx.length;
		for (var i = 0; i < this.glen; i++) {
			var genInv = permInv(this.genEx[i]);
			this.genExMap[i][2] = genExSet.get(this.permHash(genInv));
		}
		this.canon = new CanonSeqGen(this.genEx);
		this.canon.initTrie(2);
		this.canoni = new CanonSeqGen(this.genEx);
		for (var i = 0; i < this.canon.skipSeqs.length; i++) {
			var seq = this.canon.skipSeqs[i].slice();
			seq.reverse();
			for (var j = 0; j < seq.length; j++) seq[j] = this.genExMap[seq[j]][2];
			this.canoni.addSkipSeq(seq);
		}
		this.canoni.refillNext();
		this.moveTable = [];
		this.idx2coset = [this.sgsG.e];
		this.coset2idx = {};
		this.coset2idx[this.midCosetHash(this.sgsG.e)] = 0;
		for (var i = 0; i < this.idx2coset.length; i++) {
			if (i >= midCosetSize) {
				console.log("ERROR!");
				break;
			}
			var perm = this.idx2coset[i];
			for (var j = 0; j < this.glen; j++) {
				if (this.genExMap[j][1] != 1) continue;
				var newp = permMult(this.genEx[j], perm);
				var key = this.midCosetHash(newp);
				if (!(key in this.coset2idx)) {
					this.coset2idx[key] = this.idx2coset.length;
					this.idx2coset.push(newp);
				}
				this.moveTable[i * this.glen + j] = this.coset2idx[key];
			}
		}
		var stdMove = null;
		for (var j = 0; j < this.glen; j++) {
			if (this.genExMap[j][1] == 1) {
				stdMove = j;
				continue;
			}
			for (var i = 0; i < this.clen; i++) this.moveTable[i * this.glen + j] = this.moveTable[this.moveTable[i * this.glen + j - 1] * this.glen + stdMove];
		}
		this.prunTable = this.initPrunTable(this.sgsG.e);
	};
	SubgroupSolver.prototype.idaMidSearch = function(pidx, maxl, lm, trieNodes, moves, curPerm, insertPerm, prunTable, callback) {
		var nodePrun = prunTable[0][pidx];
		if (nodePrun > maxl) return false;
		if (maxl == 0) {
			if (pidx >= this.clen) {
				moves.push(-1);
				var newPerm = permMult(curPerm, insertPerm);
				var ret = callback(moves, newPerm);
				moves.pop();
				return ret;
			}
			return callback(moves, curPerm);
		}
		if (pidx >= this.clen && lm != 0) {
			var newpidx = prunTable[3][pidx - this.clen];
			moves.push(-1);
			var newPerm = permMult(curPerm, insertPerm);
			var ret = this.idaMidSearch(newpidx, maxl, 1, trieNodes, moves, newPerm, insertPerm, prunTable, callback);
			moves.pop();
			if (ret) return ret;
		}
		var node = trieNodes[lm || 1];
		var glenBase = pidx * (this.glen + 31 >> 5);
		for (var mbase = 0; mbase < this.glen; mbase += 32) {
			var mask = node[this.glen + (mbase >> 5)];
			mask |= nodePrun >= maxl - 1 ? prunTable[nodePrun - maxl + 2][glenBase + (mbase >> 5)] : 0;
			mask = ~mask & (this.glen - mbase >= 32 ? -1 : (1 << this.glen - mbase) - 1);
			while (mask != 0) {
				var midx = 31 - Math.clz32(mask);
				mask -= 1 << midx;
				midx += mbase;
				var cidx = pidx % this.clen;
				var newpidx = this.moveTable[cidx * this.glen + midx] + pidx - cidx;
				if (DEBUG$2 && prunTable[0][newpidx] >= maxl) debugger;
				var nextCanon = node[midx];
				moves.push(midx);
				var newPerm = permMult(curPerm, this.genExi[midx]);
				var ret = this.idaMidSearch(newpidx, maxl - 1, nextCanon ^ nextCanon >> 31, trieNodes, moves, newPerm, insertPerm, prunTable, callback);
				moves.pop();
				if (ret) return ret;
			}
		}
		return false;
	};
	SubgroupSolver.prototype.initPrunTable = function(perm, tryNISS) {
		var pidx = this.coset2idx[this.midCosetHash(perm)];
		var prunTable = [];
		var fartherMask = [];
		var nocloserMask = [];
		var maskBase = this.glen + 31 >> 5;
		for (var i = 0; i < this.clen; i++) prunTable[i] = -1;
		var permMove = [];
		if (tryNISS) {
			for (var i = 0; i < this.clen; i++) {
				prunTable.push(-1, -1);
				permMove[i] = this.coset2idx[this.midCosetHash(permMult(perm, this.idx2coset[i]))];
				permMove[permMove[i] + this.clen] = i;
			}
			prunTable[0] = 0;
		} else prunTable[pidx] = 0;
		var fill = 1;
		var lastfill = 0;
		var curDepth = 0;
		while (fill != lastfill) {
			lastfill = fill;
			for (var idx = 0; idx < prunTable.length; idx++) {
				if (prunTable[idx] != curDepth) continue;
				var cidx = idx % this.clen;
				var midx = idx - cidx;
				for (var m = 0; m < this.glen; m++) {
					var newIdx = this.moveTable[cidx * this.glen + m] + midx;
					var newPrun = prunTable[newIdx];
					if (prunTable[newIdx] == -1) {
						prunTable[newIdx] = curDepth + 1;
						newPrun = curDepth + 1;
						fill++;
					}
					if (newPrun > curDepth) fartherMask[idx * maskBase + (m >> 5)] |= 1 << (m & 31);
					if (newPrun >= curDepth) nocloserMask[idx * maskBase + (m >> 5)] |= 1 << (m & 31);
				}
				if (!tryNISS || midx != 0) continue;
				for (var m = 0; m < 2; m++) {
					var newIdx = permMove[cidx + (1 - m) * this.clen] + (m + 1) * this.clen;
					if (prunTable[newIdx] == -1) {
						prunTable[newIdx] = curDepth;
						fill++;
					}
				}
			}
			curDepth++;
		}
		return [
			prunTable,
			fartherMask,
			nocloserMask,
			permMove,
			curDepth
		];
	};
	SubgroupSolver.prototype.checkPerm = function(perm) {
		this.initTables();
		if (this.sgsH.isMember(perm) >= 0) return 1;
		else if (this.sgsG.isMember(perm) < 0) return 2;
		else return 0;
	};
	SubgroupSolver.ONLY_IDA = 1;
	SubgroupSolver.ALLOW_PRE = 2;
	SubgroupSolver.prototype.DissectionSolve = function(perm, minl, maxl, permCtx, solCallback) {
		permCtx = permCtx || {};
		this.initTables();
		if (this.sgsG.isMember(perm) < 0) {
			console.log("[Subgroup Solver] NOT A MEMBER OF G");
			return;
		}
		var pidx = this.coset2idx[this.midCosetHash(perm)];
		if (!pidx && pidx !== 0) {
			console.log("[Subgroup Solver] ERROR!");
			return;
		}
		var onlyIDA = (permCtx.mask & SubgroupSolver.ONLY_IDA) != 0;
		var tryNISS = (permCtx.mask & SubgroupSolver.ALLOW_PRE) != 0 && this.isCosetSearch;
		var ret = null;
		var prunTable1 = this.prunTable;
		var prunTable2 = null;
		if (tryNISS) {
			permCtx.prunTable = permCtx.prunTable || this.initPrunTable(perm, tryNISS);
			prunTable2 = permCtx.prunTable;
			prunTable1 = prunTable2;
			pidx = this.clen;
		}
		for (var depth = Math.max(minl, prunTable1[0][pidx]); depth <= maxl; depth++) {
			var s1tot = 0;
			var s2tot = 0;
			var permi = permInv(perm);
			if (onlyIDA || depth <= this.prunTable[4]) {
				ret = this.idaMidSearch(tryNISS ? this.clen : pidx, depth, 1, this.canon.trieNodes, [], this.sgsG.toKeyIdx(tryNISS ? null : permi), permi, prunTable1, (moves, permKey) => {
					s1tot++;
					if (this.sgsG.isSubgroupMemberByKey(permKey, this.sgsH) < 0) return;
					var solution = [];
					for (var i = 0; i < moves.length; i++) solution.push(moves[i] == -1 ? -1 : this.genExMap[moves[i]].slice(0, 2));
					return solCallback ? solCallback(solution) : solution;
				});
				if (ret) return ret;
				continue;
			}
			var mid = ~~(depth / 2);
			if (!prunTable2) prunTable2 = this.initPrunTable(perm, tryNISS);
			var preSize = tryNISS ? 2 : 1;
			var mpcnt = 0;
			var mpsizes = [];
			for (var mpidx = 0; mpidx < this.clen * preSize; mpidx++) {
				var mpidx1 = mpidx;
				var mpidx2 = mpidx + (tryNISS ? mpidx >= this.clen ? -this.clen : this.clen * 2 : 0);
				if (prunTable1[0][mpidx1] > mid || prunTable2[0][mpidx2] > depth - mid) continue;
				mpcnt++;
				var visited = /* @__PURE__ */ new Map();
				var size1 = 0;
				var size2 = 0;
				var perm0 = this.isCosetSearch ? this.sgsG.e : this.sgsG.toKeyIdx();
				this.idaMidSearch(mpidx1, mid, 0, this.canon.trieNodes, [], perm0, permi, prunTable1, (moves, permKey) => {
					var key;
					if (this.isCosetSearch) {
						var permRep = this.sgsH.minElem(permKey);
						key = this.permHash(permRep);
					} else key = this.permHash(permKey);
					size1++;
					var sols1h = visited.get(key) || [];
					sols1h.push(moves.slice());
					visited.set(key, sols1h);
				});
				ret = this.idaMidSearch(mpidx2, depth - mid, 1, this.canoni.trieNodes, [], perm0, perm, prunTable2, (moves, permKey) => {
					var finalPermKey = tryNISS ? permKey : permMult(permKey, perm);
					var key;
					if (this.isCosetSearch) {
						var permRep = this.sgsH.minElem(finalPermKey);
						key = this.permHash(permRep);
					} else key = this.permHash(finalPermKey);
					size2++;
					if (visited.has(key)) {
						var sols2h = [];
						var node = 1;
						for (var i = 0; i < moves.length; i++) {
							var move = moves[moves.length - 1 - i];
							move = move == -1 ? -1 : this.genExMap[move][2];
							node = move == -1 ? 1 : this.canon.trieNodes[node][move];
							if (DEBUG$2 && node == -1) debugger;
							node ^= node >> 31;
							sols2h.push(move == -1 ? -1 : this.genExMap[move].slice(0, 2));
						}
						var sols1h = visited.get(key);
						for (var i = 0; i < sols1h.length; i++) {
							var solution = sols2h.slice();
							var node2 = node;
							for (var j = 0; j < sols1h[i].length; j++) {
								var move = sols1h[i][j];
								node2 = move == -1 ? 1 : this.canon.trieNodes[node2][move];
								if (node2 == -1) break;
								node2 ^= node2 >> 31;
								solution.push(move == -1 ? -1 : this.genExMap[move].slice(0, 2));
							}
							if (node2 == -1) continue;
							var chk = solCallback ? solCallback(solution) : solution;
							if (chk) return chk;
						}
					}
				});
				mpsizes.push([
					mpidx,
					size1,
					size2
				]);
				s1tot += size1;
				s2tot += size2;
				if (ret) break;
			}
			if (ret) break;
		}
		return ret;
	};
	SubgroupSolver.prototype.godsAlgo = function(depth) {
		this.initTables();
		var stateCnt = 0;
		for (var i = 0; i < this.clen; i++) {
			this.idx2coset[i];
			var visited = /* @__PURE__ */ new Set();
			for (var maxl = 0; maxl <= depth; maxl++) {
				var perm0 = this.isCosetSearch ? this.sgsG.e : this.sgsG.toKeyIdx();
				this.idaMidSearch(i, maxl, 1, this.canon.trieNodes, [], perm0, null, this.prunTable, (moves, permKey) => {
					var key;
					if (this.isCosetSearch) {
						var permRep = this.sgsH.minElem(permKey);
						key = this.permHash(permRep);
					} else key = this.permHash(permKey);
					if (!visited.has(key)) {
						stateCnt++;
						visited.add(key);
					}
				});
			}
		}
		return stateCnt;
	};
	return {
		permMult,
		permInv,
		permCmp,
		CanonSeqGen,
		SchreierSims,
		SubgroupSolver
	};
})(mathlib.rn);
(function() {
	var bitCount = mathlib.bitCount;
	function iterFill(depth, mask, ori, parity, memo, candidates, nOri, sampleArr) {
		var key = (mask * nOri + ori) * 2 + parity;
		if (!sampleArr && key in memo) return memo[key];
		if (depth == candidates.length) {
			if (ori == 0 && parity == 0) memo[key] = 1;
			else memo[key] = 0;
			return memo[key];
		}
		var cnt = 0;
		var probs = [];
		for (var i = 0; i < candidates[depth].length; i++) {
			probs[i] = 0;
			var piece = candidates[depth][i][0];
			if (mask >> piece & 1) continue;
			probs[i] = iterFill(depth + 1, mask | 1 << piece, (ori + candidates[depth][i][1]) % nOri, parity ^ bitCount(mask >> piece) & 1, memo, candidates, nOri);
			cnt += probs[i];
		}
		if (sampleArr) {
			var action = candidates[depth][mathlib.rndProb(probs)];
			sampleArr[depth] = action;
			return iterFill(depth + 1, mask | 1 << action[0], (ori + action[1]) % nOri, parity ^ bitCount(mask >> action[0]) & 1, memo, candidates, nOri, sampleArr);
		}
		memo[key] = cnt;
		return memo[key];
	}
	function genCandidates(facelet, solved, pieces) {
		var nPiece = pieces.length;
		var nOri = pieces[0].length;
		var candidates = [];
		for (var pos = 0; pos < nPiece; pos++) {
			candidates[pos] = [];
			for (var piece = 0; piece < nPiece; piece++) for (var ori = 0; ori < nOri; ori++) {
				var isValid = true;
				for (var chk = 0; chk < nOri; chk++) {
					var target = facelet[pieces[pos][chk]];
					if (target != -1 && target != solved[pieces[piece][(nOri - ori + chk) % nOri]]) {
						isValid = false;
						break;
					}
				}
				if (isValid) candidates[pos].push([piece, ori]);
			}
		}
		return candidates;
	}
	function calcPattern(facelet, solved) {
		facelet = facelet.split("");
		solved = (solved || mathlib.SOLVED_FACELET).split("");
		for (var i = 0; i < facelet.length; i++) {
			facelet[i] = "URFDLB-XYZ".indexOf(facelet[i]);
			solved[i] = "URFDLB-XYZ".indexOf(solved[i]);
		}
		var cornCandidates = genCandidates(facelet, solved, mathlib.CubieCube.cFacelet);
		var edgeCandidates = genCandidates(facelet, solved, mathlib.CubieCube.eFacelet);
		var cornCnts = [];
		var edgeCnts = [];
		var cornMemo = {};
		var edgeMemo = {};
		for (var parity = 0; parity < 2; parity++) {
			cornCnts[parity] = iterFill(0, 0, 0, parity, cornMemo, cornCandidates, 3);
			edgeCnts[parity] = iterFill(0, 0, 0, parity, edgeMemo, edgeCandidates, 2);
		}
		return [
			cornCnts,
			edgeCnts,
			cornMemo,
			edgeMemo,
			cornCandidates,
			edgeCandidates
		];
	}
	function genPattern(cornCnts, edgeCnts, cornMemo, edgeMemo, cornCandidates, edgeCandidates) {
		var parity = ~~mathlib.rndHit(cornCnts[1] * edgeCnts[1] / (cornCnts[0] * edgeCnts[0] + cornCnts[1] * edgeCnts[1]));
		var cornArr = [];
		var edgeArr = [];
		iterFill(0, 0, 0, parity, cornMemo, cornCandidates, 3, cornArr);
		iterFill(0, 0, 0, parity, edgeMemo, edgeCandidates, 2, edgeArr);
		var cc = new mathlib.CubieCube();
		for (var i = 0; i < 8; i++) cc.ca[i] = cornArr[i][1] * 8 + cornArr[i][0];
		for (var i = 0; i < 12; i++) cc.ea[i] = edgeArr[i][0] * 2 + edgeArr[i][1];
		return cc.toFaceCube();
	}
	function genPatternGroup(solved) {
		var params = calcPattern(solved, solved);
		var cornCnts = params[0];
		var edgeCnts = params[1];
		var cornMemo = params[2];
		var edgeMemo = params[3];
		var cornCandidates = params[4];
		var edgeCandidates = params[5];
		var targetSize = cornCnts[0] * edgeCnts[0] + cornCnts[1] * edgeCnts[1];
		var sgs = null;
		do {
			var parity = Math.random() < cornCnts[1] * edgeCnts[1] / (cornCnts[0] * edgeCnts[0] + cornCnts[1] * edgeCnts[1]) ? 1 : 0;
			var cornArr = [];
			var edgeArr = [];
			iterFill(0, 0, 0, parity, cornMemo, cornCandidates, 3, cornArr);
			iterFill(0, 0, 0, parity, edgeMemo, edgeCandidates, 2, edgeArr);
			var cc = new mathlib.CubieCube();
			for (var i = 0; i < 8; i++) cc.ca[i] = cornArr[i][1] * 8 + cornArr[i][0];
			for (var i = 0; i < 12; i++) cc.ea[i] = edgeArr[i][0] * 2 + edgeArr[i][1];
			var perm = cc.toPerm();
			if (!sgs) sgs = new grouplib.SchreierSims([perm]);
			else sgs.extend([perm]);
		} while (sgs.size() < targetSize);
		return sgs;
	}
	return {
		calcPattern,
		genPattern,
		genPatternGroup
	};
})();
//#endregion
//#region src/vendor/cstimer/cross.js
var cross = (function(createMove, edgeMove, createPrun, setNPerm, getNPerm, Cnk, getPruning) {
	var permPrun, flipPrun, ecPrun, fullPrun;
	var cmv = [];
	var pmul = [];
	var fmul = [];
	var e1mv = [];
	var c1mv = [];
	var xxPrun01 = [];
	var xxPrun02 = [];
	function pmv(a, c) {
		var b = cmv[c][~~(a / 24)];
		return 24 * ~~(b / 384) + pmul[a % 24][(b >> 4) % 24];
	}
	function fmv(b, c) {
		var a = cmv[c][b >> 4];
		return ~~(a / 384) << 4 | fmul[b & 15][(a >> 4) % 24] ^ a & 15;
	}
	function i2f(a, c) {
		for (var b = 3; 0 <= b; b--) c[b] = a & 1, a >>= 1;
	}
	function f2i(c) {
		for (var a = 0, b = 0; 4 > b; b++) a <<= 1, a |= c[b];
		return a;
	}
	function fullmv(idx, move) {
		var slice = cmv[move][~~(idx / 384)];
		var flip = fmul[idx & 15][(slice >> 4) % 24] ^ slice & 15;
		var perm = pmul[(idx >> 4) % 24][(slice >> 4) % 24];
		return ~~(slice / 384) * 384 + 16 * perm + flip;
	}
	function init() {
		init = function() {};
		for (var i = 0; i < 24; i++) pmul[i] = [];
		for (var i = 0; i < 16; i++) fmul[i] = [];
		var pm1 = [];
		var pm2 = [];
		var pm3 = [];
		for (var i = 0; i < 24; i++) for (var j = 0; j < 24; j++) {
			setNPerm(pm1, i, 4);
			setNPerm(pm2, j, 4);
			for (var k = 0; k < 4; k++) pm3[k] = pm1[pm2[k]];
			pmul[i][j] = getNPerm(pm3, 4);
			if (i < 16) {
				i2f(i, pm1);
				for (var k = 0; k < 4; k++) pm3[k] = pm1[pm2[k]];
				fmul[i][j] = f2i(pm3);
			}
		}
		createMove(cmv, 495, getmv);
		permPrun = [];
		flipPrun = [];
		createPrun(permPrun, 0, 11880, 5, pmv);
		createPrun(flipPrun, 0, 7920, 6, fmv);
		function getmv(comb, m) {
			var arr = [
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0
			];
			var r = 4;
			for (var i = 0; i < 12; i++) if (comb >= Cnk[11 - i][r]) {
				comb -= Cnk[11 - i][r--];
				arr[i] = r << 1;
			} else arr[i] = -1;
			edgeMove(arr, m);
			comb = 0, r = 4;
			var t = 0;
			var pm = [];
			for (var i = 0; i < 12; i++) if (arr[i] >= 0) {
				comb += Cnk[11 - i][r--];
				pm[r] = arr[i] >> 1;
				t |= (arr[i] & 1) << 3 - r;
			}
			return comb * 24 + getNPerm(pm, 4) << 4 | t;
		}
	}
	function xinit() {
		xinit = function() {};
		init();
		for (var i = 0; i < 24; i++) {
			c1mv[i] = [];
			e1mv[i] = [];
			for (var m = 0; m < 6; m++) {
				c1mv[i][m] = cornMove(i, m);
				var edge = [
					-1,
					-1,
					-1,
					-1,
					-1,
					-1,
					-1,
					-1,
					-1,
					-1,
					-1,
					-1
				];
				edge[i >> 1] = i & 1;
				edgeMove(edge, m);
				for (var e = 0; e < 12; e++) if (edge[e] >= 0) {
					e1mv[i][m] = e << 1 | edge[e];
					break;
				}
			}
		}
		ecPrun = [];
		for (var obj = 0; obj < 4; obj++) {
			var prun = [];
			createPrun(prun, (obj + 4) * 3 * 24 + (obj + 4) * 2, 576, 5, function(q, m) {
				return c1mv[~~(q / 24)][m] * 24 + e1mv[q % 24][m];
			});
			ecPrun[obj] = prun;
		}
		function cornMove(corn, m) {
			var idx = ~~(corn / 3);
			var twst = corn % 3;
			var idxt = [
				[
					3,
					1,
					2,
					7,
					0,
					5,
					6,
					4
				],
				[
					0,
					1,
					6,
					2,
					4,
					5,
					7,
					3
				],
				[
					1,
					2,
					3,
					0,
					4,
					5,
					6,
					7
				],
				[
					0,
					5,
					1,
					3,
					4,
					6,
					2,
					7
				],
				[
					4,
					0,
					2,
					3,
					5,
					1,
					6,
					7
				],
				[
					0,
					1,
					2,
					3,
					7,
					4,
					5,
					6
				]
			];
			twst = (twst + [
				[
					2,
					0,
					0,
					1,
					1,
					0,
					0,
					2
				],
				[
					0,
					0,
					1,
					2,
					0,
					0,
					2,
					1
				],
				[
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0
				],
				[
					0,
					1,
					2,
					0,
					0,
					2,
					1,
					0
				],
				[
					1,
					2,
					0,
					0,
					2,
					1,
					0,
					0
				],
				[
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0
				]
			][m][idx]) % 3;
			return idxt[m][idx] * 3 + twst;
		}
	}
	var solvCross = new mathlib.Searcher((idx) => idx[0] + idx[1] == 0, (idx) => Math.max(getPruning(permPrun, idx[0]), getPruning(flipPrun, idx[1])), (idx, move) => [pmv(idx[0], move), fmv(idx[1], move)], 6, 3, [
		1,
		2,
		4,
		9,
		18,
		36
	]);
	var solvXCross = new mathlib.Searcher((idx) => idx[0] + idx[1] == 0 && idx[2] == (idx[4] + 4) * 2 && idx[3] == (idx[4] + 4) * 3, (idx) => Math.max(getPruning(permPrun, idx[0]), getPruning(flipPrun, idx[1]), getPruning(ecPrun[idx[4]], idx[3] * 24 + idx[2])), (idx, move) => [
		pmv(idx[0], move),
		fmv(idx[1], move),
		e1mv[idx[2]][move],
		c1mv[idx[3]][move],
		idx[4]
	], 6, 3, [
		1,
		2,
		4,
		9,
		18,
		36
	]);
	new mathlib.Searcher((idx) => idx[0] + idx[1] == 0 && idx[2] == 8 && idx[3] == 12 && (idx[4] == 10 && idx[5] == 15 || idx[4] == 12 && idx[5] == 18), (idx) => Math.max(getPruning(permPrun, idx[0]), getPruning(flipPrun, idx[1]), getPruning(idx[6], idx[3] * 24 + idx[2] + 576 * (idx[5] * 24 + idx[4]))), (idx, move) => [
		pmv(idx[0], move),
		fmv(idx[1], move),
		e1mv[idx[2]][move],
		c1mv[idx[3]][move],
		e1mv[idx[4]][move],
		c1mv[idx[5]][move],
		idx[6]
	], 6, 3, [
		1,
		2,
		4,
		9,
		18,
		36
	]);
	new mathlib.Searcher((idx) => idx[0] + idx[1] == 0 && idx[2] == 8 && idx[3] == 12 && idx[4] == 10 && idx[5] == 15 && idx[6] == 12 && idx[7] == 18, (idx) => Math.max(getPruning(permPrun, idx[0]), getPruning(flipPrun, idx[1]), getPruning(xxPrun01, idx[3] * 24 + idx[2] + 576 * (idx[5] * 24 + idx[4])), getPruning(xxPrun02, idx[3] * 24 + idx[2] + 576 * (idx[7] * 24 + idx[6]))), (idx, move) => [
		pmv(idx[0], move),
		fmv(idx[1], move),
		e1mv[idx[2]][move],
		c1mv[idx[3]][move],
		e1mv[idx[4]][move],
		c1mv[idx[5]][move],
		e1mv[idx[6]][move],
		c1mv[idx[7]][move]
	], 6, 3, [
		1,
		2,
		4,
		9,
		18,
		36
	]);
	var moveIdx = [
		"FRUBLD",
		"FLDBRU",
		"FDRBUL",
		"FULBDR",
		"URBDLF",
		"DRFULB"
	];
	function solve_cross(moves) {
		init();
		var ret = [];
		for (var face = 0; face < 6; face++) {
			var flip = 0;
			var perm = 0;
			for (var i = 0; i < moves.length; i++) {
				var m = moveIdx[face].indexOf("FRUBLD".charAt(moves[i][0]));
				var p = moves[i][2];
				for (var j = 0; j < p; j++) {
					flip = fmv(flip, m);
					perm = pmv(perm, m);
				}
			}
			var sol = solvCross.solve([perm, flip], 0, 50);
			for (var i = 0; i < sol.length; i++) sol[i] = "FRUBLD".charAt(sol[i][0]) + " 2'".charAt(sol[i][1]);
			ret.push(sol);
		}
		return ret;
	}
	function fullInit() {
		fullInit = function() {};
		init();
		fullPrun = [];
		createPrun(fullPrun, 0, 190080, 7, fullmv, 6, 3, 6);
	}
	function mapCross(idx) {
		var comb = ~~(idx / 384);
		var perm = (idx >> 4) % 24;
		var flip = idx & 15;
		var arrp = [];
		var arrf = [];
		var pm = [];
		var fl = [];
		i2f(flip, fl);
		setNPerm(pm, perm, 4);
		var r = 4;
		var map = [
			7,
			6,
			5,
			4,
			10,
			9,
			8,
			11,
			3,
			2,
			1,
			0
		];
		for (var i = 0; i < 12; i++) if (comb >= Cnk[11 - i][r]) {
			comb -= Cnk[11 - i][r--];
			arrp[map[i]] = pm[r];
			arrf[map[i]] = fl[r];
		} else arrp[map[i]] = arrf[map[i]] = -1;
		return [arrp, arrf];
	}
	function getEasyCross(length) {
		fullInit();
		var lenA = Math.min(length % 10, 8);
		var lenB = Math.min(~~(length / 10), 8);
		var minLen = Math.min(lenA, lenB);
		var maxLen = Math.max(lenA, lenB);
		var ncase = [
			0,
			1,
			16,
			174,
			1568,
			11377,
			57758,
			155012,
			189978,
			190080
		];
		var cases = mathlib.rn(ncase[maxLen + 1] - ncase[minLen]) + 1;
		var i = 0;
		for (; i < 190080; i++) {
			var prun = getPruning(fullPrun, i);
			if (prun <= maxLen && prun >= minLen && --cases == 0) break;
		}
		return mapCross(i);
	}
	function getEasyXCross(length) {
		fullInit();
		xinit();
		var lenA = length % 10;
		var lenB = ~~(length / 10);
		var minLen = Math.min(lenA, lenB, 8);
		var maxLen = Math.max(lenA, lenB);
		var ncase = [
			1,
			16,
			174,
			1568,
			11377,
			57758,
			155012,
			189978,
			190080
		];
		length = Math.max(0, Math.min(maxLen, 8));
		var remain = ncase[length];
		var isFound = false;
		while (!isFound) {
			var rndIdx = [];
			var sample = 500;
			for (var i = 0; i < sample; i++) rndIdx.push(mathlib.rn(remain));
			rndIdx.sort(function(a, b) {
				return b - a;
			});
			var rndCases = [];
			var cnt = 0;
			for (var i = 0; i < 190080; i++) {
				if (getPruning(fullPrun, i) > length) continue;
				while (rndIdx.at(-1) == cnt) {
					rndCases.push(i);
					rndIdx.pop();
				}
				if (rndIdx.length == 0) break;
				cnt++;
			}
			rndIdx = mathlib.rndPerm(sample);
			for (var i = 0; i < sample; i++) {
				var caze = rndCases[rndIdx[i]];
				var comb = ~~(caze / 384);
				var perm = comb * 24 + (caze >> 4) % 24;
				var flip = comb << 4 | caze & 15;
				var sol = [];
				var corns = mathlib.rndPerm(8).slice(4);
				var edges = mathlib.rndPerm(8);
				var arr = [
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0,
					0
				];
				var r = 4;
				for (var j = 0; j < 12; j++) if (comb >= Cnk[11 - j][r]) {
					comb -= Cnk[11 - j][r--];
					arr[j] = -1;
				} else arr[j] = edges.pop();
				for (var j = 0; j < 4; j++) {
					corns[j] = corns[j] * 3 + mathlib.rn(3);
					edges[j] = arr.indexOf(j) * 2 + mathlib.rn(2);
					var sol = solvXCross.solve([
						perm,
						flip,
						edges[j],
						corns[j],
						j
					], 0, isFound ? minLen - 1 : maxLen);
					if (sol == null) continue;
					else if (sol.length < minLen) {
						isFound = false;
						break;
					} else if (sol.length <= maxLen) isFound = true;
				}
				if (!isFound) continue;
				var crossArr = mapCross(caze);
				crossArr[2] = mathlib.valuedArray(8, -1);
				crossArr[3] = mathlib.valuedArray(8, -1);
				var map = [
					7,
					6,
					5,
					4,
					10,
					9,
					8,
					11,
					3,
					2,
					1,
					0
				];
				var map2 = [
					6,
					5,
					4,
					7,
					2,
					1,
					0,
					3
				];
				for (var i = 0; i < 4; i++) {
					crossArr[0][map[edges[i] >> 1]] = map[i + 4];
					crossArr[1][map[edges[i] >> 1]] = edges[i] % 2;
					crossArr[2][map2[~~(corns[i] / 3)]] = map2[i + 4];
					crossArr[3][map2[~~(corns[i] / 3)]] = (30 - corns[i]) % 3;
				}
				return crossArr;
			}
		}
	}
	return {
		solve: solve_cross,
		getEasyCross,
		getEasyXCross
	};
})(mathlib.createMove, mathlib.edgeMove, mathlib.createPrun, mathlib.setNPerm, mathlib.getNPerm, mathlib.Cnk, mathlib.getPruning);
//#endregion
//#region src/vendor/cstimer/scramble_333_edit.js
var scramble_333$1 = (function(getNPerm, setNPerm, getNParity, rn, rndEl) {
	var Ux1 = 0, Ux2 = 1, Ux3 = 2, Rx1 = 3, Rx2 = 4, Rx3 = 5, Dx1 = 9, Dx2 = 10, Dx3 = 11, Lx1 = 12, Lx2 = 13, Lx3 = 14;
	function renderFacelet(solved, cc, resultMap) {
		var f = cc.toPerm();
		var ret = [];
		for (var i = 0; i < resultMap.length; i++) ret[i] = solved[f[resultMap[i]]];
		return ret.join("");
	}
	var search = new min2phase.Search();
	function getRandomScramble() {
		return getAnyScramble(0xffffffffffff, 0xffffffffffff, 4294967295, 4294967295);
	}
	function getFMCScramble() {
		return "R' U' F " + getAnyScramble(0xffffffffffff, 0xffffffffffff, 4294967295, 4294967295, 0, void 0, void 0, 2, 1) + "R' U' F";
	}
	function cntU(b) {
		for (var c = 0, a = 0; a < b.length; a++) -1 == b[a] && c++;
		return c;
	}
	function fixOri(arr, cntU, base) {
		var sum = 0;
		var idx = 0;
		for (var i = 0; i < arr.length; i++) if (arr[i] != -1) sum += arr[i];
		sum %= base;
		for (var i = 0; i < arr.length - 1; i++) {
			if (arr[i] == -1) {
				if (cntU-- == 1) arr[i] = ((base << 4) - sum) % base;
				else {
					arr[i] = rn(base);
					sum += arr[i];
				}
			}
			idx *= base;
			idx += arr[i];
		}
		if (cntU == 1) arr.splice(-1, 1, ((base << 4) - sum) % base);
		return idx;
	}
	function fixPerm(arr, cntU, parity) {
		var val = [
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
		for (var i = 0; i < arr.length; i++) if (arr[i] != -1) val[arr[i]] = -1;
		for (var i = 0, j = 0; i < val.length; i++) if (val[i] != -1) val[j++] = val[i];
		var last;
		for (var i = 0; i < arr.length && cntU > 0; i++) if (arr[i] == -1) {
			var r = rn(cntU);
			arr[i] = val[r];
			for (var j = r; j < 11; j++) val[j] = val[j + 1];
			if (cntU-- == 2) last = i;
		}
		if (getNParity(getNPerm(arr, arr.length), arr.length) == 1 - parity) {
			var temp = arr[i - 1];
			arr[i - 1] = arr[last];
			arr[last] = temp;
		}
		return getNPerm(arr, arr.length);
	}
	function parseMask(arr, length) {
		if ("number" !== typeof arr) return arr;
		var ret = [];
		for (var i = 0; i < length; i++) {
			var val = arr & 15;
			ret[i] = val == 15 ? -1 : val;
			arr /= 16;
		}
		return ret;
	}
	var aufsuff = [
		[],
		[Ux1],
		[Ux2],
		[Ux3]
	];
	var rlpresuff = [
		[],
		[Rx1, Lx3],
		[Rx2, Lx2],
		[Rx3, Lx1]
	];
	var rlappsuff = [
		"",
		"x'",
		"x2",
		"x"
	];
	var emptysuff = [[]];
	function getAnyScramble(_ep, _eo, _cp, _co, neut, _rndapp, _rndpre, firstAxisFilter, lastAxisFilter) {
		_rndapp = _rndapp || emptysuff;
		_rndpre = _rndpre || emptysuff;
		_ep = parseMask(_ep, 12);
		_eo = parseMask(_eo, 12);
		_cp = parseMask(_cp, 8);
		_co = parseMask(_co, 8);
		var solution = "";
		do {
			var eo = _eo.slice();
			var ep = _ep.slice();
			var co = _co.slice();
			var cp = _cp.slice();
			var neo = fixOri(eo, cntU(eo), 2);
			var nco = fixOri(co, cntU(co), 3);
			var nep, ncp;
			var ue = cntU(ep);
			var uc = cntU(cp);
			if (ue == 1) {
				fixPerm(ep, ue, -1);
				ue = 0;
			}
			if (uc == 1) {
				fixPerm(cp, uc, -1);
				uc = 0;
			}
			if (ue == 0 && uc == 0) {
				nep = getNPerm(ep, 12);
				ncp = getNPerm(cp, 8);
			} else if (ue != 0 && uc == 0) {
				ncp = getNPerm(cp, 8);
				nep = fixPerm(ep, ue, getNParity(ncp, 8));
			} else if (ue == 0 && uc != 0) {
				nep = getNPerm(ep, 12);
				ncp = fixPerm(cp, uc, getNParity(nep, 12));
			} else {
				nep = fixPerm(ep, ue, -1);
				ncp = fixPerm(cp, uc, getNParity(nep, 12));
			}
			if (ncp + nco + nep + neo == 0) continue;
			var rndpre = rndEl(_rndpre);
			var rndapp = rndEl(_rndapp);
			var cc = new mathlib.CubieCube();
			var cd = new mathlib.CubieCube();
			for (var i = 0; i < 12; i++) {
				cc.ea[i] = ep[i] << 1 | eo[i];
				if (i < 8) cc.ca[i] = co[i] << 3 | cp[i];
			}
			for (var i = 0; i < rndpre.length; i++) {
				mathlib.CubieCube.CubeMult(mathlib.CubieCube.moveCube[rndpre[i]], cc, cd);
				cc.init(cd.ca, cd.ea);
			}
			for (var i = 0; i < rndapp.length; i++) {
				mathlib.CubieCube.CubeMult(cc, mathlib.CubieCube.moveCube[rndapp[i]], cd);
				cc.init(cd.ca, cd.ea);
			}
			if (neut) {
				cc.ori = mathlib.rn([
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
			var posit = cc.toFaceCube();
			solution = search.solution(posit, 21, 1e9, 50, 2, lastAxisFilter, firstAxisFilter);
		} while (solution.length <= 3);
		return solution.replace(/ +/g, " ");
	}
	function getEdgeScramble() {
		return getAnyScramble(0xffffffffffff, 0xffffffffffff, 1985229328, 0);
	}
	function getCornerScramble() {
		return getAnyScramble(0xba9876543210, 0, 4294967295, 4294967295);
	}
	function getLLScramble(type, length, cases, neut) {
		return getAnyScramble(0xba987654ffff, 65535, 1985282047, 65535, neut);
	}
	var f2l_map = [
		[
			8192,
			4,
			"Easy-01"
		],
		[
			4113,
			4,
			"Easy-02"
		],
		[
			8210,
			4,
			"Easy-03"
		],
		[
			4099,
			4,
			"Easy-04"
		],
		[
			8195,
			4,
			"RE-05"
		],
		[
			4114,
			4,
			"RE-06"
		],
		[
			8194,
			4,
			"RE-07"
		],
		[
			4115,
			4,
			"RE-08"
		],
		[
			8211,
			4,
			"REFC-09"
		],
		[
			4098,
			4,
			"REFC-10"
		],
		[
			8208,
			4,
			"REFC-11"
		],
		[
			4097,
			4,
			"REFC-12"
		],
		[
			8209,
			4,
			"REFC-13"
		],
		[
			4096,
			4,
			"REFC-14"
		],
		[
			8193,
			4,
			"SPGO-15"
		],
		[
			4112,
			4,
			"SPGO-16"
		],
		[
			0,
			4,
			"SPGO-17"
		],
		[
			17,
			4,
			"SPGO-18"
		],
		[
			3,
			4,
			"PMS-19"
		],
		[
			18,
			4,
			"PMS-20"
		],
		[
			2,
			4,
			"PMS-21"
		],
		[
			19,
			4,
			"PMS-22"
		],
		[
			1,
			4,
			"Weird-23"
		],
		[
			16,
			4,
			"Weird-24"
		],
		[
			1024,
			4,
			"CPEU-25"
		],
		[
			1041,
			4,
			"CPEU-26"
		],
		[
			5120,
			4,
			"CPEU-27"
		],
		[
			9233,
			4,
			"CPEU-28"
		],
		[
			5137,
			4,
			"CPEU-29"
		],
		[
			9216,
			4,
			"CPEU-30"
		],
		[
			24,
			4,
			"EPCU-31"
		],
		[
			8,
			4,
			"EPCU-32"
		],
		[
			8200,
			4,
			"EPCU-33"
		],
		[
			4104,
			4,
			"EPCU-34"
		],
		[
			8216,
			4,
			"EPCU-35"
		],
		[
			4120,
			4,
			"EPCU-36"
		],
		[
			1048,
			1,
			"ECP-37"
		],
		[
			5128,
			1,
			"ECP-38"
		],
		[
			9224,
			1,
			"ECP-39"
		],
		[
			5144,
			1,
			"ECP-40"
		],
		[
			9240,
			1,
			"ECP-41"
		],
		[
			1032,
			1,
			"Solved-42"
		]
	];
	var f2lprobs = mathlib.idxArray(f2l_map, 1);
	var f2lfilter = mathlib.idxArray(f2l_map, 2);
	function getLSLLScramble(type, length, cases, neut) {
		var caze = f2l_map[scrMgr.fixCase(cases, f2lprobs)][0];
		var ep = Math.pow(16, caze & 15);
		var eo = 15 ^ caze >> 4 & 1;
		var cp = Math.pow(16, caze >> 8 & 15);
		var co = 15 ^ caze >> 12 & 3;
		return getAnyScramble(0xba9f7654ffff - 7 * ep, 64424574975 - eo * ep, 1986002943 - 11 * cp, 1048575 - co * cp, neut, aufsuff);
	}
	var eols_map = [];
	var eolsprobs = [];
	var eolsfilter = [];
	for (var i = 0; i < f2l_map.length; i++) {
		if (f2l_map[i][0] & 240) continue;
		eols_map.push(f2l_map[i]);
		eolsprobs.push(f2lprobs[i]);
		eolsfilter.push(f2lfilter[i]);
	}
	function getEOLSScramble(type, length, cases, neut) {
		var caze = eols_map[scrMgr.fixCase(cases, eolsprobs)][0];
		var ep = Math.pow(16, caze & 15);
		var cp = Math.pow(16, caze >> 8 & 15);
		var co = 15 ^ caze >> 12 & 3;
		return getAnyScramble(0xba9f7654ffff - 7 * ep, 0, 1986002943 - 11 * cp, 1048575 - co * cp, neut, aufsuff);
	}
	function getF2LImage(piece0, stmap, stprobs, cases, canvas) {
		var emap = [
			[5, 10],
			[7, 19],
			[3, -1],
			[1, -1],
			null,
			null,
			null,
			null,
			[23, 12]
		];
		var cmap = [
			[
				8,
				20,
				9
			],
			[
				6,
				-1,
				18
			],
			[
				0,
				-1,
				-1
			],
			[
				2,
				11,
				-1
			],
			[
				-1,
				15,
				26
			]
		];
		var caze = stmap[scrMgr.fixCase(cases, stprobs)][0];
		var ep = emap[caze & 15];
		var eo = caze >> 4 & 1;
		var cp = cmap[caze >> 8 & 15];
		var co = caze >> 12 & 3;
		var pieces = piece0.split("");
		for (var i1 = 0; i1 < 3; i1++) {
			if (i1 < 2 && ep[i1] >= 0) pieces[ep[i1]] = "BR".charAt(eo ^ i1);
			if (cp[i1] >= 0) pieces[cp[i1]] = "URB".charAt((co + 3 + i1) % 3);
		}
		image.face3Image(pieces.join(""), canvas);
	}
	var wvls_map = [];
	var wvlsprobs = [];
	var wvlsfilter = [
		"Oriented",
		"Rectangle-1",
		"Rectangle-2",
		"Tank-1",
		"Bowtie-1",
		"Bowtie-3",
		"Tank-2",
		"Bowtie-2",
		"Bowtie-4",
		"Snake-1",
		"Adjacent-1",
		"Adjacent-2",
		"Gun-Far",
		"Sune-1",
		"Pi-Near",
		"Gun-Back",
		"Pi-Front",
		"H-Side",
		"Snake-2",
		"Adjacent-3",
		"Adjacent-4",
		"Gun-Sides",
		"H-Front",
		"Pi-Back",
		"Gun-Near",
		"Pi-Far",
		"Sune-2"
	];
	for (var i = 0; i < 27; i++) {
		wvls_map[i] = ~~(i / 9) << 12 | ~~(i / 3) % 3 << 8 | i % 3;
		wvlsprobs[i] = 1;
	}
	function getWVLSScramble(type, length, cases, neut) {
		var caze = wvls_map[scrMgr.fixCase(cases, wvlsprobs)];
		return getAnyScramble(0xba9f7654ff8f, 0, 1986002767, 983072 | caze, neut);
	}
	function getWVLSImage(cases, canvas) {
		var caze = wvls_map[scrMgr.fixCase(cases, wvlsprobs)];
		var fill = [
			"DGG",
			"GDG",
			"GGD"
		];
		fill = fill[caze & 3] + fill[caze >> 8 & 3] + fill[caze >> 12 & 3];
		image.llImage.drawImage("3D6DDDBB0RR21G87G54GU".replace(/[0-9]/g, function(v) {
			return fill[~~v];
		}), null, canvas);
	}
	var vls_map = [];
	var vlsprobs = [];
	var vlsfilter = [];
	for (var i = 0; i < 216; i++) {
		var co = i % 27;
		var eo = ~~(i / 27);
		vls_map[i] = [~~(co / 9) % 3 << 12 | ~~(co / 3) % 3 << 8 | co % 3, (eo >> 2 & 1) << 12 | (eo >> 1 & 1) << 8 | eo & 1];
		vlsprobs[i] = 1;
		vlsfilter[i] = [
			"WVLS",
			"UB",
			"UF",
			"UF UB",
			"UL",
			"UB UL",
			"UF UL",
			"No Edge"
		][eo] + "-" + (co + 1);
	}
	function getVLSScramble(type, length, cases, neut) {
		var caze = vls_map[scrMgr.fixCase(cases, vlsprobs)];
		return getAnyScramble(0xba9f7654ff8f, 64424509440 + caze[1], 1986002767, 983072 + caze[0], neut, [[Ux3]]);
	}
	function getVLSImage(cases, canvas) {
		var caze = vls_map[scrMgr.fixCase(cases, vlsprobs)];
		var fillc = [
			"DGG",
			"GDG",
			"GGD"
		];
		fillc = fillc[caze[0] & 3] + fillc[caze[0] >> 8 & 3] + fillc[caze[0] >> 12 & 3];
		var fille = ["DG", "GD"];
		fille = fille[caze[1] & 3] + fille[caze[1] >> 8 & 3] + fille[caze[1] >> 12 & 3];
		image.llImage.drawImage("6a0eDR3cR4dUFF21b87f5".replace(/[0-9]/g, function(v) {
			return fillc[~~v];
		}).replace(/[a-z]/g, function(v) {
			return fille[v.charCodeAt(0) - "a".charCodeAt(0)];
		}), null, canvas);
	}
	function getF2LScramble(type, length, cases, neut) {
		return getAnyScramble(0xffff7654ffff, 0xffff0000ffff, 4294967295, 4294967295, neut);
	}
	function genZBLLMap() {
		var isVisited = [];
		var zbll_map = [];
		var cc = new mathlib.CubieCube();
		for (var idx = 0; idx < 15552; idx++) {
			if (isVisited[idx >> 5] >> (idx & 31) & 1) continue;
			var epi = idx % 24;
			var cpi = ~~(idx / 24) % 24;
			var coi = ~~(idx / 24 / 24);
			if (mathlib.getNParity(cpi, 4) != mathlib.getNParity(epi, 4)) continue;
			var co = mathlib.setNOri([], coi, 4, -3);
			var cp = mathlib.setNPerm([], cpi, 4, 0);
			var ep = mathlib.setNPerm([], epi, 4, 0);
			var zbcase = [
				0,
				0,
				0,
				null,
				0,
				null
			];
			for (var i = 0; i < 4; i++) {
				zbcase[0] += cp[i] << i * 4;
				zbcase[1] += co[i] << i * 4;
				zbcase[2] += ep[i] << i * 4;
			}
			for (var conj = 0; conj < 16; conj++) {
				var c0 = conj >> 2;
				var c1 = conj & 3;
				var co2 = [], cp2 = [], ep2 = [];
				for (var i = 0; i < 4; i++) {
					co2[i + c0 & 3] = co[i];
					cp2[i + c0 & 3] = cp[i] + c1 & 3;
					ep2[i + c0 & 3] = ep[i] + c1 & 3;
				}
				var co2i = mathlib.getNOri(co2, 4, -3);
				var cp2i = mathlib.getNPerm(cp2, 4, 0);
				var ep2i = mathlib.getNPerm(ep2, 4, 0);
				var idx2 = (co2i * 24 + cp2i) * 24 + ep2i;
				if (isVisited[idx2 >> 5] >> (idx2 & 31) & 1) continue;
				isVisited[idx2 >> 5] |= 1 << (idx2 & 31);
				zbcase[4]++;
			}
			for (var i = 0; i < 12; i++) {
				cc.ea[i] = ep[i] << 1;
				if (i < 8) cc.ca[i] = co[i] << 3 | cp[i];
			}
			zbcase[3] = renderFacelet("DDDDDDDDDLLLLLLLLLFFFFFFFFFUUUUUUUUURRRRRRRRRBBBBBBBBB", cc, [
				0,
				1,
				2,
				3,
				4,
				5,
				6,
				7,
				8,
				18,
				19,
				20,
				9,
				10,
				11,
				45,
				46,
				47,
				36,
				37,
				38
			]);
			if (idx > 0) zbll_map.push(zbcase);
		}
		var coNames = {};
		coNames[0] = "O";
		coNames[18] = "U";
		coNames[33] = "T";
		coNames[258] = "L";
		coNames[273] = "aS";
		coNames[546] = "S";
		coNames[4386] = "Pi";
		coNames[4626] = "H";
		var coCnts = {};
		for (var i = 0; i < zbll_map.length; i++) {
			var zbcase = zbll_map[i];
			var coName = coNames[zbcase[1]];
			coCnts[coName] = coCnts[coName] || [];
			var coCnt = coCnts[coName];
			var cpIdx = coCnt.indexOf(zbcase[0]);
			if (cpIdx == -1) {
				cpIdx = coCnt.length;
				coCnt.push(zbcase[0], 1);
			} else coCnt[cpIdx + 1]++;
			zbcase[5] = coName + ((cpIdx >> 1) + 1) + "-" + coCnts[coName][cpIdx + 1];
		}
		return zbll_map;
	}
	var zbll_map = genZBLLMap();
	var zbprobs = mathlib.idxArray(zbll_map, 4);
	var zbfilter = mathlib.idxArray(zbll_map, 5);
	function getZBLLScramble(type, length, cases, neut) {
		var zbcase = zbll_map[scrMgr.fixCase(cases, zbprobs)];
		return getAnyScramble(zbcase[2] + 0xba9876540000, 0, zbcase[0] + 1985216512, zbcase[1], neut, aufsuff, aufsuff);
	}
	function getZBLLImage(cases, canvas) {
		var face = zbll_map[cases][3];
		if (!canvas) return [
			face,
			null,
			zbfilter[cases]
		];
		image.llImage.drawImage(face, null, canvas);
	}
	var coll_map = [
		[
			12816,
			8481,
			"FeFeeeBeBLGRDGDRGLDGD",
			2,
			"H-1"
		],
		[
			8961,
			4626,
			"ReLeeeReLBGBDGDFGFDGD",
			2,
			"H-2"
		],
		[
			4611,
			4626,
			"ReBeeeLeBFGRDGDLGFDGD",
			4,
			"H-3"
		],
		[
			8211,
			4626,
			"LeReeeFeFRGLDGDBGBDGD",
			4,
			"H-4"
		],
		[
			12321,
			4128,
			"DeLeeeReDBGRFGBDGFLGD",
			4,
			"L-1"
		],
		[
			4611,
			513,
			"DeReeeLeDFGBRGFDGLBGD",
			4,
			"L-2"
		],
		[
			8961,
			258,
			"DeBeeeLeDFGRFGRDGLBGD",
			4,
			"L-3"
		],
		[
			12816,
			4128,
			"DeLeeeFeDRGFLGBDGBRGD",
			4,
			"L-4"
		],
		[
			12546,
			4128,
			"DeLeeeLeDFGBRGBDGRFGD",
			4,
			"L-5"
		],
		[
			8211,
			513,
			"DeReeeReDBGLBGFDGFLGD",
			4,
			"L-6"
		],
		[
			12816,
			4386,
			"LeFeeeReFBGDRGLDGBDGD",
			4,
			"Pi-1"
		],
		[
			8961,
			8466,
			"FeLeeeFeRRGDBGBDGLDGD",
			4,
			"Pi-2"
		],
		[
			4611,
			4641,
			"ReLeeeReLBGDFGBDGFDGD",
			4,
			"Pi-3"
		],
		[
			12546,
			4386,
			"BeFeeeFeBRGDLGLDGRDGD",
			4,
			"Pi-4"
		],
		[
			8211,
			4641,
			"BeLeeeLeFFGDRGBDGRDGD",
			4,
			"Pi-5"
		],
		[
			12321,
			4386,
			"BeReeeLeBFGDLGFDGRDGD",
			4,
			"Pi-6"
		],
		[
			12816,
			8736,
			"ReBeeeFeDRGFLGDLGDBGD",
			4,
			"S-1"
		],
		[
			8961,
			546,
			"BeReeeLeDFGRFGDBGDLGD",
			4,
			"S-2"
		],
		[
			12321,
			8736,
			"BeReeeFeDRGFLGDBGDLGD",
			4,
			"S-3"
		],
		[
			8211,
			8706,
			"ReBeeeLeDFGRFGDLGDBGD",
			4,
			"S-4"
		],
		[
			12546,
			8736,
			"FeBeeeLeDFGBRGDLGDRGD",
			4,
			"S-5"
		],
		[
			4611,
			8706,
			"LeReeeFeDRGLBGDBGDFGD",
			4,
			"S-6"
		],
		[
			4611,
			4098,
			"BeLeeeDeDBGRFGDFGRDGL",
			4,
			"T-1"
		],
		[
			12546,
			8448,
			"ReBeeeDeDLGBRGDLGFDGF",
			4,
			"T-2"
		],
		[
			8961,
			528,
			"BeFeeeDeDBGFLGDRGRDGL",
			4,
			"T-3"
		],
		[
			12816,
			8448,
			"FeFeeeDeDBGBRGDRGLDGL",
			4,
			"T-4"
		],
		[
			8211,
			4098,
			"BeBeeeDeDLGRFGDLGRDGF",
			4,
			"T-5"
		],
		[
			12321,
			8448,
			"FeBeeeDeDRGRFGDLGLDGB",
			4,
			"T-6"
		],
		[
			8961,
			288,
			"LeLeeeDeDFGBRGBDGDFGR",
			4,
			"U-1"
		],
		[
			12816,
			4608,
			"LeReeeDeDBGBRGFDGDFGL",
			4,
			"U-2"
		],
		[
			12321,
			4608,
			"FeFeeeDeDBGBRGLDGDRGL",
			4,
			"U-3"
		],
		[
			8211,
			8193,
			"BeFeeeDeDFGBRGLDGDLGR",
			4,
			"U-4"
		],
		[
			4611,
			8193,
			"ReFeeeDeDBGRFGLDGDBGL",
			4,
			"U-5"
		],
		[
			12546,
			4608,
			"LeBeeeDeDBGRFGRDGDFGL",
			4,
			"U-6"
		],
		[
			12816,
			4353,
			"LeFeeeDeRRGFDGLDGBDGB",
			4,
			"aS-1"
		],
		[
			8961,
			4368,
			"ReFeeeDeLRGBDGLDGFDGB",
			4,
			"aS-2"
		],
		[
			12321,
			4353,
			"LeBeeeDeFFGLDGRDGBDGR",
			4,
			"aS-3"
		],
		[
			8211,
			4113,
			"LeFeeeDeBFGRDGLDGBDGR",
			4,
			"aS-4"
		],
		[
			4611,
			4113,
			"FeBeeeDeLFGBDGRDGLDGR",
			4,
			"aS-5"
		],
		[
			12546,
			4353,
			"FeBeeeDeRBGFDGRDGLDGL",
			4,
			"aS-6"
		],
		[
			12321,
			0,
			"DeDeeeDeDBGRFGBRGFLGL",
			4,
			"O-Adj"
		],
		[
			8961,
			0,
			"DeDeeeDeDBGFLGRFGBRGL",
			1,
			"O-Diag"
		],
		[
			12816,
			0,
			"DeDeeeDeDBGBRGRFGFLGL",
			1,
			"O-AUF"
		]
	];
	var coprobs = mathlib.idxArray(coll_map, 3);
	var cofilter = mathlib.idxArray(coll_map, 4);
	function getCOLLScramble(type, length, cases, neut) {
		var cocase = coll_map[scrMgr.fixCase(cases, coprobs)];
		return getAnyScramble(0xba987654ffff, 0, cocase[0] + 1985216512, cocase[1], neut, aufsuff, aufsuff);
	}
	function getCMLLScramble(type, length, cases) {
		var cocase = coll_map[scrMgr.fixCase(cases, coprobs)];
		var rnd4 = rn(4);
		var presuff = [];
		for (var i = 0; i < aufsuff.length; i++) presuff.push(aufsuff[i].concat(rlpresuff[rnd4]));
		return getAnyScramble(0xba98f6f4ffff, 4042326015, cocase[0] + 1985216512, cocase[1], 0, presuff, aufsuff) + rlappsuff[rnd4];
	}
	function getSBRouxScramble(type, length, cases) {
		var rnd4 = rn(4);
		return getAnyScramble(0xfa9ff6ffffff, 0xf00ff0ffffff, 4133486591, 4027580415, 0, [rlpresuff[rnd4]]) + rlappsuff[rnd4];
	}
	function getCOLLImage(efill, cases, canvas) {
		var face = coll_map[cases][2].replace(/e/g, efill || "U");
		if (!canvas) return [
			face,
			null,
			cofilter[cases]
		];
		image.llImage.drawImage(face, null, canvas);
	}
	function getZZLLScramble(type, length, cases, neut) {
		return getAnyScramble(0xba9876543f1f, 0, 1985282047, 65535, neut, aufsuff);
	}
	var ttll_map = [
		[
			205840,
			12816,
			"FBar-1"
		],
		[
			205840,
			12546,
			"FBar-2"
		],
		[
			205840,
			12321,
			"FBar-3"
		],
		[
			205840,
			8961,
			"FBar-4"
		],
		[
			205840,
			8496,
			"FBar-5"
		],
		[
			205840,
			8211,
			"FBar-6"
		],
		[
			205840,
			4896,
			"FBar-7"
		],
		[
			205840,
			4611,
			"FBar-8"
		],
		[
			205840,
			4146,
			"FBar-9"
		],
		[
			205840,
			786,
			"FBar-10"
		],
		[
			205840,
			561,
			"FBar-11"
		],
		[
			205840,
			291,
			"FBar-12"
		],
		[
			205825,
			12801,
			"2Opp-1"
		],
		[
			205825,
			12576,
			"2Opp-2"
		],
		[
			205825,
			12306,
			"2Opp-3"
		],
		[
			205825,
			8976,
			"2Opp-4"
		],
		[
			205825,
			8451,
			"2Opp-5"
		],
		[
			205825,
			8241,
			"2Opp-6"
		],
		[
			205825,
			4866,
			"2Opp-7"
		],
		[
			205825,
			4656,
			"2Opp-8"
		],
		[
			205825,
			4131,
			"2Opp-9"
		],
		[
			205825,
			801,
			"2Opp-10"
		],
		[
			205825,
			531,
			"2Opp-11"
		],
		[
			205825,
			306,
			"2Opp-12"
		],
		[
			201760,
			12801,
			"ROpp-1"
		],
		[
			201760,
			12576,
			"ROpp-2"
		],
		[
			201760,
			12306,
			"ROpp-3"
		],
		[
			201760,
			8976,
			"ROpp-4"
		],
		[
			201760,
			8451,
			"ROpp-5"
		],
		[
			201760,
			8241,
			"ROpp-6"
		],
		[
			201760,
			4866,
			"ROpp-7"
		],
		[
			201760,
			4656,
			"ROpp-8"
		],
		[
			201760,
			4131,
			"ROpp-9"
		],
		[
			201760,
			801,
			"ROpp-10"
		],
		[
			201760,
			531,
			"ROpp-11"
		],
		[
			201760,
			306,
			"ROpp-12"
		],
		[
			201730,
			12816,
			"RBar-1"
		],
		[
			201730,
			12546,
			"RBar-2"
		],
		[
			201730,
			12321,
			"RBar-3"
		],
		[
			201730,
			8961,
			"RBar-4"
		],
		[
			201730,
			8496,
			"RBar-5"
		],
		[
			201730,
			8211,
			"RBar-6"
		],
		[
			201730,
			4896,
			"RBar-7"
		],
		[
			201730,
			4611,
			"RBar-8"
		],
		[
			201730,
			4146,
			"RBar-9"
		],
		[
			201730,
			786,
			"RBar-10"
		],
		[
			201730,
			561,
			"RBar-11"
		],
		[
			201730,
			291,
			"RBar-12"
		],
		[
			197665,
			12816,
			"2Bar-1"
		],
		[
			197665,
			12546,
			"2Bar-2"
		],
		[
			197665,
			12321,
			"2Bar-3"
		],
		[
			197665,
			8961,
			"2Bar-4"
		],
		[
			197665,
			8496,
			"2Bar-5"
		],
		[
			197665,
			8211,
			"2Bar-6"
		],
		[
			197665,
			4896,
			"2Bar-7"
		],
		[
			197665,
			4611,
			"2Bar-8"
		],
		[
			197665,
			4146,
			"2Bar-9"
		],
		[
			197665,
			786,
			"2Bar-10"
		],
		[
			197665,
			561,
			"2Bar-11"
		],
		[
			197665,
			291,
			"2Bar-12"
		],
		[
			197650,
			12801,
			"FOpp-1"
		],
		[
			197650,
			12576,
			"FOpp-2"
		],
		[
			197650,
			12306,
			"FOpp-3"
		],
		[
			197650,
			8976,
			"FOpp-4"
		],
		[
			197650,
			8451,
			"FOpp-5"
		],
		[
			197650,
			8241,
			"FOpp-6"
		],
		[
			197650,
			4866,
			"FOpp-7"
		],
		[
			197650,
			4656,
			"FOpp-8"
		],
		[
			197650,
			4131,
			"FOpp-9"
		],
		[
			197650,
			801,
			"FOpp-10"
		],
		[
			197650,
			531,
			"FOpp-11"
		],
		[
			197650,
			306,
			"FOpp-12"
		]
	];
	var ttllprobs = [];
	var ttllfilter = [];
	for (var i = 0; i < ttll_map.length; i++) {
		ttllprobs[i] = 1;
		ttllfilter[i] = ttll_map[i][2];
	}
	function getTTLLScramble(type, length, cases, neut) {
		var ttllcase = ttll_map[scrMgr.fixCase(cases, ttllprobs)];
		return getAnyScramble(0xba9876540000 + ttllcase[1], 0, 1984954368 + ttllcase[0], 0, neut, aufsuff, aufsuff);
	}
	function getTTLLImage(cases, canvas) {
		var ret = [];
		var ttllcase = ttll_map[cases];
		for (var i = 3; i >= 0; i--) {
			ret.push([
				"FR",
				"LF",
				"BL",
				"RB",
				"GG"
			][ttllcase[0] >> i * 4 & 15]);
			ret.push("RFLB".charAt(ttllcase[1] >> i * 4 & 15));
		}
		ret = ret.join("");
		ret = ret.slice(7) + ret.slice(0, 7);
		var llParam = ["GDDDDDDDD" + ret, null];
		if (!canvas) return llParam.concat([ttllfilter[cases]]);
		image.llImage.drawImage(llParam[0], llParam[1], canvas);
	}
	function getLSEScramble() {
		var rnd4 = rn(4);
		return getAnyScramble(0xba98f6f4ffff, 4042326015, 1985229328, 0, 0, [rlpresuff[rnd4]], aufsuff) + rlappsuff[rnd4];
	}
	function getCLLScramble(type, length, cases, neut) {
		var cocase = coll_map[scrMgr.fixCase(cases, coprobs)];
		return getAnyScramble(0xba987654ffff, 65535, cocase[0] + 1985216512, cocase[1], neut, aufsuff, aufsuff);
	}
	function getELLScramble(type, length, cases, neut) {
		return getAnyScramble(0xba987654ffff, 65535, 1985229328, 0, neut);
	}
	function get2GLLScramble(type, length, cases, neut) {
		return getAnyScramble(0xba987654ffff, 0, 1985229328, 65535, neut, aufsuff);
	}
	var pll_map = [
		[
			4146,
			12816,
			1,
			"H"
		],
		[
			12546,
			12816,
			4,
			"Ua"
		],
		[
			12321,
			12816,
			4,
			"Ub"
		],
		[
			8961,
			12816,
			2,
			"Z"
		],
		[
			12816,
			12321,
			4,
			"Aa"
		],
		[
			12816,
			12546,
			4,
			"Ab"
		],
		[
			12816,
			8961,
			2,
			"E"
		],
		[
			12306,
			12801,
			4,
			"F"
		],
		[
			8496,
			12321,
			4,
			"Ga"
		],
		[
			4896,
			12546,
			4,
			"Gb"
		],
		[
			12321,
			12546,
			4,
			"Gc"
		],
		[
			12546,
			12321,
			4,
			"Gd"
		],
		[
			12801,
			12801,
			4,
			"Ja"
		],
		[
			12576,
			12801,
			4,
			"Jb"
		],
		[
			4656,
			12306,
			1,
			"Na"
		],
		[
			12306,
			12306,
			1,
			"Nb"
		],
		[
			531,
			12801,
			4,
			"Ra"
		],
		[
			8976,
			12801,
			4,
			"Rb"
		],
		[
			4656,
			12801,
			4,
			"T"
		],
		[
			12576,
			12306,
			4,
			"V"
		],
		[
			12801,
			12306,
			4,
			"Y"
		]
	];
	var pllprobs = mathlib.idxArray(pll_map, 2);
	var pllfilter = mathlib.idxArray(pll_map, 3);
	var pllImgParam = [
		[
			"BFBRLRFBFLRL",
			[1, 7],
			[3, 5]
		],
		[
			"BRBRLRFFFLBL",
			[3, 7],
			[7, 5],
			[5, 3]
		],
		[
			"BLBRBRFFFLRL",
			[3, 5],
			[5, 7],
			[7, 3]
		],
		[
			"LFLBRBRBRFLF",
			[1, 5],
			[3, 7]
		],
		[
			"LBBRRLBFRFLF",
			[0, 2],
			[2, 6],
			[6, 0]
		],
		[
			"RBFLRRFFLBLB",
			[0, 6],
			[6, 8],
			[8, 0]
		],
		[
			"LBRFRBRFLBLF",
			[0, 6],
			[2, 8]
		],
		[
			"BFRFRBRBFLLL",
			[1, 7],
			[2, 8]
		],
		["BRRFLBRBFLFL"],
		["BFRFBBRLFLRL"],
		["BFRFLBRRFLBL"],
		["BLRFFBRBFLRL"],
		[
			"BBRFFBRRFLLL",
			[1, 5],
			[2, 8]
		],
		[
			"LBBRLLBRRFFF",
			[2, 8],
			[5, 7]
		],
		[
			"FBBRLLBFFLRR",
			[2, 6],
			[3, 5]
		],
		[
			"BBFLLRFFBRRL",
			[0, 8],
			[3, 5]
		],
		[
			"LLBRBLBFRFRF",
			[1, 3],
			[2, 8]
		],
		[
			"RBFLFRFLLBRB",
			[2, 8],
			[3, 7]
		],
		[
			"BBRFLBRFFLRL",
			[2, 8],
			[3, 5]
		],
		[
			"BBFLFRFRBRLL",
			[0, 8],
			[1, 5]
		],
		[
			"BBFLRRFLBRFL",
			[0, 8],
			[1, 3]
		]
	];
	function getPLLScramble(type, length, cases, neut) {
		var pllcase = pll_map[scrMgr.fixCase(cases, pllprobs)];
		return getAnyScramble(pllcase[0] + 0xba9876540000, 0, pllcase[1] + 1985216512, 0, neut, aufsuff, aufsuff);
	}
	function getPLLImage(cases, canvas) {
		var arrows = pllImgParam[cases].slice(1);
		if (arrows.length == 2) arrows = arrows.concat([[arrows[0][1], arrows[0][0]], [arrows[1][1], arrows[1][0]]]);
		var llParam = ["DDDDDDDDD" + pllImgParam[cases][0], arrows];
		if (!canvas) return llParam.concat([pllfilter[cases]]);
		image.llImage.drawImage(llParam[0], llParam[1], canvas);
	}
	var oll_map = [
		[
			0,
			0,
			1,
			"PLL",
			255
		],
		[
			4369,
			4626,
			2,
			"Point-1",
			965120
		],
		[
			4369,
			4386,
			4,
			"Point-2",
			907776
		],
		[
			4369,
			546,
			4,
			"Point-3",
			374304
		],
		[
			4369,
			273,
			4,
			"Point-4",
			447360
		],
		[
			17,
			8226,
			4,
			"Square-5",
			538123
		],
		[
			17,
			4113,
			4,
			"Square-6",
			396054
		],
		[
			17,
			8706,
			4,
			"SLBS-7",
			79402
		],
		[
			17,
			273,
			4,
			"SLBS-8",
			410514
		],
		[
			17,
			4368,
			4,
			"Fish-9",
			152458
		],
		[
			17,
			8736,
			4,
			"Fish-10",
			627788
		],
		[
			17,
			546,
			4,
			"SLBS-11",
			595470
		],
		[
			17,
			4353,
			4,
			"SLBS-12",
			281363
		],
		[
			257,
			8226,
			4,
			"Knight-13",
			108088
		],
		[
			257,
			273,
			4,
			"Knight-14",
			181144
		],
		[
			257,
			546,
			4,
			"Knight-15",
			566809
		],
		[
			257,
			4113,
			4,
			"Knight-16",
			166684
		],
		[
			4369,
			258,
			4,
			"Point-17",
			308097
		],
		[
			4369,
			18,
			4,
			"Point-18",
			300805
		],
		[
			4369,
			33,
			4,
			"Point-19",
			825861
		],
		[
			4369,
			0,
			1,
			"CO-20",
			299685
		],
		[
			0,
			4626,
			2,
			"OCLL-21",
			83290
		],
		[
			0,
			4386,
			4,
			"OCLL-22",
			672858
		],
		[
			0,
			18,
			4,
			"OCLL-23",
			82170
		],
		[
			0,
			33,
			4,
			"OCLL-24",
			66014
		],
		[
			0,
			258,
			4,
			"OCLL-25",
			132222
		],
		[
			0,
			273,
			4,
			"OCLL-26",
			133470
		],
		[
			0,
			546,
			4,
			"OCLL-27",
			74874
		],
		[
			17,
			0,
			4,
			"CO-28",
			4783
		],
		[
			17,
			528,
			4,
			"Awkward-29",
			70542
		],
		[
			17,
			8448,
			4,
			"Awkward-30",
			144042
		],
		[
			17,
			33,
			4,
			"P-31",
			328598
		],
		[
			17,
			4098,
			4,
			"P-32",
			22059
		],
		[
			257,
			33,
			4,
			"T-33",
			99228
		],
		[
			257,
			528,
			4,
			"C-34",
			172728
		],
		[
			17,
			4128,
			4,
			"Fish-35",
			303569
		],
		[
			17,
			258,
			4,
			"W-36",
			803475
		],
		[
			17,
			8208,
			4,
			"Fish-37",
			13195
		],
		[
			17,
			513,
			4,
			"W-38",
			72238
		],
		[
			257,
			4128,
			4,
			"BLBS-39",
			100924
		],
		[
			257,
			258,
			4,
			"BLBS-40",
			574105
		],
		[
			17,
			4608,
			4,
			"Awkward-41",
			86698
		],
		[
			17,
			288,
			4,
			"Awkward-42",
			38221
		],
		[
			17,
			18,
			4,
			"P-43",
			918166
		],
		[
			17,
			8193,
			4,
			"P-44",
			14891
		],
		[
			257,
			18,
			4,
			"T-45",
			688796
		],
		[
			257,
			288,
			4,
			"C-46",
			276579
		],
		[
			17,
			4641,
			4,
			"L-47",
			338706
		],
		[
			17,
			4386,
			4,
			"L-48",
			677386
		],
		[
			17,
			8466,
			4,
			"L-49",
			935442
		],
		[
			17,
			8721,
			4,
			"L-50",
			967760
		],
		[
			257,
			4641,
			4,
			"I-51",
			109336
		],
		[
			257,
			4386,
			4,
			"I-52",
			342338
		],
		[
			17,
			8481,
			4,
			"L-53",
			345874
		],
		[
			17,
			4626,
			4,
			"L-54",
			87818
		],
		[
			257,
			8481,
			2,
			"I-55",
			116504
		],
		[
			257,
			4626,
			2,
			"I-56",
			698904
		],
		[
			257,
			0,
			2,
			"CO-57",
			33469
		]
	];
	var ollprobs = mathlib.idxArray(oll_map, 2);
	var ollfilter = mathlib.idxArray(oll_map, 3);
	function getOLLScramble(type, length, cases, neut) {
		var ollcase = oll_map[scrMgr.fixCase(cases, ollprobs)];
		return getAnyScramble(0xba987654ffff, ollcase[0], 1985282047, ollcase[1], neut, aufsuff, aufsuff);
	}
	function getOLLImage(cases, canvas) {
		var face = "";
		var val = oll_map[cases][4];
		for (var i = 0; i < 21; i++) if (i == 4) face += "D";
		else {
			face += val & 1 ? "D" : "G";
			val >>= 1;
		}
		if (!canvas) return [
			face,
			null,
			ollfilter[cases]
		];
		image.llImage.drawImage(face, null, canvas);
	}
	function getEOLineScramble(type, length, cases, neut) {
		return getAnyScramble(0xffff7f5fffff, 0, 4294967295, 4294967295, neut);
	}
	function getEOCrossScramble(type, length, cases, neut) {
		return getAnyScramble(0xffff7654ffff, 0, 4294967295, 4294967295, neut);
	}
	var daufsuff = [
		[],
		[Dx1],
		[Dx2],
		[Dx3]
	];
	var daufrot = [
		"",
		"y",
		"y2",
		"y'"
	];
	function getMehta3QBScramble() {
		var rnd4 = mathlib.rn(4);
		return getAnyScramble(0xffff765fffff, 0xffff000fffff, 4133486591, 4027580415, 0, [daufsuff[rnd4]]) + daufrot[rnd4];
	}
	function getMehtaEOLEScramble() {
		var skip = mathlib.rn(4);
		var rnd4 = mathlib.rn(4);
		return getAnyScramble(0xba98765fffff + (17767 & 15 << skip * 4) * 4294967296, 1048575 + (15 << skip * 4) * 4294967296, 4133486591, 4027580415, 0, [daufsuff[rnd4]]) + daufrot[rnd4];
	}
	function getMehtaTDRScramble() {
		return getAnyScramble(0xba98765fffff, 0, 4133486591, 4027580415);
	}
	function getMehta6CPScramble() {
		return getAnyScramble(0xba98765fffff, 0, 4133486591, 0);
	}
	function getMehtaL5EPScramble() {
		return getAnyScramble(0xba98765fffff, 0, 1985229328, 0);
	}
	function getMehtaCDRLLScramble() {
		return getAnyScramble(0xba98765fffff, 0, 1985282047, 65535);
	}
	var customfilter = [
		"UR",
		"UF",
		"UL",
		"UB",
		"DR",
		"DF",
		"DL",
		"DB",
		"RF",
		"LF",
		"LB",
		"RB",
		"URF",
		"UFL",
		"ULB",
		"UBR",
		"DFR",
		"DLF",
		"DBL",
		"DRB"
	];
	for (var i = 0; i < 20; i++) {
		var piece = customfilter[i];
		customfilter[i + 20] = (piece.length == 2 ? "OriE-" : "OriC-") + piece;
		customfilter[i] = (piece.length == 2 ? "PermE-" : "PermC-") + piece;
	}
	var customprobs = mathlib.valuedArray(40, 0);
	function getCustomScramble(type, length, cases, neut) {
		var ep = 0;
		var eo = 0;
		var cp = 0;
		var co = 0;
		var chk = 4352;
		cases = cases || mathlib.valuedArray(40, 1);
		for (var i = 0; i < 12; i++) {
			chk += (cases[i] ? 69632 : 0) + (cases[i + 20] ? 16 : 0);
			ep += (cases[i] ? 15 : i) * Math.pow(16, i);
			eo += (cases[i + 20] ? 15 : 0) * Math.pow(16, i);
		}
		for (var i = 0; i < 8; i++) {
			chk += (cases[i + 12] ? 65792 : 0) + (cases[i + 32] ? 1 : 0);
			cp += (cases[i + 12] ? 15 : i) * Math.pow(16, i);
			co += (cases[i + 32] ? 15 : 0) * Math.pow(16, i);
		}
		if ((chk & 1887470) == 0) return "U' U ";
		return getAnyScramble(ep, eo, cp, co, neut);
	}
	function getEasyCrossScramble(type, length, _, neut) {
		var cases = cross.getEasyCross(length);
		return getAnyScramble(cases[0], cases[1], 4294967295, 4294967295, neut);
	}
	function getEasyXCrossScramble(type, length, _, neut) {
		var cases = cross.getEasyXCross(length);
		return getAnyScramble(cases[0], cases[1], cases[2], cases[3], neut);
	}
	var normTrans = [];
	function normOrient(facelet, toAppend) {
		var rotMoves1 = [
			"",
			"x",
			"x2",
			"x'",
			"z",
			"z'"
		];
		var rotMoves2 = [
			"",
			"y",
			"y2",
			"y'"
		];
		if (normTrans.length == 0) for (var i = 0; i < 24; i++) {
			var cc = new mathlib.CubieCube();
			cc.selfMoveStr(rotMoves2[i & 3]);
			cc.selfMoveStr(rotMoves1[i >> 2]);
			normTrans.push(cc.toPerm(null, null, null, true));
		}
		var ori = 0;
		out: for (var i = 0; i < 24; i++) {
			for (var j = 0; j < 6; j++) if (facelet[normTrans[i][j * 9 + 4]] != "URFDLB".charAt(j)) continue out;
			var ret = [];
			for (var j = 0; j < 54; j++) ret[j] = facelet[normTrans[i][j]];
			facelet = ret.join("");
			ori = i;
			break;
		}
		var mv1 = rotMoves1[ori >> 2];
		if (mv1 != "") toAppend.push(mv1[0] + "'2 ".charAt("2'".indexOf(mv1[1]) + 1));
		var mv2 = rotMoves2[ori & 3];
		if (mv2 != "") toAppend.push(mv2[0] + "'2 ".charAt("2'".indexOf(mv2[1]) + 1));
		return facelet;
	}
	var subsetSolvs = {};
	function subsetScramble(moves) {
		var key = moves.join("|");
		if (!subsetSolvs[key]) {
			var gens = [];
			for (var m = 0; m < moves.length; m++) {
				var cc = new mathlib.CubieCube();
				cc.selfMoveStr(moves[m]);
				gens.push(cc.toPerm(null, null, null, true));
			}
			subsetSolvs[key] = new grouplib.SubgroupSolver(gens);
			subsetSolvs[key].initTables();
		}
		var solv = subsetSolvs[key];
		var solution = "";
		if (solv.sgsG.size() < 1e8) {
			do {
				var state = subsetSolvs[key].sgsG.rndElem();
				solution = subsetSolvs[key].DissectionSolve(state, 12, 20).map((mvpow) => moves[mvpow[0]] + [
					"",
					"2",
					"'"
				][mvpow[1] - 1]).join(" ");
			} while (solution.length <= 2);
			return solution.replace(/ +/g, " ");
		}
		var toAppend;
		do {
			var state = subsetSolvs[key].sgsG.rndElem();
			for (var i = 0; i < state.length; i++) state[i] = "URFDLB".charAt(~~(state[i] / 9));
			toAppend = [];
			state = normOrient(state.join(""), toAppend);
			solution = search.solution(state, 21, 1e9, 50, 2);
		} while (solution.length <= 3);
		toAppend.unshift(solution);
		return toAppend.join(" ").replace(/ +/g, " ");
	}
	function genFacelet(facelet) {
		return search.solution(facelet, 21, 1e9, 50, 2);
	}
	function solvFacelet(facelet) {
		return search.solution(facelet, 21, 1e9, 50, 0);
	}
	scrMgr.reg("333", getRandomScramble)("333fm", getFMCScramble)("edges", getEdgeScramble)("corners", getCornerScramble)("333custom", getCustomScramble, [customfilter, customprobs])("ll", getLLScramble)("lsll2", getLSLLScramble, [
		f2lfilter,
		f2lprobs,
		getF2LImage.bind(null, "GGGGDGGGGGGGGRRGRRGGGBBGBBG", f2l_map, f2lprobs)
	])("f2l", getF2LScramble)("zbll", getZBLLScramble, [
		zbfilter,
		zbprobs,
		getZBLLImage
	])("zzll", getZZLLScramble)("zbls", getLSLLScramble, [
		f2lfilter,
		f2lprobs,
		getF2LImage.bind(null, "GGGGDGGGGGGGGRRGRRGGGBBGBBG", f2l_map, f2lprobs)
	])("ttll", getTTLLScramble, [
		ttllfilter,
		ttllprobs,
		getTTLLImage
	])("eols", getEOLSScramble, [
		eolsfilter,
		eolsprobs,
		getF2LImage.bind(null, "GDGDDDGDGGGGGRRGRRGGGBBDBBG", eols_map, eolsprobs)
	])("wvls", getWVLSScramble, [
		wvlsfilter,
		wvlsprobs,
		getWVLSImage
	])("vls", getVLSScramble, [
		vlsfilter,
		vlsprobs,
		getVLSImage
	])("lse", getLSEScramble)("cmll", getCMLLScramble, [
		cofilter,
		coprobs,
		getCOLLImage.bind(null, "G")
	])("cll", getCLLScramble, [
		cofilter,
		coprobs,
		getCOLLImage.bind(null, "G")
	])("coll", getCOLLScramble, [
		cofilter,
		coprobs,
		getCOLLImage.bind(null, "D")
	])("ell", getELLScramble)("pll", getPLLScramble, [
		pllfilter,
		pllprobs,
		getPLLImage
	])("oll", getOLLScramble, [
		ollfilter,
		ollprobs,
		getOLLImage
	])("2gll", get2GLLScramble)("sbrx", getSBRouxScramble)("half", subsetScramble.bind(null, [
		"U2",
		"R2",
		"F2",
		"D2",
		"L2",
		"B2"
	]))("333drud", subsetScramble.bind(null, [
		"U",
		"R2",
		"F2",
		"D",
		"L2",
		"B2"
	]))("3gen_F", subsetScramble.bind(null, [
		"U",
		"R",
		"F"
	]))("3gen_L", subsetScramble.bind(null, [
		"U",
		"R",
		"L"
	]))("2gen", subsetScramble.bind(null, ["U", "R"]))("2genl", subsetScramble.bind(null, ["U", "L"]))("RrU", subsetScramble.bind(null, [
		"R",
		"Rw",
		"U"
	]))("roux", subsetScramble.bind(null, ["M", "U"]))("mt3qb", getMehta3QBScramble)("mteole", getMehtaEOLEScramble)("mttdr", getMehtaTDRScramble)("mt6cp", getMehta6CPScramble)("mtl5ep", getMehtaL5EPScramble)("mtcdrll", getMehtaCDRLLScramble)("easyc", getEasyCrossScramble)("easyxc", getEasyXCrossScramble)("eoline", getEOLineScramble)("eocross", getEOCrossScramble);
	return {
		getRandomScramble,
		getEdgeScramble,
		getCornerScramble,
		getLLScramble,
		getLSLLScramble,
		getCOLLScramble,
		getZBLLScramble,
		getZZLLScramble,
		getTTLLScramble,
		getF2LScramble,
		getLSEScramble,
		getCMLLScramble,
		getCLLScramble,
		getELLScramble,
		getAnyScramble,
		getPLLImage,
		getOLLImage,
		getCOLLImage,
		getZBLLImage,
		genFacelet,
		solvFacelet
	};
})(mathlib.getNPerm, mathlib.setNPerm, mathlib.getNParity, mathlib.rn, mathlib.rndEl);
//#endregion
//#region src/vendor/cstimer/megascramble.js
(function(mega, rn, rndEl) {
	var cubesuff = [
		"",
		"2",
		"'"
	];
	var minxsuff = [
		"",
		"2",
		"'",
		"2'"
	];
	var args = {
		"111": [[
			["x"],
			["y"],
			["z"]
		], cubesuff],
		"2223": [[
			["U"],
			["R"],
			["F"]
		], cubesuff],
		"2226": [[
			[["U", "D"]],
			[["R", "L"]],
			[["F", "B"]]
		], cubesuff],
		"333o": [[
			["U", "D"],
			["R", "L"],
			["F", "B"]
		], cubesuff],
		"334": [[
			[[
				"U",
				"U'",
				"U2"
			], [
				"u",
				"u'",
				"u2"
			]],
			[[
				"R2",
				"L2",
				"M2"
			]],
			[[
				"F2",
				"B2",
				"S2"
			]]
		]],
		"336": [[
			[
				[
					"U",
					"U'",
					"U2"
				],
				[
					"u",
					"u'",
					"u2"
				],
				[
					"3u",
					"3u2",
					"3u'"
				]
			],
			[[
				"R2",
				"L2",
				"M2"
			]],
			[[
				"F2",
				"B2",
				"S2"
			]]
		]],
		"888": [[
			[
				"U",
				"D",
				"u",
				"d",
				"3u",
				"3d",
				"4u"
			],
			[
				"R",
				"L",
				"r",
				"l",
				"3r",
				"3l",
				"4r"
			],
			[
				"F",
				"B",
				"f",
				"b",
				"3f",
				"3b",
				"4f"
			]
		], cubesuff],
		"999": [[
			[
				"U",
				"D",
				"u",
				"d",
				"3u",
				"3d",
				"4u",
				"4d"
			],
			[
				"R",
				"L",
				"r",
				"l",
				"3r",
				"3l",
				"4r",
				"4l"
			],
			[
				"F",
				"B",
				"f",
				"b",
				"3f",
				"3b",
				"4f",
				"4b"
			]
		], cubesuff],
		"101010": [[
			[
				"U",
				"D",
				"u",
				"d",
				"3u",
				"3d",
				"4u",
				"4d",
				"5u"
			],
			[
				"R",
				"L",
				"r",
				"l",
				"3r",
				"3l",
				"4r",
				"4l",
				"5r"
			],
			[
				"F",
				"B",
				"f",
				"b",
				"3f",
				"3b",
				"4f",
				"4b",
				"5f"
			]
		], cubesuff],
		"111111": [[
			[
				"U",
				"D",
				"u",
				"d",
				"3u",
				"3d",
				"4u",
				"4d",
				"5u",
				"5d"
			],
			[
				"R",
				"L",
				"r",
				"l",
				"3r",
				"3l",
				"4r",
				"4l",
				"5r",
				"5l"
			],
			[
				"F",
				"B",
				"f",
				"b",
				"3f",
				"3b",
				"4f",
				"4b",
				"5f",
				"5b"
			]
		], cubesuff],
		"444": [[
			[
				"U",
				"D",
				"u"
			],
			[
				"R",
				"L",
				"r"
			],
			[
				"F",
				"B",
				"f"
			]
		], cubesuff],
		"444m": [[
			[
				"U",
				"D",
				"Uw"
			],
			[
				"R",
				"L",
				"Rw"
			],
			[
				"F",
				"B",
				"Fw"
			]
		], cubesuff],
		"555": [[
			[
				"U",
				"D",
				"u",
				"d"
			],
			[
				"R",
				"L",
				"r",
				"l"
			],
			[
				"F",
				"B",
				"f",
				"b"
			]
		], cubesuff],
		"555wca": [[
			[
				"U",
				"D",
				"Uw",
				"Dw"
			],
			[
				"R",
				"L",
				"Rw",
				"Lw"
			],
			[
				"F",
				"B",
				"Fw",
				"Bw"
			]
		], cubesuff],
		"666p": [[
			[
				"U",
				"D",
				"2U",
				"2D",
				"3U"
			],
			[
				"R",
				"L",
				"2R",
				"2L",
				"3R"
			],
			[
				"F",
				"B",
				"2F",
				"2B",
				"3F"
			]
		], cubesuff],
		"666wca": [[
			[
				"U",
				"D",
				"Uw",
				"Dw",
				"3Uw"
			],
			[
				"R",
				"L",
				"Rw",
				"Lw",
				"3Rw"
			],
			[
				"F",
				"B",
				"Fw",
				"Bw",
				"3Fw"
			]
		], cubesuff],
		"666s": [[
			[
				"U",
				"D",
				"U&sup2;",
				"D&sup2;",
				"U&sup3;"
			],
			[
				"R",
				"L",
				"R&sup2;",
				"L&sup2;",
				"R&sup3;"
			],
			[
				"F",
				"B",
				"F&sup2;",
				"B&sup2;",
				"F&sup3;"
			]
		], cubesuff],
		"666si": [[
			[
				"U",
				"D",
				"u",
				"d",
				"3u"
			],
			[
				"R",
				"L",
				"r",
				"l",
				"3r"
			],
			[
				"F",
				"B",
				"f",
				"b",
				"3f"
			]
		], cubesuff],
		"777p": [[
			[
				"U",
				"D",
				"2U",
				"2D",
				"3U",
				"3D"
			],
			[
				"R",
				"L",
				"2R",
				"2L",
				"3R",
				"3L"
			],
			[
				"F",
				"B",
				"2F",
				"2B",
				"3F",
				"3B"
			]
		], cubesuff],
		"777wca": [[
			[
				"U",
				"D",
				"Uw",
				"Dw",
				"3Uw",
				"3Dw"
			],
			[
				"R",
				"L",
				"Rw",
				"Lw",
				"3Rw",
				"3Lw"
			],
			[
				"F",
				"B",
				"Fw",
				"Bw",
				"3Fw",
				"3Bw"
			]
		], cubesuff],
		"777s": [[
			[
				"U",
				"D",
				"U&sup2;",
				"D&sup2;",
				"U&sup3;",
				"D&sup3;"
			],
			[
				"R",
				"L",
				"R&sup2;",
				"L&sup2;",
				"R&sup3;",
				"L&sup3;"
			],
			[
				"F",
				"B",
				"F&sup2;",
				"B&sup2;",
				"F&sup3;",
				"B&sup3;"
			]
		], cubesuff],
		"777si": [[
			[
				"U",
				"D",
				"u",
				"d",
				"3u",
				"3d"
			],
			[
				"R",
				"L",
				"r",
				"l",
				"3r",
				"3l"
			],
			[
				"F",
				"B",
				"f",
				"b",
				"3f",
				"3b"
			]
		], cubesuff],
		"crz3a": [[
			["U", "D"],
			["R", "L"],
			["F", "B"]
		], cubesuff],
		"cm3": [[[
			[
				"U<",
				"U>",
				"U2"
			],
			[
				"E<",
				"E>",
				"E2"
			],
			[
				"D<",
				"D>",
				"D2"
			]
		], [
			[
				"R^",
				"Rv",
				"R2"
			],
			[
				"M^",
				"Mv",
				"M2"
			],
			[
				"L^",
				"Lv",
				"L2"
			]
		]]],
		"cm2": [[[[
			"U<",
			"U>",
			"U2"
		], [
			"D<",
			"D>",
			"D2"
		]], [[
			"R^",
			"Rv",
			"R2"
		], [
			"L^",
			"Lv",
			"L2"
		]]]],
		"233": [[
			[[
				"U",
				"U'",
				"U2"
			]],
			["R2", "L2"],
			["F2", "B2"]
		]],
		"fto": [[
			["U", "D"],
			["F", "B"],
			["L", "BR"],
			["R", "BL"]
		], ["", "'"]],
		"gear": [[
			["U"],
			["R"],
			["F"]
		], [
			"",
			"2",
			"3",
			"4",
			"5",
			"6",
			"'",
			"2'",
			"3'",
			"4'",
			"5'"
		]],
		"sfl": [[["R", "L"], ["U", "D"]], cubesuff],
		"ufo": [[
			["A"],
			["B"],
			["C"],
			[[
				"U",
				"U'",
				"U2'",
				"U2",
				"U3"
			]]
		]],
		"RrUu": [[["U", "u"], ["R", "r"]], cubesuff],
		"minx2g": [[["U"], ["R"]], minxsuff],
		"lsll": [[
			[[
				"R U R'",
				"R U2 R'",
				"R U' R'"
			]],
			[[
				"F' U F",
				"F' U2 F",
				"F' U' F"
			]],
			[[
				"U",
				"U2",
				"U'"
			]]
		]],
		"prco": [[
			["F", "B"],
			["U", "D"],
			["L", "DBR"],
			["R", "DBL"],
			["BL", "DR"],
			["BR", "DL"]
		], minxsuff],
		"skb": [[
			["R"],
			["L"],
			["B"],
			["U"]
		], ["", "'"]],
		"ivy": [[
			["R"],
			["L"],
			["D"],
			["B"]
		], ["", "'"]],
		"112": [[["R"], ["R"]], cubesuff],
		"eide": [[
			["OMG"],
			["WOW"],
			["WTF"],
			[[
				"WOO-HOO",
				"WOO-HOO",
				"MATYAS",
				"YES",
				"YES",
				"YAY",
				"YEEEEEEEEEEEES"
			]],
			["HAHA"],
			["XD"],
			[":D"],
			["LOL"]
		], [
			"",
			"",
			"",
			"!!!"
		]]
	};
	var args2 = {
		"sia113": "#{[[\"U\",\"u\"],[\"R\",\"r\"]],%c,%l} z2 #{[[\"U\",\"u\"],[\"R\",\"r\"]],%c,%l}",
		"sia123": "#{[[\"U\"],[\"R\",\"r\"]],%c,%l} z2 #{[[\"U\"],[\"R\",\"r\"]],%c,%l}",
		"sia222": "#{[[\"U\"],[\"R\"],[\"F\"]],%c,%l} z2 y #{[[\"U\"],[\"R\"],[\"F\"]],%c,%l}",
		"335": "#{[[[\"U\",\"U'\",\"U2\"],[\"D\",\"D'\",\"D2\"]],[\"R2\",\"L2\"],[\"F2\",\"B2\"]],0,%l} / ${333}",
		"337": "#{[[[\"U\",\"U'\",\"U2\",\"u\",\"u'\",\"u2\",\"U u\",\"U u'\",\"U u2\",\"U' u\",\"U' u'\",\"U' u2\",\"U2 u\",\"U2 u'\",\"U2 u2\"],[\"D\",\"D'\",\"D2\",\"d\",\"d'\",\"d2\",\"D d\",\"D d'\",\"D d2\",\"D' d\",\"D' d'\",\"D' d2\",\"D2 d\",\"D2 d'\",\"D2 d2\"]],[\"R2\",\"L2\"],[\"F2\",\"B2\"]],0,%l} / ${333}",
		"r234": "2) ${222so}\\n3) ${333}\\n4) ${[444,40]}",
		"r2345": "${r234}\\n5) ${[\"555\",60]}",
		"r23456": "${r2345}\\n6) ${[\"666p\",80]}",
		"r234567": "${r23456}\\n7) ${[\"777p\",100]}",
		"r234w": "2) ${222so}\\n3) ${333}\\n4) ${[\"444m\",40]}",
		"r2345w": "${r234w}\\n5) ${[\"555wca\",60]}",
		"r23456w": "${r2345w}\\n6) ${[\"666wca\",80]}",
		"r234567w": "${r23456w}\\n7) ${[\"777wca\",100]}",
		"rmngf": "${r2345w}\\n3oh) ${333}\\npyr) ${[\"pyrso\",10]}\\n skb) ${skbso}\\nsq1) ${sqrs}\\nclk) ${clkwca}\\nmgm) ${[\"mgmp\",70]}",
		"333ni": "${333}#{[[\"\"]],[\"\",\"Rw \",\"Rw2 \",\"Rw' \",\"Fw \",\"Fw' \"],1}#{[[\"\"]],[\"\",\"Uw\",\"Uw2\",\"Uw'\"],1}",
		"444bld": "${444wca}#{[[\"\"]],[\"\",\" x\",\" x2\",\" x'\",\" z\",\" z'\"],1}#{[[\"\"]],[\"\",\" y\",\" y2\",\" y'\"],1}",
		"555bld": "${[\"555wca\",%l]}#{[[\"\"]],[\"\",\" 3Rw\",\" 3Rw2\",\" 3Rw'\",\" 3Fw\",\" 3Fw'\"],1}#{[[\"\"]],[\"\",\" 3Uw\",\" 3Uw2\",\" 3Uw'\"],1}"
	};
	var edges = {
		"5edge": [
			"r R b B",
			["B' b' R' r'", "B' b' R' U2 r U2 r U2 r U2 r"],
			["u", "d"]
		],
		"6edge": [
			"3r r 3b b",
			[
				"3b' b' 3r' r'",
				"3b' b' 3r' U2 r U2 r U2 r U2 r",
				"3b' b' r' U2 3r U2 3r U2 3r U2 3r",
				"3b' b' r2 U2 3r U2 3r U2 3r U2 3r U2 r"
			],
			[
				"u",
				"3u",
				"d"
			]
		],
		"7edge": [
			"3r r 3b b",
			[
				"3b' b' 3r' r'",
				"3b' b' 3r' U2 r U2 r U2 r U2 r",
				"3b' b' r' U2 3r U2 3r U2 3r U2 3r",
				"3b' b' r2 U2 3r U2 3r U2 3r U2 3r U2 r"
			],
			[
				"u",
				"3u",
				"3d",
				"d"
			]
		]
	};
	function megascramble(type, length) {
		var value = args[type];
		switch (value.length) {
			case 1: return mega(value[0], [""], length);
			case 2: return mega(value[0], value[1], length);
			case 3: return mega(value[0], value[1], value[2]);
		}
	}
	function edgescramble(type, length) {
		var value = edges[type];
		return edge(value[0], value[1], value[2], length);
	}
	function formatScramble(type, length) {
		var value = args2[type].replace(/%l/g, length).replace(/%c/g, "[\"\",\"2\",\"'\"]");
		return scrMgr.formatScramble(value);
	}
	for (var i in args) scrMgr.reg(i, megascramble);
	for (var i in args2) scrMgr.reg(i, formatScramble);
	for (var i in edges) scrMgr.reg(i, edgescramble);
	function cubeNNN(type, len) {
		var size = len;
		if (size <= 1) return "N/A";
		var data = [
			[],
			[],
			[]
		];
		for (var i = 0; i < len - 1; i++) if (i % 2 == 0) {
			data[0].push((i < 4 ? "" : ~~(i / 2 + 1)) + (i < 2 ? "U" : "u"));
			data[1].push((i < 4 ? "" : ~~(i / 2 + 1)) + (i < 2 ? "R" : "r"));
			data[2].push((i < 4 ? "" : ~~(i / 2 + 1)) + (i < 2 ? "F" : "f"));
		} else {
			data[0].push((i < 4 ? "" : ~~(i / 2 + 1)) + (i < 2 ? "D" : "d"));
			data[1].push((i < 4 ? "" : ~~(i / 2 + 1)) + (i < 2 ? "L" : "l"));
			data[2].push((i < 4 ? "" : ~~(i / 2 + 1)) + (i < 2 ? "B" : "b"));
		}
		return mega(data, cubesuff, size * 10);
	}
	scrMgr.reg("cubennn", cubeNNN);
	function edge(start, end, moves, len) {
		var u = 0, d = 0, movemis = [];
		var triggers = [
			["R", "R'"],
			["R'", "R"],
			["L", "L'"],
			["L'", "L"],
			["F'", "F"],
			["F", "F'"],
			["B", "B'"],
			["B'", "B"]
		];
		var ud = ["U", "D"];
		var scramble = start;
		for (var i = 0; i < moves.length; i++) movemis[i] = 0;
		for (var i = 0; i < len; i++) {
			var done = false;
			while (!done) {
				var v = "";
				for (var j = 0; j < moves.length; j++) {
					var x = rn(4);
					movemis[j] += x;
					if (x != 0) {
						done = true;
						v += " " + moves[j] + cubesuff[x - 1];
					}
				}
			}
			var trigger = rn(8);
			var layer = rn(2);
			var turn = rn(3);
			scramble += v + " " + triggers[trigger][0] + " " + ud[layer] + cubesuff[turn] + " " + triggers[trigger][1];
			if (layer == 0) u += turn + 1;
			if (layer == 1) d += turn + 1;
		}
		for (var i = 0; i < moves.length; i++) {
			var x = 4 - movemis[i] % 4;
			if (x < 4) scramble += " " + moves[i] + cubesuff[x - 1];
		}
		u = 4 - u % 4;
		d = 4 - d % 4;
		if (u < 4) scramble += " U" + cubesuff[u - 1];
		if (d < 4) scramble += " D" + cubesuff[d - 1];
		scramble += " " + rndEl(end);
		return scramble;
	}
})(scrMgr.mega, mathlib.rn, mathlib.rndEl);
//#endregion
//#region src/vendor/cstimer/utilscramble.js
var SCRAMBLE_NOOBST = [
	["turn the top face", "turn the bottom face"],
	["turn the right face", "turn the left face"],
	["turn the front face", "turn the back face"]
];
var SCRAMBLE_NOOBSS = " clockwise by 90 degrees,| counterclockwise by 90 degrees,| by 180 degrees,";
(function(rn, rndEl, mega) {
	var cubesuff = [
		"",
		"2",
		"'"
	];
	var minxsuff = [
		"",
		"2",
		"'",
		"2'"
	];
	var seq = [];
	var p = [];
	function adjScramble(faces, adj, len, suffixes, probs) {
		suffixes = suffixes || [""];
		var used = 0;
		var face;
		var ret = [];
		for (var j = 0; j < len; j++) {
			do
				face = probs ? mathlib.rndProb(probs) : rn(faces.length);
			while (used >> face & 1);
			ret.push(faces[face] + rndEl(suffixes));
			used &= ~adj[face];
			used |= 1 << face;
		}
		return ret.join(" ");
	}
	function yj4x4(type, len) {
		var turns = [
			["U", "D"],
			[
				"R",
				"L",
				"r"
			],
			[
				"F",
				"B",
				"f"
			]
		];
		var donemoves = [];
		var lastaxis;
		var fpos = 0;
		var j, k;
		var s = "";
		lastaxis = -1;
		for (j = 0; j < len; j++) {
			var done = 0;
			do {
				var first = rn(turns.length);
				var second = rn(turns[first].length);
				if (first != lastaxis || donemoves[second] == 0) {
					if (first == lastaxis) {
						donemoves[second] = 1;
						var rs = rn(cubesuff.length);
						if (first == 0 && second == 0) fpos = (fpos + 4 + rs) % 4;
						if (first == 1 && second == 2) {
							if (fpos == 0 || fpos == 3) s += "l" + cubesuff[rs] + " ";
							else s += "r" + cubesuff[rs] + " ";
						} else if (first == 2 && second == 2) {
							if (fpos == 0 || fpos == 1) s += "b" + cubesuff[rs] + " ";
							else s += "f" + cubesuff[rs] + " ";
						} else s += turns[first][second] + cubesuff[rs] + " ";
					} else {
						for (k = 0; k < turns[first].length; k++) donemoves[k] = 0;
						lastaxis = first;
						donemoves[second] = 1;
						var rs = rn(cubesuff.length);
						if (first == 0 && second == 0) fpos = (fpos + 4 + rs) % 4;
						if (first == 1 && second == 2) {
							if (fpos == 0 || fpos == 3) s += "l" + cubesuff[rs] + " ";
							else s += "r" + cubesuff[rs] + " ";
						} else if (first == 2 && second == 2) {
							if (fpos == 0 || fpos == 1) s += "b" + cubesuff[rs] + " ";
							else s += "f" + cubesuff[rs] + " ";
						} else s += turns[first][second] + cubesuff[rs] + " ";
					}
					done = 1;
				}
			} while (done == 0);
		}
		return s;
	}
	scrMgr.reg("444yj", yj4x4);
	function bicube(type, len) {
		function canMove(face) {
			var u = [], i, j, done, z = 0;
			for (i = 0; i < 9; i++) {
				done = 0;
				for (j = 0; j < u.length; j++) if (u[j] == start[d[face][i]]) done = 1;
				if (done == 0) {
					u[u.length] = start[d[face][i]];
					if (start[d[face][i]] == 0) z = 1;
				}
			}
			return u.length == 5 && z == 1;
		}
		function doMove(face, amount) {
			for (var i = 0; i < amount; i++) {
				var t = start[d[face][0]];
				start[d[face][0]] = start[d[face][6]];
				start[d[face][6]] = start[d[face][4]];
				start[d[face][4]] = start[d[face][2]];
				start[d[face][2]] = t;
				t = start[d[face][7]];
				start[d[face][7]] = start[d[face][5]];
				start[d[face][5]] = start[d[face][3]];
				start[d[face][3]] = start[d[face][1]];
				start[d[face][1]] = t;
			}
		}
		var d = [
			[
				0,
				1,
				2,
				5,
				8,
				7,
				6,
				3,
				4
			],
			[
				6,
				7,
				8,
				13,
				20,
				19,
				18,
				11,
				12
			],
			[
				0,
				3,
				6,
				11,
				18,
				17,
				16,
				9,
				10
			],
			[
				8,
				5,
				2,
				15,
				22,
				21,
				20,
				13,
				14
			]
		];
		var start = [
			1,
			1,
			2,
			3,
			3,
			2,
			4,
			4,
			0,
			5,
			6,
			7,
			8,
			9,
			10,
			10,
			5,
			6,
			7,
			8,
			9,
			11,
			11
		], move = "UFLR", s = "", arr = [], poss, done, i, j, x, y;
		while (arr.length < len) {
			poss = [
				1,
				1,
				1,
				1
			];
			for (j = 0; j < 4; j++) if (poss[j] == 1 && !canMove(j)) poss[j] = 0;
			done = 0;
			while (done == 0) {
				x = rn(4);
				if (poss[x] == 1) {
					y = rn(3) + 1;
					doMove(x, y);
					done = 1;
				}
			}
			arr[arr.length] = [x, y];
			if (arr.length >= 2) {
				if (arr.at(-1)[0] == arr.at(-2)[0]) {
					arr.at(-2)[1] = (arr.at(-2)[1] + arr.at(-1)[1]) % 4;
					arr = arr.slice(0, arr.length - 1);
				}
			}
			if (arr.length >= 1) {
				if (arr.at(-1)[1] == 0) arr = arr.slice(0, arr.length - 1);
			}
		}
		for (i = 0; i < len; i++) s += move[arr[i][0]] + cubesuff[arr[i][1] - 1] + " ";
		return s;
	}
	scrMgr.reg("bic", bicube);
	function c(s) {
		return " " + rndEl([
			s + "=0",
			s + "+1",
			s + "+2",
			s + "+3",
			s + "+4",
			s + "+5",
			s + "+6",
			s + "-5",
			s + "-4",
			s + "-3",
			s + "-2",
			s + "-1"
		]) + " ";
	}
	function c2() {
		return rndEl(["U", "d"]) + rndEl(["U", "d"]);
	}
	function c3() {
		return "     ";
	}
	function do15puzzle(mirrored, len, arrow, tiny) {
		var effect = [
			[0, -1],
			[1, 0],
			[-1, 0],
			[0, 1]
		];
		var x = 0, y = 3, r, lastr = 5, ret = [];
		for (var i = 0; i < len; i++) {
			do
				r = rn(4);
			while (x + effect[r][0] < 0 || x + effect[r][0] > 3 || y + effect[r][1] < 0 || y + effect[r][1] > 3 || r + lastr == 3);
			x += effect[r][0];
			y += effect[r][1];
			if (ret.length > 0 && ret.at(-1)[0] == r) ret.at(-1)[1]++;
			else ret.push([r, 1]);
			lastr = r;
		}
		var retstr = "";
		for (var i = 0; i < ret.length; i++) {
			var m = mirrored ? ret[i][0] : 3 - ret[i][0];
			m = (arrow ? "￪￩￫￬" : "ULRD").charAt(m);
			if (tiny) retstr += m + (ret[i][1] == 1 ? "" : ret[i][1]) + " ";
			else for (var j = 0; j < ret[i][1]; j++) retstr += m + " ";
		}
		return retstr;
	}
	function pochscramble(x, y) {
		var ret = "";
		var i = 0, j;
		for (; i < y; i++) {
			ret += "  ";
			for (j = 0; j < x; j++) ret += (j % 2 == 0 ? "R" : "D") + rndEl(["++", "--"]) + " ";
			ret += "U" + (ret.endsWith("-- ") ? "'\\n" : "~\\n");
		}
		return ret;
	}
	function carrotscramble(x, y) {
		var ret = "";
		var i = 0, j;
		for (; i < y; i++) {
			ret += " ";
			for (j = 0; j < x / 2; j++) ret += rndEl(["+", "-"]) + rndEl(["+", "-"]) + " ";
			ret += "U" + (ret.endsWith("- ") ? "'\\n" : "~\\n");
		}
		return ret;
	}
	function gigascramble(len) {
		var ret = "";
		var i = 0, j;
		for (; i < Math.ceil(len / 10); i++) {
			ret += "  ";
			for (j = 0; j < 10; j++) ret += (j % 2 == 0 ? "Rr".charAt(rn(2)) : "Dd".charAt(rn(2))) + rndEl([
				"+ ",
				"++",
				"- ",
				"--"
			]) + " ";
			ret += "y" + rndEl(minxsuff).padEnd(2, "~") + "\\n";
		}
		return ret;
	}
	function sq1_scramble(type, len) {
		seq = [];
		var i, k;
		sq1_getseq(1, type, len);
		var s = "";
		for (i = 0; i < seq[0].length; i++) {
			k = seq[0][i];
			if (k[0] == 7) s += "/";
			else s += " (" + k[0] + "," + k[1] + ")";
		}
		return s;
	}
	function ssq1t_scramble(len) {
		seq = [];
		var i;
		sq1_getseq(2, 0, len);
		var s = seq[0], t = seq[1], u = "";
		if (s[0][0] == 7) s = [[0, 0]].concat(s);
		if (t[0][0] == 7) t = [[0, 0]].concat(t);
		for (i = 0; i < len; i++) u += "(" + s[2 * i][0] + "," + t[2 * i][0] + "," + t[2 * i][1] + "," + s[2 * i][1] + ")/ ";
		return u;
	}
	function sq1_getseq(num, type, len) {
		for (var n = 0; n < num; n++) {
			p = [
				1,
				0,
				0,
				1,
				0,
				0,
				1,
				0,
				0,
				1,
				0,
				0,
				0,
				1,
				0,
				0,
				1,
				0,
				0,
				1,
				0,
				0,
				1,
				0
			];
			seq[n] = [];
			var cnt = 0;
			while (cnt < len) {
				var x = rn(12) - 5;
				var y = type == 2 ? 0 : rn(12) - 5;
				var size = (x == 0 ? 0 : 1) + (y == 0 ? 0 : 1);
				if ((cnt + size <= len || type != 1) && (size > 0 || cnt == 0)) {
					if (sq1_domove(x, y)) {
						if (type == 1) cnt += size;
						if (size > 0) seq[n][seq[n].length] = [x, y];
						if (cnt < len || type != 1) {
							cnt++;
							seq[n][seq[n].length] = [7, 0];
							sq1_domove(7, 0);
						}
					}
				}
			}
		}
	}
	function sq1_domove(x, y) {
		var i, px, py;
		if (x == 7) {
			for (i = 0; i < 6; i++) mathlib.circle(p, i + 6, i + 12);
			return true;
		} else if (p[(17 - x) % 12] || p[(11 - x) % 12] || p[12 + (17 - y) % 12] || p[12 + (11 - y) % 12]) return false;
		else {
			px = p.slice(0, 12);
			py = p.slice(12, 24);
			for (i = 0; i < 12; i++) {
				p[i] = px[(12 + i - x) % 12];
				p[i + 12] = py[(12 + i - y) % 12];
			}
			return true;
		}
	}
	function moyuRedi(length) {
		var ret = [];
		for (var i = 0; i < length; i++) ret.push(mega([["R"], ["L"]], ["", "'"], 3 + rn(3)));
		return ret.join(" x ");
	}
	function addPyrTips(scramble, moveLen) {
		var cnt = 0;
		var rnd = [];
		for (var i = 0; i < 4; i++) {
			rnd[i] = rn(3);
			if (rnd[i] > 0) {
				rnd[i] = "ulrb".charAt(i) + ["! ", "' "][rnd[i] - 1];
				cnt++;
			} else rnd[i] = "";
		}
		return scramble.substr(0, scramble.length - moveLen * cnt) + " " + rnd.join("");
	}
	function PolyScrambler(puzzle, validMoves, move2str) {
		var pobj = poly3d.getFamousPuzzle(puzzle);
		puzzle = poly3d.makePuzzle.apply(poly3d, pobj.polyParam);
		var permLen = puzzle.moveTable[0].length;
		var e = [];
		for (var i = 0; i < permLen; i++) e[i] = i;
		var gens = [];
		for (var i = 0; i < validMoves.length; i++) {
			var move = pobj.parser.parseScramble(validMoves[i]);
			var perm = e.slice();
			for (var j = 0; j < move.length; j++) {
				var pow = move[j][1];
				if (pow == 0) continue;
				var operm = puzzle.moveTable[puzzle.getTwistyIdx(move[j][0])].slice();
				for (var k = 0; k < operm.length; k++) operm[k] = operm[k] >= 0 ? operm[k] : k;
				if (pow < 0) {
					operm = grouplib.permInv(operm);
					pow = -pow;
				}
				while (--pow >= 0) perm = grouplib.permMult(perm, operm);
			}
			gens.push(perm);
		}
		this.solv = new grouplib.SubgroupSolver(gens);
		this.move2str = move2str;
		this.moves = validMoves;
		this.solv.initTables();
	}
	PolyScrambler.prototype.getScramble = function(minLen, maxLen) {
		var solution = "";
		do {
			var state = this.solv.sgsG.rndElem();
			solution = (this.solv.DissectionSolve(state, minLen, maxLen) || []).map((mvpow) => this.move2str(this.moves[mvpow[0]], mvpow[1])).join(" ");
		} while (solution.length <= 2);
		return solution.replace(/ +/g, " ");
	};
	var polyObjs = {};
	function getPolyScrambler(puzzle, validMoves, move2str) {
		var key = JSON.stringify([puzzle, validMoves]);
		if (!(key in polyObjs)) polyObjs[key] = new PolyScrambler(puzzle, validMoves, move2str);
		return polyObjs[key];
	}
	function utilscramble(type, len) {
		var ret = "";
		switch (type) {
			case "15p": return do15puzzle(false, len);
			case "15pm": return do15puzzle(true, len);
			case "15pat": return do15puzzle(false, len, true, true);
			case "clkwca":
			case "clkwcab":
			case "clknf":
				var clkapp = [
					"0+",
					"1+",
					"2+",
					"3+",
					"4+",
					"5+",
					"6+",
					"1-",
					"2-",
					"3-",
					"4-",
					"5-"
				];
				ret = type == "clknf" ? "UR? DR? DL? UL? U(?,?) R(?,?) D(?,?) L(?,?) ALL? all?????" : "UR? DR? DL? UL? U? R? D? L? ALL? y2 U? R? D? L? ALL?????";
				for (var i = 0; i < 14; i++) ret = ret.replace("?", rndEl(clkapp));
				if (type == "clkwca") ret = ret.slice(0, -4);
				return ret.replace("?", rndEl(["", " UR"])).replace("?", rndEl(["", " DR"])).replace("?", rndEl(["", " DL"])).replace("?", rndEl(["", " UL"]));
			case "clk": return "UU" + c("u") + "dU" + c("u") + "dd" + c("u") + "Ud" + c("u") + "dU" + c("u") + "Ud" + c("u") + "UU" + c("u") + "UU" + c("u") + "UU" + c("u") + "dd" + c3() + c2() + "\\ndd" + c("d") + "dU" + c("d") + "UU" + c("d") + "Ud" + c("d") + "UU" + c3() + "UU" + c3() + "Ud" + c3() + "dU" + c3() + "UU" + c3() + "dd" + c("d") + c2();
			case "clkc":
				ret = "";
				for (var i = 0; i < 4; i++) ret += "(" + (rn(12) - 5) + ", " + (rn(12) - 5) + ") / ";
				for (var i = 0; i < 6; i++) ret += "(" + (rn(12) - 5) + ") / ";
				for (var i = 0; i < 4; i++) ret += rndEl(["d", "U"]);
				return ret;
			case "clke": return "UU" + c("u") + "dU" + c("u") + "dU" + c("u") + "UU" + c("u") + "UU" + c("u") + "UU" + c("u") + "Ud" + c("u") + "Ud" + c("u") + "dd" + c("u") + "dd" + c3() + c2() + "\\nUU" + c3() + "UU" + c3() + "dU" + c("d") + "dU" + c3() + "dd" + c("d") + "Ud" + c3() + "Ud" + c("d") + "UU" + c3() + "UU" + c("d") + "dd" + c("d") + c2();
			case "giga": return gigascramble(len);
			case "mgmo": return adjScramble([
				"F",
				"B",
				"U",
				"D",
				"L",
				"DBR",
				"DL",
				"BR",
				"DR",
				"BL",
				"R",
				"DBL"
			], [
				1364,
				2728,
				1681,
				2402,
				2629,
				1418,
				2329,
				1574,
				1129,
				2198,
				421,
				602
			], len, minxsuff);
			case "mgms2l": return adjScramble([
				"F",
				"R",
				"BR",
				"BL",
				"L",
				"U"
			], [
				50,
				37,
				42,
				52,
				41,
				31
			], len, minxsuff);
			case "mgmp": return pochscramble(10, Math.ceil(len / 10));
			case "mgmc": return carrotscramble(10, Math.ceil(len / 10));
			case "klmp": return pochscramble(10, Math.ceil(len / 10));
			case "heli":
			case "helicv": return adjScramble([
				"UF",
				"UR",
				"UB",
				"UL",
				"FR",
				"BR",
				"BL",
				"FL",
				"DF",
				"DR",
				"DB",
				"DL"
			], [
				154,
				53,
				106,
				197,
				771,
				1542,
				3084,
				2313,
				2704,
				1328,
				2656,
				1472
			], len);
			case "heli2x2":
				ret = adjScramble([
					"UR",
					"UF",
					"UL",
					"UB",
					"DR",
					"DF",
					"DL",
					"DB",
					"FR",
					"FL",
					"BL",
					"BR",
					"UFR",
					"UFL",
					"UBL",
					"UBR",
					"DFR",
					"DFL",
					"DBL",
					"DBR",
					"U",
					"R",
					"F"
				], [
					40931328,
					24129536,
					55599104,
					53526528,
					48824320,
					31653888,
					63307776,
					61603840,
					15798272,
					30547968,
					60047360,
					45645824,
					7340291,
					22020614,
					51381260,
					36702217,
					14680368,
					29360736,
					58721472,
					44042384,
					56688399,
					47815099,
					28521335,
					57610224,
					47605486,
					29150429
				], len, null, [
					1,
					1,
					1,
					1,
					1,
					1,
					1,
					1,
					1,
					1,
					1,
					1,
					1,
					1,
					1,
					1,
					1,
					1,
					1,
					1,
					3,
					3,
					3
				]).split(" ");
				for (var i = 0; i < ret.length; i++) if (ret[i].length == 3) ret[i] += mathlib.rndEl(["", "'"]);
				else if (ret[i].length == 1) ret[i] += mathlib.rndEl([
					"",
					"'",
					"2"
				]);
				return ret.join(" ");
			case "heli2x2g":
				var lastMove = -1;
				ret = [];
				var cornMoves = [
					"UFR",
					"UFL",
					"UBL",
					"UBR",
					"DFR",
					"DFL",
					"DBL",
					"DBR"
				];
				var edgeMoves = [
					"UF",
					"UL",
					"UB",
					"UR",
					"FR",
					"FL",
					"BL",
					"BR",
					"DF",
					"DL",
					"DB",
					"DR"
				];
				var maxWidth = 0;
				for (var i = 0; i < len; i++) {
					var facePerm;
					do
						facePerm = mathlib.rndPerm(3);
					while (facePerm[0] == lastMove);
					lastMove = facePerm[2];
					var cornPerm = mathlib.rndPerm(8).slice(0, 4).sort();
					var edgePerm = mathlib.rndPerm(12).slice(0, mathlib.rn(2) + 6).sort(function(a, b) {
						return a - b;
					});
					var line = [];
					for (var j = 0; j < 3; j++) line.push("URF".charAt(facePerm[j]) + mathlib.rndEl([
						" ",
						"2",
						"'"
					]));
					line.push("");
					for (var j = 0; j < cornPerm.length; j++) line.push(cornMoves[cornPerm[j]] + mathlib.rndEl([" ", "'"]));
					line.push("");
					for (var j = 0; j < edgePerm.length; j++) line.push(edgeMoves[edgePerm[j]]);
					ret[i] = line.join(" ");
					maxWidth = Math.max(maxWidth, ret[i].length);
				}
				for (var i = 0; i < ret.length; i++) ret[i] = ret[i].padEnd(maxWidth, "~");
				return ret.join("\\n");
			case "redi": return adjScramble([
				"L",
				"R",
				"F",
				"B",
				"l",
				"r",
				"f",
				"b"
			], [
				28,
				44,
				67,
				131,
				193,
				194,
				52,
				56
			], len, ["", "'"]);
			case "redim": return moyuRedi(len);
			case "dmdso": return getPolyScrambler("dmd", [
				"U",
				"R",
				"L",
				"F"
			], (mv, pow) => mv + ["", "'"][pow - 1]).getScramble(7, 10);
			case "pyrm":
				ret = mega([
					["U"],
					["L"],
					["R"],
					["B"]
				], ["!", "'"], len);
				return addPyrTips(ret, 3).replace(/!/g, "");
			case "prcp": return pochscramble(10, Math.ceil(len / 10));
			case "mpyr":
				ret = adjScramble([
					"U!",
					"L!",
					"R!",
					"B!",
					"Uw",
					"Lw",
					"Rw",
					"Bw"
				], [
					224,
					208,
					176,
					112,
					238,
					221,
					187,
					119
				], len, ["!", "'"]);
				return addPyrTips(ret, 4).replace(/!/g, "");
			case "r3":
				for (var i = 0; i < len; i++) ret += (i == 0 ? "" : "\\n") + (i + 1) + ") ${333}";
				return scrMgr.formatScramble(ret);
			case "r3ni":
				for (var i = 0; i < len; i++) ret += (i == 0 ? "" : "\\n") + (i + 1) + ") ${333ni}";
				return scrMgr.formatScramble(ret);
			case "sq1h": return sq1_scramble(1, len);
			case "sq1t": return sq1_scramble(0, len);
			case "sq2":
				var i = 0;
				while (i < len) {
					var rndu = rn(12) - 5;
					var rndd = rn(12) - 5;
					if (rndu != 0 || rndd != 0) {
						i++;
						ret += "(" + rndu + "," + rndd + ")/ ";
					}
				}
				return ret;
			case "ssq1t": return ssq1t_scramble(len);
			case "bsq": return sq1_scramble(2, len);
			case "ctico": return adjScramble([
				"UL",
				"UR",
				"UrUl",
				"FlFr",
				"LBl",
				"RBr"
			], [
				63,
				63,
				63,
				63,
				63,
				63
			], len, minxsuff);
			case "-1":
				for (var i = 0; i < len; i++) ret += String.fromCharCode(32 + rn(224));
				ret += "Error: subscript out of range";
				return ret;
			case "333noob":
				ret = mega(SCRAMBLE_NOOBST, SCRAMBLE_NOOBSS.split("|"), len).replace(/t/, "T");
				return ret.substr(0, ret.length - 2) + ".";
			case "lol":
				ret = mega([["L"], ["O"]], 0, len);
				return ret.replace(/ /g, "");
		}
		console.log("Error");
	}
	scrMgr.reg([
		"15p",
		"15pm",
		"15pat",
		"clkwca",
		"clkwcab",
		"clknf",
		"clk",
		"clkc",
		"clke",
		"giga",
		"mgmo",
		"mgmp",
		"mgmc",
		"mgms2l",
		"klmp",
		"heli",
		"helicv",
		"heli2x2",
		"heli2x2g",
		"redi",
		"redim",
		"pyrm",
		"prcp",
		"mpyr",
		"r3",
		"r3ni",
		"sq1h",
		"sq1t",
		"sq2",
		"ssq1t",
		"bsq",
		"ctico",
		"dmdso",
		"-1",
		"333noob",
		"lol"
	], utilscramble);
})(mathlib.rn, mathlib.rndEl, scrMgr.mega);
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
//#region src/vendor/cstimer/333lse.js
(function() {
	var edgePerms = [[
		0,
		1,
		2,
		3
	], [
		0,
		2,
		5,
		4
	]];
	var edgeOris = [[
		0,
		0,
		0,
		0,
		2
	], [
		0,
		1,
		0,
		1,
		2
	]];
	function doPermMove(idx, m) {
		var edge = idx >> 3;
		var corn = idx;
		var cent = idx << 1 | mathlib.getNParity(edge, 6) ^ corn >> 1 & 1;
		var g = mathlib.setNPerm([], edge, 6);
		mathlib.acycle(g, edgePerms[m]);
		if (m == 0) corn = corn + 2;
		if (m == 1) cent = cent + 1;
		return mathlib.getNPerm(g, 6) << 3 | corn & 6 | cent >> 1 & 1;
	}
	function doOriMove(arr, m) {
		mathlib.acycle(arr, edgePerms[m], 1, edgeOris[m]);
	}
	var solv = new mathlib.Solver(2, 3, [[
		0,
		doPermMove,
		5760
	], [
		0,
		[
			doOriMove,
			"o",
			6,
			-2
		],
		32
	]]);
	function generateScramble() {
		var b, c;
		do {
			c = mathlib.rn(5760);
			b = mathlib.rn(32);
		} while (b + c == 0);
		return solv.toStr(solv.search([c, b], 0), "UM", " 2'").replace(/ +/g, " ");
	}
	scrMgr.reg("lsemu", generateScramble);
})();
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
//#region src/events/333/state.ts
/** Move indices for `rndApp` / `rndPre`, as used by csTimer (face * 3 + power). */
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
/**
* Scramble to a random state where the pieces in the masks are fixed, e.g.
* `getAnyScramble({ cp: 0x76543210, co: 0 })` for edges only. Unset masks are random.
*/
function getAnyScramble(options = {}) {
	return cleanScramble(scramble_333$1.getAnyScramble(options.ep ?? 0xffffffffffff, options.eo ?? 0xffffffffffff, options.cp ?? 4294967295, options.co ?? 4294967295, options.neut, options.rndApp, options.rndPre, options.firstAxisFilter, options.lastAxisFilter));
}
//#endregion
//#region src/events/333/index.ts
/** WCA 3x3: random-state scramble. */
function get333Scramble() {
	return cstimerScramble("333");
}
/** WCA one-handed: the same random-state scramble as 3x3. */
function get333OhScramble() {
	return cstimerScramble("333oh");
}
/** WCA FMC: random state, wrapped in R' U' F so it cannot start or end with trivial cancellations. */
function get333FmcScramble() {
	return cstimerScramble("333fm");
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
	return cstimerScramble("edges");
}
/** Only corners scrambled; edges solved. */
function get333CornersScramble() {
	return cstimerScramble("corners");
}
/** Last layer: first two layers solved, U layer random. */
function get333LLScramble() {
	return cstimerScramble("ll");
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
(function(Cnk, circle) {
	var PHASE1_SOLS = 1e4;
	var PHASE2_ATTS = 500;
	var PHASE2_SOLS = 100;
	var MAX_SEARCH_DEPTH = 60;
	function createArray(length1, length2) {
		var result = new Array(length1), i;
		if (length2 != void 0) for (i = 0; i < length1; i++) result[i] = new Array(length2);
		return result;
	}
	var _;
	function defineClass() {
		_ = arguments[0].prototype;
		for (var i = 1; i < arguments.length; ++i) arguments[i].prototype = _;
	}
	function nullMethod() {}
	function $clinit_Center1() {
		$clinit_Center1 = nullMethod;
		Center1SymMove = createArray(15582, 36);
		Center1Sym2Raw = createArray(15582);
		Center1SymPrun = createArray(15582);
		SymMult = createArray(48, 48);
		SymMove = createArray(48, 36);
		SymInv = createArray(48);
		finish_0 = createArray(48);
	}
	function $equals(obj, c) {
		for (var i = 0; i < 24; ++i) if (obj.ct[i] != c.ct[i]) return false;
		return true;
	}
	function $get_1(obj) {
		var idx = 0;
		var r = 8;
		for (var i = 23; i >= 0; --i) obj.ct[i] == 1 && (idx += Cnk[i][r--]);
		return idx;
	}
	function getCenter1RotThres(obj, rotPerm, thres) {
		var idx = 0;
		var r = 8;
		for (var i = 23; i >= 0; --i) {
			obj.ct[rotPerm[i]] == 1 && (idx += Cnk[i][r--]);
			if (idx >= thres) return -1;
		}
		return idx;
	}
	function $getsym(obj) {
		var cord, j;
		var ret = 0;
		if (Center1Raw2Sym != null) for (var s = 0; s < 48; s++) {
			var idx = getCenter1RotThres(obj, Center1RotPerm[s], mathlib.Cnk[21][8]);
			if (idx != -1) {
				ret = Center1Raw2Sym[idx];
				return ret & -64 | SymMult[s][ret & 63];
			}
		}
		for (j = 0; j < 48; ++j) {
			cord = raw2sym_0($get_1(obj));
			if (cord != -1) return cord * 64 + j;
			$rot(obj, 0);
			j % 2 == 1 && $rot(obj, 1);
			j % 8 == 7 && $rot(obj, 2);
			j % 16 == 15 && $rot(obj, 3);
		}
	}
	function doMoveCenter1(obj, m_0) {
		doMoveCenterCube(obj, m_0);
	}
	function $rot(obj, r) {
		switch (r) {
			case 0:
				doMoveCenter1(obj, 19);
				doMoveCenter1(obj, 28);
				break;
			case 1:
				doMoveCenter1(obj, 21);
				doMoveCenter1(obj, 32);
				break;
			case 2:
				swap(obj.ct, 0, 3, 1, 2, 1);
				swap(obj.ct, 8, 11, 9, 10, 1);
				swap(obj.ct, 4, 7, 5, 6, 1);
				swap(obj.ct, 12, 15, 13, 14, 1);
				swap(obj.ct, 16, 19, 21, 22, 1);
				swap(obj.ct, 17, 18, 20, 23, 1);
				break;
			case 3:
				doMoveCenter1(obj, 18);
				doMoveCenter1(obj, 29);
				doMoveCenter1(obj, 24);
				doMoveCenter1(obj, 35);
		}
	}
	function Center1Rotate(obj, r) {
		var j = 0;
		for (; j < r; ++j) {
			$rot(obj, 0);
			j % 2 == 1 && $rot(obj, 1);
			j % 8 == 7 && $rot(obj, 2);
			j % 16 == 15 && $rot(obj, 3);
		}
	}
	function $set_0(obj, idx) {
		var i, r = 8;
		for (i = 23; i >= 0; --i) {
			obj.ct[i] = 0;
			if (idx >= Cnk[i][r]) {
				idx -= Cnk[i][r--];
				obj.ct[i] = 1;
			}
		}
	}
	function $set_1(obj, c) {
		var i = 0;
		for (; i < 24; ++i) obj.ct[i] = c.ct[i];
	}
	function Center1(cc) {
		if (cc) {
			this.ct = cc.ct.slice();
			return;
		}
		this.ct = [];
		for (var i = 0; i < 24; ++i) this.ct[i] = i < 8 ? 1 : 0;
	}
	Center1.prototype.fromCube = function(cc, urf) {
		for (var i = 0; i < 24; ++i) this.ct[i] = cc.ct[i] % 3 == urf ? 1 : 0;
		return this;
	};
	function initCenter1MoveTable() {
		var c = new Center1();
		var d = new Center1();
		for (var i = 0; i < 15582; ++i) {
			$set_0(d, Center1Sym2Raw[i]);
			for (var m = 0; m < 36; ++m) {
				if (m % 3 == 1 || Center1SymMove[i][m] !== void 0) continue;
				$set_1(c, d);
				doMoveCenter1(c, m);
				var idx = $getsym(c);
				Center1SymMove[i][m] = idx;
				var invM = SymMove[idx & 63][~~(m / 3) * 3 + 2 - m % 3];
				if (Center1SymMove[idx >> 6][invM] === void 0) Center1SymMove[idx >> 6][invM] = i << 6 | SymInv[idx & 63];
			}
		}
		for (var i = 0; i < 15582; i++) for (var m = 0; m < 36; m += 3) {
			var idx = Center1SymMove[i][m];
			var nextM = SymMove[idx & 63][m];
			var nextIdx = Center1SymMove[idx >>> 6][nextM];
			var symx = SymMult[idx & 63][nextIdx & 63];
			Center1SymMove[i][m + 1] = nextIdx & -64 | symx;
		}
	}
	function initCenter1Prun() {
		var check, depth, done, i, idx, inv, m_0, select;
		fill_0(Center1SymPrun);
		Center1SymPrun[0] = 0;
		depth = 0;
		done = 1;
		while (done != 15582) {
			inv = depth > 4;
			select = inv ? -1 : depth;
			check = inv ? depth : -1;
			++depth;
			for (i = 0; i < 15582; ++i) {
				if (Center1SymPrun[i] != select) continue;
				for (m_0 = 0; m_0 < 27; ++m_0) {
					idx = Center1SymMove[i][m_0] >>> 6;
					if (Center1SymPrun[idx] != check) continue;
					++done;
					if (inv) {
						Center1SymPrun[i] = depth;
						break;
					} else Center1SymPrun[idx] = depth;
				}
			}
		}
	}
	function getSolvedSym(cube) {
		var c = new Center1(cube), check, i, j = 0;
		for (; j < 48; ++j) {
			check = true;
			for (i = 0; i < 24; ++i) if (c.ct[i] != centerFacelet[i] >> 4) {
				check = false;
				break;
			}
			if (check) return j;
			$rot(c, 0);
			j % 2 == 1 && $rot(c, 1);
			j % 8 == 7 && $rot(c, 2);
			j % 16 == 15 && $rot(c, 3);
		}
		return -1;
	}
	function initSymMeta() {
		var c = new Center1(), d, e, f, i = 0, j, k_0;
		for (; i < 24; ++i) c.ct[i] = i;
		d = new Center1(c);
		e = new Center1(c);
		f = new Center1(c);
		for (i = 0; i < 48; ++i) {
			for (j = 0; j < 48; ++j) {
				for (k_0 = 0; k_0 < 48; ++k_0) {
					if ($equals(c, d)) {
						SymMult[i][j] = k_0;
						k_0 == 0 && (SymInv[i] = j);
					}
					$rot(d, 0);
					k_0 % 2 == 1 && $rot(d, 1);
					k_0 % 8 == 7 && $rot(d, 2);
					k_0 % 16 == 15 && $rot(d, 3);
				}
				$rot(c, 0);
				j % 2 == 1 && $rot(c, 1);
				j % 8 == 7 && $rot(c, 2);
				j % 16 == 15 && $rot(c, 3);
			}
			$rot(c, 0);
			i % 2 == 1 && $rot(c, 1);
			i % 8 == 7 && $rot(c, 2);
			i % 16 == 15 && $rot(c, 3);
		}
		for (i = 0; i < 48; ++i) {
			$set_1(c, e);
			Center1Rotate(c, SymInv[i]);
			for (j = 0; j < 36; ++j) {
				$set_1(d, c);
				doMoveCenter1(d, j);
				Center1Rotate(d, i);
				for (k_0 = 0; k_0 < 36; ++k_0) {
					$set_1(f, e);
					doMoveCenter1(f, k_0);
					if ($equals(f, d)) {
						SymMove[i][j] = k_0;
						break;
					}
				}
			}
		}
		$set_0(c, 0);
		for (i = 0; i < 48; ++i) {
			finish_0[SymInv[i]] = $get_1(c);
			$rot(c, 0);
			i % 2 == 1 && $rot(c, 1);
			i % 8 == 7 && $rot(c, 2);
			i % 16 == 15 && $rot(c, 3);
		}
	}
	function initCenter1Sym2Raw() {
		var idx, j, occ;
		var c = new Center1();
		new Center1();
		Center1RotPerm = [];
		for (var i = 0; i < 24; i++) c.ct[i] = i;
		for (var s = 0; s < 48; s++) {
			Center1RotPerm[s] = c.ct.slice();
			$rot(c, 0);
			s % 2 == 1 && $rot(c, 1);
			s % 8 == 7 && $rot(c, 2);
			s % 16 == 15 && $rot(c, 3);
		}
		occ = createArray(22984);
		for (var i = 0; i < 22984; i++) occ[i] = 0;
		var count = 0;
		for (var i = 0; i < mathlib.Cnk[21][8]; ++i) if ((occ[i >>> 5] & 1 << (i & 31)) == 0) {
			$set_0(c, i);
			for (j = 0; j < 48; ++j) {
				idx = getCenter1RotThres(c, Center1RotPerm[j], mathlib.Cnk[21][8]);
				if (idx == -1) continue;
				occ[idx >>> 5] |= 1 << (idx & 31);
				Center1Raw2Sym != null && (Center1Raw2Sym[idx] = count << 6 | SymInv[j]);
			}
			Center1Sym2Raw[count++] = i;
		}
	}
	function raw2sym_0(n) {
		var m_0 = binarySearch_0(Center1Sym2Raw, n);
		return m_0 >= 0 ? m_0 : -1;
	}
	var Center1SymPrun, Center1SymMove, finish_0, Center1Raw2Sym = null, Center1Sym2Raw, Center1RotPerm, SymInv, SymMove, SymMult;
	function $clinit_Center2() {
		$clinit_Center2 = nullMethod;
		rlmv = createArray(70, 28);
		ctmv = createArray(6435, 28);
		rlrot = createArray(70, 16);
		ctrot = createArray(6435, 16);
		ctprun = createArray(450450);
		pmv = [
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			1,
			0,
			1,
			0,
			0,
			0,
			0,
			0,
			0,
			1,
			0,
			1,
			0,
			0,
			0
		];
	}
	function $getct(obj) {
		var i, idx = 0, r = 8;
		for (i = 14; i >= 0; --i) obj.ct[i] != obj.ct[15] && (idx += Cnk[i][r--]);
		return idx;
	}
	function $getrl(obj) {
		var i, idx = 0, r = 4;
		for (i = 6; i >= 0; --i) obj.rl[i] != obj.rl[7] && (idx += Cnk[i][r--]);
		return idx * 2 + obj.parity;
	}
	function doMoveCenter2(obj, m_0) {
		var key;
		obj.parity ^= pmv[m_0];
		key = m_0 % 3;
		m_0 = ~~(m_0 / 3);
		switch (m_0) {
			case 0:
				swap(obj.ct, 0, 1, 2, 3, key);
				break;
			case 1:
				swap(obj.rl, 0, 1, 2, 3, key);
				break;
			case 2:
				swap(obj.ct, 8, 9, 10, 11, key);
				break;
			case 3:
				swap(obj.ct, 4, 5, 6, 7, key);
				break;
			case 4:
				swap(obj.rl, 4, 5, 6, 7, key);
				break;
			case 5:
				swap(obj.ct, 12, 13, 14, 15, key);
				break;
			case 6:
				swap(obj.ct, 0, 1, 2, 3, key);
				swap(obj.rl, 0, 5, 4, 1, key);
				swap(obj.ct, 8, 9, 12, 13, key);
				break;
			case 7:
				swap(obj.rl, 0, 1, 2, 3, key);
				swap(obj.ct, 1, 15, 5, 9, key);
				swap(obj.ct, 2, 12, 6, 10, key);
				break;
			case 8:
				swap(obj.ct, 8, 9, 10, 11, key);
				swap(obj.rl, 0, 3, 6, 5, key);
				swap(obj.ct, 3, 2, 5, 4, key);
				break;
			case 9:
				swap(obj.ct, 4, 5, 6, 7, key);
				swap(obj.rl, 3, 2, 7, 6, key);
				swap(obj.ct, 11, 10, 15, 14, key);
				break;
			case 10:
				swap(obj.rl, 4, 5, 6, 7, key);
				swap(obj.ct, 0, 8, 4, 14, key);
				swap(obj.ct, 3, 11, 7, 13, key);
				break;
			case 11:
				swap(obj.ct, 12, 13, 14, 15, key);
				swap(obj.rl, 1, 4, 7, 2, key);
				swap(obj.ct, 1, 0, 7, 6, key);
		}
	}
	function $rot_0(obj, r) {
		switch (r) {
			case 0:
				doMoveCenter2(obj, 19);
				doMoveCenter2(obj, 28);
				break;
			case 1:
				doMoveCenter2(obj, 21);
				doMoveCenter2(obj, 32);
				break;
			case 2:
				swap(obj.ct, 0, 3, 1, 2, 1);
				swap(obj.ct, 8, 11, 9, 10, 1);
				swap(obj.ct, 4, 7, 5, 6, 1);
				swap(obj.ct, 12, 15, 13, 14, 1);
				swap(obj.rl, 0, 3, 5, 6, 1);
				swap(obj.rl, 1, 2, 4, 7, 1);
		}
	}
	function $set_2(obj, c, edgeParity) {
		var i = 0;
		for (; i < 16; ++i) obj.ct[i] = c.ct[i] % 3;
		for (i = 0; i < 8; ++i) obj.rl[i] = c.ct[i + 16];
		obj.parity = edgeParity;
	}
	function $setct(obj, idx) {
		var i, r = 8;
		obj.ct[15] = 0;
		for (i = 14; i >= 0; --i) if (idx >= Cnk[i][r]) {
			idx -= Cnk[i][r--];
			obj.ct[i] = 1;
		} else obj.ct[i] = 0;
	}
	function $setrl(obj, idx) {
		var i, r;
		obj.parity = idx & 1;
		idx >>>= 1;
		r = 4;
		obj.rl[7] = 0;
		for (i = 6; i >= 0; --i) if (idx >= Cnk[i][r]) {
			idx -= Cnk[i][r--];
			obj.rl[i] = 1;
		} else obj.rl[i] = 0;
	}
	function Center2() {
		this.rl = createArray(8);
		this.ct = createArray(16);
		this.parity = 0;
	}
	Center2.prototype.copy = function(obj) {
		for (var i = 0; i < 8; i++) this.rl[i] = obj.rl[i];
		for (var i = 0; i < 16; i++) this.ct[i] = obj.ct[i];
		this.parity = obj.parity;
	};
	var ctmv, ctprun, ctrot, pmv, rlmv, rlrot;
	function initCenter2() {
		var ct, ctx, depth, done, i, idx, j, m_0, rl, rlx;
		var c = new Center2();
		var d = new Center2();
		for (i = 0; i < 70; ++i) for (m_0 = 0; m_0 < 28; ++m_0) {
			$setrl(c, i);
			doMoveCenter2(c, move2std[m_0]);
			rlmv[i][m_0] = $getrl(c);
		}
		for (i = 0; i < 70; ++i) {
			$setrl(c, i);
			for (j = 0; j < 16; ++j) {
				rlrot[i][j] = $getrl(c);
				$rot_0(c, 0);
				j % 2 == 1 && $rot_0(c, 1);
				j % 8 == 7 && $rot_0(c, 2);
			}
		}
		for (i = 0; i < 6435; ++i) {
			$setct(c, i);
			for (j = 0; j < 16; ++j) {
				ctrot[i][j] = $getct(c);
				$rot_0(c, 0);
				j % 2 == 1 && $rot_0(c, 1);
				j % 8 == 7 && $rot_0(c, 2);
			}
		}
		for (i = 0; i < 6435; ++i) {
			$setct(c, i);
			for (m_0 = 0; m_0 < 28; ++m_0) {
				d.copy(c);
				doMoveCenter2(d, move2std[m_0]);
				ctmv[i][m_0] = $getct(d);
			}
		}
		fill_0(ctprun);
		ctprun[0] = ctprun[18] = ctprun[28] = ctprun[46] = ctprun[54] = ctprun[56] = 0;
		depth = 0;
		done = 6;
		while (done != 450450) {
			var inv = depth > 6;
			var select = inv ? -1 : depth;
			var check = inv ? depth : -1;
			++depth;
			for (i = 0; i < 450450; ++i) {
				if (ctprun[i] != select) continue;
				ct = ~~(i / 70);
				rl = i % 70;
				for (m_0 = 0; m_0 < 23; ++m_0) {
					ctx = ctmv[ct][m_0];
					rlx = rlmv[rl][m_0];
					idx = ctx * 70 + rlx;
					if (ctprun[idx] != check) continue;
					++done;
					if (inv) {
						ctprun[i] = depth;
						break;
					} else ctprun[idx] = depth;
				}
			}
		}
	}
	function $clinit_Center3() {
		$clinit_Center3 = nullMethod;
		ctmove = createArray(29400, 20);
		pmove = [
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			1,
			1,
			1,
			1,
			1,
			1
		];
		prun_0 = createArray(29400);
		rl2std = [
			0,
			9,
			14,
			23,
			27,
			28,
			41,
			42,
			46,
			55,
			60,
			69
		];
		std2rl = createArray(70);
	}
	function $getct_0(obj) {
		var check, i, idx = 0, idxrl, r = 4;
		for (i = 6; i >= 0; --i) obj.ud[i] != obj.ud[7] && (idx += Cnk[i][r--]);
		idx *= 35;
		r = 4;
		for (i = 6; i >= 0; --i) obj.fb[i] != obj.fb[7] && (idx += Cnk[i][r--]);
		idx *= 12;
		check = obj.fb[7] ^ obj.ud[7];
		idxrl = 0;
		r = 4;
		for (i = 7; i >= 0; --i) obj.rl[i] != check && (idxrl += Cnk[i][r--]);
		return obj.parity + 2 * (idx + std2rl[idxrl]);
	}
	function doMoveCenter3(obj, i) {
		obj.parity ^= pmove[i];
		switch (i) {
			case 0:
			case 1:
			case 2:
				swap(obj.ud, 0, 1, 2, 3, i % 3);
				break;
			case 3:
				swap(obj.rl, 0, 1, 2, 3, 1);
				break;
			case 4:
			case 5:
			case 6:
				swap(obj.fb, 0, 1, 2, 3, (i - 1) % 3);
				break;
			case 7:
			case 8:
			case 9:
				swap(obj.ud, 4, 5, 6, 7, (i - 1) % 3);
				break;
			case 10:
				swap(obj.rl, 4, 5, 6, 7, 1);
				break;
			case 11:
			case 12:
			case 13:
				swap(obj.fb, 4, 5, 6, 7, (i + 1) % 3);
				break;
			case 14:
				swap(obj.ud, 0, 1, 2, 3, 1);
				swap(obj.rl, 0, 5, 4, 1, 1);
				swap(obj.fb, 0, 5, 4, 1, 1);
				break;
			case 15:
				swap(obj.rl, 0, 1, 2, 3, 1);
				swap(obj.fb, 1, 4, 7, 2, 1);
				swap(obj.ud, 1, 6, 5, 2, 1);
				break;
			case 16:
				swap(obj.fb, 0, 1, 2, 3, 1);
				swap(obj.ud, 3, 2, 5, 4, 1);
				swap(obj.rl, 0, 3, 6, 5, 1);
				break;
			case 17:
				swap(obj.ud, 4, 5, 6, 7, 1);
				swap(obj.rl, 3, 2, 7, 6, 1);
				swap(obj.fb, 3, 2, 7, 6, 1);
				break;
			case 18:
				swap(obj.rl, 4, 5, 6, 7, 1);
				swap(obj.fb, 0, 3, 6, 5, 1);
				swap(obj.ud, 0, 3, 4, 7, 1);
				break;
			case 19:
				swap(obj.fb, 4, 5, 6, 7, 1);
				swap(obj.ud, 0, 7, 6, 1, 1);
				swap(obj.rl, 1, 4, 7, 2, 1);
		}
	}
	function $set_3(obj, c, eXc_parity) {
		var i, parity = c.ct[0] % 3 > c.ct[8] % 3 ^ c.ct[8] % 3 > c.ct[16] % 3 ^ c.ct[0] % 3 > c.ct[16] % 3 ? 0 : 1;
		for (i = 0; i < 8; ++i) {
			obj.ud[i] = ~~(c.ct[i] / 3) ^ 1;
			obj.fb[i] = ~~(c.ct[i + 8] / 3) ^ 1;
			obj.rl[i] = ~~(c.ct[i + 16] / 3) ^ 1 ^ parity;
		}
		obj.parity = parity ^ eXc_parity;
	}
	function $setct_0(obj, idx) {
		var i, idxfb, idxrl, r;
		obj.parity = idx & 1;
		idx >>>= 1;
		idxrl = rl2std[idx % 12];
		idx = ~~(idx / 12);
		r = 4;
		for (i = 7; i >= 0; --i) {
			obj.rl[i] = 0;
			if (idxrl >= Cnk[i][r]) {
				idxrl -= Cnk[i][r--];
				obj.rl[i] = 1;
			}
		}
		idxfb = idx % 35;
		idx = ~~(idx / 35);
		r = 4;
		obj.fb[7] = 0;
		for (i = 6; i >= 0; --i) if (idxfb >= Cnk[i][r]) {
			idxfb -= Cnk[i][r--];
			obj.fb[i] = 1;
		} else obj.fb[i] = 0;
		r = 4;
		obj.ud[7] = 0;
		for (i = 6; i >= 0; --i) if (idx >= Cnk[i][r]) {
			idx -= Cnk[i][r--];
			obj.ud[i] = 1;
		} else obj.ud[i] = 0;
	}
	function Center3() {
		this.ud = createArray(8);
		this.rl = createArray(8);
		this.fb = createArray(8);
		this.parity = 0;
	}
	Center3.prototype.copy = function(obj) {
		for (var i = 0; i < 8; i++) {
			this.ud[i] = obj.ud[i];
			this.rl[i] = obj.rl[i];
			this.fb[i] = obj.fb[i];
		}
		this.parity = obj.parity;
	};
	var ctmove, pmove, prun_0, rl2std, std2rl;
	function initCenter3() {
		var depth, done, i = 0, m_0;
		for (; i < 12; ++i) std2rl[rl2std[i]] = i;
		var c = new Center3();
		var d = new Center3();
		for (i = 0; i < 29400; ++i) {
			$setct_0(c, i);
			for (m_0 = 0; m_0 < 20; ++m_0) {
				d.copy(c);
				doMoveCenter3(d, m_0);
				ctmove[i][m_0] = $getct_0(d);
			}
		}
		fill_0(prun_0);
		prun_0[0] = 0;
		depth = 0;
		done = 1;
		while (done != 29400) {
			for (i = 0; i < 29400; ++i) {
				if (prun_0[i] != depth) continue;
				for (m_0 = 0; m_0 < 17; ++m_0) if (prun_0[ctmove[i][m_0]] == -1) {
					prun_0[ctmove[i][m_0]] = depth + 1;
					++done;
				}
			}
			++depth;
		}
	}
	function $copy_1(obj, c) {
		var i = 0;
		for (; i < 24; ++i) obj.ct[i] = c.ct[i];
	}
	function doMoveCenterCube(obj, m_0) {
		var key = m_0 % 3;
		m_0 = ~~(m_0 / 3);
		switch (m_0) {
			case 6:
				swap(obj.ct, 8, 20, 12, 16, key);
				swap(obj.ct, 9, 21, 13, 17, key);
			case 0:
				swap(obj.ct, 0, 1, 2, 3, key);
				break;
			case 7:
				swap(obj.ct, 1, 15, 5, 9, key);
				swap(obj.ct, 2, 12, 6, 10, key);
			case 1:
				swap(obj.ct, 16, 17, 18, 19, key);
				break;
			case 8:
				swap(obj.ct, 2, 19, 4, 21, key);
				swap(obj.ct, 3, 16, 5, 22, key);
			case 2:
				swap(obj.ct, 8, 9, 10, 11, key);
				break;
			case 9:
				swap(obj.ct, 10, 18, 14, 22, key);
				swap(obj.ct, 11, 19, 15, 23, key);
			case 3:
				swap(obj.ct, 4, 5, 6, 7, key);
				break;
			case 10:
				swap(obj.ct, 0, 8, 4, 14, key);
				swap(obj.ct, 3, 11, 7, 13, key);
			case 4:
				swap(obj.ct, 20, 21, 22, 23, key);
				break;
			case 11:
				swap(obj.ct, 1, 20, 7, 18, key);
				swap(obj.ct, 0, 23, 6, 17, key);
			case 5: swap(obj.ct, 12, 13, 14, 15, key);
		}
	}
	function CenterCube() {
		this.ct = [];
		for (var i = 0; i < 24; ++i) this.ct[i] = centerFacelet[i] >> 4;
	}
	function $clinit_CornerCube() {
		$clinit_CornerCube = nullMethod;
		CornerMoveCube = createArray(18);
		cornerFacelet_0 = [
			[
				8,
				9,
				20
			],
			[
				6,
				18,
				38
			],
			[
				0,
				36,
				47
			],
			[
				2,
				45,
				11
			],
			[
				29,
				26,
				15
			],
			[
				27,
				44,
				24
			],
			[
				33,
				53,
				42
			],
			[
				35,
				17,
				51
			]
		];
		initMove_0();
	}
	function $$init_2(obj) {
		obj.cp = [
			0,
			1,
			2,
			3,
			4,
			5,
			6,
			7
		];
		obj.co = [
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0
		];
	}
	function $copy_2(obj, c) {
		var i = 0;
		for (; i < 8; ++i) {
			obj.cp[i] = c.cp[i];
			obj.co[i] = c.co[i];
		}
	}
	function $move_3(obj, idx) {
		!obj.temps && (obj.temps = new CornerCube_0());
		CornMult_0(obj, CornerMoveCube[idx], obj.temps);
		$copy_2(obj, obj.temps);
	}
	function $setTwist_0(obj, idx) {
		var i, twst = 0;
		for (i = 6; i >= 0; --i) {
			twst += obj.co[i] = idx % 3;
			idx = ~~(idx / 3);
		}
		obj.co[7] = (15 - twst) % 3;
	}
	function CornMult_0(a, b, prod) {
		var corn = 0, ori, oriA, oriB;
		for (; corn < 8; ++corn) {
			prod.cp[corn] = a.cp[b.cp[corn]];
			oriA = a.co[b.cp[corn]];
			oriB = b.co[corn];
			ori = oriA;
			ori = ori + (oriA < 3 ? oriB : 6 - oriB);
			ori = ori % 3;
			oriA >= 3 ^ oriB >= 3 && (ori = ori + 3);
			prod.co[corn] = ori;
		}
	}
	function CornerCube_0() {
		$$init_2(this);
	}
	function CornerCube_1(cperm, twist) {
		$$init_2(this);
		mathlib.setNPerm(this.cp, cperm, 8);
		$setTwist_0(this, twist);
	}
	function initMove_0() {
		var a, p_0;
		CornerMoveCube[0] = new CornerCube_1(15120, 0);
		CornerMoveCube[3] = new CornerCube_1(21021, 1494);
		CornerMoveCube[6] = new CornerCube_1(8064, 1236);
		CornerMoveCube[9] = new CornerCube_1(9, 0);
		CornerMoveCube[12] = new CornerCube_1(1230, 412);
		CornerMoveCube[15] = new CornerCube_1(224, 137);
		for (a = 0; a < 18; a += 3) for (p_0 = 0; p_0 < 2; ++p_0) {
			CornerMoveCube[a + p_0 + 1] = new CornerCube_0();
			CornMult_0(CornerMoveCube[a + p_0], CornerMoveCube[a], CornerMoveCube[a + p_0 + 1]);
		}
	}
	defineClass(CornerCube_0, CornerCube_1);
	_.temps = null;
	var cornerFacelet_0, CornerMoveCube;
	function $clinit_Edge3() {
		$clinit_Edge3 = nullMethod;
		prunValues = [
			1,
			4,
			16,
			55,
			324,
			1922,
			12275,
			77640,
			485359,
			2778197,
			11742425,
			27492416,
			31002941,
			31006080
		];
		Edge3Prun = /* @__PURE__ */ new Int32Array(1937880);
		Edge3Sym2Raw = createArray(1538);
		Edge3Sym2Mask = createArray(1538);
		symstate = createArray(1538);
		Edge3Raw2Sym = createArray(11880);
		syminv_0 = [
			0,
			1,
			6,
			3,
			4,
			5,
			2,
			7
		];
		mvrot = createArray(168, 12);
		mvroto = createArray(168, 12);
		factX = [
			1,
			1,
			1,
			3,
			12,
			60,
			360,
			2520,
			20160,
			181440,
			1814400,
			19958400,
			239500800
		];
		FullEdgeMap = [
			0,
			2,
			4,
			6,
			1,
			3,
			7,
			5,
			8,
			9,
			10,
			11
		];
	}
	function $circlex(obj, a, b, c, d) {
		var temp = obj.edgeo[d];
		obj.edgeo[d] = obj.edge[c];
		obj.edge[c] = obj.edgeo[b];
		obj.edgeo[b] = obj.edge[a];
		obj.edge[a] = temp;
	}
	function $get_2(obj, end, returnMask) {
		obj.isStd || $std(obj);
		return get12Perm(obj.edge, end, returnMask);
	}
	function get12Perm(arr, end, returnMask) {
		var idx = 0;
		var mask = 0;
		for (var i = 0; i < end; i++) {
			var val = arr[i];
			idx = idx * (12 - i) + val - mathlib.bitCount(mask & (1 << val) - 1);
			mask |= 1 << val;
		}
		return returnMask ? mask : idx;
	}
	function $getsym_0(obj) {
		obj.isStd || $std(obj);
		return getMvSym(obj.edge, 20) >> 3;
	}
	function $move_4(obj, i) {
		obj.isStd = false;
		switch (i) {
			case 0:
				circle(obj.edge, 0, 4, 1, 5);
				circle(obj.edgeo, 0, 4, 1, 5);
				break;
			case 1:
				$swap_0(obj.edge, 0, 4, 1, 5);
				$swap_0(obj.edgeo, 0, 4, 1, 5);
				break;
			case 2:
				circle(obj.edge, 0, 5, 1, 4);
				circle(obj.edgeo, 0, 5, 1, 4);
				break;
			case 3:
				$swap_0(obj.edge, 5, 10, 6, 11);
				$swap_0(obj.edgeo, 5, 10, 6, 11);
				break;
			case 4:
				circle(obj.edge, 0, 11, 3, 8);
				circle(obj.edgeo, 0, 11, 3, 8);
				break;
			case 5:
				$swap_0(obj.edge, 0, 11, 3, 8);
				$swap_0(obj.edgeo, 0, 11, 3, 8);
				break;
			case 6:
				circle(obj.edge, 0, 8, 3, 11);
				circle(obj.edgeo, 0, 8, 3, 11);
				break;
			case 7:
				circle(obj.edge, 2, 7, 3, 6);
				circle(obj.edgeo, 2, 7, 3, 6);
				break;
			case 8:
				$swap_0(obj.edge, 2, 7, 3, 6);
				$swap_0(obj.edgeo, 2, 7, 3, 6);
				break;
			case 9:
				circle(obj.edge, 2, 6, 3, 7);
				circle(obj.edgeo, 2, 6, 3, 7);
				break;
			case 10:
				$swap_0(obj.edge, 4, 8, 7, 9);
				$swap_0(obj.edgeo, 4, 8, 7, 9);
				break;
			case 11:
				circle(obj.edge, 1, 9, 2, 10);
				circle(obj.edgeo, 1, 9, 2, 10);
				break;
			case 12:
				$swap_0(obj.edge, 1, 9, 2, 10);
				$swap_0(obj.edgeo, 1, 9, 2, 10);
				break;
			case 13:
				circle(obj.edge, 1, 10, 2, 9);
				circle(obj.edgeo, 1, 10, 2, 9);
				break;
			case 14:
				$swap_0(obj.edge, 0, 4, 1, 5);
				$swap_0(obj.edgeo, 0, 4, 1, 5);
				circle(obj.edge, 9, 11);
				circle(obj.edgeo, 8, 10);
				break;
			case 15:
				$swap_0(obj.edge, 5, 10, 6, 11);
				$swap_0(obj.edgeo, 5, 10, 6, 11);
				circle(obj.edge, 1, 3);
				circle(obj.edgeo, 0, 2);
				break;
			case 16:
				$swap_0(obj.edge, 0, 11, 3, 8);
				$swap_0(obj.edgeo, 0, 11, 3, 8);
				circle(obj.edge, 5, 7);
				circle(obj.edgeo, 4, 6);
				break;
			case 17:
				$swap_0(obj.edge, 2, 7, 3, 6);
				$swap_0(obj.edgeo, 2, 7, 3, 6);
				circle(obj.edge, 8, 10);
				circle(obj.edgeo, 9, 11);
				break;
			case 18:
				$swap_0(obj.edge, 4, 8, 7, 9);
				$swap_0(obj.edgeo, 4, 8, 7, 9);
				circle(obj.edge, 0, 2);
				circle(obj.edgeo, 1, 3);
				break;
			case 19:
				$swap_0(obj.edge, 1, 9, 2, 10);
				$swap_0(obj.edgeo, 1, 9, 2, 10);
				circle(obj.edge, 4, 6);
				circle(obj.edgeo, 5, 7);
		}
	}
	function $rot_1(obj, r) {
		obj.isStd = false;
		switch (r) {
			case 0:
				$move_4(obj, 14);
				$move_4(obj, 17);
				break;
			case 1:
				$circlex(obj, 11, 5, 10, 6);
				$circlex(obj, 5, 10, 6, 11);
				$circlex(obj, 1, 2, 3, 0);
				$circlex(obj, 4, 9, 7, 8);
				$circlex(obj, 8, 4, 9, 7);
				$circlex(obj, 0, 1, 2, 3);
				break;
			case 2:
				$swapx(obj, 4, 5);
				$swapx(obj, 5, 4);
				$swapx(obj, 11, 8);
				$swapx(obj, 8, 11);
				$swapx(obj, 7, 6);
				$swapx(obj, 6, 7);
				$swapx(obj, 9, 10);
				$swapx(obj, 10, 9);
				$swapx(obj, 1, 1);
				$swapx(obj, 0, 0);
				$swapx(obj, 3, 3);
				$swapx(obj, 2, 2);
		}
	}
	function $rotate_0(obj, r) {
		while (r >= 2) {
			r -= 2;
			$rot_1(obj, 1);
			$rot_1(obj, 2);
		}
		r != 0 && $rot_1(obj, 0);
	}
	function $set_4(obj, idx) {
		var i, p_0, parity, v, vall = 1985229328, valh = 47768;
		parity = 0;
		for (i = 0; i < 11; ++i) {
			p_0 = factX[11 - i];
			v = ~~(idx / p_0);
			idx = idx % p_0;
			parity ^= v;
			v <<= 2;
			if (v >= 32) {
				v = v - 32;
				obj.edge[i] = valh >> v & 15;
				var m = (1 << v) - 1;
				valh = (valh & m) + (valh >> 4 & ~m);
			} else {
				obj.edge[i] = vall >> v & 15;
				var m = (1 << v) - 1;
				vall = (vall & m) + (vall >>> 4 & ~m) + (valh << 28);
				valh = valh >> 4;
			}
		}
		if ((parity & 1) == 0) obj.edge[11] = vall;
		else {
			obj.edge[11] = obj.edge[10];
			obj.edge[10] = vall;
		}
		for (i = 0; i < 12; ++i) obj.edgeo[i] = i;
		obj.isStd = true;
	}
	function $set_5(obj, e) {
		var i = 0;
		for (; i < 12; ++i) {
			obj.edge[i] = e.edge[i];
			obj.edgeo[i] = e.edgeo[i];
		}
		obj.isStd = e.isStd;
	}
	function $set_6(obj, c) {
		var i, parity, s, t;
		obj.temp ?? (obj.temp = createArray(12));
		for (i = 0; i < 12; ++i) {
			obj.temp[i] = i;
			obj.edge[i] = c.ep[FullEdgeMap[i] + 12] % 12;
		}
		parity = 1;
		for (i = 0; i < 12; ++i) while (obj.edge[i] != i) {
			t = obj.edge[i];
			obj.edge[i] = obj.edge[t];
			obj.edge[t] = t;
			s = obj.temp[i];
			obj.temp[i] = obj.temp[t];
			obj.temp[t] = s;
			parity ^= 1;
		}
		for (i = 0; i < 12; ++i) obj.edge[i] = obj.temp[c.ep[FullEdgeMap[i]] % 12];
		return parity;
	}
	function $std(obj) {
		var i;
		obj.temp ?? (obj.temp = createArray(12));
		for (i = 0; i < 12; ++i) obj.temp[obj.edgeo[i]] = i;
		for (i = 0; i < 12; ++i) {
			obj.edge[i] = obj.temp[obj.edge[i]];
			obj.edgeo[i] = i;
		}
		obj.isStd = true;
	}
	function $swap_0(arr, a, b, c, d) {
		var temp = arr[a];
		arr[a] = arr[c];
		arr[c] = temp;
		temp = arr[b];
		arr[b] = arr[d];
		arr[d] = temp;
	}
	function $swapx(obj, x, y) {
		var temp = obj.edge[x];
		obj.edge[x] = obj.edgeo[y];
		obj.edgeo[y] = temp;
	}
	function Edge3_0() {
		this.edge = createArray(12);
		this.edgeo = createArray(12);
		this.isStd = true;
		this.temp = null;
	}
	var FullEdgeMap, Edge3Prun, factX, mvrot, mvroto, prunValues, Edge3Raw2Sym, Edge3Sym2Raw, Edge3Sym2Mask, syminv_0, symstate;
	function initEdge3Prun() {
		var chk, cord1, cord2, e = new Edge3_0(), f = new Edge3_0(), find_0, g = new Edge3_0(), j, symState, symcord1, val;
		fill_0(Edge3Prun);
		var depth = 0;
		var done = 1;
		setPruning(Edge3Prun, 0, 0);
		var bfsMoves = [
			1,
			0,
			2,
			3,
			5,
			4,
			6,
			8,
			7,
			9,
			10,
			12,
			11,
			13,
			14,
			15,
			16
		];
		while (done != 31006080) {
			var inv = depth > 9;
			var depm3 = depth % 3;
			var dep1m3 = (depth + 1) % 3;
			var dep2m3 = (depth + 2) % 3;
			find_0 = inv ? 3 : depm3;
			chk = inv ? depm3 : 3;
			var find_mask = find_0 * 1431655765;
			if (depth >= EDGE3_MAX_PRUN - 1) break;
			for (var i_ = 0; i_ < 31006080; i_ += 16) {
				val = Edge3Prun[i_ >> 4];
				var chkmask = val ^ find_mask;
				if (!inv && val == -1 || (chkmask - 1431655765 & ~chkmask & 2863311530) == 0) continue;
				for (var i = i_, end = i_ + 16; i < end; ++i, val >>= 2) {
					if ((val & 3) != find_0) continue;
					symcord1 = ~~(i / 20160);
					cord1 = Edge3Sym2Raw[symcord1];
					cord2 = i % 20160;
					$set_4(e, cord1 * 20160 + cord2);
					for (var mi = 0; mi < 17; ++mi) {
						var m = bfsMoves[mi];
						var idx = getMvSym(e.edge, m, Edge3SymMove[m][symcord1]);
						var symx = idx & 7;
						idx >>= 3;
						var prun = getPruning_0(Edge3Prun, idx);
						if (prun != chk) {
							if (prun == dep2m3 || prun == depm3 && idx < i) mi = skipAxis3[m];
							continue;
						}
						setPruning(Edge3Prun, inv ? i : idx, dep1m3);
						++done;
						if (inv) break;
						var symcord1x = ~~(idx / 20160);
						symState = symstate[symcord1x];
						if (symState == 1) continue;
						$set_5(f, e);
						$move_4(f, m);
						$rotate_0(f, symx);
						for (j = 1; (symState = symState >> 1) != 0; ++j) {
							if ((symState & 1) != 1) continue;
							$set_5(g, f);
							$rotate_0(g, j);
							var idxx = symcord1x * 20160 + $get_2(g, 10) % 20160;
							if (getPruning_0(Edge3Prun, idxx) == chk) {
								setPruning(Edge3Prun, idxx, dep1m3);
								++done;
							}
						}
					}
				}
			}
			++depth;
		}
	}
	function getPruning_0(table, index) {
		return table[index >> 4] >> ((index & 15) << 1) & 3;
	}
	function getMvSym(ep, mv, assumeIdx) {
		var mrIdx = mv << 3;
		var movo, mov;
		var idx = 0;
		var mask = 0;
		if (assumeIdx !== void 0 && move3std[mv] % 3 == 1) {
			mrIdx |= assumeIdx & 7;
			idx = assumeIdx >> 3;
		} else {
			movo = mvroto[mrIdx];
			mov = mvrot[mrIdx];
			for (var i = 0; i < 4; i++) {
				var val = movo[ep[mov[i]]];
				idx = idx * (12 - i) + val - mathlib.bitCount(mask & (1 << val) - 1);
				mask |= 1 << val;
			}
			idx = Edge3Raw2Sym[idx];
			mrIdx |= idx & 7;
			idx >>= 3;
		}
		movo = mvroto[mrIdx];
		mov = mvrot[mrIdx];
		mask = Edge3Sym2Mask[idx];
		for (var i = 4; i < 10; i++) {
			var val = movo[ep[mov[i]]];
			idx = idx * (12 - i) + val - mathlib.bitCount(mask & (1 << val) - 1);
			mask |= 1 << val;
		}
		return idx << 3 | mrIdx & 7;
	}
	var EDGE3_MAX_PRUN = 10;
	function getprun(edge) {
		var cord1, cord2, depm3, depth, e = new Edge3_0(), idx, symcord1;
		depth = 0;
		depm3 = getPruning_0(Edge3Prun, edge);
		if (depm3 == 3) return EDGE3_MAX_PRUN;
		while (edge != 0) {
			depm3 = (depm3 + 2) % 3;
			symcord1 = ~~(edge / 20160);
			cord1 = Edge3Sym2Raw[symcord1];
			cord2 = edge % 20160;
			$set_4(e, cord1 * 20160 + cord2);
			for (var m = 0; m < 17; ++m) {
				idx = getMvSym(e.edge, m) >> 3;
				if (getPruning_0(Edge3Prun, idx) == depm3) {
					++depth;
					edge = idx;
					break;
				}
			}
		}
		return depth;
	}
	function getprun_0(edge, prun) {
		var depm3 = getPruning_0(Edge3Prun, edge);
		if (depm3 == 3) return EDGE3_MAX_PRUN;
		return (1227133513 << depm3 >> prun & 3) + prun - 1;
	}
	function initEdge3MvRot() {
		var e = new Edge3_0();
		for (var m = 0; m < 21; ++m) for (var r = 0; r < 8; ++r) {
			$set_4(e, 0);
			$move_4(e, m);
			$rotate_0(e, r);
			for (var i = 0; i < 12; ++i) mvrot[m << 3 | r][i] = e.edge[i];
			$std(e);
			for (var i = 0; i < 12; ++i) mvroto[m << 3 | r][i] = e.temp[i];
		}
	}
	var Edge3SymMove = [];
	function initEdge3Sym2Raw() {
		var count, e = new Edge3_0(), idx, j, occ = createArray(1485);
		for (var i = 0; i < 1485; i++) occ[i] = 0;
		count = 0;
		for (var i = 0; i < 11880; ++i) if ((occ[i >>> 3] & 1 << (i & 7)) == 0) {
			$set_4(e, i * factX[8]);
			Edge3Sym2Raw[count] = i;
			Edge3Sym2Mask[count] = $get_2(e, 4, true);
			for (j = 0; j < 8; ++j) {
				idx = $get_2(e, 4);
				idx == i && (symstate[count] = symstate[count] | 1 << j);
				occ[idx >> 3] |= 1 << (idx & 7);
				Edge3Raw2Sym[idx] = count << 3 | syminv_0[j];
				$rot_1(e, 0);
				if (j % 2 == 1) {
					$rot_1(e, 1);
					$rot_1(e, 2);
				}
			}
			count++;
		}
		for (var m = 0; m < 20; m++) Edge3SymMove[m] = [];
		for (var i = 0; i < 1538; i++) {
			$set_4(e, Edge3Sym2Raw[i] * factX[8]);
			for (var m = 0; m < 20; ++m) {
				if (move3std[m] % 3 != 1) continue;
				idx = getMvSym(e.edge, m);
				Edge3SymMove[m][i] = ~~((idx >> 3) / 20160) << 3 | idx & 7;
			}
		}
	}
	function setPruning(table, index, value) {
		table[index >> 4] ^= (3 ^ value) << ((index & 15) << 1);
	}
	function checkPhase2Edge(epInv, moves, length) {
		var parity = 0;
		for (var i = 0; i < 12; i++) {
			var e = epInv[i];
			var eo = epInv[i + 12];
			for (var j = 0; j < length; j++) {
				var moveMap = epMoveMap[moves[j]];
				e = moveMap[e];
				eo = moveMap[eo];
			}
			if (e < 12 != eo >= 12) return false;
			parity ^= e >= 12 ? 1 : 0;
		}
		return parity == 0;
	}
	function $copy_3(obj, c) {
		var i = 0;
		for (; i < 24; ++i) obj.ep[i] = c.ep[i];
	}
	function doMoveEdge(obj, m_0) {
		var key = m_0 % 3;
		m_0 = ~~(m_0 / 3);
		switch (m_0) {
			case 6: swap(obj.ep, 9, 22, 11, 20, key);
			case 0:
				swap(obj.ep, 0, 1, 2, 3, key);
				swap(obj.ep, 12, 13, 14, 15, key);
				break;
			case 7: swap(obj.ep, 2, 16, 6, 12, key);
			case 1:
				swap(obj.ep, 11, 15, 10, 19, key);
				swap(obj.ep, 23, 3, 22, 7, key);
				break;
			case 8: swap(obj.ep, 3, 19, 5, 13, key);
			case 2:
				swap(obj.ep, 0, 11, 6, 8, key);
				swap(obj.ep, 12, 23, 18, 20, key);
				break;
			case 9: swap(obj.ep, 8, 23, 10, 21, key);
			case 3:
				swap(obj.ep, 4, 5, 6, 7, key);
				swap(obj.ep, 16, 17, 18, 19, key);
				break;
			case 10: swap(obj.ep, 14, 0, 18, 4, key);
			case 4:
				swap(obj.ep, 1, 20, 5, 21, key);
				swap(obj.ep, 13, 8, 17, 9, key);
				break;
			case 11: swap(obj.ep, 7, 15, 1, 17, key);
			case 5:
				swap(obj.ep, 2, 9, 4, 10, key);
				swap(obj.ep, 14, 21, 16, 22, key);
		}
	}
	function EdgeCube() {
		this.ep = [];
		for (var i = 0; i < 24; ++i) this.ep[i] = i;
	}
	function $clinit_FullCube_0() {
		$clinit_FullCube_0 = nullMethod;
		move2rot = [
			35,
			1,
			34,
			2,
			4,
			6,
			22,
			5,
			19
		];
	}
	function $$init_3(obj) {
		obj.moveBuffer = createArray(60);
	}
	function $copy_4(obj, c) {
		var i;
		$copy_3(obj.edge, c.edge);
		$copy_1(obj.center, c.center);
		$copy_2(obj.corner, c.corner);
		obj.value = c.value;
		obj.add1 = c.add1;
		obj.length1 = c.length1;
		obj.length2 = c.length2;
		obj.length3 = c.length3;
		obj.sym = c.sym;
		for (i = 0; i < 60; ++i) obj.moveBuffer[i] = c.moveBuffer[i];
		obj.moveLength = c.moveLength;
		obj.edgeAvail = c.edgeAvail;
		obj.centerAvail = c.centerAvail;
		obj.cornerAvail = c.cornerAvail;
	}
	var centerFacelet = [
		5,
		6,
		10,
		9,
		53,
		54,
		58,
		57,
		37,
		38,
		42,
		41,
		85,
		86,
		90,
		89,
		21,
		22,
		26,
		25,
		69,
		70,
		74,
		73
	];
	var cornerFacelet = [
		[
			15,
			16,
			35
		],
		[
			12,
			32,
			67
		],
		[
			0,
			64,
			83
		],
		[
			3,
			80,
			19
		],
		[
			51,
			47,
			28
		],
		[
			48,
			79,
			44
		],
		[
			60,
			95,
			76
		],
		[
			63,
			31,
			92
		]
	];
	var edgeFacelet = [
		[13, 33],
		[4, 65],
		[2, 81],
		[11, 17],
		[61, 94],
		[52, 78],
		[50, 46],
		[59, 30],
		[75, 40],
		[68, 87],
		[27, 88],
		[20, 39],
		[34, 14],
		[66, 8],
		[82, 1],
		[18, 7],
		[93, 62],
		[77, 56],
		[45, 49],
		[29, 55],
		[36, 71],
		[91, 72],
		[84, 23],
		[43, 24]
	];
	function $fromFacelet(obj, f) {
		var ctMask = 0;
		var edMask = 0;
		var cpMask = 0;
		var coSum = 0;
		for (var i = 0; i < 24; i++) {
			obj.center.ct[i] = f[centerFacelet[i]];
			ctMask += 1 << f[centerFacelet[i]] * 4;
		}
		for (var i = 0; i < 24; i++) for (var j = 0; j < 24; j++) if (f[edgeFacelet[i][0]] == edgeFacelet[j][0] >> 4 && f[edgeFacelet[i][1]] == edgeFacelet[j][1] >> 4) {
			obj.edge.ep[i] = j;
			edMask |= 1 << j;
		}
		var col1, col2, ori;
		for (var i = 0; i < 8; i++) {
			for (ori = 0; ori < 3; ori++) if (f[cornerFacelet[i][ori]] == 0 || f[cornerFacelet[i][ori]] == 3) break;
			col1 = f[cornerFacelet[i][(ori + 1) % 3]];
			col2 = f[cornerFacelet[i][(ori + 2) % 3]];
			for (var j = 0; j < 8; j++) if (col1 == cornerFacelet[j][1] >> 4 && col2 == cornerFacelet[j][2] >> 4) {
				obj.corner.cp[i] = j;
				obj.corner.co[i] = ori % 3;
				cpMask |= 1 << j;
				coSum += ori % 3;
				break;
			}
		}
		return (cpMask != 255) * 1 + (coSum % 3 != 0) * 2 + (ctMask != 4473924) * 4 + (edMask != 16777215) * 8;
	}
	function toFacelet(obj) {
		getCenter(obj);
		$getCorner(obj);
		$getEdge(obj);
		var f = [];
		for (var i = 0; i < 24; i++) f[centerFacelet[i]] = obj.center.ct[i];
		for (var i = 0; i < 24; i++) {
			f[edgeFacelet[i][0]] = edgeFacelet[obj.edge.ep[i]][0] >> 4;
			f[edgeFacelet[i][1]] = edgeFacelet[obj.edge.ep[i]][1] >> 4;
		}
		for (var c = 0; c < 8; c++) {
			var j = obj.corner.cp[c];
			var ori = obj.corner.co[c];
			for (var n = 0; n < 3; n++) f[cornerFacelet[c][(n + ori) % 3]] = cornerFacelet[j][n] >> 4;
		}
		return f;
	}
	function to333Facelet(obj) {
		var f = toFacelet(obj);
		var chks = [
			[1, 2],
			[4, 8],
			[7, 11],
			[13, 14],
			[
				5,
				6,
				9,
				10
			]
		];
		var map4to3 = [
			0,
			1,
			3,
			4,
			5,
			7,
			12,
			13,
			15
		];
		var f3 = [];
		for (var fidx = 0; fidx < 6; fidx++) {
			for (var i = 0; i < chks.length; i++) {
				var cmp = f[fidx << 4 | chks[i][0]];
				for (var j = 1; j < chks[i].length; j++) if (cmp != f[fidx << 4 | chks[i][j]]) {
					console.log("reduction error", chks[i][j], chks[i][0]);
					return null;
				}
			}
			for (var i = 0; i < map4to3.length; i++) f3[fidx * 9 + i] = f[fidx << 4 | map4to3[i]];
		}
		return f3;
	}
	function getCenter(obj) {
		while (obj.centerAvail < obj.moveLength) doMoveCenterCube(obj.center, obj.moveBuffer[obj.centerAvail++]);
		return obj.center;
	}
	function $getCorner(obj) {
		while (obj.cornerAvail < obj.moveLength) $move_3(obj.corner, obj.moveBuffer[obj.cornerAvail++] % 18);
		return obj.corner;
	}
	function $getEdge(obj) {
		while (obj.edgeAvail < obj.moveLength) doMoveEdge(obj.edge, obj.moveBuffer[obj.edgeAvail++]);
		return obj.edge;
	}
	function getMoveString(obj) {
		var finishSym, fixedMoves = new Array(obj.moveLength - (obj.add1 ? 2 : 0)), i, i_1, idx = 0, move, rot, ret, sym, axis, pows;
		for (i = 0; i < obj.length1; ++i) fixedMoves[idx++] = obj.moveBuffer[i];
		sym = obj.sym;
		for (i = obj.length1 + (obj.add1 ? 2 : 0); i < obj.moveLength; ++i) if (SymMove[sym][obj.moveBuffer[i]] >= 27) {
			fixedMoves[idx++] = SymMove[sym][obj.moveBuffer[i]] - 9;
			rot = move2rot[SymMove[sym][obj.moveBuffer[i]] - 27];
			sym = SymMult[sym][rot];
		} else fixedMoves[idx++] = SymMove[sym][obj.moveBuffer[i]];
		finishSym = SymMult[SymInv[sym]][getSolvedSym(getCenter(obj))];
		ret = [];
		sym = finishSym;
		for (i = idx - 1; i >= 0; --i) {
			move = fixedMoves[i];
			move = ~~(move / 3) * 3 + (2 - move % 3);
			if (SymMove[sym][move] >= 27) {
				ret.push(SymMove[sym][move] - 9);
				rot = move2rot[SymMove[sym][move] - 27];
				sym = SymMult[sym][rot];
			} else ret.push(SymMove[sym][move]);
		}
		axis = -1;
		idx = 0;
		pows = [
			0,
			0,
			0
		];
		for (i = 0; i < ret.length; ++i) {
			move = ret[i];
			if (axis != ~~(move / 3) % 3) {
				for (i_1 = 0; i_1 < 3; i_1++) if (pows[i_1] % 4) {
					ret[idx++] = move2str_1[i_1 * 9 + axis * 3 + pows[i_1] - 1] + " ";
					pows[i_1] = 0;
				}
				axis = ~~(move / 3) % 3;
			}
			pows[~~(move / 9)] += move % 3 + 1;
		}
		for (i_1 = 0; i_1 < 3; i_1++) if (pows[i_1] % 4) {
			ret[idx++] = move2str_1[i_1 * 9 + axis * 3 + pows[i_1] - 1] + " ";
			pows[i_1] = 0;
		}
		ret = ret.slice(0, idx).join("");
		return ret;
	}
	function $move_6(obj, m_0) {
		obj.moveBuffer[obj.moveLength++] = m_0;
	}
	function FullCube_3() {
		$$init_3(this);
		this.edge = new EdgeCube();
		this.center = new CenterCube();
		this.corner = new CornerCube_0();
	}
	function FullCube_4(c) {
		FullCube_3.call(this);
		$copy_4(this, c);
	}
	defineClass(FullCube_3, FullCube_4);
	_.add1 = false;
	_.center = null;
	_.centerAvail = 0;
	_.corner = null;
	_.cornerAvail = 0;
	_.edge = null;
	_.edgeAvail = 0;
	_.length1 = 0;
	_.length2 = 0;
	_.length3 = 0;
	_.moveLength = 0;
	_.sym = 0;
	_.value = 0;
	var move2rot;
	function $compare_0(c1, c2) {
		return c2.value - c1.value;
	}
	function $clinit_Moves() {
		$clinit_Moves = nullMethod;
		var i, j;
		move2str_1 = [
			"U  ",
			"U2 ",
			"U' ",
			"R  ",
			"R2 ",
			"R' ",
			"F  ",
			"F2 ",
			"F' ",
			"D  ",
			"D2 ",
			"D' ",
			"L  ",
			"L2 ",
			"L' ",
			"B  ",
			"B2 ",
			"B' ",
			"Uw ",
			"Uw2",
			"Uw'",
			"Rw ",
			"Rw2",
			"Rw'",
			"Fw ",
			"Fw2",
			"Fw'",
			"Dw ",
			"Dw2",
			"Dw'",
			"Lw ",
			"Lw2",
			"Lw'",
			"Bw ",
			"Bw2",
			"Bw'"
		];
		move2std = [
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
			11,
			12,
			13,
			14,
			15,
			16,
			17,
			19,
			21,
			22,
			23,
			25,
			28,
			30,
			31,
			32,
			34,
			36
		];
		move3std = [
			0,
			1,
			2,
			4,
			6,
			7,
			8,
			9,
			10,
			11,
			13,
			15,
			16,
			17,
			19,
			22,
			25,
			28,
			31,
			34,
			36
		];
		std2move = createArray(37);
		std3move = createArray(37);
		ckmv = createArray(37, 36);
		ckmv2_0 = createArray(29, 28);
		ckmv3 = createArray(21, 20);
		skipAxis = createArray(36);
		skipAxis2 = createArray(28);
		skipAxis3 = createArray(20);
		epMoveMap = createArray(36, 24);
		for (i = 0; i < 29; ++i) std2move[move2std[i]] = i;
		for (i = 0; i < 21; ++i) std3move[move3std[i]] = i;
		for (i = 0; i < 36; ++i) {
			for (j = 0; j < 36; ++j) ckmv[i][j] = ~~(i / 3) == ~~(j / 3) || ~~(i / 3) % 3 == ~~(j / 3) % 3 && i > j;
			ckmv[36][i] = false;
		}
		for (i = 0; i < 29; ++i) for (j = 0; j < 28; ++j) ckmv2_0[i][j] = ckmv[move2std[i]][move2std[j]];
		for (i = 0; i < 21; ++i) for (j = 0; j < 20; ++j) ckmv3[i][j] = ckmv[move3std[i]][move3std[j]];
		for (i = 0; i < 36; ++i) {
			skipAxis[i] = 36;
			for (j = i; j < 36; ++j) if (!ckmv[i][j]) {
				skipAxis[i] = j - 1;
				break;
			}
		}
		for (i = 0; i < 28; ++i) {
			skipAxis2[i] = 28;
			for (j = i; j < 28; ++j) if (!ckmv2_0[i][j]) {
				skipAxis2[i] = j - 1;
				break;
			}
		}
		for (i = 0; i < 20; ++i) {
			skipAxis3[i] = 20;
			for (j = i; j < 20; ++j) if (!ckmv3[i][j]) {
				skipAxis3[i] = j - 1;
				break;
			}
		}
		for (i = 0; i < 36; ++i) {
			var edge = new EdgeCube();
			doMoveEdge(edge, i);
			for (j = 0; j < 24; j++) epMoveMap[i][edge.ep[j]] = j;
		}
	}
	var ckmv, ckmv2_0, ckmv3, move2std, move2str_1, move3std, skipAxis, skipAxis2, skipAxis3, std2move, std3move, epMoveMap;
	function $doSearch(obj) {
		var MAX_LENGTH2, MAX_LENGTH3, ct, eparity, fb, fbprun, index, length12, length123, p1SolsArr, prun, rl, rlprun, s2ct, s2rl, solcube, ud, udprun;
		obj.solution = "";
		var tt = Date.now();
		ud = $getsym(new Center1().fromCube(getCenter(obj.c), 0));
		fb = $getsym(new Center1().fromCube(getCenter(obj.c), 1));
		rl = $getsym(new Center1().fromCube(getCenter(obj.c), 2));
		udprun = Center1SymPrun[ud >> 6];
		fbprun = Center1SymPrun[fb >> 6];
		rlprun = Center1SymPrun[rl >> 6];
		obj.p1SolsCnt = 0;
		obj.arr2idx = 0;
		$clear(obj.p1sols);
		for (obj.length1 = Math.min(udprun, fbprun, rlprun); obj.length1 < MAX_SEARCH_DEPTH; ++obj.length1) if (rlprun <= obj.length1 && phase1Search(obj, rl >>> 6, rl & 63, obj.length1, -1, 0) || udprun <= obj.length1 && phase1Search(obj, ud >>> 6, ud & 63, obj.length1, -1, 0) || fbprun <= obj.length1 && phase1Search(obj, fb >>> 6, fb & 63, obj.length1, -1, 0)) break;
		p1SolsArr = obj.p1sols.array.slice();
		var tt1 = Date.now() - tt;
		p1SolsArr.sort(function(a, b) {
			return a.value - b.value;
		});
		MAX_LENGTH2 = 9;
		do {
			OUT: for (length12 = p1SolsArr[0].value; length12 < MAX_SEARCH_DEPTH; ++length12) for (var i = 0; i < p1SolsArr.length; ++i) {
				var cc = p1SolsArr[i];
				if (cc.value > length12) break;
				if (length12 - cc.length1 > MAX_LENGTH2) continue;
				$copy_4(obj.c1, cc);
				var ep = $getEdge(obj.c1).ep;
				$set_2(obj.ct2, getCenter(obj.c1), parity_0(ep));
				s2ct = $getct(obj.ct2);
				s2rl = $getrl(obj.ct2);
				obj.length1 = cc.length1;
				obj.length2 = length12 - cc.length1;
				obj.epInv = [];
				for (var e = 0; e < 24; e++) obj.epInv[ep[e]] = e;
				if (phase2Search(obj, s2ct, s2rl, obj.length2, 28, 0)) break OUT;
			}
			++MAX_LENGTH2;
		} while (length12 == MAX_SEARCH_DEPTH);
		obj.arr2.sort(function(a, b) {
			return a.value - b.value;
		});
		var tt2 = Date.now() - tt - tt1;
		index = 0;
		MAX_LENGTH3 = 13;
		do {
			OUT2: for (length123 = obj.arr2[0].value; length123 < MAX_SEARCH_DEPTH; ++length123) for (var i = 0; i < Math.min(obj.arr2idx, PHASE2_SOLS); ++i) {
				if (obj.arr2[i].value > length123) break;
				obj.arr2[i].length3 = length123 - obj.arr2[i].length1 - obj.arr2[i].length2;
				if (obj.arr2[i].length3 > MAX_LENGTH3) continue;
				eparity = $set_6(obj.e12, $getEdge(obj.arr2[i]));
				$set_3(obj.ct3, getCenter(obj.arr2[i]), eparity ^ parity_0($getCorner(obj.arr2[i]).cp));
				ct = $getct_0(obj.ct3);
				$get_2(obj.e12, 10);
				for (var j = 0; j < 12; j++) obj.tempep[0][j] = obj.e12.edge[j];
				prun = getprun($getsym_0(obj.e12));
				if (prun <= obj.arr2[i].length3 && phase3Search(obj, obj.tempep[0], ct, prun, obj.arr2[i].length3, 20, 0)) {
					index = i;
					break OUT2;
				}
			}
			++MAX_LENGTH3;
		} while (length123 == MAX_SEARCH_DEPTH);
		var tt3 = Date.now() - tt - tt1 - tt2;
		solcube = new FullCube_4(obj.arr2[index]);
		obj.length1 = solcube.length1;
		obj.length2 = solcube.length2;
		obj.length3 = solcube.length3;
		for (var i = 0; i < obj.length3; ++i) $move_6(solcube, move3std[obj.move3[i]]);
		var f3 = to333Facelet(solcube);
		if (!f3) console.log("[scramble 444] Reduction Error!", toFacelet(solcube));
		for (var i = 0; i < 54; i++) f3[i] = "URFDLB"[f3[i]];
		f3 = f3.join("");
		var sol3 = scramble_333$1.solvFacelet(f3).split(" ");
		var length333 = 0;
		for (var m = 0; m < sol3.length; m++) if (/^[URFDLB][2']?$/.exec(sol3[m])) {
			length333++;
			$move_6(solcube, "URFDLB".indexOf(sol3[m][0]) * 3 + "2'".indexOf(sol3[m][1]) + 1);
		}
		obj.solution = getMoveString(solcube);
		return [
			obj.length1,
			obj.length2,
			obj.length3,
			length333,
			tt1,
			tt2,
			tt3
		];
	}
	function $init2_0(obj, sym) {
		var ctp, i, next, s2ct, s2rl;
		$copy_4(obj.c1, obj.c);
		for (i = 0; i < obj.length1; ++i) $move_6(obj.c1, obj.move1[i]);
		switch (finish_0[sym]) {
			case 0:
				$move_6(obj.c1, 24);
				$move_6(obj.c1, 35);
				obj.move1[obj.length1] = 24;
				obj.move1[obj.length1 + 1] = 35;
				obj.add1 = true;
				sym = 19;
				break;
			case 12869:
				$move_6(obj.c1, 18);
				$move_6(obj.c1, 29);
				obj.move1[obj.length1] = 18;
				obj.move1[obj.length1 + 1] = 29;
				obj.add1 = true;
				sym = 34;
				break;
			case 735470:
				obj.add1 = false;
				sym = 0;
		}
		$set_2(obj.ct2, getCenter(obj.c1), parity_0($getEdge(obj.c1).ep));
		s2ct = $getct(obj.ct2);
		s2rl = $getrl(obj.ct2);
		ctp = ctprun[s2ct * 70 + s2rl];
		obj.c1.value = ctp + obj.length1;
		obj.c1.length1 = obj.length1;
		obj.c1.add1 = obj.add1;
		obj.c1.sym = sym;
		++obj.p1SolsCnt;
		if (obj.p1sols.size < PHASE2_ATTS) next = new FullCube_4(obj.c1);
		else {
			next = $poll(obj.p1sols);
			next.value > obj.c1.value && $copy_4(next, obj.c1);
		}
		$add(obj.p1sols, next);
		return obj.p1SolsCnt == PHASE1_SOLS;
	}
	function $init3(obj) {
		if (!checkPhase2Edge(obj.epInv, obj.move2, obj.length2)) return false;
		var ct, eparity, i, prun;
		$copy_4(obj.c2, obj.c1);
		for (i = 0; i < obj.length2; ++i) $move_6(obj.c2, obj.move2[i]);
		eparity = $set_6(obj.e12, $getEdge(obj.c2));
		$set_3(obj.ct3, getCenter(obj.c2), eparity ^ parity_0($getCorner(obj.c2).cp));
		ct = $getct_0(obj.ct3);
		$get_2(obj.e12, 10);
		prun = getprun($getsym_0(obj.e12));
		!obj.arr2[obj.arr2idx] ? obj.arr2[obj.arr2idx] = new FullCube_4(obj.c2) : $copy_4(obj.arr2[obj.arr2idx], obj.c2);
		obj.arr2[obj.arr2idx].value = obj.length1 + obj.length2 + Math.max(prun, prun_0[ct]);
		obj.arr2[obj.arr2idx].length2 = obj.length2;
		++obj.arr2idx;
		return obj.arr2idx == obj.arr2.length;
	}
	function phase1Search(obj, ct, sym, maxl, lm, depth) {
		var axis, ctx, m_0, power, prun, symx;
		if (ct == 0) return maxl == 0 && $init2_0(obj, sym);
		for (axis = 0; axis < 27; axis += 3) {
			if (axis == lm || axis == lm - 9 || axis == lm - 18) continue;
			for (power = 0; power < 3; ++power) {
				m_0 = axis + power;
				ctx = Center1SymMove[ct][SymMove[sym][m_0]];
				prun = Center1SymPrun[ctx >>> 6];
				if (prun >= maxl) {
					if (prun > maxl) break;
					continue;
				}
				symx = SymMult[sym][ctx & 63];
				ctx >>>= 6;
				obj.move1[depth] = m_0;
				if (phase1Search(obj, ctx, symx, maxl - 1, axis, depth + 1)) return true;
			}
		}
		return false;
	}
	function phase2Search(obj, ct, rl, maxl, lm, depth) {
		var ctx, m_0, prun, rlx;
		if (ct == 0 && ctprun[rl] == 0 && maxl < 5) return maxl == 0 && $init3(obj);
		for (m_0 = 0; m_0 < 23; ++m_0) {
			if (ckmv2_0[lm][m_0]) {
				m_0 = skipAxis2[m_0];
				continue;
			}
			ctx = ctmv[ct][m_0];
			rlx = rlmv[rl][m_0];
			prun = ctprun[ctx * 70 + rlx];
			if (prun >= maxl) {
				prun > maxl && (m_0 = skipAxis2[m_0]);
				continue;
			}
			obj.move2[depth] = move2std[m_0];
			if (phase2Search(obj, ctx, rlx, maxl - 1, m_0, depth + 1)) return true;
		}
		return false;
	}
	function phase3Search(obj, eplast, ct, prun, maxl, lm, depth) {
		if (maxl == 0) return true;
		var ep = obj.tempep[depth];
		if (lm != 20) {
			var movo = mvroto[lm << 3];
			var mov = mvrot[lm << 3];
			for (var i = 0; i < 12; i++) ep[i] = movo[eplast[mov[i]]];
		}
		for (var m = 0; m < 17; m++) {
			if (ckmv3[lm][m]) {
				m = skipAxis3[m];
				continue;
			}
			var ctx = ctmove[ct][m];
			var prun1 = prun_0[ctx];
			if (prun1 >= maxl) {
				prun1 > maxl && m < 14 && (m = skipAxis3[m]);
				continue;
			}
			var prunx = getprun_0(getMvSym(ep, m) >> 3, prun);
			if (prunx >= maxl) {
				prunx > maxl && m < 14 && (m = skipAxis3[m]);
				continue;
			}
			if (phase3Search(obj, ep, ctx, prunx, maxl - 1, m, depth + 1)) {
				obj.move3[depth] = m;
				return true;
			}
		}
		return false;
	}
	function Search_4() {
		var i;
		this.p1sols = new PriorityQueue_0();
		this.move1 = createArray(15);
		this.move2 = createArray(20);
		this.move3 = createArray(20);
		this.c1 = new FullCube_3();
		this.c2 = new FullCube_3();
		this.ct2 = new Center2();
		this.ct3 = new Center3();
		this.e12 = new Edge3_0();
		this.tempep = createArray(20);
		this.arr2 = createArray(PHASE2_SOLS);
		for (i = 0; i < 20; ++i) this.tempep[i] = [];
		this.add1 = false;
		this.arr2idx = 0;
		this.c = null;
		this.length1 = 0;
		this.length2 = 0;
		this.p1SolsCnt = 0;
		this.solution = "";
	}
	function parity_0(arr) {
		var parity = 0;
		var mask = 0;
		for (var i = 0; i < arr.length; i++) {
			var val = arr[i];
			parity ^= val - mathlib.bitCount(mask & (1 << val) - 1);
			mask |= 1 << val;
		}
		return parity & 1;
	}
	function swap(arr, a, b, c, d, key) {
		var temp;
		switch (key) {
			case 0:
				temp = arr[d];
				arr[d] = arr[c];
				arr[c] = arr[b];
				arr[b] = arr[a];
				arr[a] = temp;
				return;
			case 1:
				temp = arr[a];
				arr[a] = arr[c];
				arr[c] = temp;
				temp = arr[b];
				arr[b] = arr[d];
				arr[d] = temp;
				return;
			case 2:
				temp = arr[a];
				arr[a] = arr[b];
				arr[b] = arr[c];
				arr[c] = arr[d];
				arr[d] = temp;
				return;
		}
	}
	function $add(obj, o) {
		if ($offer(obj, o)) return true;
	}
	function $add_0(obj, o) {
		obj.array[obj.size++] = o;
		return true;
	}
	function $clear(obj) {
		obj.array = [];
		obj.size = 0;
	}
	function $get_4(obj, index) {
		return obj.array[index];
	}
	function $remove_0(obj, index) {
		var previous = obj.array[index];
		obj.array.splice(index, 1);
		--obj.size;
		return previous;
	}
	function $set_7(obj, index, o) {
		var previous = obj.array[index];
		obj.array[index] = o;
		return previous;
	}
	function PriorityQueue_0() {
		this.array = [];
		this.array.length = PHASE2_ATTS;
		this.size = 0;
	}
	function binarySearch_0(sortedArray, key) {
		var high, low = 0, mid, midVal;
		high = sortedArray.length - 1;
		while (low <= high) {
			mid = low + (high - low >> 1);
			midVal = sortedArray[mid];
			if (midVal < key) low = mid + 1;
			else if (midVal > key) high = mid - 1;
			else return mid;
		}
		return -low - 1;
	}
	function fill_0(a) {
		for (var i = 0; i < a.length; i++) a[i] = -1;
	}
	function $mergeHeaps(obj, node) {
		var heapSize = obj.size, smallestChild, value = $get_4(obj, node), leftChild, rightChild, smallestChild_0;
		while (node * 2 + 1 < heapSize) {
			smallestChild = (leftChild = 2 * node + 1, rightChild = leftChild + 1, smallestChild_0 = leftChild, rightChild < heapSize && $compare_0($get_4(obj, rightChild), $get_4(obj, leftChild)) < 0 && (smallestChild_0 = rightChild), smallestChild_0);
			if ($compare_0(value, $get_4(obj, smallestChild)) < 0) break;
			$set_7(obj, node, $get_4(obj, smallestChild));
			node = smallestChild;
		}
		$set_7(obj, node, value);
	}
	function $offer(obj, e) {
		var childNode, node = obj.size;
		$add_0(obj, e);
		while (node > 0) {
			childNode = node;
			node = node - 1 >> 1;
			if ($compare_0($get_4(obj, node), e) <= 0) {
				$set_7(obj, childNode, e);
				return true;
			}
			$set_7(obj, childNode, $get_4(obj, node));
		}
		$set_7(obj, node, e);
		return true;
	}
	function $poll(obj) {
		var value;
		if (obj.size == 0) return null;
		value = $get_4(obj, 0);
		$removeAtIndex(obj);
		return value;
	}
	function $removeAtIndex(obj) {
		var lastValue = $remove_0(obj, obj.size - 1);
		if (0 < obj.size) {
			$set_7(obj, 0, lastValue);
			$mergeHeaps(obj, 0);
		}
	}
	var searcher;
	function init() {
		init = nullMethod;
		$clinit_Moves();
		$clinit_Center1();
		$clinit_Center2();
		$clinit_Center3();
		$clinit_Edge3();
		$clinit_CornerCube();
		$clinit_FullCube_0();
		initSymMeta();
		Center1Raw2Sym = createArray(735471);
		initCenter1Sym2Raw();
		initCenter1MoveTable();
		Center1Raw2Sym = null;
		initCenter1Prun();
		initCenter2();
		initCenter3();
		initEdge3MvRot();
		initEdge3Sym2Raw();
		initEdge3Prun();
		searcher = new Search_4();
	}
	function partialSolvedState(ctMask, edMask, cnMask, neut) {
		var facelet;
		var colmap = [
			0,
			1,
			2,
			3,
			4,
			5
		];
		if (neut) {
			var ori = mathlib.rn([
				1,
				4,
				8,
				1,
				1,
				1,
				24
			][neut]);
			if (ori >= 8) {
				mathlib.acycle(colmap, [
					0,
					1,
					2
				], ori >> 3);
				mathlib.acycle(colmap, [
					3,
					4,
					5
				], ori >> 3);
				ori &= 7;
			}
			if (ori >= 4) {
				mathlib.acycle(colmap, [
					0,
					1,
					3,
					4
				], 2);
				ori &= 3;
			}
			if (ori >= 1) mathlib.acycle(colmap, [
				1,
				2,
				4,
				5
			], ori);
		}
		var solved = true;
		for (var _ = 0; solved && _ < 100; _++) {
			var cc = new FullCube_3();
			var ctSwaps = [];
			var edSwaps = [];
			var cnSwaps = [];
			for (var i = 0; i < 24; i++) {
				if (ctMask >> i & 1) ctSwaps.push(i);
				if (edMask >> i & 1) edSwaps.push(i);
				if (cnMask >> i & 1) cnSwaps.push(i);
			}
			var ctPerm = mathlib.rndPerm(ctSwaps.length);
			for (var i = 0; i < ctSwaps.length; i++) cc.center.ct[ctSwaps[i]] = centerFacelet[ctSwaps[ctPerm[i]]] >> 4;
			var edPerm = mathlib.rndPerm(edSwaps.length);
			for (var i = 0; i < edSwaps.length; i++) cc.edge.ep[edSwaps[i]] = edSwaps[edPerm[i]];
			var cnPerm = mathlib.rndPerm(cnSwaps.length);
			var coSum = 24;
			for (var i = 0; i < cnSwaps.length; i++) {
				var co = mathlib.rn(3);
				cc.corner.co[cnSwaps[i]] = co;
				cc.corner.cp[cnSwaps[i]] = cnSwaps[cnPerm[i]];
				coSum -= co;
			}
			if (coSum % 3 != 0) cc.corner.co[cnSwaps[0]] = (cc.corner.co[cnSwaps[0]] + coSum) % 3;
			facelet = toFacelet(cc);
			for (var i = 0; i < 96; i++) {
				facelet[i] = "URFDLB".charAt(colmap[facelet[i]]);
				if (facelet[i] != facelet[i >> 4 << 4]) solved = false;
			}
		}
		return facelet.join("");
	}
	function genFacelet(facelet) {
		init();
		facelet = facelet.split("");
		for (var i = 0; i < 96; i++) facelet[i] = "URFDLB".indexOf(facelet[i]);
		searcher.c = new FullCube_3();
		var chk = $fromFacelet(searcher.c, facelet);
		if (chk != 0) console.log("[scramble 444] State Check Error!", chk, facelet);
		$doSearch(searcher);
		return searcher.solution.replace(/\s+/g, " ");
	}
	function testbench(nsolv) {
		init();
		nsolv = nsolv || 100;
		var avgs = [];
		for (var i = 0; i < nsolv; i++) {
			var facelet = partialSolvedState(16777215, 16777215, 255).split("");
			for (var j = 0; j < 96; j++) facelet[j] = "URFDLB".indexOf(facelet[j]);
			searcher.c = new FullCube_3();
			var chk = $fromFacelet(searcher.c, facelet);
			if (chk != 0) console.log("[scramble 444] State Check Error!", chk, facelet);
			var data = $doSearch(searcher);
			for (var j = 0; j < data.length; j++) avgs[j] = (avgs[j] || 0) + data[j];
			console.log(avgs.map((x) => ~~(100 * x / (i + 1)) / 100));
		}
	}
	function getPartialScramble(ctMask, edMask, cnMask, neut) {
		return genFacelet(partialSolvedState(ctMask, edMask, cnMask, neut));
	}
	function getRandomScramble() {
		return genFacelet(partialSolvedState(16777215, 16777215, 255));
	}
	function getYauUD3CScramble(type, length, cases, neut) {
		return getPartialScramble(16776960, 16715760 | 4097 << mathlib.rn(4), 255, neut);
	}
	function getHoyaRLDAScramble(type, length, cases, neut) {
		return getPartialScramble(240 | 3840 << mathlib.rn(2) * 4, 16777215, 255, neut);
	}
	function getHoyaRLCAScramble(type, length, cases, neut) {
		return getPartialScramble(240 | 3840 << mathlib.rn(2) * 4, 16715760, 255, neut);
	}
	function getEdgeScramble() {
		return getPartialScramble(0, 16777215, 255);
	}
	function getEdgeOnlyScramble() {
		return getPartialScramble(0, 16777215, 0);
	}
	function getCenterOnlyScramble() {
		return getPartialScramble(16777215, 0, 0);
	}
	function getLastLayerScramble(type, length, cases, neut) {
		return getPartialScramble(0, 983280, 240, neut);
	}
	function getCenterUDSolvedScramble(type, length, cases, neut) {
		return getPartialScramble(16776960, 16777215, 255, neut);
	}
	function getCenterRLSolvedScramble(type, length, cases, neut) {
		return getPartialScramble(65535, 16777215, 255, neut);
	}
	function appendRotationFix(scramble, targetFace) {
		var testCube = new FullCube_3();
		var moves = scramble.trim().split(/\s+/);
		for (var mi = 0; mi < moves.length; mi++) {
			var mv = moves[mi];
			while (mv.length < 3) mv += " ";
			var mvIdx = move2str_1.indexOf(mv);
			if (mvIdx >= 0) $move_6(testCube, mvIdx);
		}
		var f = toFacelet(testCube);
		var faceCenters = [
			5,
			21,
			37,
			53,
			69,
			85
		];
		var uColorAt = -1;
		for (var fi = 0; fi < 6; fi++) if (f[faceCenters[fi]] == 0) {
			uColorAt = fi;
			break;
		}
		var rotTable = [
			[
				"",
				"z",
				"x'",
				"z2",
				"z'",
				"x"
			],
			[
				"z'",
				"",
				"y",
				"z",
				"z2",
				"y'"
			],
			[
				"x",
				"y'",
				"",
				"x'",
				"y",
				"x2"
			],
			[
				"z2",
				"z'",
				"x",
				"",
				"z",
				"x'"
			],
			[
				"z",
				"z2",
				"y'",
				"z'",
				"",
				"y"
			],
			[
				"x'",
				"y",
				"x2",
				"x",
				"y'",
				""
			]
		];
		targetFace = targetFace || 0;
		var rot = rotTable[uColorAt][targetFace];
		if (rot) scramble = scramble + " " + rot;
		return scramble.replace(/\s+/g, " ").trim();
	}
	function getLast8DedgeScramble(type, length, cases, neut) {
		return appendRotationFix(getPartialScramble(0, 15793935, 255, neut), 0);
	}
	function getELLScramble(type, length, cases, neut) {
		return getPartialScramble(0, 983280, 0, neut);
	}
	function applyColorNeutrality(neut) {
		var colmap = [
			0,
			1,
			2,
			3,
			4,
			5
		];
		if (neut) {
			var ori = mathlib.rn([
				1,
				4,
				8,
				1,
				1,
				1,
				24
			][neut]);
			if (ori >= 8) {
				mathlib.acycle(colmap, [
					0,
					1,
					2
				], ori >> 3);
				mathlib.acycle(colmap, [
					3,
					4,
					5
				], ori >> 3);
				ori &= 7;
			}
			if (ori >= 4) {
				mathlib.acycle(colmap, [
					0,
					1,
					3,
					4
				], 2);
				ori &= 3;
			}
			if (ori >= 1) mathlib.acycle(colmap, [
				1,
				2,
				4,
				5
			], ori);
		}
		return colmap;
	}
	var llU = [
		3,
		0,
		1,
		2
	];
	var llUPow = [[
		0,
		1,
		2,
		3
	], llU];
	llUPow[2] = llUPow[1].map(function(_, i) {
		return llU[llUPow[1][i]];
	});
	llUPow[3] = llUPow[2].map(function(_, i) {
		return llU[llUPow[2][i]];
	});
	function llConjugate(perm, k) {
		if (k == 0) return perm.slice();
		var uk = llUPow[k];
		var uinv = llUPow[(4 - k) % 4];
		return perm.map(function(_, i) {
			return uk[perm[uinv[i]]];
		});
	}
	function permuteByU(arr, k) {
		if (k == 0) return arr.slice();
		var u = llUPow[k];
		var result = [];
		for (var i = 0; i < 4; i++) result[u[i]] = arr[i];
		return result;
	}
	function fillRandomPerm(arr, n) {
		var free = [], used = {};
		for (var i = 0; i < n; i++) if (arr[i] != -1) used[arr[i]] = true;
		for (var i = 0; i < n; i++) if (!used[i]) free.push(i);
		for (var i = free.length - 1; i > 0; i--) {
			var j = mathlib.rn(i + 1);
			var tmp = free[i];
			free[i] = free[j];
			free[j] = tmp;
		}
		for (var i = 0, fi = 0; i < n; i++) if (arr[i] == -1) arr[i] = free[fi++];
	}
	function fillRandomOri(arr, n, base) {
		var sum = 0;
		var last = -1;
		for (var i = 0; i < n; i++) if (arr[i] == -1) last = i;
		else sum += arr[i];
		for (var i = 0; i < n; i++) if (arr[i] == -1 && i != last) {
			arr[i] = mathlib.rn(base);
			sum += arr[i];
		}
		if (last != -1) arr[last] = (base - sum % base) % base;
	}
	function get444LLScramble(_ep, _eo, _cp, _co, neut, _rndpre, _rndapp, rotFix) {
		var ep = _ep.slice();
		var eo = _eo.slice();
		var cp = _cp.slice();
		var co = _co.slice();
		fillRandomPerm(ep, 4);
		fillRandomPerm(cp, 4);
		for (var i = 0; i < 4; i++) if (eo[i] == -1) eo[i] = mathlib.rn(2);
		fillRandomOri(co, 4, 3);
		if (_rndpre && _rndpre.length > 0) {
			var k = _rndpre[mathlib.rn(_rndpre.length)];
			if (k > 0) {
				ep = llConjugate(ep, k);
				cp = llConjugate(cp, k);
				eo = permuteByU(eo, k);
				co = permuteByU(co, k);
			}
		}
		if (_rndapp && _rndapp.length > 0) {
			var k = _rndapp[mathlib.rn(_rndapp.length)];
			if (k > 0) {
				var u = llUPow[k];
				var newEp = [], newEo = [], newCp = [], newCo = [];
				for (var i = 0; i < 4; i++) {
					newEp[u[i]] = ep[i];
					newEo[u[i]] = eo[i];
					newCp[u[i]] = cp[i];
					newCo[u[i]] = co[i];
				}
				ep = newEp;
				eo = newEo;
				cp = newCp;
				co = newCo;
			}
		}
		var cc = new FullCube_3();
		for (var i = 0; i < 4; i++) {
			cc.corner.cp[i] = cp[i];
			cc.corner.co[i] = co[i];
		}
		for (var i = 0; i < 4; i++) {
			var src = ep[i];
			if (eo[i]) {
				cc.edge.ep[i] = src + 12;
				cc.edge.ep[i + 12] = src;
			} else {
				cc.edge.ep[i] = src;
				cc.edge.ep[i + 12] = src + 12;
			}
		}
		var colmap = applyColorNeutrality(neut);
		var facelet = toFacelet(cc);
		for (var i = 0; i < 96; i++) facelet[i] = "URFDLB".charAt(colmap[facelet[i]]);
		var scramble = genFacelet(facelet.join("")).replace(/^\s+/, "");
		if (rotFix !== void 0 && rotFix !== false) scramble = appendRotationFix(scramble, rotFix);
		return scramble;
	}
	var ppll_map = [
		[
			[
				2,
				1,
				0,
				3
			],
			[
				0,
				1,
				2,
				3
			],
			2,
			"EPLL-Opp"
		],
		[
			[
				0,
				1,
				3,
				2
			],
			[
				0,
				1,
				2,
				3
			],
			4,
			"EPLL-Adj"
		],
		[
			[
				3,
				0,
				1,
				2
			],
			[
				0,
				1,
				2,
				3
			],
			1,
			"EPLL-O-"
		],
		[
			[
				1,
				2,
				3,
				0
			],
			[
				0,
				1,
				2,
				3
			],
			1,
			"EPLL-O+"
		],
		[
			[
				2,
				3,
				1,
				0
			],
			[
				0,
				1,
				2,
				3
			],
			4,
			"EPLL-W"
		],
		[
			[
				0,
				1,
				2,
				3
			],
			[
				2,
				1,
				0,
				3
			],
			2,
			"CPLL-pN"
		],
		[
			[
				0,
				1,
				2,
				3
			],
			[
				3,
				1,
				2,
				0
			],
			4,
			"CPLL-pJ"
		],
		[
			[
				2,
				3,
				0,
				1
			],
			[
				3,
				1,
				2,
				0
			],
			4,
			"CPLL-M"
		],
		[
			[
				1,
				2,
				0,
				3
			],
			[
				2,
				1,
				0,
				3
			],
			4,
			"Diag-Sa"
		],
		[
			[
				3,
				1,
				0,
				2
			],
			[
				0,
				3,
				2,
				1
			],
			4,
			"Diag-Sb"
		],
		[
			[
				0,
				3,
				2,
				1
			],
			[
				3,
				2,
				1,
				0
			],
			1,
			"Diag-Q"
		],
		[
			[
				2,
				1,
				0,
				3
			],
			[
				3,
				2,
				1,
				0
			],
			1,
			"Diag-X"
		],
		[
			[
				1,
				0,
				3,
				2
			],
			[
				0,
				2,
				1,
				3
			],
			4,
			"Adj-Ka"
		],
		[
			[
				3,
				2,
				1,
				0
			],
			[
				0,
				2,
				1,
				3
			],
			4,
			"Adj-Kb"
		],
		[
			[
				3,
				1,
				0,
				2
			],
			[
				3,
				1,
				2,
				0
			],
			4,
			"Adj-Pa"
		],
		[
			[
				2,
				1,
				3,
				0
			],
			[
				3,
				1,
				2,
				0
			],
			4,
			"Adj-Pb"
		],
		[
			[
				0,
				1,
				3,
				2
			],
			[
				0,
				2,
				3,
				1
			],
			4,
			"Adj-Ba"
		],
		[
			[
				0,
				2,
				1,
				3
			],
			[
				3,
				1,
				0,
				2
			],
			4,
			"Adj-Bb"
		],
		[
			[
				0,
				3,
				1,
				2
			],
			[
				1,
				0,
				2,
				3
			],
			4,
			"Adj-Ca"
		],
		[
			[
				0,
				2,
				3,
				1
			],
			[
				1,
				0,
				2,
				3
			],
			4,
			"Adj-Cb"
		],
		[
			[
				2,
				0,
				1,
				3
			],
			[
				0,
				1,
				3,
				2
			],
			4,
			"Adj-Da"
		],
		[
			[
				2,
				1,
				3,
				0
			],
			[
				0,
				1,
				3,
				2
			],
			4,
			"Adj-Db"
		],
		[
			[
				2,
				3,
				0,
				1
			],
			[
				0,
				1,
				2,
				3
			],
			1,
			"PLL-H"
		],
		[
			[
				3,
				0,
				2,
				1
			],
			[
				0,
				1,
				2,
				3
			],
			4,
			"PLL-Ua"
		],
		[
			[
				1,
				3,
				2,
				0
			],
			[
				0,
				1,
				2,
				3
			],
			4,
			"PLL-Ub"
		],
		[
			[
				3,
				2,
				1,
				0
			],
			[
				0,
				1,
				2,
				3
			],
			2,
			"PLL-Z"
		],
		[
			[
				0,
				1,
				2,
				3
			],
			[
				1,
				2,
				0,
				3
			],
			4,
			"PLL-Aa"
		],
		[
			[
				0,
				1,
				2,
				3
			],
			[
				2,
				0,
				1,
				3
			],
			4,
			"PLL-Ab"
		],
		[
			[
				0,
				1,
				2,
				3
			],
			[
				1,
				0,
				3,
				2
			],
			2,
			"PLL-E"
		],
		[
			[
				0,
				3,
				2,
				1
			],
			[
				1,
				0,
				2,
				3
			],
			4,
			"PLL-F"
		],
		[
			[
				2,
				0,
				1,
				3
			],
			[
				1,
				2,
				0,
				3
			],
			4,
			"PLL-Ga"
		],
		[
			[
				1,
				2,
				0,
				3
			],
			[
				2,
				0,
				1,
				3
			],
			4,
			"PLL-Gb"
		],
		[
			[
				1,
				3,
				2,
				0
			],
			[
				2,
				0,
				1,
				3
			],
			4,
			"PLL-Gc"
		],
		[
			[
				3,
				0,
				2,
				1
			],
			[
				1,
				2,
				0,
				3
			],
			4,
			"PLL-Gd"
		],
		[
			[
				3,
				1,
				2,
				0
			],
			[
				1,
				0,
				2,
				3
			],
			4,
			"PLL-Ja"
		],
		[
			[
				1,
				0,
				2,
				3
			],
			[
				1,
				0,
				2,
				3
			],
			4,
			"PLL-Jb"
		],
		[
			[
				2,
				1,
				0,
				3
			],
			[
				2,
				1,
				0,
				3
			],
			1,
			"PLL-Na"
		],
		[
			[
				0,
				3,
				2,
				1
			],
			[
				2,
				1,
				0,
				3
			],
			1,
			"PLL-Nb"
		],
		[
			[
				0,
				1,
				3,
				2
			],
			[
				1,
				0,
				2,
				3
			],
			4,
			"PLL-Ra"
		],
		[
			[
				0,
				2,
				1,
				3
			],
			[
				1,
				0,
				2,
				3
			],
			4,
			"PLL-Rb"
		],
		[
			[
				2,
				1,
				0,
				3
			],
			[
				1,
				0,
				2,
				3
			],
			4,
			"PLL-T"
		],
		[
			[
				1,
				0,
				2,
				3
			],
			[
				2,
				1,
				0,
				3
			],
			4,
			"PLL-V"
		],
		[
			[
				3,
				1,
				2,
				0
			],
			[
				2,
				1,
				0,
				3
			],
			4,
			"PLL-Y"
		]
	];
	var ppllprobs = mathlib.idxArray(ppll_map, 2);
	var ppllfilter = mathlib.idxArray(ppll_map, 3);
	function getPPLLScramble(type, length, cases, neut) {
		var c = ppll_map[scrMgr.fixCase(cases, ppllprobs)];
		return get444LLScramble(c[0], [
			0,
			0,
			0,
			0
		], c[1], [
			0,
			0,
			0,
			0
		], neut, [
			0,
			1,
			2,
			3
		], [
			0,
			1,
			2,
			3
		], 0);
	}
	var ppllImgParam = [
		[
			"BFBRRRFBFLLL",
			[7, 1],
			[1, 7]
		],
		[
			"LBLBLBRRRFFF",
			[7, 5],
			[5, 7]
		],
		[
			"BRBRFRFLFLBL",
			[1, 3],
			[3, 7],
			[7, 5],
			[5, 1]
		],
		[
			"BLBRBRFRFLFL",
			[1, 5],
			[5, 7],
			[7, 3],
			[3, 1]
		],
		["BRBRLRFBFLFL"],
		[
			"LLRFBBRRLBFF",
			[0, 8],
			[8, 0]
		],
		[
			"RRFLFRFLLBBB",
			[2, 8],
			[8, 2]
		],
		["RLFLBRFRLBFB"],
		["LRRFLBRBLBFF"],
		["FFBRBLBRFLLR"],
		["RFLBRFLBRFLB"],
		["RBLBLFLFRFRB"],
		["RRLBBRFLFLFB"],
		["RLLBFRFRFLBB"],
		["BRRFFBRBFLLL"],
		["FBLBFFLLBRRR"],
		["BRRFLBRFFLBL"],
		["RRFLBRFFLBLB"],
		["BLFLRBRFRFBL"],
		["FRBRBFLFLBLR"],
		["BFBRRFLLRFBL"],
		["LRLBLRFBBRFF"],
		[
			"BFBRLRFBFLRL",
			[1, 7],
			[3, 5]
		],
		[
			"BRBRLRFFFLBL",
			[3, 7],
			[7, 5],
			[5, 3]
		],
		[
			"BLBRBRFFFLRL",
			[3, 5],
			[5, 7],
			[7, 3]
		],
		[
			"LFLBRBRBRFLF",
			[1, 5],
			[3, 7]
		],
		[
			"LBBRRLBFRFLF",
			[0, 2],
			[2, 6],
			[6, 0]
		],
		[
			"RBFLRRFFLBLB",
			[0, 6],
			[6, 8],
			[8, 0]
		],
		[
			"LBRFRBRFLBLF",
			[0, 6],
			[2, 8]
		],
		[
			"BFRFRBRBFLLL",
			[1, 7],
			[2, 8]
		],
		["BRRFLBRBFLFL"],
		["BFRFBBRLFLRL"],
		["BFRFLBRRFLBL"],
		["BLRFFBRBFLRL"],
		[
			"BBRFFBRRFLLL",
			[1, 5],
			[2, 8]
		],
		[
			"LBBRLLBRRFFF",
			[2, 8],
			[5, 7]
		],
		[
			"FBBRLLBFFLRR",
			[2, 6],
			[3, 5]
		],
		[
			"BBFLLRFFBRRL",
			[0, 8],
			[3, 5]
		],
		[
			"LLBRBLBFRFRF",
			[1, 3],
			[2, 8]
		],
		[
			"RBFLFRFLLBRB",
			[2, 8],
			[3, 7]
		],
		[
			"BBRFLBRFFLRL",
			[2, 8],
			[3, 5]
		],
		[
			"BBFLFRFRBRLL",
			[0, 8],
			[1, 5]
		],
		[
			"BBFLRRFLBRFL",
			[0, 8],
			[1, 3]
		]
	];
	function getPPLLImage(cases, canvas) {
		var sideStickers3 = ppllImgParam[cases][0];
		var arrows3 = ppllImgParam[cases].slice(1);
		if (arrows3.length == 2) arrows3 = arrows3.concat([[arrows3[0][1], arrows3[0][0]], [arrows3[1][1], arrows3[1][0]]]);
		var uFace = "DDDDDDDDDDDDDDDD";
		var side4 = "";
		for (var s = 0; s < 4; s++) {
			var c1 = sideStickers3[s * 3];
			var e = sideStickers3[s * 3 + 1];
			var c2 = sideStickers3[s * 3 + 2];
			side4 += c1 + e + e + c2;
		}
		var arrowMap = [
			[0, 0],
			[1.5, 0],
			[3, 0],
			[0, 1.5],
			[1.5, 1.5],
			[3, 1.5],
			[0, 3],
			[1.5, 3],
			[3, 3]
		];
		var arrows4 = [];
		for (var i = 0; i < arrows3.length; i++) arrows4.push([arrowMap[arrows3[i][0]], arrowMap[arrows3[i][1]]]);
		var llParam = [uFace + side4, arrows4];
		if (!canvas) return llParam.concat([ppllfilter[cases]]);
		image.llImage.drawImage(llParam[0], llParam[1], canvas);
	}
	var poll_map = [
		[
			[
				2,
				0,
				2,
				2
			],
			0,
			3,
			4,
			"3E-S-F"
		],
		[
			[
				2,
				0,
				2,
				2
			],
			3,
			3,
			4,
			"3E-S-R"
		],
		[
			[
				2,
				0,
				2,
				2
			],
			2,
			3,
			4,
			"3E-S-B"
		],
		[
			[
				2,
				0,
				2,
				2
			],
			1,
			3,
			4,
			"3E-S-L"
		],
		[
			[
				0,
				1,
				1,
				1
			],
			0,
			3,
			4,
			"3E-A-F"
		],
		[
			[
				0,
				1,
				1,
				1
			],
			3,
			3,
			4,
			"3E-A-R"
		],
		[
			[
				0,
				1,
				1,
				1
			],
			2,
			3,
			4,
			"3E-A-B"
		],
		[
			[
				0,
				1,
				1,
				1
			],
			1,
			3,
			4,
			"3E-A-L"
		],
		[
			[
				0,
				0,
				1,
				2
			],
			0,
			3,
			4,
			"3E-T-F"
		],
		[
			[
				0,
				0,
				1,
				2
			],
			3,
			3,
			4,
			"3E-T-R"
		],
		[
			[
				0,
				0,
				1,
				2
			],
			2,
			3,
			4,
			"3E-T-B"
		],
		[
			[
				0,
				0,
				1,
				2
			],
			1,
			3,
			4,
			"3E-T-L"
		],
		[
			[
				0,
				1,
				0,
				2
			],
			0,
			3,
			4,
			"3E-L-F"
		],
		[
			[
				0,
				1,
				0,
				2
			],
			3,
			3,
			4,
			"3E-L-R"
		],
		[
			[
				0,
				1,
				0,
				2
			],
			2,
			3,
			4,
			"3E-L-B"
		],
		[
			[
				0,
				1,
				0,
				2
			],
			1,
			3,
			4,
			"3E-L-L"
		],
		[
			[
				0,
				0,
				2,
				1
			],
			0,
			3,
			4,
			"3E-U-F"
		],
		[
			[
				0,
				0,
				2,
				1
			],
			3,
			3,
			4,
			"3E-U-R"
		],
		[
			[
				0,
				0,
				2,
				1
			],
			2,
			3,
			4,
			"3E-U-B"
		],
		[
			[
				0,
				0,
				2,
				1
			],
			1,
			3,
			4,
			"3E-U-L"
		],
		[
			[
				2,
				2,
				1,
				1
			],
			0,
			3,
			4,
			"3E-Pi-F"
		],
		[
			[
				2,
				2,
				1,
				1
			],
			3,
			3,
			4,
			"3E-Pi-R"
		],
		[
			[
				2,
				2,
				1,
				1
			],
			2,
			3,
			4,
			"3E-Pi-B"
		],
		[
			[
				2,
				2,
				1,
				1
			],
			1,
			3,
			4,
			"3E-Pi-L"
		],
		[
			[
				2,
				1,
				2,
				1
			],
			0,
			3,
			4,
			"3E-H-F"
		],
		[
			[
				2,
				1,
				2,
				1
			],
			3,
			3,
			4,
			"3E-H-R"
		],
		[
			[
				0,
				0,
				0,
				0
			],
			0,
			3,
			4,
			"3E-O-F"
		],
		[
			[
				2,
				0,
				2,
				2
			],
			0,
			1,
			4,
			"1E-S-F"
		],
		[
			[
				2,
				0,
				2,
				2
			],
			3,
			1,
			4,
			"1E-S-R"
		],
		[
			[
				2,
				0,
				2,
				2
			],
			2,
			1,
			4,
			"1E-S-B"
		],
		[
			[
				2,
				0,
				2,
				2
			],
			1,
			1,
			4,
			"1E-S-L"
		],
		[
			[
				0,
				1,
				1,
				1
			],
			0,
			1,
			4,
			"1E-A-F"
		],
		[
			[
				0,
				1,
				1,
				1
			],
			3,
			1,
			4,
			"1E-A-R"
		],
		[
			[
				0,
				1,
				1,
				1
			],
			2,
			1,
			4,
			"1E-A-B"
		],
		[
			[
				0,
				1,
				1,
				1
			],
			1,
			1,
			4,
			"1E-A-L"
		],
		[
			[
				0,
				0,
				1,
				2
			],
			0,
			1,
			4,
			"1E-T-F"
		],
		[
			[
				0,
				0,
				1,
				2
			],
			3,
			1,
			4,
			"1E-T-R"
		],
		[
			[
				0,
				0,
				1,
				2
			],
			2,
			1,
			4,
			"1E-T-B"
		],
		[
			[
				0,
				0,
				1,
				2
			],
			1,
			1,
			4,
			"1E-T-L"
		],
		[
			[
				0,
				1,
				0,
				2
			],
			0,
			1,
			4,
			"1E-L-F"
		],
		[
			[
				0,
				1,
				0,
				2
			],
			3,
			1,
			4,
			"1E-L-R"
		],
		[
			[
				0,
				1,
				0,
				2
			],
			2,
			1,
			4,
			"1E-L-B"
		],
		[
			[
				0,
				1,
				0,
				2
			],
			1,
			1,
			4,
			"1E-L-L"
		],
		[
			[
				0,
				0,
				2,
				1
			],
			0,
			1,
			4,
			"1E-U-F"
		],
		[
			[
				0,
				0,
				2,
				1
			],
			3,
			1,
			4,
			"1E-U-R"
		],
		[
			[
				0,
				0,
				2,
				1
			],
			2,
			1,
			4,
			"1E-U-B"
		],
		[
			[
				0,
				0,
				2,
				1
			],
			1,
			1,
			4,
			"1E-U-L"
		],
		[
			[
				2,
				2,
				1,
				1
			],
			0,
			1,
			4,
			"1E-Pi-F"
		],
		[
			[
				2,
				2,
				1,
				1
			],
			3,
			1,
			4,
			"1E-Pi-R"
		],
		[
			[
				2,
				2,
				1,
				1
			],
			2,
			1,
			4,
			"1E-Pi-B"
		],
		[
			[
				2,
				2,
				1,
				1
			],
			1,
			1,
			4,
			"1E-Pi-L"
		],
		[
			[
				2,
				1,
				2,
				1
			],
			0,
			1,
			4,
			"1E-H-F"
		],
		[
			[
				2,
				1,
				2,
				1
			],
			3,
			1,
			4,
			"1E-H-R"
		],
		[
			[
				0,
				0,
				0,
				0
			],
			0,
			1,
			4,
			"1E-O-F"
		]
	];
	var pollprobs = mathlib.idxArray(poll_map, 3);
	var pollfilter = mathlib.idxArray(poll_map, 4);
	function getPOLLScramble(type, length, cases, neut) {
		var c = poll_map[scrMgr.fixCase(cases, pollprobs)];
		var co = c[0];
		var flipIdx = c[1];
		var nOriEdge = c[2];
		var eo = [];
		for (var i = 0; i < 4; i++) eo[i] = nOriEdge == 3 ? i == flipIdx ? 1 : 0 : i == flipIdx ? 0 : 1;
		return get444LLScramble([
			-1,
			-1,
			-1,
			-1
		], eo, [
			-1,
			-1,
			-1,
			-1
		], co, neut, [
			0,
			1,
			2,
			3
		], [
			0,
			1,
			2,
			3
		], 0);
	}
	function getPOLLImage(cases, canvas) {
		var pollCornerPos4 = [
			[
				15,
				20,
				19
			],
			[
				12,
				16,
				31
			],
			[
				0,
				28,
				27
			],
			[
				3,
				24,
				23
			]
		];
		var pollEdgeUPos4 = [
			[13, 14],
			[4, 8],
			[1, 2],
			[7, 11]
		];
		var pollEdgeSidePos4 = [
			[17, 18],
			[30, 29],
			[26, 25],
			[21, 22]
		];
		var pollCase = poll_map[cases];
		var co = pollCase[0];
		var flipIdx = pollCase[1];
		var nOriEdge = pollCase[2];
		var face = [];
		for (var i = 0; i < 32; i++) face[i] = "G";
		face[5] = "D";
		face[6] = "D";
		face[9] = "D";
		face[10] = "D";
		for (var c = 0; c < 4; c++) face[pollCornerPos4[c][co[c]]] = "D";
		for (var e = 0; e < 4; e++) {
			var isFlipped;
			if (nOriEdge == 3) isFlipped = e == flipIdx;
			else isFlipped = e != flipIdx;
			var uPair = pollEdgeUPos4[e];
			var sPair = pollEdgeSidePos4[e];
			if (isFlipped) {
				face[sPair[0]] = "D";
				face[sPair[1]] = "D";
			} else {
				face[uPair[0]] = "D";
				face[uPair[1]] = "D";
			}
		}
		var llParam = [face.join(""), null];
		if (!canvas) return llParam.concat([pollfilter[cases]]);
		image.llImage.drawImage(llParam[0], llParam[1], canvas);
	}
	scrMgr.reg("444wca", getRandomScramble)("4edge", getEdgeScramble)("444edo", getEdgeOnlyScramble)("444cto", getCenterOnlyScramble)("444ll", getLastLayerScramble)("444ell", getELLScramble)("444ctud", getCenterUDSolvedScramble)("444ctrl", getCenterRLSolvedScramble)("444l8e", getLast8DedgeScramble)("444ud3c", getYauUD3CScramble)("444rlda", getHoyaRLDAScramble)("444rlca", getHoyaRLCAScramble)("444ppll", getPPLLScramble, [
		ppllfilter,
		ppllprobs,
		getPPLLImage
	])("444poll", getPOLLScramble, [
		pollfilter,
		pollprobs,
		getPOLLImage
	]);
	return {
		getRandomScramble,
		getPartialScramble,
		testbench
	};
})(mathlib.Cnk, mathlib.circle);
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
/** WCA 5x5: 60 random moves (or `length`) in WCA notation. */
function get555Scramble(length = 60) {
	return cstimerScramble("555wca", length);
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
		length: 60,
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
/** WCA 6x6: 80 random moves (or `length`) in WCA notation. */
function get666Scramble(length = 80) {
	return cstimerScramble("666wca", length);
}
const events666 = [
	{
		id: "666wca",
		name: "6x6x6 WCA",
		puzzle: "666",
		length: 80,
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
/** WCA 7x7: 100 random moves (or `length`) in WCA notation. */
function get777Scramble(length = 100) {
	return cstimerScramble("777wca", length);
}
const events777 = [
	{
		id: "777wca",
		name: "7x7x7 WCA",
		puzzle: "777",
		length: 100,
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
//#region src/vendor/cstimer/mgmsolver.js
var DEBUG$1 = false;
var mgmsolver = (function() {
	function MgmCubie() {
		this.corn = [];
		this.twst = [];
		this.edge = [];
		this.flip = [];
		for (var i = 0; i < 20; i++) {
			this.corn[i] = i;
			this.twst[i] = 0;
		}
		for (var i = 0; i < 30; i++) {
			this.edge[i] = i;
			this.flip[i] = 0;
		}
	}
	MgmCubie.SOLVED = new MgmCubie();
	var U = 0, R = 10, F = 20, L = 30, BL = 40, BR = 50, DR = 60, DL = 70, DBL = 80, B = 90, DBR = 100, D = 110;
	var cornFacelet = [
		[
			U + 2,
			R + 3,
			F + 4
		],
		[
			U + 3,
			F + 3,
			L + 4
		],
		[
			U + 4,
			L + 3,
			BL + 4
		],
		[
			U + 0,
			BL + 3,
			BR + 4
		],
		[
			U + 1,
			BR + 3,
			R + 4
		],
		[
			D + 3,
			B + 0,
			DBL + 1
		],
		[
			D + 2,
			DBR + 0,
			B + 1
		],
		[
			D + 1,
			DR + 0,
			DBR + 1
		],
		[
			D + 0,
			DL + 0,
			DR + 1
		],
		[
			D + 4,
			DBL + 0,
			DL + 1
		],
		[
			DR + 3,
			F + 0,
			R + 2
		],
		[
			L + 0,
			F + 2,
			DL + 3
		],
		[
			BL + 0,
			L + 2,
			DBL + 3
		],
		[
			BR + 0,
			BL + 2,
			B + 3
		],
		[
			R + 0,
			BR + 2,
			DBR + 3
		],
		[
			B + 4,
			BL + 1,
			DBL + 2
		],
		[
			DBR + 4,
			BR + 1,
			B + 2
		],
		[
			DR + 4,
			R + 1,
			DBR + 2
		],
		[
			DL + 4,
			F + 1,
			DR + 2
		],
		[
			DBL + 4,
			L + 1,
			DL + 2
		]
	];
	var edgeFacelet = [
		[U + 6, R + 8],
		[U + 7, F + 8],
		[U + 8, L + 8],
		[U + 9, BL + 8],
		[U + 5, BR + 8],
		[D + 8, DBL + 5],
		[D + 7, B + 5],
		[D + 6, DBR + 5],
		[D + 5, DR + 5],
		[D + 9, DL + 5],
		[F + 9, R + 7],
		[F + 5, DR + 7],
		[L + 9, F + 7],
		[L + 5, DL + 7],
		[BL + 9, L + 7],
		[BL + 5, DBL + 7],
		[BR + 9, BL + 7],
		[BR + 5, B + 7],
		[BR + 7, R + 9],
		[DBR + 7, R + 5],
		[B + 9, DBL + 6],
		[B + 8, BL + 6],
		[DBR + 9, B + 6],
		[DBR + 8, BR + 6],
		[DR + 9, DBR + 6],
		[DR + 8, R + 6],
		[DL + 9, DR + 6],
		[DL + 8, F + 6],
		[DBL + 9, DL + 6],
		[DBL + 8, L + 6]
	];
	MgmCubie.prototype.toFaceCube = function(cFacelet, eFacelet) {
		cFacelet = cFacelet || cornFacelet;
		eFacelet = eFacelet || edgeFacelet;
		var f = [];
		mathlib.fillFacelet(cFacelet, f, this.corn, this.twst, 10);
		mathlib.fillFacelet(eFacelet, f, this.edge, this.flip, 10);
		return f;
	};
	MgmCubie.prototype.fromFacelet = function(facelet, cFacelet, eFacelet) {
		cFacelet = cFacelet || cornFacelet;
		eFacelet = eFacelet || edgeFacelet;
		var count = 0;
		var f = [];
		for (var i = 0; i < 120; ++i) {
			f[i] = facelet[i];
			count += Math.pow(16, f[i]);
		}
		if (count != 0xaaaaaaaaaaaa) return -1;
		if (mathlib.detectFacelet(cFacelet, f, this.corn, this.twst, 10) == -1 || mathlib.detectFacelet(eFacelet, f, this.edge, this.flip, 10) == -1) return -1;
		return this;
	};
	MgmCubie.prototype.hashCode = function() {
		var ret = 0;
		for (var i = 0; i < 20; i++) {
			ret = 0 | ret * 31 + this.corn[i] * 3 + this.twst[i];
			ret = 0 | ret * 31 + this.edge[i] * 2 + this.flip[i];
		}
		return ret;
	};
	MgmCubie.MgmMult = function(a, b, prod) {
		for (var i = 0; i < 20; i++) {
			prod.corn[i] = a.corn[b.corn[i]];
			prod.twst[i] = (a.twst[b.corn[i]] + b.twst[i]) % 3;
		}
		for (var i = 0; i < 30; i++) {
			prod.edge[i] = a.edge[b.edge[i]];
			prod.flip[i] = a.flip[b.edge[i]] ^ b.flip[i];
		}
	};
	MgmCubie.MgmMult3 = function(a, b, c, prod) {
		for (var i = 0; i < 20; i++) {
			prod.corn[i] = a.corn[b.corn[c.corn[i]]];
			prod.twst[i] = (a.twst[b.corn[c.corn[i]]] + b.twst[c.corn[i]] + c.twst[i]) % 3;
		}
		for (var i = 0; i < 30; i++) {
			prod.edge[i] = a.edge[b.edge[c.edge[i]]];
			prod.flip[i] = a.flip[b.edge[c.edge[i]]] ^ b.flip[c.edge[i]] ^ c.flip[i];
		}
	};
	MgmCubie.prototype.invFrom = function(cc) {
		for (var i = 0; i < 20; i++) {
			this.corn[cc.corn[i]] = i;
			this.twst[cc.corn[i]] = (3 - cc.twst[i]) % 3;
		}
		for (var i = 0; i < 30; i++) {
			this.edge[cc.edge[i]] = i;
			this.flip[cc.edge[i]] = cc.flip[i];
		}
		return this;
	};
	MgmCubie.prototype.copy = function(cc) {
		this.corn = cc.corn.slice();
		this.twst = cc.twst.slice();
		this.edge = cc.edge.slice();
		this.flip = cc.flip.slice();
		return this;
	};
	MgmCubie.prototype.isEqual = function(c) {
		for (var i = 0; i < 20; i++) if (this.corn[i] != c.corn[i] || this.twst[i] != c.twst[i]) return false;
		for (var i = 0; i < 30; i++) if (this.edge[i] != c.edge[i] || this.flip[i] != c.flip[i]) return false;
		return true;
	};
	function getComb(perm, ori, n, r, base) {
		var thres = r;
		var idxComb = 0;
		var idxOri = 0;
		var permR = [];
		for (var i = n - 1; i >= 0; i--) if (perm[i] < thres) {
			idxComb += mathlib.Cnk[i][r--];
			idxOri = idxOri * base + ori[i];
			permR[r] = perm[i];
		}
		return [
			idxComb,
			mathlib.getNPerm(permR, thres),
			idxOri
		];
	}
	function setComb(perm, ori, idx, n, r) {
		var fill = n - 1;
		for (var i = n - 1; i >= 0; i--) {
			if (idx >= mathlib.Cnk[i][r]) {
				idx -= mathlib.Cnk[i][r--];
				perm[i] = r;
			} else perm[i] = fill--;
			ori[i] = 0;
		}
	}
	function doCombMove4(moveTable, N_PERM, N_ORI, TT_OFFSET, idx, move) {
		var slice = ~~(idx / N_ORI / N_PERM);
		var perm = ~~(idx / N_ORI) % N_PERM;
		var twst = idx % N_ORI;
		var val = moveTable[move][slice];
		slice = val[0];
		perm = perm4Mult[perm][val[1]];
		twst = N_ORI & 1 ? perm4TT[perm4MulT[val[1]][twst * TT_OFFSET] / TT_OFFSET][val[2]] : perm4MulF[val[1]][twst * TT_OFFSET] / TT_OFFSET ^ val[2];
		return (slice * N_PERM + perm) * N_ORI + twst;
	}
	MgmCubie.prototype.setCComb = function(idx, r) {
		setComb(this.corn, this.twst, idx, 20, r || 4);
	};
	MgmCubie.prototype.getCComb = function(r) {
		return getComb(this.corn, this.twst, 20, r || 4, 3);
	};
	MgmCubie.prototype.setEComb = function(idx, r) {
		setComb(this.edge, this.flip, idx, 30, r || 4);
	};
	MgmCubie.prototype.getEComb = function(r) {
		return getComb(this.edge, this.flip, 30, r || 4, 2);
	};
	MgmCubie.prototype.faceletMove = function(face, pow, wide) {
		var facelet = this.toFaceCube();
		var state = [];
		for (var i = 0; i < 12; i++) {
			for (var j = 0; j < 10; j++) state[i * 11 + j] = facelet[i * 10 + j];
			state[i * 11 + 10] = 0;
		}
		mathlib.minx.doMove(state, face, pow, wide);
		for (var i = 0; i < 12; i++) for (var j = 0; j < 10; j++) facelet[i * 10 + j] = state[i * 11 + j];
		this.fromFacelet(facelet);
	};
	function createMoveCube() {
		var moveCube = [];
		var moveHash = [];
		for (var i = 0; i < 48; i++) moveCube[i] = new MgmCubie();
		for (var a = 0; a < 48; a += 4) {
			moveCube[a].faceletMove(a >> 2, 1, 0);
			moveHash[a] = moveCube[a].hashCode();
			for (var p = 0; p < 3; p++) {
				MgmCubie.MgmMult(moveCube[a + p], moveCube[a], moveCube[a + p + 1]);
				moveHash[a + p + 1] = moveCube[a + p + 1].hashCode();
			}
		}
		MgmCubie.moveCube = moveCube;
		var symCube = [];
		var symMult = [];
		var symMulI = [];
		var symMulM = [];
		var symHash = [];
		var tmp = new MgmCubie();
		for (var s = 0; s < 60; s++) {
			symCube[s] = new MgmCubie().copy(tmp);
			symHash[s] = symCube[s].hashCode();
			symMult[s] = [];
			symMulI[s] = [];
			tmp.faceletMove(0, 1, 1);
			if (s % 5 == 4) tmp.faceletMove(s % 10 == 4 ? 1 : 2, 1, 1);
			if (s % 30 == 29) {
				tmp.faceletMove(1, 2, 1);
				tmp.faceletMove(2, 1, 1);
				tmp.faceletMove(0, 3, 1);
			}
		}
		for (var i = 0; i < 60; i++) for (var j = 0; j < 60; j++) {
			MgmCubie.MgmMult(symCube[i], symCube[j], tmp);
			var k = symHash.indexOf(tmp.hashCode());
			symMult[i][j] = k;
			symMulI[k][j] = i;
		}
		for (var s = 0; s < 60; s++) {
			symMulM[s] = [];
			for (var j = 0; j < 12; j++) {
				MgmCubie.MgmMult3(symCube[symMulI[0][s]], moveCube[j * 4], symCube[s], tmp);
				var k = moveHash.indexOf(tmp.hashCode());
				symMulM[s][j] = k >> 2;
			}
		}
		MgmCubie.symCube = symCube;
		MgmCubie.symMult = symMult;
		MgmCubie.symMulI = symMulI;
		MgmCubie.symMulM = symMulM;
	}
	function CCombCoord(cubieMap) {
		this.map = new MgmCubie();
		this.imap = new MgmCubie();
		this.map.corn = cubieMap.slice();
		for (var i = 0; i < 20; i++) if (cubieMap.indexOf(i) == -1) this.map.corn.push(i);
		this.imap.invFrom(this.map);
		this.tmp = new MgmCubie();
	}
	CCombCoord.prototype.get = function(cc, r) {
		MgmCubie.MgmMult3(this.imap, cc, this.map, this.tmp);
		return this.tmp.getCComb(r);
	};
	CCombCoord.prototype.set = function(cc, idx, r) {
		this.tmp.setCComb(idx, r);
		MgmCubie.MgmMult3(this.map, this.tmp, this.imap, cc);
	};
	MgmCubie.CCombCoord = CCombCoord;
	function ECombCoord(cubieMap) {
		this.map = new MgmCubie();
		this.imap = new MgmCubie();
		this.map.edge = cubieMap.slice();
		for (var i = 0; i < 30; i++) if (cubieMap.indexOf(i) == -1) this.map.edge.push(i);
		this.imap.invFrom(this.map);
		this.tmp = new MgmCubie();
	}
	ECombCoord.prototype.get = function(cc, r) {
		MgmCubie.MgmMult3(this.imap, cc, this.map, this.tmp);
		return this.tmp.getEComb(r);
	};
	ECombCoord.prototype.set = function(cc, idx, r) {
		this.tmp.setEComb(idx, r);
		MgmCubie.MgmMult3(this.map, this.tmp, this.imap, cc);
	};
	MgmCubie.ECombCoord = ECombCoord;
	function EOriCoord(cubieMap) {
		ECombCoord.call(this, cubieMap);
	}
	EOriCoord.prototype = {
		get: function(cc, r) {
			var idx = 0;
			MgmCubie.MgmMult3(this.imap, cc, this.map, this.tmp);
			for (var i = 0; i < r; i++) idx = idx | this.tmp.flip[i] << i;
			return idx;
		},
		set: function(cc, idx, r) {
			for (var i = 0; i < 30; i++) this.tmp.flip[i] = i < r ? idx >> i & 1 : 0;
			MgmCubie.MgmMult3(this.map, this.tmp, this.imap, cc);
		}
	};
	MgmCubie.EOriCoord = EOriCoord;
	function EPermCoord(cubieMap) {
		ECombCoord.call(this, cubieMap);
	}
	EPermCoord.prototype = {
		get: function(cc, r) {
			MgmCubie.MgmMult3(this.imap, cc, this.map, this.tmp);
			return mathlib.getNPerm(this.tmp.edge, r);
		},
		set: function(cc, idx, r) {
			var edge = [];
			mathlib.setNPerm(edge, idx, r);
			for (var i = 0; i < 30; i++) this.tmp.edge[i] = i < r ? edge[i] : i;
			MgmCubie.MgmMult3(this.map, this.tmp, this.imap, cc);
		}
	};
	MgmCubie.EPermCoord = EPermCoord;
	function COriCoord(cubieMap) {
		CCombCoord.call(this, cubieMap);
	}
	COriCoord.prototype = {
		get: function(cc, r) {
			var idx = 0;
			MgmCubie.MgmMult3(this.imap, cc, this.map, this.tmp);
			for (var i = 0, base = 1; i < r; i++, base *= 3) idx += this.tmp.twst[i] * base;
			return idx;
		},
		set: function(cc, idx, r) {
			for (var i = 0; i < 30; i++) {
				this.tmp.twst[i] = i < r ? idx % 3 : 0;
				idx = ~~(idx / 3);
			}
			MgmCubie.MgmMult3(this.map, this.tmp, this.imap, cc);
		}
	};
	MgmCubie.COriCoord = COriCoord;
	function CPermCoord(cubieMap) {
		CCombCoord.call(this, cubieMap);
	}
	CPermCoord.prototype = {
		get: function(cc, r) {
			MgmCubie.MgmMult3(this.imap, cc, this.map, this.tmp);
			return mathlib.getNPerm(this.tmp.corn, r);
		},
		set: function(cc, idx, r) {
			var corn = [];
			mathlib.setNPerm(corn, idx, r);
			for (var i = 0; i < 20; i++) this.tmp.corn[i] = i < r ? corn[i] : i;
			MgmCubie.MgmMult3(this.map, this.tmp, this.imap, cc);
		}
	};
	MgmCubie.CPermCoord = CPermCoord;
	var perm4Mult = [];
	var perm4MulT = [];
	var perm4MulF = [];
	var perm4TT = [];
	var ckmv = [];
	var y2Move = [
		0,
		3,
		4,
		5,
		1,
		2,
		8,
		9,
		10,
		6,
		7,
		11
	];
	var yMove = [
		0,
		2,
		3,
		4,
		5,
		1,
		7,
		8,
		9,
		10,
		6,
		11
	];
	function comb4FullMove(moveTable, idx, move) {
		var slice = ~~(idx / 81 / 24);
		var perm = ~~(idx / 81) % 24;
		var twst = idx % 81;
		var val = moveTable[move][slice];
		slice = val[0];
		perm = perm4Mult[perm][val[1]];
		twst = perm4TT[perm4MulT[val[1]][twst]][val[2]];
		return slice * 81 * 24 + perm * 81 + twst;
	}
	function comb3FullMove(moveTable, idx, move) {
		var slice = ~~(idx / 27 / 6);
		var perm = ~~(idx / 27) % 6;
		var twst = idx % 27;
		var val = moveTable[move][slice];
		slice = val[0];
		perm = perm4Mult[perm][val[1]];
		twst = perm4TT[perm4MulT[val[1]][twst * 3] / 3][val[2]];
		return slice * 27 * 6 + perm * 27 + twst;
	}
	function init() {
		init = function() {};
		createMoveCube();
		function setTwst4(arr, idx, base) {
			for (var k = 0; k < 4; k++) {
				arr[k] = idx % base;
				idx = ~~(idx / base);
			}
		}
		function getTwst4(arr, base) {
			var idx = 0;
			for (var k = 3; k >= 0; k--) idx = idx * base + arr[k];
			return idx;
		}
		var perm1 = [];
		var perm2 = [];
		var perm3 = [];
		for (var i = 0; i < 24; i++) {
			perm4Mult[i] = [];
			mathlib.setNPerm(perm1, i, 4);
			for (var j = 0; j < 24; j++) {
				mathlib.setNPerm(perm2, j, 4);
				for (var k = 0; k < 4; k++) perm3[k] = perm1[perm2[k]];
				perm4Mult[i][j] = mathlib.getNPerm(perm3, 4);
			}
		}
		for (var j = 0; j < 24; j++) {
			mathlib.setNPerm(perm2, j, 4);
			perm4MulT[j] = [];
			for (var i = 0; i < 81; i++) {
				setTwst4(perm1, i, 3);
				for (var k = 0; k < 4; k++) perm3[k] = perm1[perm2[k]];
				perm4MulT[j][i] = getTwst4(perm3, 3);
			}
			perm4MulF[j] = [];
			for (var i = 0; i < 16; i++) {
				setTwst4(perm1, i, 2);
				for (var k = 0; k < 4; k++) perm3[k] = perm1[perm2[k]];
				perm4MulF[j][i] = getTwst4(perm3, 2);
			}
		}
		for (var j = 0; j < 81; j++) {
			perm4TT[j] = [];
			setTwst4(perm2, j, 3);
			for (var i = 0; i < 81; i++) {
				setTwst4(perm1, i, 3);
				for (var k = 0; k < 4; k++) perm3[k] = (perm1[k] + perm2[k]) % 3;
				perm4TT[j][i] = getTwst4(perm3, 3);
			}
		}
		var tmp1 = new MgmCubie();
		var tmp2 = new MgmCubie();
		for (var m1 = 0; m1 < 12; m1++) {
			ckmv[m1] = 1 << m1;
			for (var m2 = 0; m2 < m1; m2++) {
				MgmCubie.MgmMult(MgmCubie.moveCube[m1 * 4], MgmCubie.moveCube[m2 * 4], tmp1);
				MgmCubie.MgmMult(MgmCubie.moveCube[m2 * 4], MgmCubie.moveCube[m1 * 4], tmp2);
				if (tmp1.isEqual(tmp2)) ckmv[m1] |= 1 << m2;
			}
		}
	}
	function move2str(moves) {
		var ret = [];
		for (var i = 0; i < moves.length; i++) ret.push([
			"U",
			"R",
			"F",
			"L",
			"BL",
			"BR",
			"DR",
			"DL",
			"DBL",
			"B",
			"DBR",
			"D"
		][moves[i][0]] + [
			"",
			"2",
			"2'",
			"'"
		][moves[i][1]]);
		return ret.join(" ");
	}
	function move2strRURp(moves) {
		var ret = [];
		for (var i = 0; i < moves.length; i++) {
			let suffix = [
				"",
				"2",
				"2'",
				"'"
			][moves[i][1]];
			ret.push(moves[i][0] == 0 ? "U" + suffix : "R U" + suffix + " R'");
		}
		return ret.join(" ");
	}
	var KlmPhase1Move = [];
	var KlmPhase2Move = [];
	var KlmPhase3Move = [];
	var KlmPhase1Prun = [];
	var KlmPhase2Prun = [];
	var KlmPhase3Prun = [];
	var klmPhase1Coord;
	var klmPhase2Coord;
	var klmPhase3Coord;
	var klmSolv1 = null;
	var klmSolv2 = null;
	var klmSolv3 = null;
	function initKlmPhase1() {
		klmPhase1Coord = new CCombCoord([
			5,
			6,
			7,
			8,
			9
		]);
		var tmp1 = new MgmCubie();
		var tmp2 = new MgmCubie();
		mathlib.createMove(KlmPhase1Move, 1140, function(idx, move) {
			klmPhase1Coord.set(tmp1, idx, 3);
			MgmCubie.MgmMult(tmp1, MgmCubie.moveCube[move * 4], tmp2);
			return klmPhase1Coord.get(tmp2, 3);
		}, 12);
		mathlib.createPrun(KlmPhase1Prun, 0, 184680, 8, comb3FullMove.bind(null, KlmPhase1Move), 12, 4, 5);
		var doKlmPhase1Move = comb3FullMove.bind(null, KlmPhase1Move);
		klmSolv1 = new mathlib.Searcher(null, function(idx) {
			return Math.max(mathlib.getPruning(KlmPhase1Prun, idx[0]), mathlib.getPruning(KlmPhase1Prun, idx[1]));
		}, function(idx, move) {
			var idx1 = [doKlmPhase1Move(idx[0], move), doKlmPhase1Move(idx[1], y2Move[move])];
			if (idx1[0] == idx[0] && idx1[1] == idx[1]) return null;
			return idx1;
		}, 12, 4, ckmv);
	}
	function initKlmPhase2() {
		klmPhase2Coord = new CCombCoord([
			13,
			15,
			16,
			0,
			1,
			2,
			3,
			4,
			10,
			11,
			12,
			14,
			17,
			18,
			19
		]);
		var tmp1 = new MgmCubie();
		var tmp2 = new MgmCubie();
		mathlib.createMove(KlmPhase2Move, 455, function(idx, move) {
			klmPhase2Coord.set(tmp1, idx, 3);
			MgmCubie.MgmMult(tmp1, MgmCubie.moveCube[move * 4], tmp2);
			return klmPhase2Coord.get(tmp2, 3);
		}, 6);
		mathlib.createPrun(KlmPhase2Prun, 0, 73710, 8, comb3FullMove.bind(null, KlmPhase2Move), 6, 4, 4);
		var doKlmPhase2Move = comb3FullMove.bind(null, KlmPhase2Move);
		klmSolv2 = new mathlib.Searcher(null, function(idx) {
			return Math.max(mathlib.getPruning(KlmPhase2Prun, idx[0]), mathlib.getPruning(KlmPhase2Prun, idx[1]));
		}, function(idx, move) {
			var idx1 = [doKlmPhase2Move(idx[0], move), doKlmPhase2Move(idx[1], yMove[move])];
			if (idx1[0] == idx[0] && idx1[1] == idx[1]) return null;
			return idx1;
		}, 6, 4, ckmv);
	}
	function initKlmPhase3() {
		klmPhase3Coord = new CCombCoord([
			0,
			1,
			2,
			3,
			4,
			10,
			11,
			14,
			17,
			18
		]);
		var tmp1 = new MgmCubie();
		var tmp2 = new MgmCubie();
		mathlib.createMove(KlmPhase3Move, 210, function(idx, move) {
			klmPhase3Coord.set(tmp1, idx);
			MgmCubie.MgmMult(tmp1, MgmCubie.moveCube[move * 4], tmp2);
			return klmPhase3Coord.get(tmp2);
		}, 3);
		var doKlmPhase3Move = comb4FullMove.bind(null, KlmPhase3Move);
		mathlib.createPrun(KlmPhase3Prun, 0, 408240, 14, doKlmPhase3Move, 3, 4, 6);
		klmSolv3 = new mathlib.Searcher(null, function(idx) {
			return Math.max(mathlib.getPruning(KlmPhase3Prun, idx[0]), mathlib.getPruning(KlmPhase3Prun, idx[1]), mathlib.getPruning(KlmPhase3Prun, idx[2]));
		}, function(idx, move) {
			return [
				doKlmPhase3Move(idx[0], move),
				doKlmPhase3Move(idx[1], (move + 1) % 3),
				doKlmPhase3Move(idx[2], (move + 2) % 3)
			];
		}, 3, 4, ckmv);
	}
	function initKlm() {
		initKlm = function() {};
		init();
		initKlmPhase1();
		initKlmPhase2();
		initKlmPhase3();
	}
	function solveKlmCubie(cc, useSym) {
		initKlm();
		var kc0 = new MgmCubie();
		var kc1 = new MgmCubie();
		var kc2 = new MgmCubie();
		kc0.copy(cc);
		var idx;
		var solsym = 0;
		var idx1s = [];
		for (var s = 0; s < (useSym ? 12 : 1); s++) {
			MgmCubie.MgmMult3(MgmCubie.symCube[MgmCubie.symMulI[0][s * 5]], kc0, MgmCubie.symCube[s * 5], kc1);
			var val0 = klmPhase1Coord.get(kc1, 3);
			MgmCubie.MgmMult3(MgmCubie.symCube[MgmCubie.symMulI[0][2]], kc1, MgmCubie.symCube[2], kc2);
			var val1 = klmPhase1Coord.get(kc2, 3);
			idx1s.push([val0[0] * 27 * 6 + val0[1] * 27 + val0[2], val1[0] * 27 * 6 + val1[1] * 27 + val1[2]]);
		}
		var sol1s = klmSolv1.solveMulti(idx1s, 0, 9);
		var ksym = sol1s[1] * 5;
		var sol1 = sol1s[0];
		MgmCubie.MgmMult3(MgmCubie.symCube[MgmCubie.symMulI[0][ksym]], kc0, MgmCubie.symCube[ksym], kc1);
		kc0.copy(kc1);
		solsym = MgmCubie.symMult[solsym][ksym];
		for (var i = 0; i < sol1.length; i++) {
			var move = sol1[i];
			MgmCubie.MgmMult(kc0, MgmCubie.moveCube[move[0] * 4 + move[1]], kc1);
			kc0.copy(kc1);
			move[0] = MgmCubie.symMulM[MgmCubie.symMulI[0][solsym]][move[0]];
		}
		var idx2s = [];
		for (var s = 0; s < (useSym ? 5 : 1); s++) {
			MgmCubie.MgmMult3(MgmCubie.symCube[MgmCubie.symMulI[0][s]], kc0, MgmCubie.symCube[s], kc1);
			var val0 = klmPhase2Coord.get(kc1, 3);
			MgmCubie.MgmMult3(MgmCubie.symCube[MgmCubie.symMulI[0][1]], kc1, MgmCubie.symCube[1], kc2);
			var val1 = klmPhase2Coord.get(kc2, 3);
			idx2s.push([val0[0] * 27 * 6 + val0[1] * 27 + val0[2], val1[0] * 27 * 6 + val1[1] * 27 + val1[2]]);
		}
		var sol2s = klmSolv2.solveMulti(idx2s, 0, 14);
		ksym = sol2s[1];
		var sol2 = sol2s[0];
		MgmCubie.MgmMult3(MgmCubie.symCube[MgmCubie.symMulI[0][ksym]], kc0, MgmCubie.symCube[ksym], kc1);
		kc0.copy(kc1);
		solsym = MgmCubie.symMult[solsym][ksym];
		for (var i = 0; i < sol2.length; i++) {
			var move = sol2[i];
			MgmCubie.MgmMult(kc0, MgmCubie.moveCube[move[0] * 4 + move[1]], kc1);
			kc0.copy(kc1);
			move[0] = MgmCubie.symMulM[MgmCubie.symMulI[0][solsym]][move[0]];
		}
		val0 = klmPhase3Coord.get(kc0);
		MgmCubie.MgmMult3(MgmCubie.symCube[MgmCubie.symMulI[0][6]], kc0, MgmCubie.symCube[6], kc1);
		val1 = klmPhase3Coord.get(kc1);
		MgmCubie.MgmMult3(MgmCubie.symCube[MgmCubie.symMulI[0][29]], kc0, MgmCubie.symCube[29], kc1);
		var val2 = klmPhase3Coord.get(kc1);
		idx = [
			(val0[0] * 24 + val0[1]) * 81 + val0[2],
			(val1[0] * 24 + val1[1]) * 81 + val1[2],
			(val2[0] * 24 + val2[1]) * 81 + val2[2]
		];
		var sol3 = klmSolv3.solve(idx, 0, 14);
		for (var i = 0; i < sol3.length; i++) {
			var move = sol3[i];
			move[0] = MgmCubie.symMulM[MgmCubie.symMulI[0][solsym]][move[0]];
		}
		return move2str(Array.prototype.concat(sol1, sol2, sol3));
	}
	var mgmSolv1 = null;
	var mgmSolv2 = null;
	var mgmSolv3 = null;
	var mgmSolv4 = null;
	var mgmSolv5 = null;
	var mgmSolv6 = null;
	var mgmSolv7 = null;
	var mgmSolv8 = null;
	var mgmSolv9 = null;
	var mgmSolvA = null;
	/**
	* SOLE_EO: 0 = no ori, 1 = edge ori, 2 = corner ori
	*/
	function BlockSolver(edges, corns, N_EDGE, N_CORN, N_MOVE, SOLV_ORI) {
		var mgmECoord = new ECombCoord(edges);
		var mgmCCoord = new CCombCoord(corns);
		var mgmOCoord = SOLV_ORI == 1 ? new EOriCoord(edges) : SOLV_ORI == 2 ? new COriCoord(corns) : null;
		var MgmEMove = [];
		var MgmCMove = [];
		var MgmOMove = [];
		var MgmEPrun = [];
		var MgmCPrun = [];
		var MgmOPrun = [];
		var N_ECOMB = mathlib.Cnk[edges.length][N_EDGE];
		var N_CCOMB = mathlib.Cnk[corns.length][N_CORN];
		var N_EPERM = mathlib.fact[N_EDGE];
		var N_CPERM = mathlib.fact[N_CORN];
		var N_EORI = Math.pow(2, N_EDGE);
		var N_CORI = Math.pow(3, N_CORN);
		var N_ORI = Math.pow(1 + SOLV_ORI, SOLV_ORI == 1 ? edges.length : corns.length);
		var tmp1 = new MgmCubie();
		var tmp2 = new MgmCubie();
		mathlib.createMove(MgmEMove, N_ECOMB, function(idx, move) {
			mgmECoord.set(tmp1, idx, N_EDGE);
			MgmCubie.MgmMult(tmp1, MgmCubie.moveCube[move * 4], tmp2);
			return mgmECoord.get(tmp2, N_EDGE);
		}, N_MOVE);
		mathlib.createMove(MgmCMove, N_CCOMB, function(idx, move) {
			mgmCCoord.set(tmp1, idx, N_CORN);
			MgmCubie.MgmMult(tmp1, MgmCubie.moveCube[move * 4], tmp2);
			return mgmCCoord.get(tmp2, N_CORN);
		}, N_MOVE);
		var doMgmEMove = doCombMove4.bind(null, MgmEMove, N_EPERM, N_EORI, 16 / N_EORI);
		var doMgmCMove = doCombMove4.bind(null, MgmCMove, N_CPERM, N_CORI, 81 / N_CORI);
		mathlib.createPrun(MgmEPrun, 0, N_ECOMB * N_EPERM * N_EORI, 14, doMgmEMove, N_MOVE, 4);
		mathlib.createPrun(MgmCPrun, 0, N_CCOMB * N_CPERM * N_CORI, 14, doMgmCMove, N_MOVE, 4);
		if (SOLV_ORI) {
			mathlib.createMove(MgmOMove, N_ORI, function(idx, move) {
				mgmOCoord.set(tmp1, idx, edges.length);
				MgmCubie.MgmMult(tmp1, MgmCubie.moveCube[move * 4], tmp2);
				return mgmOCoord.get(tmp2, edges.length);
			}, N_MOVE);
			mathlib.createPrun(MgmOPrun, 0, N_CCOMB * N_ORI, 14, function(idx, move) {
				var slice = ~~(idx / N_ORI);
				var twst = idx % N_ORI;
				return MgmCMove[move][slice][0] * N_ORI + MgmOMove[move][twst];
			}, N_MOVE, 4);
		}
		var MgmECPrun = [];
		mathlib.createPrun(MgmECPrun, 0, N_ECOMB * N_CCOMB, 14, function(idx, move) {
			var idxE = ~~(idx / N_CCOMB);
			var idxC = idx % N_CCOMB;
			return MgmEMove[move][idxE][0] * N_CCOMB + MgmCMove[move][idxC][0];
		}, N_MOVE, 4);
		this.solv = new mathlib.Searcher(null, function(idx) {
			return Math.max(mathlib.getPruning(MgmEPrun, idx[0]), mathlib.getPruning(MgmCPrun, idx[1]), SOLV_ORI ? mathlib.getPruning(MgmOPrun, ~~(idx[1] / N_CPERM / N_CORI) * N_ORI + idx[2]) : 0, mathlib.getPruning(MgmECPrun, ~~(idx[0] / N_EPERM / N_EORI) * N_CCOMB + ~~(idx[1] / N_CPERM / N_CORI)));
		}, function(idx, move) {
			var idx1 = [
				doMgmEMove(idx[0], move),
				doMgmCMove(idx[1], move),
				SOLV_ORI ? MgmOMove[move][idx[2]] : 0
			];
			if (idx1[0] == idx[0] && idx1[1] == idx[1] && idx1[2] == idx[2]) return null;
			return idx1;
		}, N_MOVE, 4, ckmv);
		this.mgmECoord = mgmECoord;
		this.mgmCCoord = mgmCCoord;
		this.mgmOCoord = mgmOCoord;
		this.N_EDGE = N_EDGE;
		this.N_CORN = N_CORN;
		this.N_ELEN = edges.length;
	}
	BlockSolver.prototype.getIdx = function(cc) {
		var idxE = this.mgmECoord.get(cc, this.N_EDGE);
		var idxC = this.mgmCCoord.get(cc, this.N_CORN);
		var idxO = this.mgmOCoord ? this.mgmOCoord.get(cc, this.N_ELEN) : 0;
		return [
			(idxE[0] * mathlib.fact[this.N_EDGE] + idxE[1]) * Math.pow(2, this.N_EDGE) + idxE[2],
			(idxC[0] * mathlib.fact[this.N_CORN] + idxC[1]) * Math.pow(3, this.N_CORN) + idxC[2],
			idxO
		];
	};
	BlockSolver.prototype.solve = function(kc0) {
		var kc1 = new MgmCubie();
		var idx = this.getIdx(kc0);
		var sol = this.solv.solve(idx, 0, 30);
		for (var i = 0; i < sol.length; i++) {
			var move = sol[i];
			MgmCubie.MgmMult(kc0, MgmCubie.moveCube[move[0] * 4 + move[1]], kc1);
			kc0.copy(kc1);
		}
		return sol;
	};
	BlockSolver.prototype.solveMulti = function(kcs, nsol) {
		var kc1 = new MgmCubie();
		var idxs = [];
		for (var i = 0; i < kcs.length; i++) idxs.push(this.getIdx(kcs[i]));
		var solSet = /* @__PURE__ */ new Set();
		var sols = [];
		var kcsRet = [];
		this.solv.solveMulti(idxs, 0, 30, function(sol, sidx) {
			var kc0 = new MgmCubie();
			kc0.copy(kcs[sidx]);
			for (var i = 0; i < sol.length; i++) {
				var move = sol[i];
				MgmCubie.MgmMult(kc0, MgmCubie.moveCube[move[0] * 4 + move[1]], kc1);
				kc0.copy(kc1);
			}
			var hashCode = kc0.hashCode();
			if (solSet.has(hashCode)) return false;
			solSet.add(hashCode);
			sols.push([sol.slice(), sidx]);
			kcsRet.push(kc0);
			return sols.length >= nsol;
		});
		return [kcsRet, sols];
	};
	function BlockRURpSolver(edges, corns, N_EDGE, N_CORN, N_MOVE) {
		var mgmEPCoord = new EPermCoord(edges);
		var mgmCPCoord = new CPermCoord(corns);
		var mgmEOCoord = new EOriCoord(edges);
		var mgmCOCoord = new COriCoord(corns);
		var MgmEPMove = [];
		var MgmCPMove = [];
		var MgmEOMove = [];
		var MgmCOMove = [];
		var MgmEPrun = [];
		var MgmCPrun = [];
		var N_EPERM = mathlib.fact[N_EDGE];
		var N_CPERM = mathlib.fact[N_CORN];
		var N_EORI = Math.pow(2, N_EDGE);
		var N_CORI = Math.pow(3, N_CORN);
		var tmp1 = new MgmCubie();
		var tmp2 = new MgmCubie();
		var moveRURp = new MgmCubie();
		MgmCubie.MgmMult3(MgmCubie.moveCube[4], MgmCubie.moveCube[0], MgmCubie.moveCube[7], moveRURp);
		var CoordMove = function(coord, N_PIECE, idx, move) {
			coord.set(tmp1, idx, N_PIECE);
			MgmCubie.MgmMult(tmp1, move == 0 ? MgmCubie.moveCube[0] : moveRURp, tmp2);
			return coord.get(tmp2, N_PIECE);
		};
		mathlib.createMove(MgmEPMove, N_EPERM, CoordMove.bind(null, mgmEPCoord, N_EDGE), N_MOVE);
		mathlib.createMove(MgmCPMove, N_CPERM, CoordMove.bind(null, mgmCPCoord, N_CORN), N_MOVE);
		mathlib.createMove(MgmEOMove, N_EORI, CoordMove.bind(null, mgmEOCoord, N_EDGE), N_MOVE);
		mathlib.createMove(MgmCOMove, N_CORI, CoordMove.bind(null, mgmCOCoord, N_CORN), N_MOVE);
		var doXMove = function(PMove, OMove, N_ORI, idx, move) {
			let perm = ~~(idx / N_ORI);
			let ori = idx % N_ORI;
			perm = PMove[move][perm];
			ori = OMove[move][ori];
			return perm * N_ORI + ori;
		};
		var doMgmEMove = doXMove.bind(null, MgmEPMove, MgmEOMove, N_EORI);
		var doMgmCMove = doXMove.bind(null, MgmCPMove, MgmCOMove, N_CORI);
		mathlib.createPrun(MgmEPrun, 0, N_EPERM * N_EORI, 14, doMgmEMove, N_MOVE, 4);
		mathlib.createPrun(MgmCPrun, 0, N_CPERM * N_CORI, 14, doMgmCMove, N_MOVE, 4);
		this.solv = new mathlib.Searcher(null, function(idx) {
			return Math.max(mathlib.getPruning(MgmEPrun, idx[0]), mathlib.getPruning(MgmCPrun, idx[1]));
		}, function(idx, move) {
			return [doMgmEMove(idx[0], move), doMgmCMove(idx[1], move)];
		}, N_MOVE, 4, ckmv);
		this.mgmECoord = { get: (cc) => mgmEPCoord.get(cc, N_EDGE) * N_EORI + mgmEOCoord.get(cc, N_EDGE) };
		this.mgmCCoord = { get: (cc) => mgmCPCoord.get(cc, N_CORN) * N_CORI + mgmCOCoord.get(cc, N_CORN) };
		this.N_EDGE = N_EDGE;
		this.N_CORN = N_CORN;
	}
	BlockRURpSolver.prototype.getIdx = function(cc) {
		return [this.mgmECoord.get(cc), this.mgmCCoord.get(cc)];
	};
	BlockRURpSolver.prototype.solve = BlockSolver.prototype.solve;
	BlockRURpSolver.prototype.solveMulti = BlockSolver.prototype.solveMulti;
	function initMgm() {
		initMgm = function() {};
		init();
		var edgeOrder = [
			6,
			7,
			22,
			5,
			20,
			9,
			28,
			8,
			24,
			26,
			17,
			23,
			15,
			16,
			21,
			13,
			14,
			29,
			11,
			12,
			27,
			18,
			19,
			25,
			0,
			1,
			2,
			3,
			4,
			10
		];
		var cornOrder = [
			6,
			5,
			9,
			7,
			8,
			16,
			13,
			15,
			12,
			19,
			11,
			18,
			14,
			17,
			0,
			1,
			2,
			3,
			4,
			10
		];
		mgmSolv1 = new BlockSolver(edgeOrder, cornOrder, 3, 1, 12);
		mgmSolv2 = new BlockSolver(edgeOrder.slice(3), cornOrder.slice(1), 2, 1, 9);
		mgmSolv3 = new BlockSolver(edgeOrder.slice(5), cornOrder.slice(2), 2, 1, 8);
		mgmSolv4 = new BlockSolver(edgeOrder.slice(7), cornOrder.slice(3), 3, 2, 7);
		mgmSolv5 = new BlockSolver(edgeOrder.slice(10), cornOrder.slice(5), 2, 1, 6);
		mgmSolv6 = new BlockSolver(edgeOrder.slice(12), cornOrder.slice(6), 3, 2, 5);
		mgmSolv7 = new BlockSolver(edgeOrder.slice(15), cornOrder.slice(8), 3, 2, 4);
		mgmSolv8 = new BlockSolver(edgeOrder.slice(18), cornOrder.slice(10), 3, 2, 3, 1);
		mgmSolv9 = new BlockSolver(edgeOrder.slice(21), cornOrder.slice(12), 3, 2, 2);
		mgmSolvA = new BlockRURpSolver(edgeOrder.slice(24), cornOrder.slice(14), 6, 6, 2);
	}
	function solveMgmCubie(cc, useSym) {
		initMgm();
		var kc0 = new MgmCubie();
		new MgmCubie();
		new MgmCubie();
		kc0.copy(cc);
		var kcs0 = [kc0];
		var [kcs1, sol1s] = mgmSolv1.solveMulti(kcs0, 100);
		var [kcs2, sol2s] = mgmSolv2.solveMulti(kcs1, 100);
		var [kcs3, sol3s] = mgmSolv3.solveMulti(kcs2, 100);
		var [kcs4, sol4s] = mgmSolv4.solveMulti(kcs3, 10);
		var [kcs5, sol5s] = mgmSolv5.solveMulti(kcs4, 100);
		var [kcs6, sol6s] = mgmSolv6.solveMulti(kcs5, 100);
		var [kcs7, sol7s] = mgmSolv7.solveMulti(kcs6, 100);
		var [kcs8, sol8s] = mgmSolv8.solveMulti(kcs7, 5);
		var [kcs9, sol9s] = mgmSolv9.solveMulti(kcs8, 20);
		var [kcsA, solAs] = mgmSolvA.solveMulti(kcs9, 1);
		var [solA, sidxA] = solAs[0];
		var [sol9, sidx9] = sol9s[sidxA];
		var [sol8, sidx8] = sol8s[sidx9];
		var [sol7, sidx7] = sol7s[sidx8];
		var [sol6, sidx6] = sol6s[sidx7];
		var [sol5, sidx5] = sol5s[sidx6];
		var [sol4, sidx4] = sol4s[sidx5];
		var [sol3, sidx3] = sol3s[sidx4];
		var [sol2, sidx2] = sol2s[sidx3];
		var [sol1, sidx1] = sol1s[sidx2];
		return [move2str([].concat(sol1, sol2, sol3, sol4, sol5, sol6, sol7, sol8, sol9)), move2strRURp(solA)].join(" ");
	}
	function checkSolver(isKlm) {
		init();
		var kc0 = new MgmCubie();
		var kc1 = new MgmCubie();
		var gen = [];
		for (var i = 0; i < 500; i++) {
			var move = mathlib.rn(12);
			gen.push([move, 0]);
			MgmCubie.MgmMult(kc0, MgmCubie.moveCube[move * 4], kc1);
			kc0.copy(kc1);
		}
		return move2str(gen) + "   " + (isKlm ? solveKlmCubie : solveMgmCubie)(kc0, true);
	}
	return {
		MgmCubie,
		solveKlmCubie,
		solveMgmCubie,
		checkSolver: DEBUG$1 && checkSolver
	};
})();
//#endregion
//#region src/vendor/cstimer/megaminx.js
(function() {
	"use strict";
	function getKiloScramble() {
		var cc = new mgmsolver.MgmCubie();
		cc.corn = mathlib.rndPerm(20, true);
		var chksum = 60;
		for (var i = 0; i < 19; i++) {
			var t = mathlib.rn(3);
			cc.twst[i] = t;
			chksum -= t;
		}
		cc.twst[19] = chksum % 3;
		return mgmsolver.solveKlmCubie(cc, true);
	}
	function getMegaScramble() {
		var cc = new mgmsolver.MgmCubie();
		cc.corn = mathlib.rndPerm(20, true);
		cc.edge = mathlib.rndPerm(30, true);
		var chksum = 60;
		for (var i = 0; i < 19; i++) {
			var t = mathlib.rn(3);
			cc.twst[i] = t;
			chksum -= t;
		}
		cc.twst[19] = chksum % 3;
		chksum = 0;
		for (var i = 0; i < 29; i++) {
			var t = mathlib.rn(2);
			cc.flip[i] = t;
			chksum ^= t;
		}
		cc.flip[29] = chksum;
		return mgmsolver.solveMgmCubie(cc, true);
	}
	scrMgr.reg("klmso", getKiloScramble)("mgmso", getMegaScramble);
})();
//#endregion
//#region src/vendor/cstimer/mgmlsll.js
(function() {
	var epcord = new mathlib.Coord("p", 6, -1);
	var eocord = new mathlib.Coord("o", 6, -2);
	var cpcord = new mathlib.Coord("p", 6, -1);
	var cocord = new mathlib.Coord("o", 6, -3);
	function eMove(idx, m) {
		var perm = epcord.set([], idx >> 5);
		var twst = eocord.set([], idx & 31);
		if (m == 0) {
			mathlib.acycle(twst, [
				0,
				1,
				2,
				3,
				4
			], 1);
			mathlib.acycle(perm, [
				0,
				1,
				2,
				3,
				4
			], 1);
		} else if (m == 1) {
			mathlib.acycle(twst, [
				0,
				1,
				2,
				3,
				5
			], 1);
			mathlib.acycle(perm, [
				0,
				1,
				2,
				3,
				5
			], 1);
		} else if (m == 2) {
			mathlib.acycle(twst, [
				1,
				2,
				3,
				4,
				5
			], 1, [
				0,
				0,
				0,
				0,
				1,
				2
			]);
			mathlib.acycle(perm, [
				1,
				2,
				3,
				4,
				5
			]);
		}
		return epcord.get(perm) << 5 | eocord.get(twst);
	}
	function cMove(idx, m) {
		var perm = cpcord.set([], ~~(idx / 243));
		var twst = cocord.set([], idx % 243);
		if (m == 0) {
			mathlib.acycle(twst, [
				0,
				1,
				2,
				3,
				4
			], 1);
			mathlib.acycle(perm, [
				0,
				1,
				2,
				3,
				4
			], 1);
		} else if (m == 1) {
			mathlib.acycle(twst, [
				0,
				5,
				1,
				2,
				3
			], 1, [
				2,
				0,
				0,
				0,
				0,
				3
			]);
			mathlib.acycle(perm, [
				0,
				5,
				1,
				2,
				3
			]);
		} else if (m == 2) {
			mathlib.acycle(twst, [
				0,
				2,
				3,
				4,
				5
			], 1, [
				1,
				0,
				0,
				0,
				1,
				3
			]);
			mathlib.acycle(perm, [
				0,
				2,
				3,
				4,
				5
			]);
		}
		return cpcord.get(perm) * 243 + cocord.get(twst);
	}
	var solv = new mathlib.Solver(3, 4, [[
		0,
		eMove,
		11520
	], [
		0,
		cMove,
		87480
	]]);
	function getMinxLSScramble(type, length, cases) {
		var edge = 0;
		var corn = 0;
		do
			if (type == "mlsll") {
				edge = mathlib.rn(11520);
				corn = mathlib.rn(87480);
			} else if (type == "mgmpll") {
				edge = epcord.get(mathlib.rndPerm(5, true).concat([5])) * 32;
				corn = cpcord.get(mathlib.rndPerm(5, true).concat([5])) * 243;
			} else if (type == "mgmll") {
				var eo = eocord.set([], mathlib.rn(32));
				eo[0] += eo[5];
				eo[5] = 0;
				var co = cocord.set([], mathlib.rn(243));
				co[0] += co[5];
				co[5] = 0;
				edge = epcord.get(mathlib.rndPerm(5, true).concat([5])) * 32 + eocord.get(eo);
				corn = cpcord.get(mathlib.rndPerm(5, true).concat([5])) * 243 + cocord.get(co);
			}
		while (edge == 0 && corn == 0);
		var sol = solv.search([edge, corn], 0);
		var ret = [];
		for (var i = 0; i < sol.length; i++) {
			var move = sol[i];
			ret.push([
				"U",
				"R U",
				"F' U"
			][move[0]] + [
				"",
				"2",
				"2'",
				"'"
			][move[1]] + [
				"",
				" R'",
				" F"
			][move[0]]);
		}
		return ret.join(" ").replace(/ +/g, " ");
	}
	scrMgr.reg("mlsll", getMinxLSScramble)("mgmpll", getMinxLSScramble)("mgmll", getMinxLSScramble);
})();
//#endregion
//#region src/events/minx/index.ts
/**
* WCA Megaminx: 7 lines of Pochmann-style moves (R++ D-- ... U), separated by newlines.
* Another `length` gives length / 10 lines, rounded up.
*/
function getMegaminxScramble(length = 70) {
	return cstimerScramble("mgmp", length);
}
const eventsMinx = [
	{
		id: "mgmp",
		name: "Megaminx WCA",
		puzzle: "minx",
		length: 70,
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
//#region src/vendor/cstimer/pyraminx.js
(function() {
	var cFacelet = [
		[
			3,
			16,
			11
		],
		[
			4,
			23,
			15
		],
		[
			5,
			9,
			22
		],
		[
			10,
			17,
			21
		]
	];
	var eFacelet = [
		[1, 7],
		[2, 14],
		[0, 18],
		[6, 12],
		[8, 20],
		[13, 19]
	];
	function checkNoBar(perm, ori) {
		var edgeOri = eocoord.set([], ori & 31);
		var cornOri = cocoord.set([], ori >> 5);
		var edgePerm = epcoord.set([], perm);
		var f = [];
		mathlib.fillFacelet(cFacelet, f, [
			0,
			1,
			2,
			3
		], cornOri, 6);
		mathlib.fillFacelet(eFacelet, f, edgePerm, edgeOri, 6);
		var pieces = [
			4,
			2,
			3,
			1,
			5,
			0
		];
		for (var i = 0; i < 6; i++) for (var j = 0; j < 2; j++) {
			var p1 = eFacelet[i][0 ^ j];
			var p2 = eFacelet[i][1 ^ j];
			var nb1 = ~~(p1 / 6) * 6 + pieces[(pieces.indexOf(p1 % 6) + 5) % 6];
			var nb2 = ~~(p2 / 6) * 6 + pieces[(pieces.indexOf(p2 % 6) + 1) % 6];
			if (f[nb1] == f[p1] && f[nb2] == f[p2]) return false;
		}
		return true;
	}
	var solv = new mathlib.Solver(4, 2, [[
		0,
		[
			epermMove,
			"p",
			6,
			-1
		],
		360
	], [
		0,
		oriMove,
		2592
	]]);
	var movePieces = [
		[
			0,
			1,
			3
		],
		[
			1,
			2,
			5
		],
		[
			0,
			4,
			2
		],
		[
			3,
			5,
			4
		]
	];
	var moveOris = [
		[
			0,
			1,
			0,
			2
		],
		[
			0,
			1,
			0,
			2
		],
		[
			0,
			0,
			1,
			2
		],
		[
			0,
			0,
			1,
			2
		]
	];
	function epermMove(arr, m) {
		mathlib.acycle(arr, movePieces[m]);
	}
	var eocoord = new mathlib.Coord("o", 6, -2);
	var epcoord = new mathlib.Coord("p", 6, -1);
	var cocoord = new mathlib.Coord("o", 4, 3);
	function oriMove(a, c) {
		var edgeOri = eocoord.set([], a & 31);
		var cornOri = cocoord.set([], a >> 5);
		cornOri[c]++;
		mathlib.acycle(edgeOri, movePieces[c], 1, moveOris[c]);
		return cocoord.get(cornOri) << 5 | eocoord.get(edgeOri);
	}
	function pyrMult(state0, state1) {
		var ep0 = epcoord.set([], state0[0]);
		var eo0 = eocoord.set([], state0[1] & 31);
		var co0 = cocoord.set([], state0[1] >> 5);
		var ep1 = epcoord.set([], state1[0]);
		var eo1 = eocoord.set([], state1[1] & 31);
		var co1 = cocoord.set([], state1[1] >> 5);
		var ep2 = [];
		var eo2 = [];
		var co2 = [];
		for (var i = 0; i < 6; i++) {
			ep2[i] = ep0[ep1[i]];
			eo2[i] = eo0[ep1[i]] ^ eo1[i];
		}
		for (var i = 0; i < 4; i++) co2[i] = co0[i] + co1[i];
		return [epcoord.get(ep2), cocoord.get(co2) << 5 | eocoord.get(eo2)];
	}
	var aufs = [
		[0, 0],
		[183, 869],
		[87, 1729]
	];
	var l4e_map = [
		[
			1,
			3,
			"L3Bar-1",
			"LLDGFFRRG"
		],
		[
			59,
			3,
			"L3Bar-2",
			"DLLGFFRRG"
		],
		[
			25,
			3,
			"L3Bar-3",
			"FFGDRRLLG"
		],
		[
			35,
			3,
			"L3Bar-4",
			"GRRGLLFFD"
		],
		[
			12,
			3,
			"LL-1",
			"LLGFFGGGG"
		],
		[
			10,
			3,
			"LL-2",
			"GLLGGGGRR"
		],
		[
			2,
			1,
			"LL-3",
			"RLRLFLFRF"
		],
		[
			4,
			1,
			"LL-4",
			"FLFRFRLRL"
		],
		[
			3,
			3,
			"L4NB-1",
			"FGGGGDGFGGGF"
		],
		[
			57,
			3,
			"L4NB-2",
			"GGRGRGDGGGGR"
		],
		[
			53,
			3,
			"L4NB-3",
			"GGDGRGGGRGGR"
		],
		[
			45,
			3,
			"L4NB-4",
			"DGGFGGGFGGGF"
		],
		[
			33,
			3,
			"L4NB-5",
			"GGDGGGGRGGGR"
		],
		[
			27,
			3,
			"L4NB-6",
			"DGGGFGGGGGGF"
		],
		[
			49,
			3,
			"L3NB-1",
			"RRGGGDGFF"
		],
		[
			43,
			3,
			"L3NB-2",
			"GFFRRGDGG"
		],
		[
			41,
			3,
			"L3NB-3",
			"GGGDLLFFG"
		],
		[
			51,
			3,
			"L3NB-4",
			"GGGGRRLLD"
		],
		[
			8,
			3,
			"Flip-1",
			"RLFLFFRRL"
		],
		[
			16,
			3,
			"Flip-2",
			"LFFRRRLLFGGD"
		],
		[
			56,
			1,
			"Flip-3",
			"RLFLFRFRLGGD"
		],
		[
			21,
			3,
			"L4Blk-1",
			"GGDGGGLLL"
		],
		[
			13,
			3,
			"L4Blk-2",
			"DGGLLLGGG"
		],
		[
			29,
			3,
			"L4Bar-1",
			"GGGDGGGRR"
		],
		[
			37,
			3,
			"L4Bar-2",
			"GGGFFGGGD"
		],
		[
			61,
			3,
			"L4Bar-3",
			"GGGDGGLLG"
		],
		[
			5,
			3,
			"L4Bar-4",
			"GGGGLLGGD"
		],
		[
			17,
			3,
			"L4Bar-5",
			"GGGLLDGGG"
		],
		[
			11,
			3,
			"L4Bar-6",
			"GGGGGGDLL"
		],
		[
			9,
			3,
			"L4Bar-7",
			"RRGDGGGGG"
		],
		[
			19,
			3,
			"L4Bar-8",
			"GFFGGGGGD"
		],
		[
			20,
			3,
			"DFlip-1",
			"GGGRRGGGGGGD"
		],
		[
			18,
			3,
			"DFlip-2",
			"GGGGGGGFFGGD"
		],
		[
			60,
			1,
			"DFlip-3",
			"FFGRRGLLGGGD"
		],
		[
			58,
			1,
			"DFlip-4",
			"GRRGLLGFFGGD"
		]
	];
	var l4eprobs = [];
	var l4efilter = [];
	for (var i = 0; i < l4e_map.length; i++) {
		l4eprobs.push(l4e_map[i][1]);
		l4efilter.push(l4e_map[i][2]);
	}
	function getL4EScramble(type, length, cases) {
		var l4ecase = l4e_map[scrMgr.fixCase(cases, l4eprobs)][0];
		var perm = mathlib.getNPerm(mathlib.setNPerm([], l4ecase & 1, 4, -1).concat([4, 5]), 6, -1);
		var ori = (l4ecase >> 1 & 3) * 864 + (l4ecase >> 3);
		var state = pyrMult(mathlib.rndEl(aufs), pyrMult([perm, ori], mathlib.rndEl(aufs)));
		var sol = solv.toStr(solv.search(state, 8).reverse(), "ULRB", ["'", ""]) + " ";
		for (var i = 0; i < 4; i++) {
			var r = mathlib.rn(3);
			if (r < 2) sol += "lrbu".charAt(i) + [" ", "' "][r];
		}
		return sol;
	}
	function getL4EImage(cases, canvas) {
		var l4ecase = l4e_map[cases];
		if (!canvas) return [
			"GGG" + l4ecase[3],
			null,
			l4ecase[2]
		];
		image.pyrllImage("GGG" + l4ecase[3], canvas);
	}
	function getScramble(type) {
		var minl = type == "pyro" ? 0 : 8;
		var limit = type == "pyrl4e" ? 2 : 7;
		var len = 0;
		var sol;
		var perm;
		var ori;
		do {
			if (type == "pyro" || type == "pyrso" || type == "pyr4c") {
				perm = mathlib.rn(360);
				ori = mathlib.rn(2592);
			} else if (type == "pyrl4e") {
				perm = mathlib.getNPerm(mathlib.setNPerm([], mathlib.rn(12), 4, -1).concat([4, 5]), 6, -1);
				ori = mathlib.rn(3) * 864 + mathlib.rn(8);
			} else if (type == "pyrnb") do {
				perm = mathlib.rn(360);
				ori = mathlib.rn(2592);
			} while (!checkNoBar(perm, ori));
			len = solv.search([perm, ori], 0).length;
			sol = solv.toStr(solv.search([perm, ori], minl).reverse(), "ULRB", ["'", ""]) + " ";
			for (var i = 0; i < 4; i++) {
				var r = mathlib.rn(type == "pyr4c" ? 2 : 3);
				if (r < 2) {
					sol += "lrbu".charAt(i) + [" ", "' "][r];
					len++;
				}
			}
		} while (len < limit);
		return sol;
	}
	scrMgr.reg([
		"pyro",
		"pyrso",
		"pyrnb",
		"pyr4c"
	], getScramble)("pyrl4e", getL4EScramble, [
		l4efilter,
		l4eprobs,
		getL4EImage
	]);
})();
(function() {
	function MpyrCubie(ep, eo, wp, ct, co, cp) {
		this.ep = ep || [
			0,
			1,
			2,
			3,
			4,
			5
		];
		this.eo = eo || [
			0,
			0,
			0,
			0,
			0,
			0
		];
		this.wp = wp || [
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
		this.ct = ct || [
			0,
			1,
			2,
			3
		];
		this.co = co || [
			0,
			0,
			0,
			0
		];
		this.cp = cp || [
			0,
			1,
			2,
			3
		];
	}
	MpyrCubie.prototype.toString = function() {
		var f = this.toFaceCube(1);
		var ret = "XX L0 L1 L2 L3 L4 XX    XX R0 R1 R2 R3 R4 XX\n   L5 L6 L7 L8 L9    XX    R5 R6 R7 R8 R9\n      La Lb Lc    Fc Fb Fa    Ra Rb Rc\n         XX    F9 F8 F7 F6 F5    XX\n            XX F4 F3 F2 F1 F0 XX\n            XX D0 D1 D2 D3 D4 XX\n               D5 D6 D7 D8 D9\n                  Da Db Dc\n                     XX";
		ret = ret.replace(/([FRDL])([0-9a-c])/g, function(m, p1, p2) {
			var i = "FRDL".indexOf(p1) * 13 + parseInt(p2, 16);
			return "FRDL"[~~(f[i] / 13)] + (f[i] % 13).toString(16);
		});
		return ret;
	};
	var F = 0, R = 13, D = 26, L = 39, a = 10, b = 11, c = 12;
	var edgeFacelets = [
		[F + 8, L + 8],
		[D + 8, R + 8],
		[F + 6, R + 6],
		[D + 6, L + 6],
		[F + 2, D + 2],
		[R + 2, L + 2]
	];
	var wingFacelets = [
		[F + 9, L + c],
		[L + 9, F + c],
		[D + 9, R + c],
		[R + 9, D + c],
		[F + a, R + 5],
		[R + a, F + 5],
		[D + a, L + 5],
		[L + a, D + 5],
		[F + 1, D + 3],
		[D + 1, F + 3],
		[R + 1, L + 3],
		[L + 1, R + 3]
	];
	var cornFacelets = [
		[
			F + 0,
			R + b,
			D + 4
		],
		[
			D + 0,
			L + b,
			F + 4
		],
		[
			R + 0,
			F + b,
			L + 4
		],
		[
			L + 0,
			D + b,
			R + 4
		]
	];
	var centFacelets = [
		F + 7,
		D + 7,
		R + 7,
		L + 7
	];
	MpyrCubie.prototype.toFaceCube = function(todiv) {
		var f = [];
		todiv = todiv || 13;
		mathlib.fillFacelet(edgeFacelets, f, this.ep, this.eo, todiv);
		mathlib.fillFacelet(wingFacelets, f, this.wp, [], todiv);
		mathlib.fillFacelet(cornFacelets, f, this.cp, this.co, todiv);
		mathlib.fillFacelet(centFacelets, f, this.ct, null, todiv);
		return f;
	};
	MpyrCubie.prototype.fromFacelet = function(facelet) {
		var count = 0;
		var f = [];
		for (var i = 0; i < 52; ++i) {
			f[i] = facelet[i];
			count += Math.pow(16, f[i]);
		}
		if (count != 56797) return -1;
		for (var i = 0; i < 6; i++) out: for (var j = 0; j < 6; j++) for (var t = 0; t < 2; t++) if (~~(edgeFacelets[j][0] / 13) == f[edgeFacelets[i][t]] && ~~(edgeFacelets[j][1] / 13) == f[edgeFacelets[i][t ^ 1]]) {
			this.ep[i] = j;
			this.eo[i] = t;
			break out;
		}
		for (var i = 0; i < 12; i++) for (var j = 0; j < 12; j++) if (~~(wingFacelets[j][0] / 13) == f[wingFacelets[i][0]] && ~~(wingFacelets[j][1] / 13) == f[wingFacelets[i][1]]) {
			this.wp[i] = j;
			break;
		}
		for (var i = 0; i < 4; i++) out: for (var j = 0; j < 4; j++) for (var t = 0; t < 3; t++) if (~~(cornFacelets[j][0] / 13) == f[cornFacelets[i][t]] && ~~(cornFacelets[j][1] / 13) == f[cornFacelets[i][(t + 1) % 3]] && ~~(cornFacelets[j][2] / 13) == f[cornFacelets[i][(t + 2) % 3]]) {
			this.cp[i] = j;
			this.co[i] = t;
			break out;
		}
		for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) if (~~(centFacelets[j] / 13) == f[centFacelets[i]]) this.ct[i] = j;
		return this;
	};
	MpyrCubie.randomCube = function() {
		return new MpyrCubie(mathlib.rndPerm(6, true), mathlib.setNOri([], mathlib.rn(32), 6, -2), mathlib.rndPerm(12, true), mathlib.rndPerm(4, true), mathlib.setNOri([], mathlib.rn(27), 4, -3), null);
	};
	MpyrCubie.MpyrMult = function() {
		var args = Array.from(arguments);
		var prod = args.pop() || new MpyrCubie();
		return args.reduceRight((b, a) => {
			for (var i = 0; i < 4; i++) {
				prod.ct[i] = a.ct[b.ct[i]];
				prod.co[i] = (a.co[b.cp[i]] + b.co[i]) % 3;
				prod.cp[i] = a.cp[b.cp[i]];
			}
			for (var i = 0; i < 6; i++) {
				prod.eo[i] = a.eo[b.ep[i]] ^ b.eo[i];
				prod.ep[i] = a.ep[b.ep[i]];
			}
			for (var i = 0; i < 12; i++) prod.wp[i] = a.wp[b.wp[i]];
			return prod;
		});
	};
	function initMoveCube() {
		if (MpyrCubie.moveCube) return;
		var moveCube = [];
		moveCube[0] = new MpyrCubie([
			0,
			1,
			2,
			3,
			4,
			5
		], [
			0,
			0,
			0,
			0,
			0,
			0
		], [
			0,
			4,
			2,
			3,
			10,
			5,
			6,
			7,
			8,
			9,
			1,
			11
		], [
			0,
			1,
			2,
			3
		], [
			0,
			0,
			1,
			0
		], null);
		moveCube[2] = new MpyrCubie([
			2,
			1,
			5,
			3,
			4,
			0
		], [
			1,
			0,
			0,
			0,
			0,
			1
		], [
			5,
			4,
			2,
			3,
			10,
			11,
			6,
			7,
			8,
			9,
			1,
			0
		], [
			2,
			1,
			3,
			0
		], [
			0,
			0,
			1,
			0
		], null);
		moveCube[4] = new MpyrCubie([
			0,
			1,
			2,
			3,
			4,
			5
		], [
			0,
			0,
			0,
			0,
			0,
			0
		], [
			0,
			1,
			2,
			6,
			4,
			5,
			11,
			7,
			8,
			9,
			10,
			3
		], [
			0,
			1,
			2,
			3
		], [
			0,
			0,
			0,
			1
		], null);
		moveCube[6] = new MpyrCubie([
			0,
			3,
			2,
			5,
			4,
			1
		], [
			0,
			1,
			0,
			1,
			0,
			0
		], [
			0,
			1,
			7,
			6,
			4,
			5,
			11,
			10,
			8,
			9,
			2,
			3
		], [
			0,
			3,
			1,
			2
		], [
			0,
			0,
			0,
			1
		], null);
		moveCube[8] = new MpyrCubie([
			0,
			1,
			2,
			3,
			4,
			5
		], [
			0,
			0,
			0,
			0,
			0,
			0
		], [
			0,
			1,
			5,
			3,
			4,
			8,
			6,
			7,
			2,
			9,
			10,
			11
		], [
			0,
			1,
			2,
			3
		], [
			1,
			0,
			0,
			0
		], null);
		moveCube[10] = new MpyrCubie([
			0,
			2,
			4,
			3,
			1,
			5
		], [
			0,
			1,
			1,
			0,
			0,
			0
		], [
			0,
			1,
			5,
			4,
			9,
			8,
			6,
			7,
			2,
			3,
			10,
			11
		], [
			1,
			2,
			0,
			3
		], [
			1,
			0,
			0,
			0
		], null);
		moveCube[12] = new MpyrCubie([
			0,
			1,
			2,
			3,
			4,
			5
		], [
			0,
			0,
			0,
			0,
			0,
			0
		], [
			7,
			1,
			2,
			3,
			4,
			5,
			6,
			9,
			8,
			0,
			10,
			11
		], [
			0,
			1,
			2,
			3
		], [
			0,
			1,
			0,
			0
		], null);
		moveCube[14] = new MpyrCubie([
			3,
			1,
			2,
			4,
			0,
			5
		], [
			1,
			0,
			0,
			0,
			1,
			0
		], [
			7,
			6,
			2,
			3,
			4,
			5,
			8,
			9,
			1,
			0,
			10,
			11
		], [
			3,
			0,
			2,
			1
		], [
			0,
			1,
			0,
			0
		], null);
		for (var i = 1; i < 16; i += 2) moveCube[i] = MpyrCubie.MpyrMult(moveCube[i - 1], moveCube[i - 1], null);
		MpyrCubie.moveCube = moveCube;
	}
	initMoveCube();
	MpyrCubie.prototype.getPairPerm = function() {
		var objw = [];
		var ret = [];
		for (var i = 0; i < 6; i++) {
			var ori = this.eo[i];
			objw[this.ep[i] * 2] = i * 2 + ori;
			objw[this.ep[i] * 2 + 1] = i * 2 + (ori ^ 1);
		}
		for (var i = 0; i < 12; i++) ret[i] = objw[this.wp[i]];
		return ret;
	};
	MpyrCubie.prototype.getCosetIdx = function() {
		var ret = 0;
		for (var i = 0; i < 4; i++) ret += this.co[i];
		ret += 3 - this.ct[3 ^ this.ct.indexOf(3)];
		return ret % 3;
	};
	function genCkmv(moves) {
		var ckmv = [];
		var tmp1 = new MpyrCubie();
		var tmp2 = new MpyrCubie();
		for (var m1 = 0; m1 < moves.length; m1++) {
			ckmv[m1] = 1 << m1;
			for (var m2 = 0; m2 < m1; m2++) {
				MpyrCubie.MpyrMult(MpyrCubie.moveCube[moves[m1]], MpyrCubie.moveCube[moves[m2]], tmp1);
				MpyrCubie.MpyrMult(MpyrCubie.moveCube[moves[m2]], MpyrCubie.moveCube[moves[m1]], tmp2);
				if (tmp1.toString(1) == tmp2.toString(1)) ckmv[m1] |= 1 << m2;
			}
		}
		return ckmv;
	}
	function doMove(mc, move) {
		return MpyrCubie.MpyrMult(mc, MpyrCubie.moveCube[move], null);
	}
	function doCosetMove(idx, move) {
		return (idx + 1 - (move >> 1) % 2) % 3;
	}
	var phase1Moves = [
		0,
		2,
		4,
		6,
		8,
		10,
		12,
		14
	];
	var p1e1w2Move = null;
	var solv1 = null;
	function phase1e1w2Hash(edge, fc) {
		var pos = fc.ep.indexOf(edge);
		var ori = fc.eo[pos];
		return (pos * 12 + fc.wp.indexOf(edge << 1 | ori)) * 12 + fc.wp.indexOf(edge << 1 | ori ^ 1);
	}
	function initPhase1() {
		var mc = new MpyrCubie();
		p1e1w2Move = mathlib.createMoveHash(mc, phase1Moves, phase1e1w2Hash.bind(null, 0), doMove);
		var solved = [];
		var solved2 = [];
		for (var i = 0; i < 6; i++) {
			solved.push(p1e1w2Move[1][phase1e1w2Hash(i, mc)]);
			for (var j = 0; j < i; j++) solved2.push(Math.min(solved[i], solved[j]) * 792 + Math.max(solved[i], solved[j]));
		}
		var p1e2w4Prun = [];
		mathlib.createPrun(p1e2w4Prun, solved2, 1881792, 12, function(idx, move) {
			var ct = doCosetMove(~~(idx / 792 / 792), phase1Moves[move]);
			var idx1 = ~~(idx / 792) % 792;
			var idx2 = idx % 792;
			idx1 = p1e1w2Move[0][move][idx1];
			idx2 = p1e1w2Move[0][move][idx2];
			return ct * 792 * 792 + Math.min(idx1, idx2) * 792 + Math.max(idx1, idx2);
		}, 8, 2);
		var ckmv = genCkmv(phase1Moves);
		solv1 = new mathlib.Searcher(null, function(idx) {
			var prun = 0;
			var ctbase = idx[6] * 792 * 792;
			for (var i = 0; i < 6; i++) for (var j = 0; j < i; j++) prun = Math.max(prun, mathlib.getPruning(p1e2w4Prun, ctbase + Math.min(idx[i], idx[j]) * 792 + Math.max(idx[i], idx[j])));
			return prun;
		}, function(idx, move) {
			var ret = [];
			for (var i = 0; i < 6; i++) ret[i] = p1e1w2Move[0][move][idx[i]];
			ret[6] = doCosetMove(idx[6], phase1Moves[move]);
			return ret;
		}, 8, 2, ckmv);
	}
	var phase2Moves = [
		2,
		6,
		10,
		14
	];
	var p2epctMoves = null;
	var p2eocoMoves = null;
	var solv2 = null;
	function phase2EpCtHash(fc) {
		return mathlib.getNPerm(fc.ep, 6, -1) * 4 + fc.ct.indexOf(0);
	}
	function phase2EoCoHash(fc) {
		return (parseInt(fc.eo.join(""), 2) >> 1) * 81 + parseInt(fc.co.join(""), 3);
	}
	function initPhase2() {
		p2epctMoves = mathlib.createMoveHash(new MpyrCubie(), phase2Moves, phase2EpCtHash, doMove);
		p2eocoMoves = mathlib.createMoveHash(new MpyrCubie(), phase2Moves, phase2EoCoHash, doMove);
		var p2epctPrun = [];
		var p2eocoPrun = [];
		mathlib.createPrun(p2epctPrun, 0, 1440, 14, p2epctMoves[0], 4, 2);
		mathlib.createPrun(p2eocoPrun, 0, 2592, 14, p2eocoMoves[0], 4, 2);
		var ckmv2 = genCkmv(phase2Moves);
		solv2 = new mathlib.Searcher(null, function(idx) {
			return Math.max(mathlib.getPruning(p2epctPrun, idx[0]), mathlib.getPruning(p2eocoPrun, idx[1]));
		}, function(idx, move) {
			return [p2epctMoves[0][move][idx[0]], p2eocoMoves[0][move][idx[1]]];
		}, 4, 2, ckmv2);
	}
	function getScramble(validMoves, len) {
		var scramble = [];
		for (var i = 0; i < len; i++) scramble.push(validMoves[~~(Math.random() * validMoves.length)]);
		var mc = new MpyrCubie();
		for (var i = 0; i < scramble.length; i++) mc = MpyrCubie.MpyrMult(mc, MpyrCubie.moveCube[scramble[i]], null);
		return [mc, scramble];
	}
	var move2str = [
		"U",
		"U'",
		"Uw",
		"Uw'",
		"B",
		"B'",
		"Bw",
		"Bw'",
		"R",
		"R'",
		"Rw",
		"Rw'",
		"L",
		"L'",
		"Lw",
		"Lw'"
	];
	function prettyMoves(moves) {
		return moves.map((move) => move2str[move]).join(" ");
	}
	function applyMoves(mc, moves) {
		return moves.reduce((mc, move) => MpyrCubie.MpyrMult(mc, MpyrCubie.moveCube[move], null), mc);
	}
	function solveMpyr(mc) {
		if (!solv1) {
			initPhase1();
			initPhase2();
		}
		var tt1 = Date.now();
		var idx = [];
		for (var i = 0; i < 6; i++) idx[i] = p1e1w2Move[1][phase1e1w2Hash(i, mc)];
		idx[6] = mc.getCosetIdx();
		var sol1 = solv1.solve(idx, 0, 14);
		tt1 = Date.now() - tt1;
		for (var i = 0; i < sol1.length; i++) sol1[i] = phase1Moves[sol1[i][0]] + sol1[i][1];
		mc = applyMoves(mc, sol1);
		var p2epct = p2epctMoves[1][phase2EpCtHash(mc)];
		var p2eoco = p2eocoMoves[1][phase2EoCoHash(mc)];
		var tt2 = Date.now();
		var sol2 = solv2.solve([p2epct, p2eoco], 0, 20);
		tt2 = Date.now() - tt2;
		for (var i = 0; i < sol2.length; i++) sol2[i] = phase2Moves[sol2[i][0]] + sol2[i][1];
		return [
			sol1,
			sol2,
			tt1,
			tt2
		];
	}
	function solveTest(n_moves) {
		var solvInfo = getScramble([
			0,
			2,
			4,
			6,
			8,
			10,
			12,
			14
		], n_moves);
		prettyMoves(solvInfo[1].slice());
		var mc = solvInfo[0];
		var ret = solveMpyr(mc);
		mc = applyMoves(mc, ret[0]);
		mc = applyMoves(mc, ret[1]);
		var isSolved = true;
		var f = mc.toFaceCube();
		for (var i = 0; i < 52; i += 13) for (var j = i + 1; j < i + 13; j++) if (f[i] != f[j]) {
			isSolved = false;
			break;
		}
		if (!isSolved) console.log("ERROR! NOT SOLVED!");
		return [
			ret[0].length,
			ret[1].length,
			ret[2],
			ret[3]
		];
	}
	function getRandomScramble() {
		var sol = solveMpyr(MpyrCubie.randomCube());
		sol = prettyMoves([].concat(sol[0], sol[1]));
		for (var i = 0; i < 4; i++) {
			var r = mathlib.rn(3);
			if (r < 2) sol += " " + "lrbu".charAt(i) + ["", "'"][r];
		}
		return sol;
	}
	scrMgr.reg("mpyrso", getRandomScramble);
	return {
		getRandomScramble,
		solveTest
	};
})();
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
//#region src/vendor/cstimer/skewb.js
(function() {
	/**	1 2   U
	0  LFRB
	3 4   D  */
	var fixedCorn = [
		[
			4,
			16,
			7
		],
		[
			1,
			11,
			22
		],
		[
			26,
			14,
			8
		],
		[
			29,
			19,
			23
		]
	];
	var twstCorn = [
		[
			3,
			6,
			12
		],
		[
			2,
			21,
			17
		],
		[
			27,
			9,
			18
		],
		[
			28,
			24,
			13
		]
	];
	function checkNoBar(perm, twst) {
		var corner = cpcord.set([], perm % 12);
		var center = ctcord.set([], ~~(perm / 12));
		var fixedtwst = ftcord.set([], twst % 81);
		twst = twcord.set([], ~~(twst / 81));
		var f = [];
		for (var i = 0; i < 6; i++) f[i * 5] = center[i];
		mathlib.fillFacelet(fixedCorn, f, [
			0,
			1,
			2,
			3
		], fixedtwst, 5);
		mathlib.fillFacelet(twstCorn, f, corner, twst, 5);
		for (var i = 0; i < 30; i += 5) for (var j = 1; j < 5; j++) if (f[i] == f[i + j]) return false;
		return true;
	}
	var moveCenters = [
		[
			0,
			3,
			1
		],
		[
			0,
			2,
			4
		],
		[
			1,
			5,
			2
		],
		[
			3,
			4,
			5
		]
	];
	var moveCorners = [
		[
			0,
			1,
			2
		],
		[
			0,
			3,
			1
		],
		[
			0,
			2,
			3
		],
		[
			1,
			3,
			2
		]
	];
	var ctcord = new mathlib.Coord("p", 6, -1);
	var cpcord = new mathlib.Coord("p", 4, -1);
	var ftcord = new mathlib.Coord("o", 4, 3);
	var twcord = new mathlib.Coord("o", 4, -3);
	function ctcpMove(idx, m) {
		var corner = cpcord.set([], idx % 12);
		var center = ctcord.set([], ~~(idx / 12));
		mathlib.acycle(center, moveCenters[m]);
		mathlib.acycle(corner, moveCorners[m]);
		return ctcord.get(center) * 12 + cpcord.get(corner);
	}
	function twstMove(idx, move) {
		var fixedtwst = ftcord.set([], idx % 81);
		var twst = twcord.set([], ~~(idx / 81));
		fixedtwst[move]++;
		mathlib.acycle(twst, moveCorners[move], 1, [
			0,
			2,
			1,
			3
		]);
		return twcord.get(twst) * 81 + ftcord.get(fixedtwst);
	}
	var solv = new mathlib.Solver(4, 2, [[
		0,
		ctcpMove,
		4320
	], [
		0,
		twstMove,
		2187
	]]);
	var solvivy = new mathlib.Solver(4, 2, [[
		0,
		function(idx, m) {
			return ~~(ctcpMove(idx * 12, m) / 12);
		},
		360
	], [
		0,
		function(idx, m) {
			return twstMove(idx, m) % 81;
		},
		81
	]]);
	function sol2str(sol) {
		var ret = [];
		var move2str = [
			"L",
			"R",
			"B",
			"U"
		];
		for (var i = 0; i < sol.length; i++) {
			var axis = sol[i][0];
			var pow = 1 - sol[i][1];
			if (axis == 2) mathlib.acycle(move2str, [
				0,
				3,
				1
			], pow + 1);
			ret.push(move2str[axis] + (pow == 1 ? "'" : ""));
		}
		return ret.join(" ");
	}
	var ori = [
		0,
		1,
		2,
		0,
		2,
		1,
		1,
		2,
		0,
		2,
		1,
		0
	];
	function getScramble(type) {
		var perm, twst;
		var lim = type == "skbso" ? 6 : 2;
		var minl = type == "skbo" ? 0 : 8;
		do {
			perm = mathlib.rn(4320);
			twst = mathlib.rn(2187);
		} while (perm == 0 && twst == 0 || ori[perm % 12] != (twst + ~~(twst / 3) + ~~(twst / 9) + ~~(twst / 27)) % 3 || solv.search([perm, twst], 0, lim) != null || type == "skbnb" && !checkNoBar(perm, twst));
		return sol2str(solv.search([perm, twst], minl).reverse());
	}
	function getScrambleIvy(type) {
		var perm, twst, lim = 1, maxl = type == "ivyso" ? 6 : 0;
		do {
			perm = mathlib.rn(360);
			twst = mathlib.rn(81);
		} while (perm == 0 && twst == 0 || solvivy.search([perm, twst], 0, lim) != null);
		return solvivy.toStr(solvivy.search([perm, twst], maxl).reverse(), "RLDB", "' ");
	}
	scrMgr.reg([
		"skbo",
		"skbso",
		"skbnb"
	], getScramble)(["ivyo", "ivyso"], getScrambleIvy);
})();
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
//#region src/vendor/cstimer/ftocta.js
var DEBUG = false;
var ftosolver = (function() {
	"use strict";
	function FtoCubie(cp, co, ep, uf, rl) {
		this.cp = cp && cp.slice() || [
			0,
			1,
			2,
			3,
			4,
			5
		];
		this.co = co && co.slice() || [
			0,
			0,
			0,
			0,
			0,
			0
		];
		this.ep = ep && ep.slice() || [
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
		this.uf = uf && uf.slice() || [
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
		this.rl = rl && rl.slice() || [
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
	}
	var U = 0, F = 9, r = 18, l = 27, D = 36, B = 45, R = 54, L = 63;
	var cornFacelets = [
		[
			U + 0,
			R + 0,
			F + 0,
			L + 0
		],
		[
			U + 4,
			B + 8,
			r + 4,
			R + 8
		],
		[
			U + 8,
			L + 4,
			l + 8,
			B + 4
		],
		[
			l + 0,
			D + 0,
			r + 0,
			B + 0
		],
		[
			F + 4,
			D + 8,
			l + 4,
			L + 8
		],
		[
			r + 8,
			D + 4,
			F + 8,
			R + 4
		]
	];
	var edgeFacelets = [
		[U + 1, R + 3],
		[U + 3, L + 1],
		[U + 6, B + 6],
		[l + 1, D + 3],
		[r + 3, D + 1],
		[F + 6, D + 6],
		[F + 3, R + 1],
		[F + 1, L + 3],
		[l + 6, L + 6],
		[l + 3, B + 1],
		[r + 1, B + 3],
		[r + 6, R + 6]
	];
	var ctufFacelets = [
		U + 2,
		U + 5,
		U + 7,
		F + 2,
		F + 5,
		F + 7,
		r + 2,
		r + 5,
		r + 7,
		l + 2,
		l + 5,
		l + 7
	];
	var ctrlFacelets = [
		D + 2,
		D + 5,
		D + 7,
		B + 2,
		B + 5,
		B + 7,
		L + 2,
		L + 5,
		L + 7,
		R + 2,
		R + 5,
		R + 7
	];
	FtoCubie.prototype.isEqual = function(fc) {
		for (var i = 0; i < 12; i++) if (this.ep[i] != fc.ep[i] || this.uf[i] != fc.uf[i] || this.rl[i] != fc.rl[i] || i < 6 && (this.cp[i] != fc.cp[i] || this.co[i] != fc.co[i])) return false;
		return true;
	};
	FtoCubie.prototype.toFaceCube = function(todiv) {
		var f = [];
		todiv = todiv || 9;
		var co = [];
		for (var i = 0; i < 6; i++) co[i] = this.co[i] * 2;
		mathlib.fillFacelet(cornFacelets, f, this.cp, co, todiv);
		mathlib.fillFacelet(edgeFacelets, f, this.ep, [], todiv);
		mathlib.fillFacelet(ctufFacelets, f, this.uf, null, todiv);
		mathlib.fillFacelet(ctrlFacelets, f, this.rl, null, todiv);
		return f;
	};
	FtoCubie.prototype.fromFacelet = function(facelet) {
		var count = 0;
		var f = [];
		for (var i = 0; i < 72; ++i) {
			f[i] = facelet[i];
			count += Math.pow(16, f[i]);
		}
		if (count != 2576980377) return -1;
		var co = [];
		if (mathlib.detectFacelet(cornFacelets, f, this.cp, co, 9) == -1 || mathlib.detectFacelet(edgeFacelets, f, this.ep, [], 9) == -1) return -1;
		var parity = 0;
		for (var i = 0; i < 6; i++) {
			this.co[i] = co[i] >> 1;
			parity ^= this.co[i];
		}
		if (parity != 0 || mathlib.getNParity(mathlib.getNPerm(this.cp, 6), 6) != 0 || mathlib.getNParity(mathlib.getNPerm(this.ep, 12), 12) != 0) return -1;
		var remainCnts = [
			3,
			3,
			3,
			3
		];
		for (var i = 0; i < 12; i++) {
			var col = f[ctufFacelets[i]];
			if (!(remainCnts[col] > 0)) return -1;
			this.uf[i] = col * 3 + 3 - remainCnts[col];
			remainCnts[col]--;
		}
		remainCnts = [
			3,
			3,
			3,
			3
		];
		for (var i = 0; i < 12; i++) {
			var col = [
				0,
				1,
				3,
				2
			][f[ctrlFacelets[i]] - 4];
			if (!(remainCnts[col] > 0)) return -1;
			this.rl[i] = col * 3 + 3 - remainCnts[col];
			remainCnts[col]--;
		}
		if (mathlib.getNParity(mathlib.getNPerm(this.uf, 12), 12) != 0) for (var i = 0; i < 12; i++) this.uf[i] ^= this.uf[i] < 2 ? 1 : 0;
		if (mathlib.getNParity(mathlib.getNPerm(this.rl, 12), 12) != 0) for (var i = 0; i < 12; i++) this.rl[i] ^= this.rl[i] < 2 ? 1 : 0;
		return this;
	};
	FtoCubie.prototype.toString = function(todiv) {
		var f = this.toFaceCube(todiv);
		var ret = "  U8 U7 U6 U5 U4      B8 B7 B6 B5 B4\nL4   U3 U2 U1   R8  r4   B3 B2 B1   l8\nL5 L1   U0   R3 R7  r5 r1   B0   l3 l7\nL6 L2 L0  R0 R2 R6  r6 r2 r0  l0 l2 l6\nL7 L3   F0   R1 R5  r7 r3   D0   l1 l5\nL8   F1 F2 F3   R4  r8   D1 D2 D3   l4\n  F4 F5 F6 F7 F8      D4 D5 D6 D7 D8";
		ret = ret.replace(/([UFrlDBRL])([0-8])/g, function(m, p1, p2) {
			var i = "UFrlDBRL".indexOf(p1) * 9 + ~~p2;
			return "UFrlDBRL"[~~(f[i] / 9)] + f[i] % 9;
		});
		return ret;
	};
	FtoCubie.FtoMult = function() {
		var args = Array.from(arguments);
		var prod = args.pop() || new FtoCubie();
		return args.reduceRight((b, a) => {
			for (var i = 0; i < 6; i++) {
				prod.co[i] = a.co[b.cp[i]] ^ b.co[i];
				prod.cp[i] = a.cp[b.cp[i]];
			}
			for (var i = 0; i < 12; i++) {
				prod.ep[i] = a.ep[b.ep[i]];
				prod.uf[i] = a.uf[b.uf[i]];
				prod.rl[i] = a.rl[b.rl[i]];
			}
			return prod;
		});
	};
	function initMoveCube() {
		var rotU = new FtoCubie([
			1,
			2,
			0,
			4,
			5,
			3
		], [
			0,
			0,
			0,
			0,
			0,
			0
		], [
			2,
			0,
			1,
			5,
			3,
			4,
			10,
			11,
			6,
			7,
			8,
			9
		], [
			1,
			2,
			0,
			7,
			8,
			6,
			10,
			11,
			9,
			4,
			5,
			3
		], [
			2,
			0,
			1,
			8,
			6,
			7,
			11,
			9,
			10,
			5,
			3,
			4
		]);
		var rotR = new FtoCubie([
			5,
			0,
			4,
			2,
			3,
			1
		], [
			1,
			1,
			0,
			1,
			1,
			0
		], [
			6,
			5,
			7,
			9,
			2,
			10,
			11,
			4,
			3,
			8,
			1,
			0
		], [
			5,
			3,
			4,
			8,
			6,
			7,
			2,
			0,
			1,
			11,
			9,
			10
		], [
			4,
			5,
			3,
			7,
			8,
			6,
			1,
			2,
			0,
			10,
			11,
			9
		]);
		var rotUi = FtoCubie.FtoMult(rotU, rotU, null);
		var rotRi = FtoCubie.FtoMult(rotR, rotR, null);
		var rotL = FtoCubie.FtoMult(rotUi, rotR, rotU, null);
		var rotF = FtoCubie.FtoMult(rotR, rotU, rotRi, null);
		var moveCube = [];
		moveCube[0] = new FtoCubie([
			1,
			2,
			0,
			3,
			4,
			5
		], [
			0,
			0,
			0,
			0,
			0,
			0
		], [
			2,
			0,
			1,
			3,
			4,
			5,
			6,
			7,
			8,
			9,
			10,
			11
		], [
			1,
			2,
			0,
			3,
			4,
			5,
			6,
			7,
			8,
			9,
			10,
			11
		], [
			0,
			1,
			2,
			3,
			6,
			7,
			11,
			9,
			8,
			5,
			10,
			4
		]);
		moveCube[2] = new FtoCubie([
			4,
			1,
			2,
			3,
			5,
			0
		], [
			1,
			0,
			0,
			0,
			1,
			0
		], [
			0,
			1,
			2,
			3,
			4,
			6,
			7,
			5,
			8,
			9,
			10,
			11
		], [
			0,
			1,
			2,
			4,
			5,
			3,
			6,
			7,
			8,
			9,
			10,
			11
		], [
			0,
			9,
			10,
			3,
			4,
			5,
			2,
			7,
			1,
			8,
			6,
			11
		]);
		moveCube[4] = new FtoCubie([
			0,
			5,
			2,
			1,
			4,
			3
		], [
			0,
			1,
			0,
			0,
			0,
			1
		], [
			0,
			1,
			2,
			3,
			10,
			5,
			6,
			7,
			8,
			9,
			11,
			4
		], [
			0,
			1,
			2,
			3,
			4,
			5,
			7,
			8,
			6,
			9,
			10,
			11
		], [
			5,
			3,
			2,
			11,
			4,
			10,
			6,
			7,
			8,
			9,
			0,
			1
		]);
		moveCube[6] = new FtoCubie([
			0,
			1,
			3,
			4,
			2,
			5
		], [
			0,
			0,
			1,
			1,
			0,
			0
		], [
			0,
			1,
			2,
			8,
			4,
			5,
			6,
			7,
			9,
			3,
			10,
			11
		], [
			0,
			1,
			2,
			3,
			4,
			5,
			6,
			7,
			8,
			10,
			11,
			9
		], [
			8,
			1,
			7,
			2,
			0,
			5,
			6,
			3,
			4,
			9,
			10,
			11
		]);
		moveCube[8] = new FtoCubie([
			0,
			1,
			2,
			5,
			3,
			4
		], [
			0,
			0,
			0,
			0,
			0,
			0
		], [
			0,
			1,
			2,
			4,
			5,
			3,
			6,
			7,
			8,
			9,
			10,
			11
		], [
			0,
			1,
			2,
			3,
			9,
			10,
			5,
			7,
			4,
			8,
			6,
			11
		], [
			1,
			2,
			0,
			3,
			4,
			5,
			6,
			7,
			8,
			9,
			10,
			11
		]);
		moveCube[10] = new FtoCubie([
			0,
			3,
			1,
			2,
			4,
			5
		], [
			0,
			1,
			1,
			0,
			0,
			0
		], [
			0,
			1,
			10,
			3,
			4,
			5,
			6,
			7,
			8,
			2,
			9,
			11
		], [
			0,
			6,
			7,
			3,
			4,
			5,
			11,
			9,
			8,
			2,
			10,
			1
		], [
			0,
			1,
			2,
			4,
			5,
			3,
			6,
			7,
			8,
			9,
			10,
			11
		]);
		moveCube[12] = new FtoCubie([
			5,
			0,
			2,
			3,
			4,
			1
		], [
			1,
			1,
			0,
			0,
			0,
			0
		], [
			6,
			1,
			2,
			3,
			4,
			5,
			11,
			7,
			8,
			9,
			10,
			0
		], [
			5,
			3,
			2,
			8,
			4,
			7,
			6,
			0,
			1,
			9,
			10,
			11
		], [
			0,
			1,
			2,
			3,
			4,
			5,
			6,
			7,
			8,
			10,
			11,
			9
		]);
		moveCube[14] = new FtoCubie([
			2,
			1,
			4,
			3,
			0,
			5
		], [
			1,
			0,
			1,
			0,
			0,
			0
		], [
			0,
			8,
			2,
			3,
			4,
			5,
			6,
			1,
			7,
			9,
			10,
			11
		], [
			11,
			1,
			10,
			2,
			0,
			5,
			6,
			7,
			8,
			9,
			3,
			4
		], [
			0,
			1,
			2,
			3,
			4,
			5,
			7,
			8,
			6,
			9,
			10,
			11
		]);
		moveCube[16] = FtoCubie.FtoMult(rotU, moveCube[8], null);
		moveCube[18] = FtoCubie.FtoMult(rotF, moveCube[10], null);
		moveCube[20] = FtoCubie.FtoMult(rotR, moveCube[6], null);
		moveCube[22] = FtoCubie.FtoMult(rotL, moveCube[4], null);
		for (var i = 1; i < 24; i += 2) {
			moveCube[i] = new FtoCubie();
			FtoCubie.FtoMult(moveCube[i - 1], moveCube[i - 1], moveCube[i]);
		}
		var moveHash = [];
		for (var i = 0; i < 24; i++) moveHash[i] = moveCube[i].ep.join(",");
		var symCube = [];
		var symMult = [];
		var symMulI = [];
		var symMulM = [];
		var symHash = [];
		var fc = new FtoCubie();
		new FtoCubie();
		for (var s = 0; s < 12; s++) {
			symCube[s] = new FtoCubie(fc.cp, fc.co, fc.ep, fc.uf, fc.rl);
			symHash[s] = symCube[s].ep.join(",");
			symMult[s] = [];
			symMulI[s] = [];
			fc = FtoCubie.FtoMult(fc, rotU, null);
			if (s % 3 == 2) fc = FtoCubie.FtoMult(fc, rotR, rotU, null);
			if (s % 6 == 5) fc = FtoCubie.FtoMult(fc, rotU, rotR, null);
		}
		for (var i = 0; i < 12; i++) for (var j = 0; j < 12; j++) {
			FtoCubie.FtoMult(symCube[i], symCube[j], fc);
			var k = symHash.indexOf(fc.ep.join(","));
			symMult[i][j] = k;
			symMulI[k][j] = i;
		}
		for (var s = 0; s < 12; s++) {
			symMulM[s] = [];
			for (var j = 0; j < 8; j++) {
				FtoCubie.FtoMult(symCube[symMulI[0][s]], moveCube[j * 2], symCube[s], fc);
				var k = moveHash.indexOf(fc.ep.join(","));
				symMulM[s][j] = k >> 1;
			}
		}
		FtoCubie.moveCube = moveCube;
		FtoCubie.symCube = symCube;
		FtoCubie.symMult = symMult;
		FtoCubie.symMulI = symMulI;
		FtoCubie.symMulM = symMulM;
	}
	initMoveCube();
	function ftoPermMove(key, perm, move) {
		var ret = [];
		var movePerm = FtoCubie.moveCube[move][key];
		for (var i = 0; i < 12; i++) ret[i] = perm[movePerm[i]];
		return ret;
	}
	function ftoFullMove(fc, move) {
		return FtoCubie.FtoMult(fc, FtoCubie.moveCube[move], null);
	}
	function phase1EdgeHash(ep) {
		var ret = 0;
		var e3fst = -1;
		for (var i = 0; i < 12; i++) {
			if ((56 >> ep[i] & 1) == 0) continue;
			if (e3fst == -1) e3fst = ep[i];
			ret += (ep[i] - e3fst + 3) % 3 + 1 << i * 2;
		}
		return ret;
	}
	function phase1CtrlHash(rl) {
		var ret = 0;
		for (var i = 0; i < 12; i++) if (rl[i] < 3) ret |= 1 << i;
		return ret;
	}
	function phase2EdgeHash(ep) {
		var edge2group = [
			0,
			1,
			2,
			3,
			3,
			3,
			0,
			1,
			1,
			2,
			2,
			0
		];
		var groups = [
			[
				0,
				6,
				11
			],
			[
				1,
				7,
				8
			],
			[
				2,
				9,
				10
			],
			[
				3,
				4,
				5
			]
		];
		var ret = 0;
		var egoff = [
			-1,
			-1,
			-1,
			-1
		];
		for (var i = 0; i < 12; i++) {
			var g = edge2group[ep[i]];
			var gidx = groups[g].indexOf(ep[i]);
			if (egoff[g] == -1) egoff[g] = gidx;
			ret += (g * 4 + (gidx - egoff[g] + 3) % 3) * Math.pow(16, i);
		}
		return ret;
	}
	function phase2CtHash(ct) {
		var ret = 0;
		for (var i = 0; i < 12; i++) ret |= ~~(ct[i] / 3) << i * 2;
		return ret;
	}
	function phase3EdgeHash(ep) {
		return String.fromCharCode.apply(null, ep);
	}
	function phase3CcufHash(fc) {
		return String.fromCharCode.apply(null, [].concat(fc.cp, fc.co));
	}
	function randomMoves(validMoves, len) {
		var scramble = [];
		for (var i = 0; i < len; i++) scramble.push(validMoves[~~(Math.random() * validMoves.length)]);
		var fc = new FtoCubie();
		for (var i = 0; i < scramble.length; i++) fc = FtoCubie.FtoMult(fc, FtoCubie.moveCube[scramble[i]], null);
		return [fc, scramble];
	}
	function genCkmv(moves) {
		var ckmv = [];
		var tmp1 = new FtoCubie();
		var tmp2 = new FtoCubie();
		for (var m1 = 0; m1 < moves.length; m1++) {
			ckmv[m1] = 1 << m1;
			for (var m2 = 0; m2 < m1; m2++) {
				FtoCubie.FtoMult(FtoCubie.moveCube[moves[m1]], FtoCubie.moveCube[moves[m2]], tmp1);
				FtoCubie.FtoMult(FtoCubie.moveCube[moves[m2]], FtoCubie.moveCube[moves[m1]], tmp2);
				if (tmp1.isEqual(tmp2)) ckmv[m1] |= 1 << m2;
			}
		}
		return ckmv;
	}
	var phase1Moves = [
		0,
		2,
		22,
		6,
		16,
		10,
		12,
		14
	];
	var p1epMoves = null;
	var p1rlMoves = null;
	var ckmv1 = null;
	var solv1 = null;
	var pyraSymCube = [];
	for (var i = 0; i < 12; i++) pyraSymCube.push(new FtoCubie(FtoCubie.symCube[i].cp, FtoCubie.symCube[i].co, null, FtoCubie.symCube[i].uf, null));
	function phase1Init() {
		var fc = new FtoCubie();
		p1epMoves = mathlib.createMoveHash(fc.ep.slice(), phase1Moves, phase1EdgeHash, ftoPermMove.bind(null, "ep"));
		p1rlMoves = mathlib.createMoveHash(fc.rl.slice(), phase1Moves, phase1CtrlHash, ftoPermMove.bind(null, "rl"));
		var N_P1EP = p1epMoves[0][0].length;
		var N_P1RL = p1rlMoves[0][0].length;
		ckmv1 = genCkmv(phase1Moves);
		var p1eprlPrun = [];
		mathlib.createPrun(p1eprlPrun, 0, N_P1EP * N_P1RL, 14, function(idx, move) {
			var rl = ~~(idx / N_P1EP);
			var ep = idx % N_P1EP;
			return p1rlMoves[0][move][rl] * N_P1EP + p1epMoves[0][move][ep];
		}, phase1Moves.length, 2);
		solv1 = new mathlib.Searcher(null, function(idx) {
			return mathlib.getPruning(p1eprlPrun, idx[1] * N_P1EP + idx[0]);
		}, function(idx, move) {
			return [p1epMoves[0][move][idx[0]], p1rlMoves[0][move][idx[1]]];
		}, 8, 2, ckmv1);
	}
	function phase1GenIdxs(fc) {
		var idxs = [];
		var syms = [];
		var fc2 = new FtoCubie();
		var fc3 = new FtoCubie();
		for (var sidx = 0; sidx < 12; sidx += 3) {
			FtoCubie.FtoMult(FtoCubie.symCube[sidx % 12], fc, fc2);
			var rot = 0;
			for (; rot < 12; rot++) {
				FtoCubie.FtoMult(fc2, FtoCubie.symCube[rot], fc3);
				if (fc3.ep[4] == 4) break;
			}
			idxs.push([p1epMoves[1][phase1EdgeHash(fc3.ep)], p1rlMoves[1][phase1CtrlHash(fc3.rl)]]);
			syms.push([sidx, rot]);
		}
		return [idxs, syms];
	}
	function phase1ProcSol(sol, solsym, fc) {
		for (var i = 0; i < sol.length; i++) sol[i] = phase1Moves[sol[i][0]] + sol[i][1];
		var std = move2std(sol);
		for (var i = 0; i < std[0].length; i++) {
			var move = std[0][i];
			sol[i] = FtoCubie.symMulM[FtoCubie.symMulI[0][solsym[1]]][move >> 1] * 2 + (move & 1);
			fc = FtoCubie.FtoMult(fc, FtoCubie.moveCube[sol[i]], null);
		}
		solsym[1] = FtoCubie.symMulI[solsym[1]][std[1]];
		fc = FtoCubie.FtoMult(pyraSymCube[~~(solsym[0] / 12)], FtoCubie.symCube[solsym[0] % 12], fc, FtoCubie.symCube[solsym[1]], null);
		return [
			fc,
			sol,
			solsym[0],
			solsym[1]
		];
	}
	var N_PHASE1_SOLS = 1e3;
	function solvePhase1(fc) {
		if (!solv1) phase1Init();
		var tt = Date.now();
		var idxs = phase1GenIdxs(fc);
		var syms = idxs[1];
		idxs = idxs[0];
		var p1sols = [];
		solv1.solveMulti(idxs, 0, 12, function(sol, sidx) {
			var param = phase1ProcSol(sol.slice(), syms[sidx].slice(), fc);
			p1sols.push(param);
			return p1sols.length >= N_PHASE1_SOLS;
		});
		tt = Date.now() - tt;
		for (var i = 0; i < p1sols.length; i++) p1sols[i].push(tt);
		return p1sols;
	}
	var phase2Moves = [
		0,
		12,
		14,
		8,
		10
	];
	var p2epMoves = null;
	var p2rlMoves = null;
	var p2ccMoves = null;
	var p2cc2ufBit = {};
	var ckmv2 = null;
	var solv2 = null;
	var P2EPRL_MAXL = 11;
	var p2symMap = [];
	var ufStd2Raw = [];
	var ufRaw2Std = [];
	var p2ufCoord = new mathlib.Coord("c", 12, [
		3,
		3,
		3,
		3
	]);
	var cornExFacelets = [
		[
			U + 2,
			R + 2,
			F + 2,
			L + 2
		],
		[
			U + 5,
			B + 7,
			r + 5,
			R + 7
		],
		[
			U + 7,
			L + 5,
			l + 7,
			B + 5
		],
		[
			l + 2,
			D + 2,
			r + 2,
			B + 2
		],
		[
			F + 5,
			D + 7,
			l + 5,
			L + 7
		],
		[
			r + 7,
			D + 5,
			F + 7,
			R + 5
		]
	];
	function phase2CpcoHash(fc) {
		var ret = String.fromCharCode.apply(null, [].concat(fc.cp, fc.co));
		if (!(ret in p2cc2ufBit)) {
			var co = [];
			for (var i = 0; i < 6; i++) co[i] = fc.co[i] * 2;
			var facelet = fc.toFaceCube();
			mathlib.fillFacelet(cornExFacelets, facelet, fc.cp, co, 9);
			p2cc2ufBit[ret] = phase2CtHash(new FtoCubie().fromFacelet(facelet).uf);
		}
		return ret;
	}
	function phase2ufStd(uf, symMap) {
		var col1 = uf[0], col2 = -1;
		for (var i = 1; i < 12; i++) if (uf[i] != col1) {
			col2 = uf[i];
			break;
		}
		var sym = symMap[col1 * 4 + col2];
		for (var i = 0; i < 12; i++) uf[i] = ~~(FtoCubie.symCube[sym].uf[uf[i] * 3] / 3);
		return sym;
	}
	function getPhase2ufIdx(uf) {
		var ufstd = [];
		for (var i = 0; i < 12; i++) ufstd[i] = ~~(uf[i] / 3);
		var sym = phase2ufStd(ufstd, p2symMap);
		return ufRaw2Std[p2ufCoord.get(ufstd)] << 4 | sym;
	}
	function phase2Init() {
		var fc = new FtoCubie();
		p2epMoves = mathlib.createMoveHash(fc.ep.slice(), phase2Moves, phase2EdgeHash, ftoPermMove.bind(null, "ep"));
		p2rlMoves = mathlib.createMoveHash(fc.rl.slice(), phase2Moves, phase2CtHash, ftoPermMove.bind(null, "rl"));
		p2ccMoves = mathlib.createMoveHash(fc, phase2Moves, phase2CpcoHash, ftoFullMove);
		var arr = [];
		var arr2 = [];
		var p2ufMoveStd = [
			[],
			[],
			[],
			[],
			[]
		];
		var ufStd2Bit = [];
		var p2ccRecol = [];
		for (var s = 0; s < 12; s++) {
			var uf = FtoCubie.symCube[s].uf;
			var col1 = ~~(uf.indexOf(0) / 3);
			var col2 = ~~(uf.indexOf(3) / 3);
			p2symMap[col1 * 4 + col2] = s;
			p2ccRecol[s] = [];
		}
		out: for (var i = 0; i < 42e3; i++) {
			p2ufCoord.set(arr, i);
			for (var j = 1; j < 12; j++) if (arr[j] > 1) continue out;
			else if (arr[j] == 1) break;
			ufRaw2Std[i] = ufStd2Raw.length;
			ufStd2Raw.push(i);
		}
		for (var i = 0; i < ufStd2Raw.length; i++) {
			p2ufCoord.set(arr, ufStd2Raw[i]);
			var hash = 0;
			for (var j = 0; j < 12; j++) hash |= arr[j] << j * 2;
			ufStd2Bit[i] = hash;
			for (var m = 0; m < phase2Moves.length; m++) {
				mathlib.permOriMult(arr, FtoCubie.moveCube[phase2Moves[m]].uf, arr2);
				var sym = phase2ufStd(arr2, p2symMap);
				p2ufMoveStd[m][i] = ufRaw2Std[p2ufCoord.get(arr2)] << 4 | sym;
			}
		}
		var cc2Bit = [];
		for (var key in p2ccMoves[1]) {
			var idx = p2ccMoves[1][key];
			cc2Bit[idx] = p2cc2ufBit[key];
			var cpco = [];
			for (var s = 0; s < 12; s++) {
				var sc = FtoCubie.symCube[s];
				for (var i = 0; i < 6; i++) {
					var scpi = key.charCodeAt(i);
					cpco[i] = sc.cp[scpi];
					cpco[i + 6] = sc.co[scpi] ^ key.charCodeAt(i + 6);
				}
				var hash = String.fromCharCode.apply(null, cpco);
				p2ccRecol[s][idx] = p2ccMoves[1][hash];
			}
		}
		var p2necPrun = [
			0,
			99,
			3,
			4,
			5,
			6,
			8,
			99,
			2,
			3,
			4,
			5,
			6,
			8,
			1,
			3,
			4,
			5,
			6,
			7,
			8,
			1,
			3,
			4,
			5,
			6,
			7,
			9,
			99,
			2,
			3,
			4,
			5,
			6,
			8,
			2,
			2,
			4,
			4,
			5,
			6,
			8,
			3,
			3,
			4,
			5,
			6,
			7,
			8,
			3,
			3,
			4,
			5,
			6,
			7,
			9,
			3,
			3,
			4,
			5,
			6,
			7,
			8,
			4,
			4,
			4,
			5,
			6,
			7,
			8,
			4,
			4,
			5,
			6,
			7,
			8,
			9,
			4,
			4,
			5,
			6,
			7,
			8,
			9,
			4,
			4,
			5,
			6,
			7,
			8,
			9,
			4,
			4,
			5,
			6,
			7,
			8,
			9,
			5,
			5,
			6,
			7,
			8,
			9,
			10,
			5,
			5,
			6,
			7,
			8,
			9,
			10
		];
		var N_P2EP = p2epMoves[0][0].length;
		var N_P2RL = p2rlMoves[0][0].length;
		var p2eprlPrun = [];
		mathlib.createPrun(p2eprlPrun, 0, N_P2EP * N_P2RL, P2EPRL_MAXL - 2, function(idx, move) {
			var rl = ~~(idx / N_P2EP);
			var ep = idx % N_P2EP;
			return p2rlMoves[0][move][rl] * N_P2EP + p2epMoves[0][move][ep];
		}, phase2Moves.length, 2);
		ckmv2 = genCkmv(phase2Moves);
		solv2 = new mathlib.Searcher(null, function(idx) {
			var xors = ufStd2Bit[idx[3] >> 4] ^ cc2Bit[p2ccRecol[idx[3] & 15][idx[2]]];
			xors = (xors | xors >> 1) & 5592405;
			var necIdx = (mathlib.bitCount(xors & 63) << 2 | mathlib.bitCount(xors & 12632256)) * 7 + mathlib.bitCount(xors & 4144896);
			return Math.max(Math.min(P2EPRL_MAXL, mathlib.getPruning(p2eprlPrun, idx[1] * N_P2EP + idx[0])), p2necPrun[necIdx]);
		}, function(idx, move) {
			var ufidx1 = p2ufMoveStd[move][idx[3] >> 4];
			var ufcol = FtoCubie.symMult[ufidx1 & 15][idx[3] & 15];
			return [
				p2epMoves[0][move][idx[0]],
				p2rlMoves[0][move][idx[1]],
				p2ccMoves[0][move][idx[2]],
				ufidx1 & -16 | ufcol
			];
		}, phase2Moves.length, 2, ckmv2);
		if (0) var p2ufPrun, N_P2CC, N_P2UFSTD, ufBit2Std, i, solved, key, ufidx;
	}
	function solvePhase2(solvInfos) {
		if (!solv2) phase2Init();
		var tt = Date.now();
		var idxs = [];
		for (var i = 0; i < solvInfos.length; i++) idxs.push([
			p2epMoves[1][phase2EdgeHash(solvInfos[i][0].ep)],
			p2rlMoves[1][phase2CtHash(solvInfos[i][0].rl)],
			p2ccMoves[1][phase2CpcoHash(solvInfos[i][0])],
			getPhase2ufIdx(solvInfos[i][0].uf)
		]);
		var sol2s = solv2.solveMulti(idxs, 0, 25);
		var sol = sol2s[0];
		var src = sol2s[1];
		var solvInfo = solvInfos[src];
		var fc = solvInfo[0];
		for (var i = 0; i < sol.length; i++) {
			var move = phase2Moves[sol[i][0]] + sol[i][1];
			sol[i] = FtoCubie.symMulM[FtoCubie.symMulI[0][solvInfo[3]]][move >> 1] * 2 + (move & 1);
			fc = FtoCubie.FtoMult(fc, FtoCubie.moveCube[move], null);
		}
		return [
			fc,
			sol,
			solvInfo[2],
			solvInfo[3],
			src,
			Date.now() - tt
		];
	}
	var phase3Moves = [
		8,
		10,
		12,
		14
	];
	var p3epMoves = null;
	var p3ufMoves = null;
	var p3epPrun = null;
	var p3ufPrun = null;
	var ckmv3 = null;
	var solv3 = null;
	function phase3Init() {
		var fc = new FtoCubie();
		p3epMoves = mathlib.createMoveHash(fc.ep.slice(), phase3Moves, phase3EdgeHash, ftoPermMove.bind(null, "ep"));
		p3ufMoves = mathlib.createMoveHash(new FtoCubie(), phase3Moves, phase3CcufHash, ftoFullMove);
		p3epPrun = [];
		p3ufPrun = [];
		mathlib.createPrun(p3epPrun, 0, 81, 14, p3epMoves[0], 4, 2);
		mathlib.createPrun(p3ufPrun, 0, 11520, 14, p3ufMoves[0], 4, 2);
		ckmv3 = genCkmv(phase3Moves);
		solv3 = new mathlib.Searcher(null, function(idx) {
			return Math.max(mathlib.getPruning(p3epPrun, idx[0]), mathlib.getPruning(p3ufPrun, idx[1]));
		}, function(idx, move) {
			return [p3epMoves[0][move][idx[0]], p3ufMoves[0][move][idx[1]]];
		}, 4, 2, ckmv3);
	}
	function solvePhase3(solvInfo) {
		var fc = solvInfo[0];
		if (!p3epPrun) phase3Init();
		var tt = Date.now();
		var p3epidx = p3epMoves[1][phase3EdgeHash(fc.ep)];
		var p3ufidx = p3ufMoves[1][phase3CcufHash(fc)];
		var sol = solv3.solve([p3epidx, p3ufidx], 0, 25);
		for (var i = 0; i < sol.length; i++) {
			var move = phase3Moves[sol[i][0]] + sol[i][1];
			sol[i] = FtoCubie.symMulM[FtoCubie.symMulI[0][solvInfo[3]]][move >> 1] * 2 + (move & 1);
			fc = FtoCubie.FtoMult(fc, FtoCubie.moveCube[move], null);
		}
		return [
			fc,
			sol,
			solvInfo[2],
			solvInfo[3],
			Date.now() - tt
		];
	}
	function move2std(moves) {
		var sym = 0;
		var ret = [];
		var w2axis = [
			4,
			5,
			3,
			2
		];
		var w2rot = [
			1,
			10,
			5,
			11
		];
		for (var i = 0; i < moves.length; i++) {
			var rot = 0;
			var axis = moves[i] >> 1;
			var pow = moves[i] & 1;
			if (axis >= 8) {
				rot = w2rot[axis - 8];
				axis = w2axis[axis - 8];
			}
			if (!pow) rot = FtoCubie.symMult[rot][rot];
			ret.push(FtoCubie.symMulM[sym][axis] * 2 + pow);
			sym = FtoCubie.symMult[rot][sym];
		}
		return [ret, sym];
	}
	function applyMoves(fc, moves) {
		for (var i = 0; i < moves.length; i++) fc = FtoCubie.FtoMult(fc, FtoCubie.moveCube[moves[i]], null);
		return fc;
	}
	var move2str = [
		"U",
		"U'",
		"F",
		"F'",
		"r",
		"r'",
		"l",
		"l'",
		"D",
		"D'",
		"B",
		"B'",
		"R",
		"R'",
		"L",
		"L'"
	];
	function prettyMoves(moves) {
		var buf = [];
		for (var i = 0; i < moves.length; i++) buf[i] = move2str[moves[i]];
		return buf.join(" ").replace(/l/g, "BL").replace(/r/g, "BR");
	}
	function FtoSolver() {}
	FtoSolver.prototype.solveFto = function(fc, invSol) {
		if (!solv1) {
			phase1Init();
			phase2Init();
			phase3Init();
		}
		var solvInfos = solvePhase1(fc);
		var solvInfo2 = solvePhase2(solvInfos);
		var solvInfo1 = solvInfos[solvInfo2[4]];
		this.sol1 = solvInfo1[1].slice();
		this.tt1 = solvInfo1[4];
		var sym1Idx = solvInfo1[2];
		this.sol2 = solvInfo2[1].slice();
		this.tt2 = solvInfo2[5];
		solvInfo2[0] = FtoCubie.FtoMult(pyraSymCube[FtoCubie.symMulI[0][~~(sym1Idx / 12)]], solvInfo2[0], null);
		var solvInfo3 = solvePhase3(solvInfo2);
		this.sol3 = solvInfo3[1].slice();
		this.tt3 = solvInfo3[4];
		var sol = [].concat(this.sol1, this.sol2, this.sol3);
		if (invSol) {
			for (var i = 0; i < sol.length; i++) sol[i] ^= 1;
			sol.reverse();
		}
		return prettyMoves(sol);
	};
	var solver = new FtoSolver();
	function solveTest(n_moves) {
		var solvInfo = randomMoves([
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
			11,
			12,
			13,
			14,
			15
		], n_moves);
		prettyMoves(solvInfo[1].slice());
		solver.solveFto(solvInfo[0]);
		var fc = solvInfo[0];
		fc = applyMoves(fc, solver.sol1);
		fc = applyMoves(fc, solver.sol2);
		fc = applyMoves(fc, solver.sol3);
		var facelets = fc.toFaceCube();
		var isSolved = true;
		out: for (var i = 0; i < 8; i++) for (var j = 1; j < 9; j++) if (facelets[i * 9 + j] != facelets[i * 9]) {
			isSolved = false;
			break out;
		}
		if (!isSolved) console.log("error, FTO not solved!!!");
		return [
			solver.sol1.length + solver.sol2.length + solver.sol3.length,
			solver.sol1.length,
			solver.sol2.length,
			solver.sol3.length,
			solver.tt1,
			solver.tt2,
			solver.tt3
		];
	}
	function testbench(ntest) {
		ntest = ntest || 100;
		var cumlen = [];
		for (var nsolv = 0; nsolv < ntest; nsolv++) {
			var lengths = solveTest(200);
			for (var i = 0; i < lengths.length; i++) cumlen[i] = (cumlen[i] || 0) + lengths[i];
			console.log("AvgL: ", cumlen[0] / (nsolv + 1));
		}
		console.log("AvgL1:", cumlen[1] / ntest);
		console.log("AvgL2:", cumlen[2] / ntest);
		console.log("AvgL3:", cumlen[3] / ntest);
		console.log("AvgT1:", cumlen[4] / ntest);
		console.log("AvgT2:", cumlen[5] / ntest);
		console.log("AvgT3:", cumlen[6] / ntest);
	}
	function solveFacelet(facelet, invSol) {
		var fc = new FtoCubie();
		if (fc.fromFacelet(facelet) == -1) return "FTO Solver ERROR!";
		return solver.solveFto(fc, invSol);
	}
	return {
		solveFacelet,
		FtoCubie,
		testbench: DEBUG && testbench
	};
})();
//#endregion
//#region src/vendor/cstimer/scramble_fto.js
(function() {
	"use strict";
	function getRandomScramble(solvedEdge, solvedCenter, solvedCorner) {
		var fc = new ftosolver.FtoCubie();
		if (!solvedEdge) fc.ep = mathlib.rndPerm(12, true);
		if (!solvedCenter) {
			fc.uf = mathlib.rndPerm(12, true);
			fc.rl = mathlib.rndPerm(12, true);
		}
		if (!solvedCorner) {
			fc.cp = mathlib.rndPerm(6, true);
			mathlib.setNOri(fc.co, mathlib.rn(32), 6, -2);
		}
		return ftosolver.solveFacelet(fc.toFaceCube(), true);
	}
	function getLNTScramble(ufs) {
		var solved = false;
		var nCorn = ufs.length >> 1;
		var fc = new ftosolver.FtoCubie();
		var cp, co, uf;
		do {
			cp = mathlib.rndPerm(nCorn, true);
			co = mathlib.setNOri([], mathlib.rn(1 << nCorn >> 1), nCorn, -2);
			uf = mathlib.rndPerm(ufs.length, true);
			solved = true;
			for (var i = 0; i < ufs.length; i++) solved = solved && ~~(ufs[uf[i]] / 3) == ~~(ufs[i] / 3);
			for (var i = 0; i < nCorn; i++) solved = solved && cp[i] == i && co[i] == 0;
		} while (solved);
		for (var i = 0; i < nCorn; i++) {
			fc.cp[i] = cp[i];
			fc.co[i] = co[i];
		}
		for (var i = 0; i < ufs.length; i++) fc.uf[ufs[i]] = ufs[uf[i]];
		return ftosolver.solveFacelet(fc.toFaceCube(), true);
	}
	function getTCPScramble() {
		var fc = new ftosolver.FtoCubie();
		var cp, co, uf;
		var ufs = [
			1,
			2,
			3,
			7,
			11
		];
		do {
			cp = mathlib.rndPerm(3, true);
			co = [0].concat(mathlib.setNOri([], mathlib.rn(2), 2, -2));
			uf = mathlib.rndPerm(5, true);
		} while (ufs[uf[0]] < 3 || ufs[uf[1]] < 3);
		for (var i = 0; i < 3; i++) {
			fc.cp[i] = cp[i];
			fc.co[i] = co[i];
		}
		for (var i = 0; i < ufs.length; i++) fc.uf[ufs[i]] = ufs[uf[i]];
		return ftosolver.solveFacelet(fc.toFaceCube(), true);
	}
	scrMgr.reg("ftoso", getRandomScramble.bind(null, false, false, false))("ftol3t", getLNTScramble.bind(null, [
		0,
		1,
		2,
		3,
		7,
		11
	]))("ftol4t", getLNTScramble.bind(null, [
		0,
		1,
		2,
		3,
		6,
		7,
		9,
		11
	]))("ftotcp", getTCPScramble)("ftoedge", getRandomScramble.bind(null, false, true, true))("ftocent", getRandomScramble.bind(null, true, false, true))("ftocorn", getRandomScramble.bind(null, true, true, false));
})();
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
(function() {
	var sol;
	function slideMove(state, m) {
		var blank = state.indexOf("-");
		var x = blank >> 2;
		var y = blank & 3;
		var ret = state.split("");
		var ori = m[0];
		var target = ~~m[1];
		var arr = [x << 2 | y];
		if (ori == "V") {
			if (ret[x << 2 | target] == "$") return null;
			var inc = y > target ? -1 : 1;
			while (y != target) {
				y += inc;
				arr.push(x << 2 | y);
			}
		} else {
			if (ret[target << 2 | y] == "$") return null;
			var inc = x > target ? -1 : 1;
			while (x != target) {
				x += inc;
				arr.push(x << 2 | y);
			}
		}
		arr.reverse();
		mathlib.acycle(ret, arr);
		return ret.join("");
	}
	function mirror(perm) {
		var ret = [];
		var mirrorPerm = [
			0,
			4,
			8,
			12,
			1,
			5,
			9,
			13,
			2,
			6,
			10,
			14,
			3,
			7,
			11,
			15
		];
		for (var i = 0; i < 16; i++) ret[i] = mirrorPerm[perm[mirrorPerm[i]]];
		return ret;
	}
	function fixBlank(state) {
		var ret = [];
		state = state.split("");
		for (var i = 0; i < state.length; i++) if (state[i] == "?") {
			state[i] = "-";
			ret.push(state.join(""));
			state[i] = "?";
		}
		return ret;
	}
	var moves = {
		"V0": 0,
		"V1": 0,
		"V2": 0,
		"V3": 0,
		"H0": 1,
		"H1": 1,
		"H2": 1,
		"H3": 1
	};
	var solv1 = new mathlib.gSolver(fixBlank("0123????????????"), slideMove, moves);
	var solv2 = new mathlib.gSolver(fixBlank("$$$$4???8???c???"), slideMove, moves);
	var solv3 = new mathlib.gSolver(["$$$$$567$9ab$de-"], slideMove, moves);
	function stateInit(state, perm) {
		var ret = [];
		for (var i = 0; i < perm.length; i++) ret[i] = state[perm[i]];
		state = ret.join("");
		for (var i = 0; i < sol.length; i++) state = slideMove(state, sol[i]);
		return state;
	}
	function randPerm(size) {
		var perm = [];
		var inv;
		do {
			perm = mathlib.rndPerm(size * size);
			inv = (size - 1 - ~~(perm.indexOf(perm.length - 1) / size)) * (size - 1);
			for (var i = 0; i < perm.length; i++) for (var j = i + 1; j < perm.length; j++) if (perm[i] > perm[j] && perm[i] != perm.length - 1) inv++;
		} while (inv % 2 != 0);
		return perm;
	}
	function prettySol(settings, size, midx) {
		var ret = [];
		var moveRef = midx == 1 ? "VH" : "HV";
		var symbol = settings.indexOf("a") == -1 ? ["DR", "UL"] : ["￬￫", "￪￩"];
		var isBlankMove = settings.indexOf("m") != -1;
		var compress = settings.indexOf("p") != -1;
		var pos = [-1, -1];
		for (var i = 0; i < sol.length; i++) {
			var val = ~~sol[i][1];
			var m = moveRef.indexOf(sol[i][0]);
			if (pos[m] == -1 || pos[m] == val) {
				pos[m] = val;
				continue;
			}
			if (ret.length > 0 && ret.at(-1)[0] == m) {
				var move = ret.at(-1);
				move[1] += val - pos[m];
				if (move[1] == 0) ret.pop();
			} else ret.push([m, val - pos[m]]);
			pos[m] = val;
		}
		for (var i = 0; i < ret.length; i++) {
			var move = ret[i];
			var axis = symbol[isBlankMove != move[1] > 0 ? 0 : 1][move[0]];
			var pow = Math.abs(move[1]);
			ret[i] = [];
			if (compress) ret[i].push(axis + pow);
			else while (pow-- > 0) ret[i].push(axis);
			ret[i] = ret[i].join(" ");
		}
		ret.reverse();
		return ret.join(" ").replace(/1/g, "");
	}
	function getScramble(size, type) {
		+/* @__PURE__ */ new Date();
		var perm = [];
		var midx = 0;
		if (size == 4) {
			perm[0] = randPerm(4);
			perm[1] = mirror(perm[0]);
			out: for (var d = 0; d < 99; d++) for (midx = 0; midx < 2; midx++) {
				var blank = perm[midx].indexOf(perm[midx].length - 1);
				sol = ["V" + (blank & 3), "H" + (blank >> 2)];
				var sol1 = solv1.search(stateInit("0123???????????-", perm[midx]), d, d);
				if (sol1) {
					sol = sol.concat(sol1);
					break out;
				}
			}
			var sol2 = solv2.search(stateInit("01234???8???c??-", perm[midx]).replace(/[0123]/g, "$"), 0);
			sol = sol.concat(sol2);
		} else if (size == 3) {
			var perm8 = randPerm(3);
			var slide8 = [
				5,
				6,
				7,
				9,
				10,
				11,
				13,
				14,
				15
			];
			for (var i = 0; i < 16; i++) perm[i] = slide8[perm8[slide8.indexOf(i)]] || i;
			var blank = perm.indexOf(perm.length - 1);
			sol = ["V" + (blank & 3), "H" + (blank >> 2)];
			perm = [perm];
		}
		var sol3 = solv3.search(stateInit("0123456789abcde-", perm[midx]).replace(/[012348c]/g, "$"), 0);
		sol = sol.concat(sol3);
		return prettySol(type.slice(size == 3 ? 3 : 4), 4, midx);
	}
	scrMgr.reg([
		"15prp",
		"15prap",
		"15prmp"
	], getScramble.bind(null, 4))([
		"8prp",
		"8prap",
		"8prmp"
	], getScramble.bind(null, 3));
})();
//#endregion
//#region src/vendor/cstimer/1x3x3.js
(function() {
	var solv = new mathlib.Solver(4, 1, [[
		0,
		doMove,
		384
	]]);
	var movePieces = [
		[0, 1],
		[2, 3],
		[0, 3],
		[1, 2]
	];
	function doMove(idx, m) {
		var arr = mathlib.setNPerm([], idx >> 4, 4);
		mathlib.acycle(arr, movePieces[m]);
		return (mathlib.getNPerm(arr, 4) << 4) + (idx & 15 ^ 1 << m);
	}
	function generateScramble() {
		var c = 1 + mathlib.rn(191);
		c = c * 2 + ((mathlib.getNParity(c >> 3, 4) ^ c >> 1 ^ c >> 2 ^ c) & 1);
		return solv.toStr(solv.search([c], 0), "RLFB", [""]);
	}
	scrMgr.reg("133", generateScramble);
})();
//#endregion
//#region src/vendor/cstimer/2x2x3.js
(function(circle, getNPerm) {
	var cmv = [];
	var cprun = [];
	function initCornerMoveTable() {
		var g = [], temp;
		for (var i = 0; i < 40320; i++) cmv[i] = [];
		for (var i = 0; i < 40320; i++) {
			mathlib.setNPerm(g, i, 8);
			circle(g, 0, 1, 2, 3);
			temp = cmv[0][i] = getNPerm(g, 8);
			circle(g, 4, 5, 6, 7);
			temp = cmv[1][temp] = getNPerm(g, 8);
			circle(g, 2, 5)(g, 3, 6);
			temp = cmv[2][temp] = getNPerm(g, 8);
			circle(g, 0, 5)(g, 3, 4);
			cmv[3][temp] = getNPerm(g, 8);
		}
	}
	function doEdgeMove(idx, m) {
		if (m < 2) return idx;
		var g = mathlib.setNPerm([], idx, 3);
		if (m == 2) circle(g, 0, 1);
		else if (m == 3) circle(g, 0, 2);
		return getNPerm(g, 3);
	}
	function init() {
		init = function() {};
		initCornerMoveTable();
		mathlib.createPrun(cprun, 0, 40320, 12, cmv, 4, 3);
	}
	function search(corner, edge, maxl, lm, sol) {
		if (maxl == 0) return corner + edge == 0;
		if (mathlib.getPruning(cprun, corner) > maxl) return false;
		var h, g, f, i = 0;
		for (; i < 4; i++) if (i != lm) {
			h = corner;
			g = edge;
			for (f = 0; f < (i < 2 ? 3 : 1); f++) {
				h = cmv[i][h];
				g = doEdgeMove(g, i);
				if (search(h, g, maxl - 1, i, sol)) {
					sol.push([
						"U",
						"D",
						"R2",
						"F2"
					][i] + (i < 2 ? " 2'".charAt(f) : ""));
					return true;
				}
			}
		}
	}
	function generateScramble() {
		init();
		var b, c;
		do {
			c = mathlib.rn(40320);
			b = mathlib.rn(6);
		} while (b + c == 0);
		var d = [];
		for (var a = 0; a < 99; a++) if (search(c, b, a, -1, d)) break;
		return d.reverse().join(" ");
	}
	scrMgr.reg("223", generateScramble);
})(mathlib.circle, mathlib.getNPerm);
//#endregion
//#region src/vendor/cstimer/gearcube.js
(function() {
	var cmv = [];
	var emv = [];
	var prun = [
		[],
		[],
		[]
	];
	var moveEdges = [
		[
			0,
			3,
			2,
			1
		],
		[0, 1],
		[0, 3]
	];
	function cornerMove(arr, m) {
		mathlib.acycle(arr, [0, m + 1]);
	}
	function edgeMove(idx, m) {
		var arr = mathlib.setNPerm([], ~~(idx / 3), 4);
		mathlib.acycle(arr, moveEdges[m]);
		return mathlib.getNPerm(arr, 4) * 3 + (idx % 3 + (m == 0 ? 1 : 0)) % 3;
	}
	function doMove(off, idx, m) {
		var edge = idx % 72;
		var corner = ~~(idx / 72);
		corner = cmv[m][corner];
		edge = emv[(m + off) % 3][edge];
		return corner * 72 + edge;
	}
	function getPrun(state) {
		return Math.max(mathlib.getPruning(prun[0], state[0] * 72 + state[1]), mathlib.getPruning(prun[1], state[0] * 72 + state[2]), mathlib.getPruning(prun[2], state[0] * 72 + state[3]));
	}
	function search(state, maxl, lm, sol) {
		if (maxl == 0) return state[0] == 0 && state[1] == 0 && state[2] == 0 && state[3] == 0;
		if (getPrun(state) > maxl) return false;
		for (var m = 0; m < 3; m++) {
			if (m == lm) continue;
			var statex = state.slice();
			for (var a = 0; a < 11; a++) {
				statex[0] = cmv[m][statex[0]];
				for (var i = 1; i < 4; i++) statex[i] = emv[(m + i - 1) % 3][statex[i]];
				if (search(statex, maxl - 1, m, sol)) {
					sol.push("URF".charAt(m) + [
						"'",
						"2'",
						"3'",
						"4'",
						"5'",
						"6",
						"5",
						"4",
						"3",
						"2",
						""
					][a]);
					return true;
				}
			}
		}
	}
	function init() {
		init = function() {};
		mathlib.createMove(emv, 72, edgeMove, 3);
		mathlib.createMove(cmv, 24, [
			cornerMove,
			"p",
			4
		], 3);
		for (var i = 0; i < 3; i++) mathlib.createPrun(prun[i], 0, 1728, 5, doMove.bind(null, i), 3, 12, 0);
	}
	function getRandomState() {
		var ret = [mathlib.rn(24)];
		for (var i = 0; i < 3; i++) do
			ret[i + 1] = mathlib.rn(72);
		while (mathlib.getPruning(prun[i], ret[0] * 72 + ret[i + 1]) == 15);
		return ret;
	}
	function generateScramble(type) {
		init();
		var state;
		do
			state = getRandomState();
		while (state == 0);
		var len = type == "gearso" ? 4 : 0;
		var sol = [];
		while (true) {
			if (search(state, len, -1, sol)) break;
			len++;
		}
		return sol.reverse().join(" ");
	}
	scrMgr.reg(["gearo", "gearso"], generateScramble);
})();
(function() {
	var edgeMoveSwaps = [
		[
			1,
			0,
			8
		],
		[
			2,
			1,
			9
		],
		[
			3,
			2,
			10
		],
		[
			0,
			3,
			11
		],
		[
			4,
			5,
			8
		],
		[
			5,
			6,
			9
		],
		[
			6,
			7,
			10
		],
		[
			7,
			4,
			11
		]
	];
	var edgeMoveSwaps2 = [
		[
			1,
			0,
			4
		],
		[
			2,
			1,
			5
		],
		[
			3,
			2,
			6
		],
		[
			0,
			3,
			7
		]
	];
	function phase2EdgeMove(arr, move) {
		mathlib.acycle(arr, edgeMoveSwaps2[move], 1);
	}
	function phase2CornMove(arr, move) {
		arr[move] = (arr[move] + 1) % 3;
	}
	function getEdgeComb(target, ep) {
		var idxComb = 0;
		var permR = [];
		var r = 4;
		for (var i = 11; i >= 0; i--) if ((ep[i] & 12) == target) {
			idxComb += mathlib.Cnk[i][r--];
			permR[r] = ep[i] & 3;
		}
		return idxComb * 24 + mathlib.getNPerm(permR, 4);
	}
	function setPhase1EdgeComb(ep, idx) {
		var fill = 11;
		var r = 4;
		for (var i = 11; i >= 0; i--) if (idx >= mathlib.Cnk[i][r]) {
			idx -= mathlib.Cnk[i][r--];
			ep[i] = r + 4;
		} else {
			ep[i] = fill--;
			if ((fill & 12) == 4) fill -= 4;
		}
		return ep;
	}
	function phase1EdgeCombMove(idx, move) {
		var ep = setPhase1EdgeComb([], idx);
		mathlib.acycle(ep, edgeMoveSwaps[move], 1);
		return getEdgeComb(4, ep);
	}
	function doEdge4Move(idx, move) {
		var slice = ~~(idx / 24);
		var perm = idx % 24;
		var val = edgeCombMove[move][slice];
		slice = ~~(val / 24);
		perm = perm4Mult[perm][val % 24];
		return slice * 24 + perm;
	}
	function phase1CornMove(idx, move) {
		if (move < 4) return idx;
		var co = cornCoord.set([], idx);
		co[move - 4] = (co[move - 4] + 1) % 3;
		return cornCoord.get(co);
	}
	function prettySolution(sol) {
		var ret = [];
		for (var i = 0; i < sol.length; i++) ret.push("FLBRflbr"[sol[i][0]] + ["", "'"][sol[i][1]]);
		return ret.join(" ");
	}
	var perm4Mult = [];
	var edgeCombMove = [];
	var cornMove = [];
	var cornCoord = null;
	var phase1EdgePrun = [];
	var phase1CornPrun = [];
	var dinoEdgePruns = [
		[],
		phase1EdgePrun,
		[]
	];
	var solvRedi1 = null;
	var solvRedi2 = null;
	var solvDino = null;
	function initDino() {
		if (solvDino) return;
		var perm1 = [];
		var perm2 = [];
		var perm3 = [];
		for (var i = 0; i < 24; i++) {
			perm4Mult[i] = [];
			mathlib.setNPerm(perm1, i, 4);
			for (var j = 0; j < 24; j++) {
				mathlib.setNPerm(perm2, j, 4);
				for (var k = 0; k < 4; k++) perm3[k] = perm1[perm2[k]];
				perm4Mult[i][j] = mathlib.getNPerm(perm3, 4);
			}
		}
		mathlib.createMove(edgeCombMove, 495, phase1EdgeCombMove, 8);
		mathlib.createPrun(dinoEdgePruns[0], 0, 11880, 8, doEdge4Move, 8, 2);
		mathlib.createPrun(dinoEdgePruns[1], 1656, 11880, 8, doEdge4Move, 8, 2);
		mathlib.createPrun(dinoEdgePruns[2], 11856, 11880, 8, doEdge4Move, 8, 2);
		solvDino = new mathlib.Searcher(null, function(idx) {
			return Math.max(mathlib.getPruning(dinoEdgePruns[0], idx[0]), mathlib.getPruning(dinoEdgePruns[1], idx[1]), mathlib.getPruning(dinoEdgePruns[2], idx[2]));
		}, function(idx, move) {
			var idx1 = [
				doEdge4Move(idx[0], move),
				doEdge4Move(idx[1], move),
				doEdge4Move(idx[2], move)
			];
			if (idx1[0] == idx[0] && idx1[1] == idx[1] && idx1[2] == idx[2]) return null;
			return idx1;
		}, 8, 2);
	}
	function initRedi() {
		if (solvRedi1) return;
		cornCoord = new mathlib.Coord("o", 4, 3);
		mathlib.createMove(cornMove, 81, phase1CornMove, 8);
		mathlib.createPrun(phase1CornPrun, 0, 81, 4, cornMove, 8, 2);
		solvRedi1 = new mathlib.Searcher(null, function(idx) {
			return Math.max(mathlib.getPruning(phase1CornPrun, idx[0]), mathlib.getPruning(phase1EdgePrun, idx[1]));
		}, function(idx, move) {
			var idx1 = [cornMove[move][idx[0]], doEdge4Move(idx[1], move)];
			if (idx1[0] == idx[0] && idx1[1] == idx[1]) return null;
			return idx1;
		}, 8, 2);
		solvRedi2 = new mathlib.Solver(4, 2, [[
			0,
			[
				phase2CornMove,
				"o",
				4,
				3
			],
			81
		], [
			0,
			[
				phase2EdgeMove,
				"p",
				8,
				-1
			],
			20160
		]]);
	}
	function solveRedi(ep, co) {
		var p1eidx = getEdgeComb(4, ep);
		var p1cidx = cornCoord.get(co.slice(4));
		var sol1 = solvRedi1.solve([p1cidx, p1eidx], 0, 15);
		for (var i = 0; i < sol1.length; i++) {
			var axis = sol1[i][0];
			var pow = sol1[i][1] + 1;
			mathlib.acycle(ep, edgeMoveSwaps[axis], pow);
			co[axis] = (co[axis] + pow) % 3;
		}
		var ep2 = [];
		for (var i = 0; i < 8; i++) {
			var j = i < 4 ? i : i + 4;
			ep2[i] = ep[j] < 4 ? ep[j] : ep[j] - 4;
		}
		var p2eidx = mathlib.getNPerm(ep2, 8, -1);
		var p2cidx = cornCoord.get(co);
		var sol2 = solvRedi2.search([p2cidx, p2eidx], 0);
		return prettySolution([].concat(sol1, sol2));
	}
	function solveDino(ep, minl) {
		var idx = [
			getEdgeComb(0, ep),
			getEdgeComb(4, ep),
			getEdgeComb(8, ep)
		];
		return prettySolution(solvDino.solve(idx, minl, 15));
	}
	function testRedi() {
		initRedi();
		var scramble = [];
		for (var i = 0; i < 20; i++) scramble.push([~~(Math.random() * 8), ~~(Math.random() * 2)]);
		var ep = [
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
		var co = [
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0
		];
		for (var i = 0; i < scramble.length; i++) {
			var axis = scramble[i][0];
			var pow = scramble[i][1] + 1;
			mathlib.acycle(ep, edgeMoveSwaps[axis], pow);
			co[axis] = (co[axis] + pow) % 3;
		}
		console.log(prettySolution(scramble) + "   " + solveRedi(ep, co));
	}
	function testDino() {
		initDino();
		var scramble = [];
		for (var i = 0; i < 20; i++) scramble.push([~~(Math.random() * 8), ~~(Math.random() * 2)]);
		var ep = [
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
		for (var i = 0; i < scramble.length; i++) {
			var axis = scramble[i][0];
			var pow = scramble[i][1] + 1;
			mathlib.acycle(ep, edgeMoveSwaps[axis], pow);
		}
		console.log(prettySolution(scramble) + "   " + solveDino(ep));
	}
	function getRandomScramble(type) {
		initDino();
		if (type == "rediso") initRedi();
		var ep = mathlib.rndPerm(12, true);
		var co = [];
		for (var i = 0; i < 8; i++) co[i] = mathlib.rn(3);
		if (type == "rediso") return solveRedi(ep, co);
		else if (type == "dinoso") return solveDino(ep, 10);
		else return solveDino(ep, 0);
	}
	scrMgr.reg("rediso", getRandomScramble)("dinoo", getRandomScramble)("dinoso", getRandomScramble);
	return {
		solveRedi,
		getRandomScramble,
		testRedi,
		testDino
	};
})();
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
export { Move, Puzzle, events222, events333, events333Variants, events444, events555, events666, events777, eventsClock, eventsFto, eventsJoke, eventsMinx, eventsOther, eventsPyram, eventsRelay, eventsSkewb, eventsSq1, get222Scramble, get333BldScramble, get333CornersScramble, get333EdgesScramble, get333FmcScramble, get333LLScramble, get333MultiBldScramble, get333OhScramble, get333Scramble, get444BldScramble, get444Scramble, get555BldScramble, get555Scramble, get666Scramble, get777Scramble, getAnyScramble, getClockScramble, getEvent, getFtoScramble, getMegaminxScramble, getPyraminxScramble, getScramble, getScrambleImage, getSeed, getSkewbScramble, getSquare1Scramble, hasScrambleImage, listEvents, listPuzzles, registerEvents, setSeed };

//# sourceMappingURL=index.mjs.map