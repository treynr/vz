
	////		label : string, data label
	////		value : float, value for this piece of data
	////		rank : int, ordered rank of this value
var SlopeGraph = (function() {

	// All publicly exposed functions are added to my.
	var my = {};

	var sample0 = [
		{label: 'Label A', value: '4.0'},
		{label: 'Label B', value: '3.0'},
		{label: 'Label C', value: '2.0'},
		{label: 'Label D', value: '1.0'}
	];
	var sample1 = [
		{label: 'Label A', value: '1.0'},
		{label: 'Label B', value: '2.0'},
		{label: 'Label C', value: '3.0'},
		{label: 'Label D', value: '4.0'}
	];

	function validateOptions(opts) {

		var opacity = (opts.opacity === undefined) ? 0.55 : opts.opacity;
		var height = (opts.height === undefined) ? 500 : opts.height;
		var width = (opts.width === undefined) ? 500 : opts.width;
		var stroke = (opts.stroke === undefined) ? '#000000' : opts.stroke;

		if (opts.colors === undefined || opts.colors.length < 2)
			var colors = d3.scale.category10();
		else
			var colors = opts.colors;

		return {
			colors : colors,
			opacity : opacity,
			height : height,
			width : width,
			stroke : stroke
		};
	}

	function rank(data) {

		data.sort(function(a, b) {

			return a.value - b.value;
		});

		for (var i = 0; i < data.length; i++)
			data[i]['rank'] = i + 1;

		return data;
	}

	function isRanked(data) {

		if (Object.prototype.toString.call(data) != '[object Array]')
			return [];

		for (var i = 0; i < data.length; i++) {

			if (!data[i].hasOwnProperty('rank'))
				return false;
		}

		return true;
	}

	my.getSamples = function() {

		return [sample0, sample1];
	}

	//// metric0 : [objects], 
	////	object :
	////		label : string, data label
	////		value : float, value for this piece of data
	////		rank : int, ordered rank of this value
	//
	//// metric1 : [objects], see metric1 above
	//
	my.draw = function(data0, data1, opts) {

		opts = validateOptions(opts);

		// Input data may not be ranked, so we check/rank just in case
		if (!isRanked(data0))
			data0 = rank(data0);
		if (!isRanked(data1))
			data1 = rank(data1);

		var margin = {top: 10, right: 30, bottom: 30, left: 50};
		var height = opts.height - margin.top - margin.bottom;
		var width = opts.width - margin.left - margin.right;

		var svg = d3.select('body')
			.append('svg')
			.attr('width', opts.width)
			.attr('height', opts.height)
			.append('g')
			;

		// Each data set is given it's own vertical axis and data points are
		// plotted along.
		var scale0 = d3.scale.linear().range([0, width]);
		var scale1 = d3.scale.linear().range([height, 0]);

		var axis0 = d3.svg.axis()
			.scale(scale0)
			.orient('left')
			;

		var axis1 = d3.svg.axis()
			.scale(scale1)
			.orient('right')
			;

		svg.append('g')
			.attr('class', 'axis')
			.call(axis0)
			;

		svg.append('g')
			.attr('class', 'axis')
			.call(axis1)
			;

	}

	return my;

}(SlopeGraph));

