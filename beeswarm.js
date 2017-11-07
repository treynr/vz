/**
 * file:    beeswarm.js
 * desc:    d3js 4.0 implementation of hierarchical graph structures. Very 
 *          similar to other graph or tree implementations, but forces a strict
 *          hierarchy and spacing between nodes.
 * vers:    0.2.0
 * auth:    TR
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
        // X-axis label
        xLabel = '',
        // Y-axis label
        yLabel = '',
        // SVG label text
        svgLabel = '',
        // Width of the boxplot and whisker outline
        strokeWidth = 4,
        // Color of the boxplot and whisker outline
        strokeColor = '#333',
        // Y value domain
        yDomain = null,

        /** private **/

        // Color scale dependent on violin categories
        colorScale = null,
        // Margin object
        margin = {top: 30, right: 10, bottom: 40, left: 50},
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
      * Creates the x and y axis scales using the given domains and/or values.
      * Returns the D3 scale objects in a two element array.
      */
    var makeScales = function() {

        if (xDomain === undefined || !xDomain)
            xDomain = getCategories();

        if (yDomain === undefined || !yDomain) {

            yDomain = [
                d3.min(getAllValues()), 
                d3.max(getAllValues())
            ];
        }

        xScale = d3.scaleBand()
            .domain(xDomain)
            //.rangeRound([margin.left, width - margin.right])
            .rangeRound([0, getWidth()])
            //.rangeRound([margin.left, getWidth()])
            .padding(0.5)
            ;

        yScale = d3.scaleLinear()
            .domain(yDomain)
            //.rangeRound([height - margin.bottom, margin.top])
            .rangeRound([getHeight(), 0])
            ;

        colorScale = d3.scaleOrdinal()
            //.domain(data.categories)
            .domain(xDomain)
            .range(d3.schemeCategory10)
            ;

        return [xScale, yScale];
    };

    /** 
      * Creates the x and y axis objects and draws them. The axis objects are
      * returned as a two element array.
      */
    var makeAxes = function() {

        var xaxis = d3.axisBottom(xScale)
            .tickSizeOuter(outerTicks ? 6 : 0)
            //.ticks(5)
            //.tickValues(xTickValues)
            //.tickFormat(d3.format(xFormat))
            ;//.tickSizeOuter(outerTicks ? 6 : 0);

        var yaxis = d3.axisLeft(yScale)
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
            .append('text')
            .attr('x', function() { return getWidth() / 2; })
            .attr('y', 35)
            .attr('fill', '#000')
            .style('text-anchor', 'middle')
            .text(function(d) { return xLabel; })
            ;

        var yAxisObject = svg.append('g')
            .style('fill', 'none')
            .style('font-family', font)
            .style('font-size', fontSize)
            .style('font-weight', fontWeight)
            .call(yaxis)
            .append('text')
            // Weird x, y argumetnns cause of the -90 rotation
            .attr('x', function() { return -getHeight() / 2; })
            .attr('y', -40)
            .attr('fill', '#000')
            .attr('transform', 'rotate(-90)')
            .style('text-anchor', 'middle')
            .text(function(d) { return yLabel; })
            ;

        return [xAxisObject, yAxisObject];
    };


    /** public **/

    /** 
      * Draw the entire violin plot.
      */
    exports.draw = function() {

        svg = d3.select('body')
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

        //var x = d3.scaleLog()
        var x = d3.scaleLinear()
            .rangeRound([0, getWidth()]);

        x.domain(d3.extent(data, function(d) { return d.value; }));

        var mean = d3.mean(data, function(d) { return d.value; });


        var simulation = d3.forceSimulation(data)
            //.force('charge', d3.forceManyBody().strength(opts.charge))
            //
            // This lets us link nodes using their identifiers and not array
            // indices
            //.force('link', 
            //       d3.forceLink().id(function(d) { 
            //           return d.id;
            //       }).distance(opts.distance))
            ////
            .force('x', d3.forceX(function (d) { return x(d.value); }).strength(1))
            .force('y', d3.forceY(getHeight() / 2))
            .force('collide', d3.forceCollide(4))
            .stop();

        for (var i = 0; i < 120; i++)
            simulation.tick();

        svg.append('rect')
            .attr('x', function() { return mean; })
            .attr('y', 0)
            .attr('height', getHeight())
            .attr('width', 3)
            .style('fill', '#FF0000')
            .style('fill-opacity', 0.95)
            ;
        //g.append("g")
        svg.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + getHeight() + ")")
      .call(d3.axisBottom(x).ticks(20, ".0s"));

  //var cell = g.append("g")
  var cell = svg.append("g")
      .attr("class", "cells")
    .selectAll("g").data(d3.voronoi()
        .extent([
            //[-margin.left, -margin.top], 
            [-margin.left, -margin.top], 
            [width + margin.right, height + margin.top]
        ])
        .x(function(d) { return d.x; })
        .y(function(d) { return d.y; })
      .polygons(data)).enter().append("g");

  cell.append("circle")
      .style('fill', function(d) {
          console.log(d.data);
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

      /*
        svg.append('rect')
            .attr('x', function() { return mean; })
            .attr('y', 0)
            .attr('height', getHeight())
            .attr('width', 3)
            .style('fill', '#FF0000')
            .style('fill-opacity', 0.95)
            ;
    */

        //var nodes = svg.selectAll('circle')
        //    .data(data)
        //    .enter()
        //    .append('circle')
        //    .attr('r', 4)
        //    .attr('cx', function(d) { return d.x; })
        //    .attr('cy', function(d) { return d.y; });

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

    return exports;
};


