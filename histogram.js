/**
 * file: histogram.js
 * desc: d3js 4.0 implementation of histograms.
 * vers: 0.1.0
 * auth: TR
 */

/*
 * The data structure necessary for this viz can be one of two objects
 * depending on how the user wants to draw the histogram. 
 * If the user wants a basic histogram layout, the data structure is 
 * simply a list of values that are automatically binned and plotted:
 * 
 *      [1, 2, 2, 8, 1, 9, 3, 5, 5, 5, 5, 7, 3]
 *
 * If the user wants to select bins themselves, a list of objects containing x
 * and y axis values are provided instead.
 *
 *      [{x: 4, y: 1}, {x: 2, y: 2}, {x: 3, y: 1}]
 *
 */
var histogram = function() {

    var exports = {},
        data = null,
        svg = null,
        // SVG width
        width = 800,
        // SVG height
        height = 500,
        // Margin object
        margin = {top: 10, right: 30, bottom: 30, left: 30},
        // The number of bins to use
        numBins = 15,
        // Scale for the x-axis
        xScale = null,
        // Scale for the y-axis
        yScale = null,
        // Histogram generator
        histogram = null,
        // Binned data generated by the histogram
        bins = null
        ;

    /** private **/

    var getWidth = function() { return width - margin.left - margin.right; };
    var getHeight = function() { return height - margin.top - margin.bottom; };

    var makeScales = function() {

        var xdomain = [
            //d3.min(data, function(d) { return d.x; }),
            //d3.max(data, function(d) { return d.x; }),
            d3.min(data),
            d3.max(data),
        ];
        console.log(xdomain);

        xScale = d3.scaleLinear()
            .domain(xdomain)
            .range([margin.left, getWidth()])
            ;

        yScale = d3.scaleLinear()
            //.range([getHeight(), 0])
            .range([getHeight(), 0])
            //.domain([0, d3.max(data, function(d) { return d.y; })])
            ;
    };

    var makeAxes = function() {

        xAxis = d3.axisBottom(xScale);
        //xAxis = d3.axisBottom(xScale)
        //    .tickValues(makeCustomBins())
        //    ;
        //console.log(makeCustomBins());

        svg.append('g')
            .attr('class', 'axis')
            .attr('transform', function() {
                return 'translate(0' + ',' + (getHeight() + 5) + ')';
            })
            .style('font', '11px sans-serif')
            .style('font-weight', 'normal')
            .style('fill', 'none')
            //.style('stroke', '#000000')
            //.style('stroke-width', '1px')
            //.call(d3.axisBottom(xScale))
            .call(xAxis)
            ;

        svg.append('g')
            .attr('class', 'axis axis--x')
            //.attr('transform', 'translate(0' + ',' + getHeight() + ')')
            .style('font', '11px sans-serif')
            .style('font-weight', 'normal')
            .style('fill', 'none')
            //.style('stroke', '#000000')
            //.style('stroke-width', '1px')
            .call(d3.axisLeft(yScale))
            ;
            //.style('font', '12px sans-serif')
            //
    };

    var makeCustomBins = function() {

        var b = [];

        for (var i = 2; i <= 12; i++)
            //console.log(i + ', ' + Math.pow(i, 2));
            b.push(Math.pow(2, i));

        return b;
    };

    var makeHistogram = function() {

        histogram = d3.histogram()
            //.value(function(d) { return d.x; })
            .domain(xScale.domain())
            .thresholds(xScale.ticks(numBins))
            //.thresholds(makeCustomBins())
            //.thresholds(xScale.ticks(20))
            ;

        bins = histogram(data);

        yScale.domain([0, d3.max(bins, function(d) { return d.length; })]);
    };

    var drawHistogram = function() {

        var bar = svg.selectAll('.bar')
            .data(bins)
            .enter()
            .append('g')
            .attr('class', 'bar')
            .attr('transform', function(d) {
                return 'translate(' + xScale(d.x0) + ',' + yScale(d.length) + ')';
            })
            ;

        bar.append('rect')
            .attr('x', 1)
            .attr('width', function(d) { 
                //return xScale(d.x1) - xScale(d.x0) - 1; 
                return xScale(bins[0].x1) - xScale(bins[0].x0) - 1; 
                //return (getWidth() / makeCustomBins().length) - 1;
            })
            .attr('height', function(d) { 
                return getHeight() - yScale(d.length); 
            })
            .style('shape-rendering', 'auto')
            .style('fill', '#0000BB')
            .style('stroke', '#000000')
            .style('stroke-width', '1px')
            ;

    };

    /** public **/

    exports.draw = function() {

        svg = d3.select('body')
            .append('svg')
            .attr('height', height)
            .attr('width', width)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
            ;

        makeScales();
        makeHistogram();
        makeAxes();
        drawHistogram();
    };

    /** setters/getters **/

    exports.data = function(_) {
        if (!arguments.length) return data;
        data = _;
        return exports;
    };

    exports.width = function(_) {
        if (!arguments.length) return width;
        width = +_;
        return exports;
    };

    exports.height = function(_) {
        if (!arguments.length) return height;
        height = +_;
        return exports;
    };

    exports.numBins = function(_) {
        if (!arguments.length) return numBins;
        numBins = +_;
        return exports;
    };

    return exports;
};

