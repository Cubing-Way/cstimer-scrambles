// Vendored from csTimer (src/js/lib/utillib.js, part only) @ 2547d82. GPL-3.0, (c) cs0x7f.
// Changes: ESM export; only the SVG and canvas helpers, on a plain object instead of jQuery.
var $ = {};
	$.svg = (function() {
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
		}

		SVG.prototype.addPoly = function(points, fillStyle, strokeStyle) {
			var cords = [];
			for (var i = 0; i < points[0].length; i++) {
				cords.push(parseNumber(points[0][i]) + ',' + parseNumber(points[1][i]));
			}
			this.elems.push('<polygon points="' + cords.join(' ') +
				'" style="fill:' + fillStyle + ';stroke:' + (strokeStyle || '#000') + ';" />');
		}

		SVG.prototype.addText = function(text, points, styles, align) {
			var styleStr = "paint-order:stroke;";
			for (var key in styles) {
				styleStr += key + ':' + styles[key] + ';';
			}
			var alignKV = 'dominant-baseline="middle" text-anchor="middle"';
			if (align == 1) {
				alignKV = 'dominant-baseline="hanging" text-anchor="start"';
			}
			this.elems.push('<text x="' + parseNumber(points[0]) + '" y="' + parseNumber(points[1]) +
				'" style="' + styleStr + '" ' + alignKV + '>' +
				encodeURIComponent(text) + '</text>');
		}

		SVG.prototype.render = function() {
			return '<svg width="' + parseNumber(this.width) + '" height="' + parseNumber(this.height) +
				'" xmlns="http://www.w3.org/2000/svg">' + this.elems.join('') + '</svg>';
		}

		SVG.prototype.renderGroup = function(x, y, width, height) {
			var scale = Math.min(width / this.width, height / this.height);
			var offset = [(width - this.width * scale) / 2, (height - this.height * scale) / 2];
			return '<g transform="translate(' +
				parseNumber(x + (width - this.width * scale) / 2) + ',' +
				parseNumber(y + (height - this.height * scale) / 2) + ') scale(' +
				parseNumber(scale) + ')">' + this.elems.join('') + '</g>';
		}

		return SVG;
	})();

	// trans: [size, offx, offy] == [size, 0, offx * size, 0, size, offy * size] or [a11 a12 a13 a21 a22 a23]
	$.ctxDrawPolygon = function(ctx, color, arr, trans) {
		if (!ctx) {
			return;
		}
		trans = trans || [1, 0, 0, 0, 1, 0];
		arr = $.ctxTransform(arr, trans);
		if (ctx instanceof $.svg) {
			return ctx.addPoly(arr, color);
		}
		ctx.beginPath();
		ctx.fillStyle = color;
		ctx.moveTo(arr[0][0], arr[1][0]);
		for (var i = 1; i < arr[0].length; i++) {
			ctx.lineTo(arr[0][i], arr[1][i]);
		}
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
	};

	$.ctxRotate = function(arr, theta) {
		return $.ctxTransform(arr, [Math.cos(theta), -Math.sin(theta), 0, Math.sin(theta), Math.cos(theta), 0]);
	};

	$.ctxTransform = function(arr) {
		var ret;
		for (var i = 1; i < arguments.length; i++) {
			var trans = arguments[i];
			if (trans.length == 3) {
				trans = [trans[0], 0, trans[1] * trans[0], 0, trans[0], trans[2] * trans[0]];
			}
			ret = [[], []];
			for (var i = 0; i < arr[0].length; i++) {
				ret[0][i] = arr[0][i] * trans[0] + arr[1][i] * trans[1] + trans[2];
				ret[1][i] = arr[0][i] * trans[3] + arr[1][i] * trans[4] + trans[5];
			}
		}
		return ret;
	};

	$.nearColor = function(color, ref, longFormat) {
		var col, m;
		m = /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/.exec(color);
		if (m) {
			col = [m[1] + m[1], m[2] + m[2], m[3] + m[3]];
		}
		m = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(color);
		if (m) {
			col = [m[1], m[2], m[3]];
		}
		for (var i=0; i<3; i++) {
			col[i] = parseInt(col[i], 16) + (ref || 0);
			col[i] = Math.min(Math.max(col[i], 0), 255);
			col[i] = (Math.round(col[i]/17)).toString(16);
		}
		return "#" + (longFormat ? col[0] + col[0] + col[1] + col[1] + col[2] + col[2] : col[0] + col[1] + col[2]);
	};

	$.col2std = function(col, faceMap) {
		var ret = [];
		col = (col || '').match(/#[0-9a-fA-F]{3}/g) || [];
		for (var i = 0; i < col.length; i++) {
			ret.push(~~($.nearColor(col[faceMap[i]], 0, true).replace('#', '0x')));
		}
		return ret;
	};
export default $;
