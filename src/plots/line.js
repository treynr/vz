/**
  * file: line.js
  * desc: d3js 4.0 implementation of line charts.
  * auth: TR
  */

import {extent, max, min} from 'd3-array';
import {axisBottom, axisLeft} from 'd3-axis';
import {scaleLinear, scaleOrdinal} from 'd3-scale';
import {schemeCategory10} from 'd3-scale-chromatic';
import {select} from 'd3-selection';
import {line, curveCatmullRom} from 'd3-shape';

export default function() {

    var exports = {},
        // Line plot input data
        data = null,
        // SVG object for this plot
        svg = null,
        svgLabel = '',
        // SVG width
        width = 800,
        // SVG height
        height = 500,
        // Margin object
        margin = {top: 10, right: 30, bottom: 50, left: 50},
        // Line width
        lineWidth = 2,
        // Draw the line of no discrimination (for ROC curves)
        drawDiscrimination = false,
        // Line color
        //lineColor = '#98ABC5',
        lineColors = scaleOrdinal(schemeCategory10),
        // If nodes are drawn, the node fill color
        nodeColor = '#F0F0F0',
        //nodeColors = d3.scaleCategory10(),
        // If nodes are drawn, the node stroke color
        //nodeStroke = '#98ABC5',
        nodeStrokes = scaleOrdinal(schemeCategory10),
        // If nodes are drawn, the width of the node's stroke
        nodeStrokeWidth = 2,
        // If nodes are drawn, the node radius
        nodeRadius = 5,
        // Draws nodes at each X-axis point if true
        useNodes = false,
        // Boolean to draw or hide the outer x-axis ticks
        outerTicks = false,
        // Axis text size
        fontSize = 13,
        // Graph title
        title = '',
        // X position of the title
        titleX = null,
        // Y position of the title
        titleY = null,
        // X-axis text
        xLabel = '',
        // Y-axis text
        yLabel = '',
        // Y-axis padding
        yAxisPad = 35,
        // Scale for the x-axis
        xScale = null,
        // Scale for the y-axis
        yScale = null,
        // Format string for x-axis labels
        xTickFormat = null,
        yDomain = null,
        xDomain = null,
        xTickValues = null,
        // Format string for y-axis labels
        yTickFormat = null,
        // y-axis tick values
        yTickValues = null,
        altAxisLabels = false
        ;

    /** private **/

    var getWidth = function() { return width - margin.left - margin.right; };
    var getHeight = function() { return height - margin.top - margin.bottom; };

    /**
      * Creates the X and Y scales.
      */
    var makeScales = function() {

        if (!xDomain)
            xDomain = extent(data.reduce((ac, d) => {
                return ac.concat(d.points.map(p => p[0]));
            }, []));

        if (!yDomain)
            yDomain = extent(data.reduce((ac, d) => {
                return ac.concat(d.points.map(p => p[1]));
            }, []));

        xScale = scaleLinear()
            .domain(xDomain)
            .nice()
            .range([margin.left, getWidth()]);

        yScale = scaleLinear()
            .domain(yDomain)
            .nice()
            .range([getHeight(), 0]);
    };

    /**
      * Generates and renders the X and Y axes for the plot.
      */
    var makeAxes = function() {

        // The last part of the ternary statement forces the first and last
        // ticks of the axis to be labeled.
        let xticks = xTickValues ? xTickValues : 
                     xScale.ticks().concat(xScale.domain());

        let yticks = yTickValues ? yTickValues : 
                     yScale.ticks().concat(yScale.domain());

        let xAxis = axisBottom(xScale)
            .tickFormat(xTickFormat)
            .tickValues(xticks);
            //.tickSizeOuter(outerTicks ? 6 : 0);
        ;

        let yAxis = axisLeft(yScale)
            //.tickValues(yTickValues)
            // Forces min/max ticks to be labeled
            .tickFormat(yTickFormat)
            .tickValues(yticks)
            ;
            //.tickFormat(d3.format(yFormat));

        let xAxisObject = svg.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(0, ${getHeight() + 1})`)
            .style('font-family', 'sans-serif')
            .style('font-size', `${fontSize}px`)
            .style('font-weight', 'normal')
            .style('fill', 'none')
            .call(xAxis);

        xAxisObject.append('text')
            .attr('fill', '#000')
            //.attr('x', (margin.left + getWidth()) / 2)
            //.attr('y', 45)
            //.attr('text-anchor', 'middle')
            .attr('x', altAxisLabels ? getWidth() : (margin.left + getWidth()) / 2)
            .attr('y', altAxisLabels ? -5 : 45)
            .attr('text-anchor', altAxisLabels ? 'end' : 'middle')
            .text(xLabel);

        let yAxisObject = svg.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(${yAxisPad}, 0)`)
            .style('font-family', 'sans-serif')
            .style('font-size', `${fontSize}px`)
            .style('font-weight', 'normal')
            .style('fill', 'none')
            .call(yAxis)
            //.call(g => g.select(".tick:last-of-type text").clone()
            //  .attr("x", 3)
            //  .attr("text-anchor", "start")
            //  .attr("font-weight", "bold")
            //  .text(yLabel))
            ;

        yAxisObject.append('text')
            .attr('fill', '#000')
            // Weird x, y argumetnns cause of the -90 rotation
            //.attr('x', -getHeight() / 2)
            //.attr('y', -50)
            //.attr('transform', 'rotate(-90)')
            //.attr('text-anchor', 'middle')
            .attr('x', altAxisLabels ? 5 : -getHeight() / 2)
            .attr('y', altAxisLabels ? 0 : -50)
            .attr('text-anchor', altAxisLabels ? 'start' : 'middle')
            .attr('transform', altAxisLabels ? '' : 'rotate(-90)')
            .text(yLabel);
    };

    /**
      * Renders the lines for the plot.
      */
    var drawLines = function() {

        var linePath = line()
            .curve(curveCatmullRom.alpha(0.5))
            .x(function(d) { return xScale(d[0]); })
            .y(function(d) { return yScale(d[1]); });

        var svgLine = svg.selectAll('aline')
            .data(data)
            .enter()
            .append('g');

        svgLine.append('path')
            .attr('d', function(d) { return linePath(d.points); })
            .style('stroke', function(d, i) { 

                if (d.color)
                    return d.color;

                return lineColors(i); 
            })
            .style('stroke-width', function(d) { 

                if (d.width)
                    return d.width;

                return lineWidth;
            })
            .style('fill', 'none')
            ;

    };

    /**
      * Renders a line from the bottom left corner to the top right corner of
      * the plot. Typically called the discrimination line and used in ROC
      * plots.
      */
    var drawDiscriminationLine = function() {

        svg.append('g')
            .append('line')
            .attr('x1', function() { return xScale.range()[0]; })
            .attr('y1', function() { return yScale.range()[0]; })
            .attr('x2', function() { return xScale.range()[1]; })
            .attr('y2', function() { return yScale.range()[1]; })
            .attr('stroke-dasharray', '5,5')
            .style('stroke', 'red')
            .style('stroke-width', 1);
    };

    /**
      * Draws a node for each data point in the plot.
      */
    var drawNodes = function() {

        for (var i = 0; i < data.length; i++) {

            var nodes = svg.selectAll('node')
                .data(data[i].points)
                .enter()
                .append('g');

            nodes.append('circle')
                .attr('cx', function(d) { return xScale(d[0]); })
                .attr('cy', function(d) { return yScale(d[1]); })
                .attr('r', function(d) {
                    if (d.radius)
                        return d.radius;

                    return nodeRadius;
                })
                .style('fill', nodeColor)
                //.style('stroke', nodeStroke)
                .style('stroke', function() { return nodeStrokes(i); })
                .style('stroke-width', nodeStrokeWidth)
                ;
        }
    };

    /**
      * Renders the title for the chart.
      */
    var drawTitle = function() {

            svg.append('text')
                .attr('x', function() {
                    if (titleX !== null)
                        return titleX;

                    return (width - margin.left) / 2;
                })
                .attr('y', function() {
                    if (titleY !== null)
                        return titleY;

                    return margin.top;
                })
                .style('font-family', 'sans-serif')
                .style('font-size', `${fontSize}px`)
                .text(title);
    };

    /** public **/

    exports.draw = function() {

        svg = select('body')
            .append('svg')
            .attr('height', height)
            .attr('width', width)
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        makeScales();
        drawLines();
        makeAxes();

        if (drawDiscrimination)
            drawDiscriminationLine();

        if (useNodes)
            drawNodes();

        if (title)
            drawTitle();
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

    exports.drawDiscrimination = function(_) {
        if (!arguments.length) return drawDiscrimination;
        drawDiscrimination = _;
        return exports;
    };

    exports.lineWidth = function(_) {
        if (!arguments.length) return lineWidth;
        lineWidth = +_;
        return exports;
    };

    exports.lineColors = function(_) {
        if (!arguments.length) return lineColors;
        lineColors = _;
        return exports;
    };

    exports.outerTicks = function(_) {
        if (!arguments.length) return outerTicks;
        outerTicks = _;
        return exports;
    };

    exports.yAxisPad = function(_) {
        if (!arguments.length) return yAxisPad;
        yAxisPad = +_;
        return exports;
    };

    exports.fontSize = function(_) {
        if (!arguments.length) return fontSize;
        fontSize = _;
        return exports;
    };

    exports.titleSize = function(_) {
        if (!arguments.length) return titleSize;
        titleSize = _;
        return exports;
    };

    exports.titleX = function(_) {
        if (!arguments.length) return titleX;
        titleX = +_;
        return exports;
    };

    exports.titleY = function(_) {
        if (!arguments.length) return titleY;
        titleY = _;
        return exports;
    };

    exports.title = function(_) {
        if (!arguments.length) return title;
        title = _;
        return exports;
    };

    exports.xLabel = function(_) {
        if (!arguments.length) return xLabel;
        xLabel = _;
        return exports;
    };

    exports.yFormat = function(_) {
        if (!arguments.length) return yFormat;
        yFormat = _;
        return exports;
    };

    exports.yLabel = function(_) {
        if (!arguments.length) return yLabel;
        yLabel = _;
        return exports;
    };

    exports.svgLabel = function(_) {
        if (!arguments.length) return svgLabel;
        svgLabel = _;
        return exports;
    };

    exports.nodeColor = function(_) {
        if (!arguments.length) return nodeColor;
        nodeColor = _;
        return exports;
    };

    exports.nodeStrokes = function(_) {
        if (!arguments.length) return nodeStrokes;
        nodeStrokes = d3.scaleOrdinal(_);
        return exports;
    };

    exports.nodeRadius = function(_) {
        if (!arguments.length) return nodeRadius;
        nodeRadius = +_;
        return exports;
    };

    exports.useNodes = function(_) {
        if (!arguments.length) return useNodes;
        useNodes = _;
        return exports;
    };

    exports.xScaleZero = function(_) {
        if (!arguments.length) return xScaleZero;
        xScaleZero = _;
        return exports;
    };

    exports.yScaleZero = function(_) {
        if (!arguments.length) return yScaleZero;
        yScaleZero = _;
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

    exports.xTickValues = function(_) {
        if (!arguments.length) return xTickValues;
        xTickValues = _;
        return exports;
    };

    exports.xTickFormat = function(_) {
        if (!arguments.length) return xTickFormat;
        xTickFormat = _;
        return exports;
    };

    exports.yTickFormat = function(_) {
        if (!arguments.length) return yTickFormat;
        yTickFormat = _;
        return exports;
    };

    exports.yTickValues = function(_) {
        if (!arguments.length) return yTickValues;
        yTickValues = _;
        return exports;
    };

    return exports;
};

