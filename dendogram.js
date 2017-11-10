/**
  * file: dendogram.js
  * desc: d3js 4.0 implementation of dendograms.
  * vers: 0.2.0
  * auth: TR
  */

/**
  * The data structure necessary for this viz is an array of objects. Each
  * object represents a separate box plot which may have >= 1 violins.
  * The design is similar to the scatter plot visualization and allows the user
  * to specify plot positions in a grid like arrangement; although this
  * complicates the codebase, it is much better for producing consistently 
  * aligned, publication-ready images.
  *
  * Each object has the following fields:
  *
  * plot {
  *     values: [required] an array of data point objects
  *     title:  [optional] text for the plot title
  *     label:  [optional] label text for indicating separate figures
  *     color:  [optional] hmmm idk yet
  * }
  *
  * value {
  *     x:      [required] x-axis (column) category
  *     y:      [required] y-axis (row) category
  *     value:  [required] the numeric value for this data point
  * }
  *
  */

var dendogram = function() {

    var exports = {},

        /** public **/

        data = null,
        // The x-axis domain range
        xDomain = null,
        // The y-axis domain range
        yDomain = null,
        // Font family
        font = 'sans-serif',
        // Font size
        fontSize = '11px',
        // Font weight
        fontWeight = 'normal',
        xLabel = '',
        yLabel = '',
        normalizeRows = false,
        normalizeColumns = false,
        normalizeMatrix = false,

        /** private **/

        cScale = null,
        // Margin object
        margin = {top: 90, right: 90, bottom: 90, left: 90},
        // SVG object
        svg = null
        ;

    /** 
      * Returns the margin corrected height of the plot.
      */
    var getHeight = function() { return height - margin.top - margin.bottom; };

    /** 
      * Returns the margin corrected width of the plot.
      */
    var getWidth = function() { return width - margin.left - margin.right; };

    /**
      * Returns the list of categories that make up the x-axis or the current
      * set of columns.
      */
    var getColumnCategories = function() {

        // Requries the Set object from the new ES6 standard which not all
        // browsers support. Removes duplicates.
        return Array
            .from(new Set(data.values.map(function(d) { return d.x; })));
    };

    /**
      * Returns the list of categories that make up the y-axis or the current
      * set of rows.
      */
    var getRowCategories = function() {

        // Requries the Set object from the new ES6 standard which not all
        // browsers support. Removes duplicates.
        return Array
            .from(new Set(data.values.map(function(d) { return d.y; })));
    };

    var normalize = function(row) {

        var cats = [];
        var means = {}
        var accessor = '';

        if (row) {

            cats = getRowCategories();
            accessor = 'y';

        } else {

            cats = getColumnCategories();
            accessor = 'x';
        }

        for (var i = 0; i < cats.length; i++)
            means[cats[i]] = [];

        for (var i = 0; i < cats.length; i++) {
            for (var j = 0; j < data.values.length; j++) {

                if (data.values[j][accessor] === cats[i])
                    means[cats[i]].push(data.values[j].value);
            }
        }

        for (var i = 0; i < cats.length; i++) {

            var mean = d3.mean(means[cats[i]]);
            var dev = d3.deviation(means[cats[i]]);

            for (var j = 0; j < data.values.length; j++) {
                if (data.values[j][accessor] === cats[i])
                    data.values[j].value = (data.values[j].value - mean) / dev;
            }
        }
    };

    /**
      * Normalize values over the entire matrix rather that just a column or
      * row at a time. This should only be used when the elements in the rows
      * and columns are the same.
      */
    var matrixNormalization = function() {

        //var vals = data.values.map(function(d) { return d.value; });
        var vals = data.values
            .filter(function(d) { return d.x != d.y; })
            .map(function(d) { return d.value; });
        var mean = d3.mean(vals);
        var dev = d3.deviation(vals);

        for (var i = 0; i < data.values.length; i++) {
            if (data.values[i].x == data.values[i].y)
                data.values[i].value = 0;
            else
                data.values[i].value = (data.values[i].value - mean) / dev;
        }
    };

    /**
      * Normalize values over the entire matrix rather that just a column or
      * row at a time. This should only be used when the elements in the rows
      * and columns are the same.
      */
    var matrixNormalization2 = function() {

        var vals = data.values
            .filter(function(d) { return d.x != d.y; })
            .map(function(d) { return d.value; });
        
        var extent = d3.extent(vals);
        //var mean = d3.mean(vals);
        //var dev = d3.deviation(vals);

        for (var i = 0; i < data.values.length; i++) {
            if (data.values[i].x == data.values[i].y)
                data.values[i].value = 0;
            else
                data.values[i].value = (data.values[i].value - extent[0]) / extent[1];
        }
    };

    var reflect = function(row) {

        var accessor = '';
        var mirror = '';
        var matrix = {};

        if (row) {

            accessor = 'y';
            mirror = 'x';

        } else {

            accessor = 'x';
            mirror = 'y';
        }
        console.log(data.values);

        for (var i = 0; i < data.values.length; i++) {

            var value = data.values[i];
            var va = value[accessor];
            var vm = value[mirror];

            if (!(va in matrix))
                matrix[va] = {}

            matrix[va][vm] = value.value;
        }

        for (var i = 0; i < data.values.length; i++) {

            var va = data.values[i][accessor];
            var vm = data.values[i][mirror];

            //if (data.values[mirror] == data.values[accessor])
            //if (vm === va)
                data.values.value = matrix[va][vm];
        }
    };

    /** 
      * Creates the x and y axis scales using the given domains and/or values.
      * Returns the D3 scale objects in a two element array.
      */
    var makeScales = function() {

        if (!xDomain)
            xDomain = getColumnCategories();

        if (!yDomain)
            yDomain = getRowCategories();

        //cDomain = d3.extent(data.values.map(function(d) { return d.value; }));
        cDomain = d3.extent(
            data.values
            //.filter(function(d) { return d.x != d.y; })
            .map(function(d) { return d.value; })
        );
        console.log(cDomain);

        xScale = d3.scaleBand()
            .domain(xDomain)
            .range([0, getWidth()])
            .paddingInner(0)
            .paddingOuter(0.05)
            .align(0)
            ;

        yScale = d3.scaleBand()
            .domain(yDomain)
            .range([0, getHeight()])
            .paddingInner(0)
            .paddingOuter(0.05)
            .align(0)
            ;

        //cScale = d3.scaleLinear()
        //    //.interpolate(d3.interpolateRgb)
        //    .interpolate(d3.interpolateYlGnBu)
        //    .domain(cDomain)
        //    .range([d3.rgb('#EDF3FE'), d3.rgb('#0767F8')])
        //    .range([d3.rgb(d3.schemeYlGnBu[0]), d3.rgb(d3.schemeYlGnBu[d3.schemeYlGnBu.length - 1])])
        //    ;
        //cScale = d3.scaleSequential(d3.interpolateYlGnBu)
        cScale = d3.scaleSequential(d3.interpolateBlues)
            //.interpolate(d3.interpolateRgb)
            .domain(cDomain)
            //.range([d3.rgb('#EDF3FE'), d3.rgb('#0767F8')])
            //.range([d3.rgb(d3.schemeYlGnBu[0]), d3.rgb(d3.schemeYlGnBu[d3.schemeYlGnBu.length - 1])])
            ;

        return [xScale, yScale];
    };

    /** 
      * Creates the x and y axis objects and draws them. The axis objects are
      * returned as a two element array.
      */
    var drawAxes = function() {

        var xaxis = d3.axisBottom(xScale)
            .tickSizeOuter(0)
            //.ticks(5)
            //.tickValues(xTickValues)
            //.tickFormat(d3.format(xFormat))
            ;//.tickSizeOuter(outerTicks ? 6 : 0);

        var yaxis = d3.axisRight(yScale)
            .tickSizeOuter(0)
            //.ticks(5)
            //.tickValues(yTicksValues)
            //.tickFormat(d3.format(yFormat))
            ;

        var xAxisObject = svg.append('g')
            .attr('transform', function() {
                return 'translate(0,' + getHeight() + ')';
            })
            .style('fill', 'none')
            .style('font-family', font)
            .style('font-size', fontSize)
            .style('font-weight', fontWeight)
            .call(xaxis)
            ;

        xAxisObject
            .select('.domain')
            .remove()
            ;

        xAxisObject
            .selectAll('text')
            .attr('x', 5)
            .attr('y', 5)
            .attr('dy', '.35em')
            .attr('dx', '.35em')
            .attr('transform', 'rotate(-300)')
            .style('text-anchor', 'start')
            .append('text')
            .attr('x', function() { return getWidth() / 2; })
            .attr('y', 35)
            .attr('fill', '#000')
            .style('text-anchor', 'middle')
            .text(function(d) { return xLabel; })
            ;


        var yAxisObject = svg.append('g')
            .attr('transform', function() {
                return 'translate(' + getWidth() + ',0)';
            })
            .style('fill', 'none')
            .style('font-family', font)
            .style('font-size', fontSize)
            .style('font-weight', fontWeight)
            .call(yaxis)
            .select('.domain')
            .remove()
            //.append('text')
            //// Weird x, y argumetnns cause of the -90 rotation
            //.attr('x', function() { return -getHeight() / 2; })
            //.attr('y', -40)
            //.attr('fill', '#000')
            ////.attr('transform', 'rotate(-90)')
            //.style('text-anchor', 'middle')
            //.text(function(d) { return 'shit'; })
            ;

        return [xAxisObject, yAxisObject];
    };

    var drawCells = function() {

        var cellSvg = svg.selectAll('cells')
            .data(data.values)
            .enter()
            .append('rect')
            .attr('x', function(d) { return xScale(d.x); })
            .attr('y', function(d) { return yScale(d.y); })
            .attr('height', yScale.bandwidth())
            .attr('width', xScale.bandwidth())
            .style('fill', function(d) { return cScale(d.value); })
            .style('stroke', '#000000')
            .style('stroke-width', 1)
            ;
    };

    var drawLegend = function() {

        var cmin = cScale.domain()[0];
        var cmax = cScale.domain()[1];
        var cmid = (cmin + cmax) / 2;

        var gradient = svg.append('defs')
            .append('linearGradient')
            .attr("id", "gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%")
            .attr("spreadMethod", "pad")
            .selectAll('stop')
            .data([
                //{offset: '0%', color: cScale(0)},
                //{offset: '50%', color: cScale(0.5)},
                //{offset: '100%', color: cScale(1)},
                {offset: '0%', color: cScale(cmin)},
                {offset: '50%', color: cScale(cmid)},
                {offset: '100%', color: cScale(cmax)},
            ])
            .enter()
            .append('stop')
            .attr('offset', function(d) { return d.offset; })
            .attr('stop-color', function(d) { return d.color; })
            ;

        var legendSvg = svg.append('rect')
            .attr('x', function(d) { return -20; })
            .attr('y', function(d) { return 0; })
            .attr('height', getHeight() - 3)
            .attr('width', 10)
            .style('fill', 'url(#gradient)')
            .style('stroke', '#000000')
            .style('stroke-width', 1)
            ;
    };

    exports.draw = function() {

        svg = d3.select('body')
            .append('svg')
            .attr('height', height)
            .attr('width', width)
            .append('g')
            .attr('transform', 
                  'translate(' + margin.left + ',' + margin.top + ')'
            )
            ;

        if (normalizeRows)
            normalize(true);

        else if (normalizeColumns)
            normalize(false);

        else if (normalizeMatrix)
            matrixNormalization2();
        console.log(data.values);

        makeScales();
        drawAxes();
        drawCells();
        drawLegend();

    };
    /**
      * Setters and getters.
      */

    exports.data = function(_) {
        if (!arguments.length) return data;
        data = _;
        return exports;
    };

    exports.height = function(_) {
        if (!arguments.length) return height;
        height = +_;
        return exports;
    };

    exports.width = function(_) {
        if (!arguments.length) return width;
        width = +_;
        return exports;
    };

    exports.normalizeRows = function(_) {
        if (!arguments.length) return normalizeRows;
        normalizeRows = _;
        return exports;
    };

    exports.normalizeColumns = function(_) {
        if (!arguments.length) return normalizeColumns;
        normalizeColumns = _;
        return exports;
    };

    exports.normalizeMatrix = function(_) {
        if (!arguments.length) return normalizeMatrix;
        normalizeMatrix = _;
        return exports;
    };

    return exports;
};
function validateOptions(opts) {

	//var opacity = (opts.opacity === undefined) ? 0.55 : opts.opacity;
	var height = (opts.height === undefined) ? 500 : opts.height;
	var width = (opts.width === undefined) ? 500 : opts.width;
	var stroke = (opts.stroke === undefined) ? '#000000' : opts.stroke;
	var nodeColor = (opts.nodeColor === undefined) ? '#000' : opts.nodeColor;
	// Radius of each node in the tree
	var radius = (opts.radius === undefined) ? 5 : opts.radius;

	//if (opts.colors === undefined || opts.colors.length < sets.length)
	//	var colors = d3.scale.category20();
	//else
	//	var colors = opts.colors;

	return {
		//colors : colors,
		//opacity : opacity,
		height : height,
		width : width,
		stroke : stroke,
		radius : radius
	};
}

