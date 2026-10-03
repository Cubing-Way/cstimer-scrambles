// Stand-in for csTimer's settings (src/js/kernel.js): the ones its image code reads,
// with csTimer's default values. Written by scripts/vendor-cstimer.mjs.
var kernel = {
	props: {
		'col-font': '#000000',
		'col-board': '#ffdddd',
		colcube: '#ff0#fa0#00f#fff#f00#0d0',
		colpyr: '#0f0#f00#00f#ff0',
		colskb: '#fff#00f#f00#ff0#0f0#f80',
		colmgm: '#fff#d00#060#81f#fc0#00b#ffb#8df#f83#7e0#f9f#999',
		colsq1: '#ff0#f80#0f0#fff#f00#00f',
		colclk: '#f00#37b#5cf#ff0#850',
		col15p: '#f99#9f9#99f#fff',
		colfto: '#fff#808#0d0#f00#00f#bbb#ff0#fa0',
		colico: '#fff#084#b36#a85#088#811#e71#b9b#05a#ed1#888#6a3#e8b#a52#6cb#c10#fa0#536#49c#ec9',
		imgSize: 15,
		imgRep: false,
		preScr: '',
		preScrT: ''
	},
	getProp: function(key, def) {
		return key in this.props ? this.props[key] : def;
	}
};
export default kernel;
