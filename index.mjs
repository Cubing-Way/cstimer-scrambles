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
/** Generates one scramble for a csTimer scramble type id, e.g. `getScramble('333')`. */
function getScramble(id) {
	const event = events.get(id);
	if (!event) throw new Error(`Unknown scramble type "${id}"`);
	return event.generate();
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
//#region src/events/333/index.ts
/** WCA 3x3: random-state scramble. */
function get333Scramble() {
	return getAnyScramble().trim();
}
/** WCA FMC: random state, wrapped in R' U' F so it cannot start or end with trivial cancellations. */
function get333FmcScramble() {
	return `R' U' F ${getAnyScramble({
		firstAxisFilter: 2,
		lastAxisFilter: 1
	}).trim()} R' U' F`;
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
		id: "333fm",
		name: "3x3x3 fewest moves",
		puzzle: "333",
		generate: get333FmcScramble
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
registerEvents(...events333);
//#endregion
export { Move, events333, get333CornersScramble, get333EdgesScramble, get333FmcScramble, get333LLScramble, get333Scramble, getAnyScramble, getEvent, getScramble, getSeed, listEvents, registerEvents, setSeed };

//# sourceMappingURL=index.mjs.map