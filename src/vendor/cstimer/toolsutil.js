// Vendored from csTimer (src/js/tools/tools.js, part only) @ 2547d82. GPL-3.0, (c) cs0x7f.
// Changes: ESM export; only the puzzle type helpers, without the tools panel.
var curScramble = ['-', '', 0];
	function scrambleType(scramble) {
		if (scramble.match(/^([\d]?[xyzFRUBLDfrubldSME]([w]|&sup[\d];)?[2']?\s*)+$/) == null) {
			return '-';
		} else if (scramble.match(/^([xyzFRU][2']?\s*)+$/)) {
			return '222o';
		} else if (scramble.match(/^([xyzFRUBLDSME][2']?\s*)+$/)) {
			return '333';
		} else if (scramble.match(/^(([xyzFRUBLDfru]|[FRU]w)[2']?\s*)+$/)) {
			return '444';
		} else if (scramble.match(/^(([xyzFRUBLDfrubld])[w]?[2']?\s*)+$/)) {
			return '555';
		} else {
			return '-';
		}
	}

	function carrot2poch(scramble) {
		return scramble.replace(/([+-])([+-]) /g, function(m, p1, p2) {
			return 'R' + p1 + p1 + ' D' + p2 + p2 + ' ';
		});
	}

	function isPuzzle(puzzle, scramble) {
		scramble = scramble || curScramble;
		var scrPuzzle = puzzleType(scramble[0]);
		scramble = scramble[1];
		if (scrPuzzle) {
			return scrPuzzle == puzzle;
		} else if (puzzle == '222') {
			return scramble.match(/^([xyzFRU][2']?\s*)+$/);
		} else if (puzzle == '333') {
			return scramble.match(/^([xyzFRUBLDSME][2']?\s*)+$/);
		} else if (puzzle == '444') {
			return scramble.match(/^(([xyzFRUBLDfru]|[FRU]w)[2']?\s*)+$/);
		} else if (puzzle == '555') {
			return scramble.match(/^(([xyzFRUBLDfrubld])[w]?[2']?\s*)+$/);
		} else if (puzzle == 'skb') {
			return scramble.match(/^([RLUB]'?\s*)+$/);
		} else if (puzzle == 'pyr') {
			return scramble.match(/^([RLUBrlub]'?\s*)+$/);
		} else if (puzzle == 'sq1') {
			return scramble.match(/^$/);
		} else if (puzzle == 'fto') {
			return scramble.match(/^(([FRUBLD]|(?:BL)|(?:BR))[']?\s*)+$/);
		}
		return false;
	}

	function puzzleType(scrambleType) {
		if (/^222(so|[236o]|eg[012]?|tc[np]?|lsall|nb)$/.exec(scrambleType)) {
			return "222";
		} else if (/^(333(oh?|ni|f[mt]|drud|custom)?|(z[zb]|[coep]|c[om]|2g|ls|tt)?ll|lse(mu)?|2genl?|3gen_[LF]|edges|corners|f2l|lsll2|(zb|w?v|eo)ls|roux|RrU|half|easyx?c|eoline|eocross|sbrx|mt(3qb|eole|tdr|6cp|l5ep|cdrll)|nocache_333(bld|pat)spec)$/.exec(scrambleType)) {
			return "333";
		} else if (/^(444([mo]|wca|yj|bld|ctud|ctrl|ud3c|l8e|rlda|rlca|edo|cto|e?ll|p[op]ll)?|4edge|RrUu)$/.exec(scrambleType)) {
			return "444";
		} else if (/^(555(wca|bld)?|5edge)$/.exec(scrambleType)) {
			return "555";
		} else if (/^(666(si|[sp]|wca)?|6edge)$/.exec(scrambleType)) {
			return "666";
		} else if (/^(777(si|[sp]|wca)?|7edge)$/.exec(scrambleType)) {
			return "777";
		} else if (/^pyr(s?[om]|l4e|nb|4c)$/.exec(scrambleType)) {
			return "pyr";
		} else if (/^skb(s?o|nb)?$/.exec(scrambleType)) {
			return "skb";
		} else if (/^sq(rs|1pll|1[ht]|rcsp)$/.exec(scrambleType)) {
			return "sq1";
		} else if (/^clk(wcab?|o|nf)$/.exec(scrambleType)) {
			return "clk";
		} else if (/^(mgmp|mgmo|mgmc|minx2g|mlsll|mgmpll|mgmll|mgmso|mgms2l)$/.exec(scrambleType)) {
			return "mgm";
		} else if (/^(klmso|klmp)$/.exec(scrambleType)) {
			return "klm";
		} else if (/^(fto|fto(so|l[34]t|tcp|edge|cent|corn))$/.exec(scrambleType)) {
			return "fto";
		} else if (/^(dmdso)$/.exec(scrambleType)) {
			return "dmd";
		} else if (/^(mpyr|mpyrso)$/.exec(scrambleType)) {
			return "mpyr";
		} else if (/^15p(at|ra?p?)?$/.exec(scrambleType)) {
			return "15p";
		} else if (/^15p(rmp|m)$/.exec(scrambleType)) {
			return "15b";
		} else if (/^8p(at|ra?p?)?$/.exec(scrambleType)) {
			return "8p";
		} else if (/^8p(rmp|m)$/.exec(scrambleType)) {
			return "8b";
		} else if (/^heli2x2g?$/.exec(scrambleType)) {
			return "heli2x2";
		} else if (/^prc[po]$/.exec(scrambleType)) {
			return "prc";
		} else if (/^redi(m|so)?$/.exec(scrambleType)) {
			return "redi";
		} else if (/^dino(o|so)?$/.exec(scrambleType)) {
			return "dino";
		} else if (/^gear(o|so)?$/.exec(scrambleType)) {
			return "gear";
		} else {
			return scrambleType;
		}
	}
var tools = {
	scrambleType: scrambleType,
	puzzleType: puzzleType,
	isPuzzle: isPuzzle,
	carrot2poch: carrot2poch,
	isCurTrainScramble: function() {
		return false;
	}
};
export default tools;
