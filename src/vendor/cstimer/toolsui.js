// Stand-in for the bits of csTimer's page its solver tools use: jQuery elements, execMain
// and the tools panel's solution spans. A solver tool writes its answers into an element;
// here an element only keeps what is appended to it, so src/stepsolver.ts can read the
// answers back. Written by scripts/vendor-cstimer.mjs.
function Elem() {
	this.children = [];
	this.value = '';
}
Elem.prototype.append = function() {
	for (var i = 0; i < arguments.length; i++) {
		this.children.push(arguments[i]);
	}
	return this;
};
Elem.prototype.empty = function() {
	this.children = [];
	return this;
};
Elem.prototype.html = function(content) {
	if (arguments.length == 0) {
		return '';
	}
	this.children = [content];
	return this;
};
Elem.prototype.val = function(value) {
	if (arguments.length == 0) {
		return this.value;
	}
	this.value = value;
	return this;
};
// Anything else (attr, click, show, ...) only matters on the page: it does nothing here.
var elemHandler = {
	get: function(target, key, proxy) {
		if (key in target || typeof key == 'symbol') {
			return target[key];
		}
		return function() {
			return proxy;
		};
	}
};
function $(arg) {
	// $(function) runs code when the page is ready: registering the tool and drawing its UI.
	if (typeof arg == 'function') {
		return;
	}
	return new Proxy(new Elem(), elemHandler);
}
var toolsui = {
	$: $,
	Elem: Elem,
	execMain: function(func, params) {
		return func.apply(null, params || []);
	},
	tools: {
		// What the tools panel shows a solution with: here, the moves themselves.
		getSolutionSpan: function(solution) {
			return { solution: solution };
		}
	}
};
export default toolsui;