var legend = function(data, opts) {

    opts = validateLegendOptions(opts);

    var legend = d3.select('body').append('svg')
        .attr('width', opts.width)
        .attr('height', opts.height)
        .selectAll('g')
        .data(data)
        .enter().append('g')
        .attr("transform", function(d, i) { 
            return "translate(40," + (i + 1) * opts.keyPadding + ")"; 
        });

    legend.append('rect')
        .attr('width', opts.keyWidth)
        .attr('height', opts.keyHeight)
		.attr('stroke', opts.stroke)
		.attr('stroke-width', opts.strokeWidth)
        .attr('shape-rendering', 'crispEdges')
        .style('fill-opacity', opts.opacity)
        .style('fill', function(d, i) {
            if (d.color === undefined)
                return opts.colors[i];

            return d.color;
        });

    legend.append("text")
        .attr("x", opts.textX)
        .attr("y", opts.textY)
        .attr("dy", ".35em")
        .attr('font-family', opts.font)
        .attr('font-size', opts.fontSize)
        .attr('font-weight', opts.fontWeight)
        .text(function(d) { 
			return d.name;
        });
};

/**
 *      height: int, the height of the SVG in pixels
 *      width: int, the width of the SVG in pixels
 *      keyHeight: int, the height of the color box in pixels
 *      keyWidth: int, the width of the color box in pixels
 *      keyPadding: int, padding between color boxes
 *      title: string, legend title
 *      colors: an array of color strings, ensure this is the same size as the
 *          number of data points.
 *      margin: an object of margin values
 *      opacity: float, the opacity of the fill colors
 *      stroke: string, color used to outline the visualization
 *      strokeWidth: string, size in pixels of the stroke outline
 *      font: string, font to use for the legend text
 *      fontSize: string, font size in pixels
 *      fontWeight: string, font weight
 *      textX: int, x coordinate position of each key/color box text
 *      textY: int, y coordinate position of each key/color box text
 */
var validateLegendOptions = function(opts) {

    opts.height = opts.height || 500;
    opts.width = opts.width || 800;
    opts.keyHeight = opts.keyHeight || 20;
    opts.keyWidth = opts.keyWidth || 20;
    opts.keyPadding = opts.keyPadding || 30;
    opts.title = opts.title || '';
    opts.margin = (opts.margin === undefined) ? {} : opts.margin;

    opts.margin.top = opts.margin.top || 10;
    opts.margin.bottom = opts.margin.bottom || 30;
    opts.margin.right = opts.margin.right || 30;
    opts.margin.left = opts.margin.left || 30;

    // These are all the visualization styling options and heavily dependent on
    // the visualization type
    opts.colors = (opts.colors === undefined) ? d3.schemeSet3 : opts.colors;
    opts.opacity = opts.opacity || 1.0;
    opts.stroke = (opts.stroke === undefined) ? '#000' : opts.stroke;
    opts.strokeWidth = (opts.strokeWidth === undefined) ? '1px' : 
                       opts.strokeWidth;
    opts.font = opts.font || 'sans-serif';
    opts.fontSize = opts.fontSize || '15px';
    opts.fontWeight = opts.fontWeight || 'normal';
    opts.textX = opts.textX || (opts.keyWidth + 2);
    opts.textY = opts.textY || (opts.keyHeight / 2 - 2);

    return opts;
};

