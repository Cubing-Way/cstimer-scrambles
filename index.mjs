import { a as poly3d, c as mathlib, i as scrMgr, n as clock, o as kernel, r as sq1, s as tools, t as scramble_333$1 } from "./redi-CSp0LG7N.mjs";
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
//#region src/vendor/cstimer/svglib.js
var $$1 = {};
$$1.svg = (function() {
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
$$1.ctxDrawPolygon = function(ctx, color, arr, trans) {
	if (!ctx) return;
	trans = trans || [
		1,
		0,
		0,
		0,
		1,
		0
	];
	arr = $$1.ctxTransform(arr, trans);
	if (ctx instanceof $$1.svg) return ctx.addPoly(arr, color);
	ctx.beginPath();
	ctx.fillStyle = color;
	ctx.moveTo(arr[0][0], arr[1][0]);
	for (var i = 1; i < arr[0].length; i++) ctx.lineTo(arr[0][i], arr[1][i]);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
};
$$1.ctxRotate = function(arr, theta) {
	return $$1.ctxTransform(arr, [
		Math.cos(theta),
		-Math.sin(theta),
		0,
		Math.sin(theta),
		Math.cos(theta),
		0
	]);
};
$$1.ctxTransform = function(arr) {
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
$$1.nearColor = function(color, ref, longFormat) {
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
$$1.col2std = function(col, faceMap) {
	var ret = [];
	col = (col || "").match(/#[0-9a-fA-F]{3}/g) || [];
	for (var i = 0; i < col.length; i++) ret.push(~~$$1.nearColor(col[faceMap[i]], 0, true).replace("#", "0x"));
	return ret;
};
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
var image = (function() {
	var img;
	var hsq3 = Math.sqrt(3) / 2;
	var PI = Math.PI;
	var Rotate = $$1.ctxRotate;
	var Transform = $$1.ctxTransform;
	var drawPolygon = $$1.ctxDrawPolygon;
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
			var svg = new $$1.svg();
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
			var svg = new $$1.svg();
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
			var svg = new $$1.svg();
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
			var svg = new $$1.svg();
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
				colors = $$1.col2std(kernel.getProp("colskb"), [
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
				var subSvg = new $$1.svg();
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
		var svg = new $$1.svg();
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
			var popImg = $$1("<img style=\"display:block;\">");
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
		llImage,
		pyrllImage,
		face3Image,
		sqllImage: sq1Image.llImage
	};
})();
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
* The SVG has a viewBox, so it can be resized with CSS, and no background.
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
		svg = image.draw([
			type,
			scramble,
			0
		]);
	} finally {
		kernel.props = saved;
	}
	if (!svg) throw new Error(`csTimer has no scramble image for "${type}"`);
	const height = width === void 0 ? svg.height : svg.height * width / svg.width;
	return svg.render().replace(/ width="[^"]*"/, width === void 0 ? "$&" : ` width="${round(width)}"`).replace(/ height="[^"]*"/, width === void 0 ? "$&" : ` height="${round(height)}"`).replace("<svg ", `<svg viewBox="0 0 ${round(svg.width)} ${round(svg.height)}" `);
}
function round(n) {
	return parseFloat(n.toFixed(3)).toString();
}
//#endregion
//#region \0@oxc-project+runtime@0.152.0/helpers/esm/checkPrivateRedeclaration.js
function _checkPrivateRedeclaration(e, t) {
	if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object");
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
//#region src/puzzle.ts
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
		methods
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
/** Ids of the puzzles `new Puzzle(id)` accepts, e.g. `'333'`, `'pyram'`. */
function listPuzzles() {
	return Object.keys(PUZZLES);
}
var _info = /* @__PURE__ */ new WeakMap();
var _colors = /* @__PURE__ */ new WeakMap();
var _imageSize = /* @__PURE__ */ new WeakMap();
var _method = /* @__PURE__ */ new WeakMap();
var _scramble = /* @__PURE__ */ new WeakMap();
var _scrambleType = /* @__PURE__ */ new WeakMap();
/**
* One physical puzzle, e.g. `new Puzzle('333')`. Each puzzle keeps its own settings
* (colors, image size, scramble method), so two puzzles never affect each other.
*
* Settings are changed with `set...` methods, which return the puzzle so they can be
* chained: `new Puzzle('333').setColor('U', '#ff0').setImageSize(200)`.
*/
var Puzzle = class {
	constructor(id) {
		_classPrivateFieldInitSpec(this, _info, void 0);
		_classPrivateFieldInitSpec(this, _colors, void 0);
		_classPrivateFieldInitSpec(this, _imageSize, void 0);
		_classPrivateFieldInitSpec(this, _method, "default");
		_classPrivateFieldInitSpec(this, _scramble, "");
		_classPrivateFieldInitSpec(this, _scrambleType, "");
		const info = PUZZLES[id];
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
	*/
	setImageSize(width) {
		if (!(width > 0) || !Number.isFinite(width)) throw new Error(`Image size must be a positive number of pixels, not ${width}`);
		_classPrivateFieldSet2(_imageSize, this, width);
		return this;
	}
	/** The width set with `setImageSize`, or `undefined` for csTimer's own size. */
	getImageSize() {
		return _classPrivateFieldGet2(_imageSize, this);
	}
	/** Which methods `setScrambleMethod` accepts for this puzzle. */
	getScrambleMethods() {
		return METHODS.filter((method) => method in _classPrivateFieldGet2(_info, this).methods);
	}
	/**
	* Picks how `scramble()` makes scrambles: `'default'` (the WCA way), `'random-state'`
	* or `'random-move'`. Throws if csTimer has no such scrambler for this puzzle
	* (see `getScrambleMethods`).
	*/
	setScrambleMethod(method) {
		if (!(method in _classPrivateFieldGet2(_info, this).methods)) throw new Error(`${this.name} has no "${method}" scrambles. Methods: ${this.getScrambleMethods().join(", ")}`);
		_classPrivateFieldSet2(_method, this, method);
		return this;
	}
	getScrambleMethod() {
		return _classPrivateFieldGet2(_method, this);
	}
	/** The csTimer scramble type id the current method uses, e.g. `'333o'`. */
	getScrambleType() {
		return _classPrivateFieldGet2(_info, this).methods[_classPrivateFieldGet2(_method, this)];
	}
	/**
	* Makes a new scramble with the current method and scrambles the puzzle with it, so
	* `getImage()` then shows it.
	*/
	scramble() {
		_classPrivateFieldSet2(_scrambleType, this, this.getScrambleType());
		_classPrivateFieldSet2(_scramble, this, getScramble(_classPrivateFieldGet2(_scrambleType, this)));
		return _classPrivateFieldGet2(_scramble, this);
	}
	/** The scramble the puzzle was last scrambled with, or `''` when it is solved. */
	getScramble() {
		return _classPrivateFieldGet2(_scramble, this);
	}
	/** Puts the puzzle back to solved. */
	reset() {
		_classPrivateFieldSet2(_scramble, this, "");
		return this;
	}
	/**
	* Draws the puzzle as it is now (solved, or after `scramble()`) as an SVG string, with
	* this puzzle's colors and image size. Same picture as `getScrambleImage`.
	*/
	getImage() {
		const colors = _classPrivateFieldGet2(_info, this).cstimerOrder.map((face) => toCstimerColor(_classPrivateFieldGet2(_colors, this)[face])).join("");
		return drawImage(_classPrivateFieldGet2(_scramble, this) ? _classPrivateFieldGet2(_scrambleType, this) : this.getScrambleType(), _classPrivateFieldGet2(_scramble, this), { [_classPrivateFieldGet2(_info, this).colorSetting]: colors }, _classPrivateFieldGet2(_imageSize, this));
	}
};
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
export { Move, Puzzle, events222, events333, events333Variants, events444, events555, events666, events777, eventsClock, eventsFto, eventsJoke, eventsMinx, eventsOther, eventsPyram, eventsRelay, eventsSkewb, eventsSq1, get222Scramble, get333BldScramble, get333CornersScramble, get333EdgesScramble, get333FmcScramble, get333LLScramble, get333MultiBldScramble, get333OhScramble, get333Scramble, get444BldScramble, get444Scramble, get555BldScramble, get555Scramble, get666Scramble, get777Scramble, getAnyScramble, getClockScramble, getEvent, getFtoScramble, getMegaminxScramble, getPyraminxScramble, getScramble, getScrambleImage, getSeed, getSkewbScramble, getSquare1Scramble, hasScrambleImage, listEvents, listPuzzles, registerEvents, setSeed };

//# sourceMappingURL=index.mjs.map