/**
  * file: beeswarm.js
  * desc: d3js 4.0 implementation of beeswarm plots.
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
  */
var beeswarm = function() {

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
        // X-axis label padding
        xLabelPad = 35,
        // SVG label text
        svgLabel = '',
        // Width of the boxplot and whisker outline
        strokeWidth = 4,
        // Color of the boxplot and whisker outline
        strokeColor = '#333',
        // Y value domain
        yDomain = null,
        // Use a force directed layout instead
        useForce = false,
        // Size of the plotted circles
        radius = 3,
        epsilon = 1e-3,
        circlePadding = 1,
        collideStrength = 5,

        /** private **/

        // Color scale dependent on violin categories
        colorScale = null,
        // Margin object
        margin = {top: 30, right: 15, bottom: 40, left: 15},
        // SVG object
        svg = null,
        // SVG object
        violinSvg = null,
        // X value domain
        xDomain = null,
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
      * Returns the list of categories used in the plot.
      */
    var getCategories = function() { 
        return data.map(function(d) { return d.category; });
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

        var xdomain = xDomain ? xDomain : 
                      d3.extent(data, function(d) { return d.value;});

        xScale = d3.scaleLinear()
            .domain(xdomain)
            .nice()
            .range([0, getWidth()]);

        //colorScale = d3.scaleSequential(d3.interpolateReds)
        colorScale = d3.scaleSequential(
                d3.interpolateRgb(d3.rgb(249,105,76), d3.rgb(103,0,13)))
            .domain(xdomain)
            ;
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

    var positionWithoutForce = function() {

        var circles = data.map(function(d) { return {x: xScale(d.value), data: d}; })
            .sort(function(a, b) { return a.x - b.x; })
            ;

        var head = null;
        var tail = null;

        for (var i = 0; i < circles.length; i++) {

            var circle = circles[i];

            while (head && head.x < circle.x - (radius * 2 + circlePadding))
                head = head.next;

            circle.y = 0;

            if (intersects(circle.x, circle.y, head)) {

                var a = head;
                circle.y = Infinity;

                do {

                    var y = a.y + Math.sqrt((radius * 2 + circlePadding) ** 2 - (a.x - circle.x) ** 2);

                    if (y < circle.y && !intersects(circle.x, y, head))
                        circle.y = y;

                    a = a.next;

                } while (a)
            }

            circle.next = null;

            if (head == null)
                head = tail = circle;
            else
                tail = tail.next = circle;
        }

        for (let c of circles) {

            c.cx = c.x;
            c.cy = height - margin.top - margin.bottom - radius - circlePadding - c.y;
        }

        return circles;
    };

    var positionWithForce = function() {

        var simulation = d3.forceSimulation(data)
            .force('x', d3.forceX(function (d) { return xScale(d.value); }).strength(1))
            .force('y', d3.forceY(getHeight() / 2))
            .force('collide', d3.forceCollide(collideStrength))
            .stop();

        for (var i = 0; i < 120; i++)
            simulation.tick();

        var voronoi = d3.voronoi()
            .extent([
                [-margin.left, -margin.top], 
                [width + margin.right, height + margin.top]
            ])
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; })
            .polygons(data)
            ;

        for (let v of voronoi) {

            v.cx = v.data.x;
            v.cy = v.data.y;
        }

        return voronoi;
        /*
        var cell = svg.append("g")
            .attr("class", "cells")
            .selectAll("g")
            .data(voronoi)
            .enter()
            .append("g");

        cell.append("circle")
            .style('fill', function(d) {
                if (d.data.color !== undefined)
                    return d.data.color;
                else
                    return '#000000';
            })
            .attr("r", 3)
            .attr("cx", function(d) { return d.data.x; })
            .attr("cy", function(d) { return d.data.y; });

        cell.append("path")
            .style('fill', 'none')
            .attr("d", function(d) { return "M" + d.join("L") + "Z"; });

        var formatValue = d3.format(',d');

        cell.append("title")
            .text(function(d) { return d.data.pathway + "\n" + formatValue(d.data.value); });
            */
    };

    var drawWithoutForce = function(positions) {

        svg.append('g')
            .selectAll('circle')
            .data(positions)
            .enter()
            .append('circle')
            .attr('cx', function(d) { return d.cx; })
            .attr('cy', function(d) { return d.cy; })
            .attr('r', radius)
            .attr('fill', function(d) { return colorScale(d.data.value); })
            //.attr('stroke', '#000')
            //.attr('stroke-width', 1)
            .append('svg:title')
            .text(function(d) { return d.data.value; })
            ;
    };

    var drawWithForce = function(positions) {

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
            )
            //.datum(data)
            //.data(data)
            ;

        makeScales();
        makeAxes()
        
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

    exports.useForce = function(_) {
        if (!arguments.length) return useForce;
        useForce = _;
        return exports;
    };

    exports.radius = function(_) {
        if (!arguments.length) return radius;
        radius = +_;
        return exports;
    };

    exports.epsilon = function(_) {
        if (!arguments.length) return epsilon;
        epsilon = +_;
        return exports;
    };

    exports.circlePadding = function(_) {
        if (!arguments.length) return circlePadding;
        circlePadding = +_;
        return exports;
    };

    exports.collideStrength = function(_) {
        if (!arguments.length) return collideStrength;
        collideStrength = +_;
        return exports;
    };

    return exports;
};


