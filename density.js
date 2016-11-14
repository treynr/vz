
    function kernelDensityEstimator(kernel, x) {
      return function(sample) {
        return x.map(function(x) {
          return [x, d3.mean(sample, function(v) { return kernel(x - v); })];
        });
      };
    }
function epanechnikovKernel(scale) {
  return function(u) {
	return Math.abs(u /= scale) <= 1 ? .75 * (1 - u * u) / scale : 0;
  };
}

function triweightKernel(scale) {
  return function(u) {
	return Math.abs(u /= scale) <= 1 ? (35/32) * Math.pow((1 - u * u), 3) / scale : 0;
  };
}

function triangularKernel(scale) {
  return function(u) {
	return Math.abs(u /= scale) <= 1 ? Math.abs(1 - u) / scale : 0;
  };
}

function uniformKernel(scale) {
  return function(u) {
	return Math.abs(u /= scale) <= 1 ? (1/2) / scale : 0;
  };
}

function quarticKernel(scale) {
  return function(u) {
	return Math.abs(u /= scale) <= 1 ? (15/16) * Math.pow((1 - u * u), 2) / scale : 0;
  };
}

function gaussianKernel(scale) {
  return function(u) {
	return Math.abs(u /= scale) <= 1 ? (1 / Math.sqrt(2 * Math.PI)) * Math.pow(Math.E, (-1/2) * (u * u)) / scale : 0;
	//return (1 / Math.sqrt(2 * Math.PI)) * Math.pow(Math.E, (-1/2) * (u * u));
  };
}
//// Wrappers around D3's min/max functions. Return the min or max of an array.
//
var minwrap = function(arr) { return d3.min(arr); };
var maxwrap = function(arr) { return d3.max(arr); };

var DensityPlot = (function() {

	// All publicly exposed functions are added to my.
	var my = {};

	// 
	var KERNELS = {

		EPANECHNIKOV : epanechnikovKernel,
		TRIWEIGHT : triweightKernel,
		TRIANGULAR : triangularKernel,
		UNIFORM : uniformKernel,
		QUARTIC : quarticKernel,
		GAUSSIAN : gaussianKernel
	};

	my.kernels = KERNELS;

	function validateOptions(opts, data) {

		// General options
		var height = opts.height || 400;
		var width = opts.width || 800;
		var title = opts.title || 'Generic Density Plot';
		var xlabel = opts.xlabel || 'X Axis';
		var ylabel = opts.ylabel || 'Y Axis';

		// Options specific to this visualization
		// Specifies the kernel function to use when estimating density
		//var kernel = opts.kernel || kernels.TRIWEIGHT;
		var kernel = opts.kernel || triweightKernel;
		// The smoothing scale to use with the kernel function
		var scale = opts.scale || 1;

		// The x-domain (min, max)
		if (opts.xdomain === undefined) {

			var xmin = d3.min(data.map(minwrap));
			var xmax = d3.max(data.map(maxwrap));
		} else {

			var xmin = opts.xdomain[0];
			var xmax = opts.xdomain[1];
		}

		var ydomain = opts.ydomain || undefined;

		return {
			height : height,
			width : width,
			title : title,
			xlabel : xlabel,
			ylabel : ylabel,
			kernel : kernel,
			scale : scale,
			xdomain : [xmin, xmax],
			ydomain : ydomain
		};
	}

	//// linepts : [object]
	////	object :
	////		x : int, the x coordinate to draw a line at
	////		color : line color, default is set to black
	my.density = function(data, opts, grps, linepts) {

		opts = validateOptions(opts, data);

		var margin = {top: 20, right: 30, bottom: 30, left: 40};
		var height = opts.height - margin.top - margin.bottom;
		var width = opts.width - margin.left - margin.right;

		// Normally we'd use the d3js color scale, but I want to pick pretty colors
		// Might add more later, but I don't think I'll need more than this. 
		var colors = ['#1f77b4', '#2ca02c', '#d62728', '#9467bd', '#ff7f0e'];

		var x = d3.scale.linear()
			.domain([opts.xdomain[0], opts.xdomain[1]])
			.range([0, width]);

		var xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom");

		//var kde = kernelDensityEstimator(triweightKernel(opts.scale), x.ticks(50));
		var kde = kernelDensityEstimator(opts.kernel(opts.scale), x.ticks(50));

		var flat = [].concat.apply([], data);
		var yvals = kde(flat).map(function(e, i, a) { return e[1]; });
		var ymin = d3.min(yvals);
		var ymax = d3.max(yvals);

		if (opts.ydomain !== undefined) {
			ymin = opts.ydomain[0];
			ymax = opts.ydomain[1];
		}

		var y = d3.scale.linear()
			.domain([ymin, ymax])
			.range([height - 1, 0]);

		var yAxis = d3.svg.axis()
			.scale(y)
			.orient("left")
			;

		var line = d3.svg.line()
			.x(function(d) { return x(d[0]); })
			.y(function(d) { return y(d[1]); });

		var area = d3.svg.area()
			.x(function(d) { return x(d[0]); })
			.y0(height)
			.y1(function(d) { return y(d[1]); })
			;

		var svg = d3.select("body").append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis)
			.append("text")
			.attr("class", "label")
			.attr("x", width)
			.attr("y", -6)
			.style("text-anchor", "end")
			.text(opts.xlabel)
			;

		svg.append('text')
			.attr('class', 'label')
			.style('text-anchor', 'middle')
			.attr('x', width / 2)
			.attr('y', 15)
			.text(opts.title);

		svg.append("g")
			.attr("class", "y axis")
			.call(yAxis);

		if (grps !== undefined && grps) {

			var key = d3.select('body')
				.append('svg')
				.attr('width', 450)
				.attr('height', 320);

			key.append('text')
				.attr({
					'text-anchor': 'middle',
					'font-family': 'sans-serif',
					'font-size': '15px',
					'y': '15',
					'x': (450 / 3)
				})
				.text('Key');
					
			var k = key.selectAll('g')
				.data(grps)
				.enter()
				.append('g')
				.attr('class', 'legend');

			k.append('circle')
				.attr('cx', 10)
				.attr('cy', function(d, i){ return (i * 30) + 30; })
				.attr('r', 10)
				.attr('fill', function(d, i){
					return colors[i];
				})
				.attr('shape-rendering', 'geometricPrecision')
				.style('stroke', '#000000')
				.style('stroke-width', 1);

			k.append('text')
				.attr('x', 30)
				.attr('y', function(d, i){ return (i * 30) + 34; })
				.attr('font-family', 'sans-serif')
				.attr('font-size', '12px')
				.text(function(d, i){ return d; });
		}

		for (var i = 0; i < data.length; i++) {

			svg.append("path")
				.datum(kde(data[i]))
				.attr("class", "area")
				.attr("d", area)
				.style('fill', function() { return colors[i]; })
				.style('opacity', 0.5)
				;

			svg.append("path")
				.datum(kde(data[i]))
				.attr("class", "line")
				.attr("d", line)
				.attr('shape-rendering', 'geometricPrecision')
				.style('stroke-width', 1)
				;
		}

		//linepts = [{x: 0.8}, {x: 0.45, color: '#FF0000'}];

		for (var i = 0; i < linepts.length; i++) {

			var start = [linepts[i].x, 0];
			var end = [linepts[i].x, ymax];
			var color = linepts[i].color || '#444444';

			var other_line = d3.svg.line()
				.x(function(d) { return x(d[0]); })
				.y(function(d) { return y(d[1]); })
				;

			svg.append("path")
				.datum([start, end])
				.style('stroke', color)
				.style('stroke-width', 2)
				.attr('shape-rendering', 'crispEdges')
				.attr("class", "line")
				.attr("d", line)
				;
		}
	}

	return my;

}(DensityPlot));


