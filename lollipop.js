/**
  * file: lollipop.js
  * desc: d3js 4.0 implementation of lollipop plots.
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
  *     x:      [req] numeric value
  *     y:      [req] categorical value or group
  *     group:  [req] some value to distinguish between two groups
  * }
  *
  */
var lollipop = function() {

    var exports = {},

        /** public **/

        // Data objects
        data = null,
        // HTML element the viz is attached to
        element = 'body',
        // X and y axis font
        font = 'sans-serif',
        // X and y axis font size
        fontSize = '11px',
        // X and y axis font weight
        fontWeight = 'normal',
        // SVG height
        height = 800,
        // SVG width
        width = 900,
        // Determines whether to draw outer (first/last) ticks on the x-axis
        outerTicks = false,
        tickValues = null,
        // X-axis label
        xLabel = '',
        // Y-axis label
        yLabel = '',
        // X-axis label padding
        xLabelPad = 35,
        // Y-axis label padding
        yLabelPad = 35,
        // SVG label text
        svgLabel = '',
        // Width of the boxplot and whisker outline
        strokeWidth = 4,
        // Color of the boxplot and whisker outline
        strokeColor = '#333',
        // X value domain
        xDomain = null,
        // Y value domain
        yDomain = null,
        // Size of the plotted circles
        radius = 9,
        background = false,
        bgColor = '#EDEDED',
        bgStroke = '#333',
        bgStrokeWidth = 1,
        lines = true,
        lineStroke = '#AAA',
        lineStrokeWidth = 2,
        circleStroke = '#AAA',
        circleStrokeWidth = 0,

        /** private **/

        // Color scale dependent on violin categories
        colorScale = null,
        // Margin object
        margin = {top: 30, right: 15, bottom: 40, left: 15},
        // SVG object
        svg = null,
        // X value scale
        xScale = null,
        // Y value scale
        yScale = null
        ;

    /** private **/

    /** 
      * Returns the margin corrected height of the plot.
      */
    var getHeight = function() { return height - margin.top - margin.bottom; };

    /** 
      * Returns the margin corrected width of the plot.
      */
    var getWidth = function() { return width - margin.left - margin.right; };

    /** 
      * Returns a list of values given an array of objects and a key used to
      * extract the value. The returned list does not contain duplicates.
      */
    var getUniqueList = function(arr, key) { 

        let found = {};

        return arr.map(d => d[key]).filter(d => {
            return found.hasOwnProperty(d) ? false : (found[d] = true);
        });
    };

    /** 
      * Iterates over each violin object and returns all distribution values
      * flattened into a single array.
      */
    var getAllValues = function() {
        return [].concat.apply([], data.map(function(d) { return d.values; }));
    };

    var makeDefaultColors = function() {

        return [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map(
            function(d) { 
                //return d3.interpolateRainbow(d);
                return d3.interpolateCool(d);
        });
    };

    /** 
      * Creates the x axis and color value scales using the the plot.
      */
    var makeScales = function() {

        var xdomain = 
            xDomain ? xDomain : d3.extent(data, function(d) { return d.x;});

        var ydomain = yDomain ? yDomain : getUniqueList(data, 'y');
                      
        xScale = d3.scaleLinear()
            .domain(xdomain)
            .nice()
            .range([0, getWidth()]);

        // We have to insert and append two hidden y values otherwise
        // a valid y value will be mapped to 0 which intersects and the top of
        // the chart which looks ugly.
        ydomain.unshift('_1_');
        ydomain.push('_2_');
        console.log(ydomain);

        yScale = d3.scalePoint()
            .domain(ydomain)
            .range([getHeight(), 0]);
    };

    /** 
      * Creates the x and y axis objects and draws them. The axis objects are
      * returned as a two element array.
      */
    var makeAxes = function() {

        var xAxis = d3.axisBottom(xScale)
            .tickSizeOuter(outerTicks ? 6 : 0)
            .tickValues(tickValues)
            ;

        var xAxisObject = svg.append('g')
            .attr('transform', function() {
                return 'translate(0,' + getHeight() + ')';
            })
            .style('fill', 'none')
            .style('font-family', font)
            .style('font-size', fontSize)
            .style('font-weight', fontWeight)
            .call(xAxis)
            .append('text')
            .attr('x', function() { return getWidth() / 2; })
            .attr('y', xLabelPad)
            .attr('fill', '#000')
            .style('text-anchor', 'middle')
            .text(function(d) { return xLabel; })
            ;

        var yAxis = d3.axisLeft(yScale)
            .tickSizeOuter(outerTicks ? 6 : 0)
            //.tickValues(tickValues)
            ;

        var yAxisObject = svg.append('g')
            .style('fill', 'none')
            .style('font-family', font)
            .style('font-size', fontSize)
            .style('font-weight', fontWeight)
            .call(yAxis);

        yAxisObject.append('text')
            // Weird x, y arguments cause of the -90 rotation
            .attr('x', function() { return -getHeight() / 2; })
            .attr('y', yLabelPad)
            .attr('fill', '#000')
            .attr('transform', 'rotate(-90)')
            .style('text-anchor', 'middle')
            .text(yLabel)
            ;

        // Remove the hidden group from view
        yAxisObject.selectAll('.tick')
            .filter(function() {
                let text = d3.select(this).select('text').text();

                return text === '_1_' || text === '_2_';
            })
            .remove();
    };

    var intersects = function(x, y, queue) {

        var c = queue;

        while (c) {

            if ((radius * 2 + circlePadding - epsilon) ** 2 > (c.x - x) ** 2 + (c.y - y) ** 2) {
                return true;
            }

            c = c.next;
        }

        return false;
    };

    var drawBackground = function() {


        var ticks = xScale.ticks(5);

        // Background if wanted
        svg.append('rect')
            //.attr('x', sx)
            //.attr('y', sy)
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', getWidth())
            .attr('height', getHeight())
            .style('stroke', '#000')
            .style('stroke-width', 0)
            .style('fill', bgColor)
            ;

        // Skip first and last ticks otherwise it looks ugly
        for (var j = 1; j < ticks.length - 1; j++) {

            // THESE FUCKING LINES ARE OFF BY 0.5 WTF?!
            svg.append('line')
                .attr('x1', xScale(ticks[j]) + 0.5)
                .attr('y1', 0)
                .attr('x2', xScale(ticks[j]) + 0.5)
                .attr('y2', getHeight())
                .style('shape-rendering', 'auto')
                .style('stroke', bgStroke)
                .style('stroke-width', bgStrokeWidth);
        }

        var ticks = yScale.domain();

        // Skip first and last ticks since they are hidden, filler elements
        for (var j = 1; j < ticks.length - 1; j++) {

            // THESE FUCKING LINES ARE OFF BY 0.5 WTF?!
            svg.append('line')
                .attr('x1', 0)
                .attr('y1', yScale(ticks[j])+0.5 )
                .attr('x2', getWidth())
                .attr('y2', yScale(ticks[j])+0.5 )
                .style('shape-rendering', 'auto')
                .style('stroke', bgStroke)
                .style('stroke-width', bgStrokeWidth);
        }
    };

    var drawCircles = function() {

        let circles = svg.selectAll('circle')
            .data(data)
            .enter()
            .append('circle')
            .attr('clip-path', 'url(#clipped)')
            .attr('cx', d => xScale(d.x))
            .attr('cy', d => yScale(d.y))
            .attr('r', d => {

                if (d.radius)
                    return d.radius;

                return radius;
            })
            .attr('fill', d => {

                if (d.color)
                    return d.color;

                return color;
            })
            .attr('opacity', d => {

                if (d.opacity)
                    return d.opacity;

                return 0.8;
            })
            .attr('stroke', d => {

                if (d.stroke)
                    return d.stroke;

                return circleStroke;
            })
            .attr('stroke-width', d => {

                if (d.strokeWidth)
                    return d.strokeWidth;

                return circleStrokeWidth;
            })
            ;
    };

    var drawLines = function() {

        // First we find pairs that are of the same category (y-value)
        let ypairs = data.reduce((ac, d) => {
            ac[d.y] = ac[d.y] || [];
            ac[d.y].push(d);

            return ac;
        }, {});

        let pairs = [];

        // Group them into lists and prevent line drawing for overlapping 
        // circles
        for (let k in ypairs) {
            let cx = Math.pow(xScale(ypairs[k][0].x) - xScale(ypairs[k][1].x), 2);
            let cy = Math.pow(yScale(ypairs[k][0].y) - yScale(ypairs[k][1].y), 2);
            let c1r = ypairs[k][0].radius || radius;
            let c2r = ypairs[k][1].radius || radius;

            // Circles are not disjoint
            if (Math.pow(c1r + c2r, 2) >= cx + cy)
                continue;

            pairs.push(ypairs[k]);
        }

        let line = d3.line()
            .x(d => xScale(d.x))
            .y(d => yScale(d.y));

        let lines = svg.selectAll('.lines')
            .data(pairs)
            .enter()
            .append('path')
            .attr('d', line)
            .attr('stroke-linecap', 'round')
            .style('shape-rendering', 'auto')
            .style('stroke', lineStroke)
            .style('stroke-width', lineStrokeWidth);
    };

    var drawClipping = function() {

        svg.append('clipPath')
            .attr('id', 'clipped')
            .append('rect')
            // A line is drawn where x == 0 so we must prevent circles
            // from overlapping this line
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', getWidth())
            .attr('height', getHeight());
    };

    /** public **/

    exports.draw = function() {

        svg = d3.select(element)
            .append('svg')
            .attr('height', height)
            .attr('width', width)
            .append('g')
            .attr('transform', 
                'translate(' + margin.left + ',' + margin.top + ')'
            );

        drawClipping();
        makeScales();
        makeAxes()

        if (background)
            drawBackground();

        if (lines)
            drawLines();

        drawCircles();
        
        /*
        if (useForce)
            var positions = positionWithForce();
        else
            var positions = positionWithoutForce();

        var circles = svg.append('g')
            .selectAll('circle')
            .data(positions)
            .enter()
            .filter(d => d.cy > 0)
            .append('circle')
            .attr('cx', d => d.cx)
            .attr('cy', d => d.cy)
            .attr('r', radius)
            .attr('fill', d => colorScale(d.data.value))
            ;

        circles
            .append('svg:title')
            .text(d => d.data.label + '\n' + d.cx + '\n' + d.cy)
            ;

        circles
            .on('mouseover', function(d) {
                d3.select(this).attr('fill', '#000');
            })
            .on('mouseout', function(d) {
                d3.select(this).attr('fill', colorScale(d.data.value));
            });
            */

        return exports;
    };

    /**
      * Setters and getters.
      */

    exports.data = function(_) {
        if (!arguments.length) return data;
        data = _;
        return exports;
    };

    exports.element = function(_) {
        if (!arguments.length) return element;
        element = _;
        return exports;
    };

    exports.margin = function(_) {
        if (!arguments.length) return margin;
        margin = _;
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

    exports.font = function(_) {
        if (!arguments.length) return font;
        font = _;
        return exports;
    };

    exports.fontColor = function(_) {
        if (!arguments.length) return fontColor;
        fontColor = _;
        return exports;
    };

    exports.fontSize = function(_) {
        if (!arguments.length) return fontSize;
        fontSize = _;
        return exports;
    };

    exports.fontWeight = function(_) {
        if (!arguments.length) return fontWeight;
        fontWeight = _;
        return exports;
    };

    exports.svgLabel = function(_) {
        if (!arguments.length) return svgLabel;
        svgLabel = _;
        return exports;
    };

    exports.textures = function(_) {
        if (!arguments.length) return textures;
        textures = _;
        return exports;
    };

    exports.xDomain = function(_) {
        if (!arguments.length) return xDomain;
        xDomain = _;
        return exports;
    };

    exports.yDomain = function(_) {
        if (!arguments.length) return yDomain;
        yDomain = _;
        return exports;
    };

    exports.xLabel = function(_) {
        if (!arguments.length) return xLabel;
        xLabel = _;
        return exports;
    };

    exports.xLabelPad = function(_) {
        if (!arguments.length) return xLabelPad;
        xLabelPad = +_;
        return exports;
    };

    exports.yLabelPad = function(_) {
        if (!arguments.length) return yLabelPad;
        yLabelPad = +_;
        return exports;
    };

    exports.yLabel = function(_) {
        if (!arguments.length) return yLabel;
        yLabel = _;
        return exports;
    };

    exports.outerTicks = function(_) {
        if (!arguments.length) return outerTicks;
        outerTicks = _;
        return exports;
    };

    exports.tickValues = function(_) {
        if (!arguments.length) return tickValues;
        tickValues = _;
        return exports;
    };

    exports.strokeWidth = function(_) {
        if (!arguments.length) return strokeWidth;
        strokeWidth = +_;
        return exports;
    };

    exports.strokeColor = function(_) {
        if (!arguments.length) return strokeColor;
        strokeColor = _;
        return exports;
    };

    exports.radius = function(_) {
        if (!arguments.length) return radius;
        radius = +_;
        return exports;
    };

    exports.marginBottom = function(_) {
        if (!arguments.length) return margin.bottom;
        margin.bottom = +_;
        return exports;
    };

    exports.marginTop = function(_) {
        if (!arguments.length) return margin.top;
        margin.top = +_;
        return exports;
    };

    exports.marginLeft = function(_) {
        if (!arguments.length) return margin.left;
        margin.left = +_;
        return exports;
    };

    exports.marginRight = function(_) {
        if (!arguments.length) return margin.right;
        margin.right = +_;
        return exports;
    };

    exports.background = function(_) {
        if (!arguments.length) return background;
        background = _;
        return exports;
    };

    exports.bgColor = function(_) {
        if (!arguments.length) return bgColor;
        bgColor = _;
        return exports;
    };
    
    exports.bgStroke = function(_) {
        if (!arguments.length) return bgStroke;
        bgStroke = _;
        return exports;
    };

    exports.bgStrokeWidth = function(_) {
        if (!arguments.length) return bgStrokeWidth;
        bgStrokeWidth = +_;
        return exports;
    };

    exports.lines = function(_) {
        if (!arguments.length) return lines;
        lines = _;
        return exports;
    };

    exports.lineStroke = function(_) {
        if (!arguments.length) return lineStroke;
        lineStroke = _;
        return exports;
    };

    exports.lineStrokeWidth = function(_) {
        if (!arguments.length) return lineStrokeWidth;
        lineStrokeWidth = +_;
        return exports;
    };
    
    exports.circleStroke = function(_) {
        if (!arguments.length) return circleStroke;
        circleStroke = _;
        return exports;
    };

    exports.circleStrokeWidth = function(_) {
        if (!arguments.length) return circleStrokeWidth;
        circleStrokeWidth = +_;
        return exports;
    };

    return exports;
};


