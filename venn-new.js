
//var Venn = (function() {
//
//	// All publicly exposed functions are added to my.
//	var my = {};

	function randInt(min, max) {

		return Math.floor(Math.random() * (max - min + 1) + min);
	}

	function makeSets(n) {

		var sets = [];
		var intersects = [];

		for (var i = 0; i < n; i++) {

			sets.append({
				label : '' + i,
				size : randInt(10, 20)
			});
		}

		for (var i = 0; i < n; i++) {
			for (var j = i + 1; j < n; j++) {

				var intersection = randInt(5, 10);
				var union = randInt(min(sets[i].size, sets[j].size), sets[i].size + sets[j].size);

				intersects.append({
					set0 : i,
					set1 : j,
					intersection : intersection,
					union : union,
					jaccard : intersection / union,
				});
			}
		}

		return (sets, intersects);
	}

	function validateOptions(opts, sets) {

		var opacity = (opts.opacity === undefined) ? 0.55 : opts.opacity;
		var height = (opts.height === undefined) ? 500 : opts.height;
		var width = (opts.width === undefined) ? 500 : opts.width;
		var stroke = (opts.stroke === undefined) ? '#000000' : opts.stroke;

		if (opts.colors === undefined || opts.colors.length < sets.length)
			var colors = d3.scale.category20();
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

	//// generateCircles
	//
	//// Creates the circle objects based on set sizes.
	//
	function generateCircles(sets) {

		var max = d3.max(sets, function(set) { return set.size; });
		var min = d3.min(sets, function(set) { return set.size; });

		var normalize = d3.scale.linear()
			.domain([min, max])
			.range([25, 85]);

		return sets.map(function(set) {
		//return sets.forEach(function(elem, i, set) {

			return {
				cx : 0, 
				cy : 0,
				r : normalize(set.size)
			};
		});
	}

	function euclideanDistance(x0, y0, x1, y1) {

		return Math.sqrt(Math.pow(x0 - x1, 2) + Math.pow(y0 - y1, 2));
	}

	function csc(a) {

		//return 1 / Math.cos(a);
		return Math.acos(a);
	}

	// convenience square function
	function sqr (n) {

		return n * n;
	}

	// Finds the area of a circular segment with a radius R and triangular
	// height d.
	function circleSegmentArea(r, d) {

		return sqr(r) * csc(d / r) - d * Math.sqrt(sqr(r) - sqr(d));
	}

	function deg2rad(d) {

		return d * Math.PI / 180;
	}

	function rad2deg(r) {

		return r * 180 / Math.PI;
	}

	function bisection(f, a, b, tol=0.00000000001, iter=100) {

		if (f(a) == 0)
			return a;

		if (f(b) == 0)
			return b;

		for (var i = 0; i < iter; i++) {

			var c = (a + b) / 2;

			if (f(c) == 0 || ((b - a) / 2) < tol)
				return c;

			if ((f(c) > 0 && f(a) > 0) || (f(c) < 0 && f(a) < 0))
				a = c;
			else
				b = c;
		}
	}

	function distanceForIntersections(r0, r1, intersect) {

		if (Math.min(r0, r1) * Math.min(r0,r1) * Math.PI <= intersect)
			return Math.abs(r0 - r1);

		return bisection(function(dist) {
			return circleIntersectArea(r0, r1, dist) - intersect;
		}, 0, r0 + r1);
	}

    function circleIntegral(r, x) {
        var y = Math.sqrt(r * r - x * x);
        return x * y + r * r * Math.atan2(x, y);
    };

    /** Returns the area of a circle of radius r - up to width */
    function circleArea(r, width) {
        return circleIntegral(r, width - r) - circleIntegral(r, -r);
    };

    /** Returns the overlap area of two circles of radius r1 and r2 - that
    have their centers separated by distance d. Simpler faster
    circle intersection for only two circles */
    function circleIntersectArea(r1, r2, d) {
        // no overlap
        if (d >= r1 + r2) {
            return 0;
        }

        // completely overlapped
        if (d <= Math.abs(r1 - r2)) {
            return Math.PI * Math.min(r1, r2) * Math.min(r1, r2);
        }

        var w1 = r1 - (d * d - r2 * r2 + r1 * r1) / (2 * d),
            w2 = r2 - (d * d - r1 * r1 + r2 * r2) / (2 * d);
        return circleArea(r1, w1) + circleArea(r2, w2);
    };

	// Returns the area of the intersection between two circles.
	function circleIntersectAreaOld(r0, r1, d) {

		//console.log('r0: ' + r0);
		//console.log('r1: ' + r1);
		if (d === (r0 + r1))
			return 0;

		else if (r0 === r1) {
			//console.log('r: ' + ((1/2) * d));
			//console.log('d: ' + r0);
			//console.log('a: ' + circleSegmentArea((1/2) * d, r0));
			return 2 * circleSegmentArea((1/2) * d, r0);
		}


		console.log((sqr(d) + sqr(r0) - sqr(r1)) / (2 * d * r0));
		var a = sqr(r0) * csc((sqr(d) + sqr(r0) - sqr(r1)) / (2 * d * r0));
		var b = sqr(r1) * csc((sqr(d) + sqr(r1) - sqr(r0)) / (2 * d * r1));
		var c0 = (-d + r0 + r1) * (d + r0 - r1) * (d - r0 + r1) * (d + r0 + r1);
		var c = (1 / 2) * Math.sqrt(c0);

		//console.log('a: ' + a);
		//console.log('b: ' + b);
		//console.log('c: ' + c);

		return a + b - c;
	}

	function getDistanceMatrix(sets, intersects) {

		var matrix = new Array(sets.length);

		for (var i = 0; i < sets.length; i++) {

			matrix[i] = new Array(sets.length);

			for (var j = 0; j < sets.length; j++)
				matrix[i][j] = 0;
		}

		for (var i = 0; i < intersects.length; i++) {

			var left = intersects[i].set0; 
			var right = intersects[i].set1; 
			var r0 = sets[left].r;
			var r1 = sets[right].r;
			var intersect = intersects[i].intersection;
			var distance = distanceForIntersections(r0, r1, intersect);

			matrix[left][right] = distance;
			matrix[right][left] = distance;
		}

		return matrix;
	}

	function layout(sets, intersects) {

	}

	function initialLayout(sets, intersects) {

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
	//my.makeVenn = function(sets, intersects, opts={}) {
	function makeVenn(sets, intersects, opts={}) {

		opts = validateOptions(opts, sets);

		var margin = {top: 10, right: 30, bottom: 30, left: 50};
		var height = opts.height - margin.top - margin.bottom;
		var width = opts.width - margin.left - margin.right;

		var svg = d3.select('body')
			.append('svg')
			.attr('width', opts.width)
			.attr('height', opts.height)
			.append('g')
			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
			;

		var circlist = generateCircles(sets);

		var nodes = svg.append('g').selectAll('circle')
			.data(circlist)
			.enter()
			;

		var circles = nodes.append('circle')
			.attr('r', function(d) { return d.r; })
			.attr('cx', function(d, i) { return d.cx + (50 * (i + 1)); })
			.attr('cy', function(d, i) { return d.cy + (50 * (i + 1)); })
			.style('fill', function(d, i) { return opts.colors(i); })
			.style('stroke', function(d) { return opts.stroke; })
			.style('stroke-width', function() { return 2; })
			.style('fill-opacity', function() { return opts.opacity; })
			.style('stroke-opacity', function() { return 0.8; })
			;
	}

//	return my;
//
//}(Venn));