//// opts {
//      xdom : [a, b]
//      ydom : [a, b]
//      dimensions : [height, width]
//      title : title string
//      xlabel : x axis label
//      ylabel : y axis label
//      colors : array of colors
//   }
//
//// data should be an array of arrays, each inner array containing the set of
//// points to be plotted.
//// grps can be empty, but if not, should be an array of group names, the same
//// length as data. Each index in grps corresponds to the same index in data
//// and vice-versa. 
//
var density = function(data, opts, grps) {

    //// Default configuration options
    var height = (opts.dimensions === undefined) ? 400 : opts.dimensions[0];
    var width = (opts.dimensions === undefined) ? 500 : opts.dimensions[1];
    var xmin = (opts.xdom === undefined) ? 0 : opts.xdom[0];
    var xmax = (opts.xdom === undefined) ? 0 : opts.xdom[1];
    var ymin = (opts.ydom === undefined) ? 0 : opts.ydom[0];
    var ymax = (opts.ydom === undefined) ? 1 : opts.ydom[1];
    var xlabel = (opts.xlabel === undefined) ? '' : opts.xlabel;
    var scale = (opts.scale === undefined) ? 1 : opts.scale;
    var colors = (opts.colors === undefined) ?
        ['#1f77b4', '#2ca02c', '#d62728', '#9467bd', '#ff7f0e'] : opts.colors;

    var margin = {top: 20, right: 30, bottom: 30, left: 40};
    height = height - margin.top - margin.bottom;
    width = width - margin.left - margin.right;

    // Normally we'd use the d3js color scale, but I want to pick pretty colors
    // Might add more later, but I don't think I'll need more than this. 
    //var colors = ['#1f77b4', '#2ca02c', '#d62728', '#9467bd', '#ff7f0e'];

    if (opts.xdom === undefined) {

        xmin = d3.min(data.map(minwrap));
        xmax = d3.max(data.map(maxwrap));
    }

    var x = d3.scale.linear()
        //.domain([30, 110])
        //.domain([d3.min(xmin), d3.max(xmax)])
        //.domain([dmin, dmax])
        .domain([xmin, xmax])
        .range([0, width]);

    var y = d3.scale.linear()
        //.domain([0, .9])
        .domain([ymin, ymax])
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        //.tickFormat(d3.format("%"))
        ;

    var line = d3.svg.line()
        .x(function(d) { return x(d[0]); })
        .y(function(d) { return y(d[1]); });

    var area = d3.svg.area()
        .x(function(d) { return x(d[0]); })
        .y0(height)
        .y1(function(d) { return y(d[1]); })
        ;

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text(xlabel)
        ;

    // title
    if (opts.title !== undefined) {

        console.log('fuuuuu');
        svg.append('text')
            .attr('class', 'label')
            .style('text-anchor', 'middle')
            .style('font-size', '15px')
            .attr('x', (width + margin.left + margin.right) / 2)
            .attr('y', 5)
            .text(opts.title);
    }

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    if (grps !== undefined && grps) {

        var key = d3.select('body')
            .append('svg')
            .attr('width', 450)
            .attr('height', 320);

        //key.append('text')
        //    .attr({
        //        'text-anchor': 'middle',
        //        'font-family': 'sans-serif',
        //        'font-size': '15px',
        //        'y': '15',
        //        'x': (450 / 3)
        //    })
        //    .text('Key');
                
        var k = key.selectAll('g')
            .data(grps)
            .enter()
            .append('g')
            .attr('class', 'legend');

        k.append('circle')
            .attr('cx', 10)
            .attr('cy', function(d, i){ return (i * 22) + 30; })
            .attr('r', 9)
            .style('fill-opacity', 0.6)
            .attr('stroke', 'black')
            .attr('stroke-width', '1.5px')
            .attr('fill', function(d, i){
                return colors[i];
            });
        k.append('text')
            .attr('x', 30)
            .attr('y', function(d, i){ return (i * 21) + 35; })
            .attr('font-family', 'sans-serif')
            .attr('font-size', '12px')
            .text(function(d, i){ return d; });
    }

    //var data = histogram(faithful);
    //var kde = kernelDensityEstimator(epanechnikovKernel(7), x.ticks(100));
    //var kde = kernelDensityEstimator(epanechnikovKernel(0.5), x.ticks(50));
    
    //var kde = kernelDensityEstimator(triweightKernel(0.5), x.ticks(50));
    //var kde = kernelDensityEstimator(triweightKernel(2), x.ticks(50));
    //
    var kde = kernelDensityEstimator(triweightKernel(scale), x.ticks(50));
    //var kde = kernelDensityEstimator(epanechnikovKernel(scale), x.ticks(50));


    //var kde = kernelDensityEstimator(uniformKernel(0.5), x.ticks(50));
    //var kde = kernelDensityEstimator(quarticKernel(0.4), x.ticks(50));
    //var kde = kernelDensityEstimator(gaussianKernel(0.5), x.ticks(50));

  //svg.selectAll(".bar")
  //    .data(data)
  //  .enter().insert("rect", ".axis")
  //    .attr("class", "bar")
  //    .attr("x", function(d) { return x(d.x) + 1; })
  //    .attr("y", function(d) { return y(d.y); })
  //    .attr("width", x(data[0].dx + data[0].x) - x(data[0].x) - 1)
  //    .attr("height", function(d) { return height - y(d.y); });


    for (var i = 0; i < data.length; i++) {

        console.log(data[i]);
        console.log(kde(data[i]));
        svg.append("path")
            //.datum(kde(faithful))
            //.datum(kde(data[0]))
            .datum(kde(data[i]))
            .attr("class", "area")
            //.style('fill', 'steelblue')
            .style('fill', function() { return colors[i]; })
            .style('opacity', 0.3)
            .attr("d", area)
            ;
        svg.append("path")
            //.datum(kde(faithful))
            //.datum(kde(data[0]))
            .datum(kde(data[i]))
            .attr("class", "line")
            .attr("d", line)
            ;
    }

    function kernelDensityEstimator(kernel, x) {
      return function(sample) {
        return x.map(function(x) {
          return [x, d3.mean(sample, function(v) { return kernel(x - v); })];
        });
      };
    }

    function epanechnikovKernel(scale) {
      return function(u) {
        return Math.abs(u /= scale) <= 1 ? .75 * (1 - u * u) / scale : 0;
      };
    }

    function triweightKernel(scale) {
      return function(u) {
        return Math.abs(u /= scale) <= 1 ? (35/32) * Math.pow((1 - u * u), 3) / scale : 0;
      };
    }

    function triangularKernel(scale) {
      return function(u) {
        return Math.abs(u /= scale) <= 1 ? Math.abs(1 - u) / scale : 0;
      };
    }

    function uniformKernel(scale) {
      return function(u) {
        return Math.abs(u /= scale) <= 1 ? (1/2) / scale : 0;
      };
    }

    function quarticKernel(scale) {
      return function(u) {
        return Math.abs(u /= scale) <= 1 ? (15/16) * Math.pow((1 - u * u), 2) / scale : 0;
      };
    }

    function gaussianKernel(scale) {
      return function(u) {
        return Math.abs(u /= scale) <= 1 ? (1 / Math.sqrt(2 * Math.PI)) * Math.pow(Math.E, (-1/2) * (u * u)) / scale : 0;
        //return (1 / Math.sqrt(2 * Math.PI)) * Math.pow(Math.E, (-1/2) * (u * u));
      };
    }
}

