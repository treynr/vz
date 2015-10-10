
function validateOptions(opts) {

    var height = (opts.height === undefined) ? 500 : opts.height;
    var width = (opts.width === undefined) ? 500 : opts.width;

	return opts;
}

//// generateCircles
//
//// Creates the circle objects based on set sizes.
//
function generateCircles(sets) {

	var max = d3.max(sets, function(set) { return set.size; });
	var min = d3.min(sets, function(set) { return set.size; });
	console.log(max);

	var normalize = d3.scale.linear()
		.domain([min, max])
		.range(5, 20);

	return sets.map(function(set) {

		return {
			x : 20, 
			y : 20,
			r : normalize(set.size)
		};
	});
}
//// sets : [object], data for each set in the diagram
////	object :
////		label : string, set label
////		size : int, set size
//
//// intersects : [int, int, int], indexes to set list and # of intersections
//// intersects : [object], set intersection data
////	object :
////		set0 : int, index to a set object in the sets list
////		set1 : int, index to a set object in the sets list
////		intersection : int, intersection between set 0 & 1
////		union : int, union between set 0 & 1
//
//// opts :
////	height : int
////	width : int
//
function makeVenn(sets, intersects, opts) {

	opts = validateOptions(opts);

    var margin = {top: 10, right: 30, bottom: 30, left: 50};
	var height = opts.height - margin.top - margin.bottom;
	var width = opts.width - margin.left - margin.right;

	var svg = d3.select('body')
		.append('svg')
		//.attr('class', 'box')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
		.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
		;
}