function translateMargin(margin) {

	return 'translate(' + margin.left + ',' + margin.top + ')';
}


function elbow(d, i) {
  return "M" + d.source.y + "," + d.source.x
      + "V" + d.target.x + "H" + d.target.y;
}
// The function expects data to be a hierarchy of objects (essentially objects
// of objects of objects of...). Each node in the tree is an object. The only
// required keys for each node are 'name' and 'children'. Children should be an
// array of objects which comprise the node's children and are the same format
// as each node. 
//
function makeTree(data, opts={}) {

	opts = validateOptions(opts);

	var margin = {top: 10, right: 30, bottom: 30, left: 50};
	var height = opts.height - margin.top - margin.bottom;
	var width = opts.width - margin.left - margin.right;
	
	//var tree = d3.layout.tree()
	//	.size([height, width]);

	var tree = d3.layout.cluster()
		.size([height, width - 200]);

	// A diagonal generator. Projection converts some point {x, y} to a two
	// element array of numbers. 
	//var diagonal = d3.svg.diagonal()
	//	.projection(function(d) { return [d.y, d.x]; });

	var svg = d3.select('body')
		.append('svg')
		.attr('width', opts.width)
		.attr('height', opts.height)
		.append('g')
		.attr('transform', translateMargin(margin));

	// d3 will automagically parse out the tree structure if it's in the 
	// format specified above
	var nodes = tree.nodes(data);
	var edges = tree.links(nodes);

	var edge = svg.selectAll('path.edge')
		.data(edges)
		.enter().append('path')
		.attr('class', 'edge')
		.attr('d', elbow);

	var node = svg.selectAll('g.node')
		.data(nodes)
		.enter().append('g')
		.attr('class', 'node')
		.attr('transform', function(d) { 
			return 'translate(' + d.y + ',' + d.x + ')'; 
		});
	
	node.append('circle')
		.attr('r', opts.radius);

	node.append('text')
		.attr('dx', function(d) { return d.children ? -8 : 8; })
		.attr('dy', function(d) { return d.children ? -5 : 3; })
		//.attr('dy', 3)
		.attr('text-anchor', function(d) { 
			return d.children ? 'end' : 'start'; 
		})
		.text(function(d) { return d.name; });

}
