/**
  * file: line.js
  * desc: d3js 4.0 implementation of line charts.
  * auth: TR
  */

import {extent} from 'd3-array';
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
        // Axis text size
        fontSize = 13,
        // Margin object
        margin = {top: 10, right: 30, bottom: 50, left: 50},
        // Line width
        lineWidth = 2,
        // Draw the line of no discrimination (for ROC curves)
        drawDiscrimination = false,
        keepAxisRotation = false,
        curveAlpha = 0.5,
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
        // Boolean to draw or hide the outer x-axis ticks
        outerTicks = false,
        useClipping = false,
        // Draws nodes at each X-axis point if true
        useNodes = false,
        // Render ticks on the opposite side of the axis line
        useOppositeTicks = false,
        useConnectedAxes = false,
        // Graph title
        title = '',
        // Width of each tick mark
        tickSize = 5,
        // Stroke width for the x-axis
        xAxisStrokeWidth = 1,
        // X-axis text
        xLabel = '',
        // X position of the x-axis label
        xLabelPad = null,
        xLabeldx = null,
        xLabeldy = null,
        // Scale for the x-axis
        xScale = null,
        // Number of x-axis ticks
        xTicks = 10,
        // Stroke width for the y-axis
        yAxisStrokeWidth = 1,
        // Y-axis text
        yLabel = '',
        // Y position of the x-axis label
        yLabelPad = null,
        yLabeldx = null,
        yLabeldy = null,
        // Y-axis padding
        yAxisPad = 35,
        // Scale for the y-axis
        yScale = null,
        // Number of y-axis ticks
        yTicks = 10,
        // Format string for x-axis labels
        xTickFormat = null,
        yDomain = null,
        xDomain = null,
        xTickValues = null,
        xScaleFunction = scaleLinear,
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
                return ac.concat(d.points.map(p => p.x));
            }, []));

        if (!yDomain)
            yDomain = extent(data.reduce((ac, d) => {
                return ac.concat(d.points.map(p => p.y));
            }, []));

        xScale = xScaleFunction()
            .domain(xDomain)
            .nice()
            .range([useConnectedAxes ? yAxisPad : margin.left, getWidth()]);
            //.range([yAxisPad, getWidth()]);

        yScale = scaleLinear()
            .domain(yDomain)
            .nice()
            .range([getHeight(), 0]);
    };

    /**
      * Generates and renders the X and Y axes for the plot.
      */
    var makeAxes = function() {

        let xAxis = axisBottom(xScale)
            .ticks(xTicks, xTickFormat)
            .tickSize(tickSize)
            .tickSizeOuter(useOppositeTicks ? 0 : tickSize);

        let yAxis = axisLeft(yScale)
            .ticks(yTicks, yTickFormat)
            .tickSize(tickSize)
            .tickSizeOuter(useOppositeTicks ? 0 : tickSize);

        let xAxisObject = svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${getHeight()})`)
            .attr('font-family', 'sans-serif')
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', 'normal')
            .attr('fill', 'none')
            .attr('stroke-width', xAxisStrokeWidth)
            .call(xAxis);

        xAxisObject.append('text')
            .attr('class', 'x-axis-label')
            .attr('fill', '#000')
            .attr('font-family', 'sans-serif')
            .attr('font-size', `${fontSize}px`)
            .attr('dx', () => {
                if (xLabeldx)
                    return xLabeldx;

                return altAxisLabels ? getWidth() : (margin.left + getWidth()) / 2;
            })
            .attr('dy', () => {
                if (xLabeldy)
                    return xLabeldy;

                return altAxisLabels ? -5 : 45;
            })
            .attr('text-anchor', altAxisLabels ? 'end' : 'middle')
            .text(xLabel);

        xAxisObject.selectAll('text')
            .attr('font-family', 'sans-serif')
            .attr('font-size', `${fontSize}px`);

        let yAxisObject = svg.append('g')
            .attr('class', 'y-axis')
            .attr('transform', `translate(${yAxisPad}, 0)`)
            .attr('font-family', 'sans-serif')
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', 'normal')
            .attr('fill', 'none')
            .attr('stroke-width', yAxisStrokeWidth)
            .call(yAxis);

        yAxisObject.append('text')
            .attr('class', 'y-axis-label')
            .attr('fill', '#000')
            .attr('dx', () => {
                if (yLabeldx)
                    return yLabeldx;

                return altAxisLabels ? 5 : -getHeight() / 2;
            })
            .attr('dy', () => {
                if (yLabeldy)
                    return yLabeldy;

                return altAxisLabels ? 5 : -50;
            })
            .attr('text-anchor', () => {
                return altAxisLabels ? 'start' : 'middle'
            })
            .attr('transform', () => {

                if (altAxisLabels && keepAxisRotation)
                    return 'rotate(-90)';

                else if (altAxisLabels)
                    return '';

                return 'rotate(-90)';
            })
            .text(yLabel);

        yAxisObject.selectAll('text')
            .attr('font-family', 'sans-serif')
            .attr('font-size', `${fontSize}px`);

        if (useOppositeTicks) {

            yAxisObject.selectAll('.tick > line')
                .attr('transform', `translate(${tickSize}, 0)`);

            xAxisObject.selectAll('.tick > line')
                .attr('transform', `translate(0, ${-tickSize})`);
        }
    };

    let renderClipping = function() {

        svg.append('clipPath')
            .attr('id', 'clipping-area')
            .attr('class', 'clipping')
            .append('rect')
            .attr('x', useConnectedAxes ? yAxisPad : margin.left)
            .attr('y', 0)
            .attr('height', getHeight())
            .attr('width', getWidth() - margin.right);
    };

    /**
      * Renders the lines for the plot.
      */
    var drawLines = function() {

        var linePath = line()
            //.curve(curveCatmullRom.alpha(curveAlpha))
            //.x(function(d) { return xScale(d[0]); })
            //.y(function(d) { return yScale(d[1]); });
            .x(function(d) { return xScale(d.x); })
            .y(function(d) { return yScale(d.y); })
            .curve(curveCatmullRom.alpha(1));

        var svgLine = svg.selectAll('aline')
            .data(data)
            .enter()
            .append('g');

        svgLine.append('path')
            .attr('class', (d, i) => {
                if (d.id)
                    return `${d.id}-line-path`;

                return `${i}-line-path`;
            })
            .attr('clip-path', useClipping ? 'url(#clipping-area)' : '')
            .attr('d', function(d) { return linePath(d.points); })
            .attr('stroke', function(d, i) {

                if (d.stroke)
                    return d.stroke;

                return lineColors(i);
            })
            .attr('stroke-width', function(d) {

                if (d.width)
                    return d.width;

                return lineWidth;
            })
            .attr('fill', 'none');

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
            .attr('stroke', 'red')
            .attr('stroke-width', 1);
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
                .attr('clip-path', useClipping ? 'url(#clipping-area)' : '')
                .attr('cx', d => xScale(d.x))
                .attr('cy', d => yScale(d.y))
                .attr('r', function(d) {
                    if (d.radius)
                        return d.radius;

                    return nodeRadius;
                })
                .attr('fill', () => {

                    if (data[i].nodeFill)
                        return data[i].nodeFill;

                    if (data[i].stroke)
                        return data[i].stroke;

                    return lineColors(i);
                })
                .attr('stroke', () => {

                    if (data[i].nodeStroke)
                        return data[i].nodeStroke;

                    if (data[i].stroke)
                        return data[i].stroke;

                    return nodeStrokes(i);
                })
                .attr('stroke-width', nodeStrokeWidth);
        }
    };

    /**
      * Renders the title for the chart.
      */
    var drawTitle = function() {

        svg.append('text')
            .attr('x', function() {
                if (xLabelPad !== null)
                    return xLabelPad;

                return (width - margin.left) / 2;
            })
            .attr('y', function() {
                if (xLabelPad !== null)
                    return xLabelPad;

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
        renderClipping();
        drawLines();

        if (useNodes)
            drawNodes();

        makeAxes();

        if (drawDiscrimination)
            drawDiscriminationLine();

        if (title)
            drawTitle();

        return exports;
    };

    /** setters/getters **/

    exports.svg = function(_) { return svg; };

    exports.data = function(_) {
        if (!arguments.length) return data;
        data = _;
        return exports;
    };

    exports.altAxisLabels = function(_) {
        if (!arguments.length) return altAxisLabels;
        altAxisLabels = _;
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

    exports.curveAlpha = function(_) {
        if (!arguments.length) return curveAlpha;
        curveAlpha = +_;
        return exports;
    };

    exports.drawDiscrimination = function(_) {
        if (!arguments.length) return drawDiscrimination;
        drawDiscrimination = _;
        return exports;
    };

    exports.keepAxisRotation = function(_) {
        if (!arguments.length) return keepAxisRotation;
        keepAxisRotation = _;
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

    exports.fontSize = function(_) {
        if (!arguments.length) return fontSize;
        fontSize = _;
        return exports;
    };

    exports.title = function(_) {
        if (!arguments.length) return title;
        title = _;
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
        nodeStrokes = scaleOrdinal(_);
        return exports;
    };

    exports.nodeStrokeWidth = function(_) {
        if (!arguments.length) return nodeStrokeWidth;
        nodeStrokeWidth = _;
        return exports;
    };

    exports.nodeRadius = function(_) {
        if (!arguments.length) return nodeRadius;
        nodeRadius = +_;
        return exports;
    };

    exports.tickSize = function(_) {
        if (!arguments.length) return tickSize;
        tickSize = +_;
        return exports;
    };

    exports.useConnectedAxes = function(_) {
        if (!arguments.length) return useConnectedAxes;
        useConnectedAxes = _;
        return exports;
    };

    exports.useOppositeTicks = function(_) {
        if (!arguments.length) return useOppositeTicks;
        useOppositeTicks = _;
        return exports;
    };

    exports.useClipping = function(_) {
        if (!arguments.length) return useClipping;
        useClipping = _;
        return exports;
    };

    exports.useNodes = function(_) {
        if (!arguments.length) return useNodes;
        useNodes = _;
        return exports;
    };

    exports.xAxisStrokeWidth = function(_) {
        if (!arguments.length) return xAxisStrokeWidth;
        xAxisStrokeWidth = _;
        return exports;
    };

    exports.xDomain = function(_) {
        if (!arguments.length) return xDomain;
        xDomain = _;
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

    exports.xLabeldy = function(_) {
        if (!arguments.length) return xLabeldy;
        xLabeldy = +_;
        return exports;
    };

    exports.xLabeldx = function(_) {
        if (!arguments.length) return xLabeldx;
        xLabeldx = +_;
        return exports;
    };

    exports.xScaleFunction = function(_) {
        if (!arguments.length) return xScaleFunction;
        xScaleFunction = _;
        return exports;
    };

    exports.xTickFormat = function(_) {
        if (!arguments.length) return xTickFormat;
        xTickFormat = _;
        return exports;
    };

    exports.xTicks = function(_) {
        if (!arguments.length) return xTicks;
        xTicks = _;
        return exports;
    };

    exports.xTickValues = function(_) {
        if (!arguments.length) return xTickValues;
        xTickValues = _;
        return exports;
    };

    exports.yAxisPad = function(_) {
        if (!arguments.length) return yAxisPad;
        yAxisPad = +_;
        return exports;
    };

    exports.yAxisStrokeWidth = function(_) {
        if (!arguments.length) return yAxisStrokeWidth;
        yAxisStrokeWidth = _;
        return exports;
    };

    exports.yDomain = function(_) {
        if (!arguments.length) return yDomain;
        yDomain = _;
        return exports;
    };

    exports.yLabel = function(_) {
        if (!arguments.length) return yLabel;
        yLabel = _;
        return exports;
    };

    exports.yLabeldy = function(_) {
        if (!arguments.length) return yLabeldy;
        yLabeldy = +_;
        return exports;
    };

    exports.yLabeldx = function(_) {
        if (!arguments.length) return yLabeldx;
        yLabeldx = +_;
        return exports;
    };

    exports.yLabelPad = function(_) {
        if (!arguments.length) return yLabelPad;
        yLabelPad = +_;
        return exports;
    };

    exports.yTickFormat = function(_) {
        if (!arguments.length) return yTickFormat;
        yTickFormat = _;
        return exports;
    };

    exports.yTicks = function(_) {
        if (!arguments.length) return yTicks;
        yTicks = _;
        return exports;
    };

    exports.yTickValues = function(_) {
        if (!arguments.length) return yTickValues;
        yTickValues = _;
        return exports;
    };

    return exports;
}

