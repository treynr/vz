/**
 * file: scatter.js
 * desc: d3js implementation of scatter plots.
 */

'use strict';

import {extent} from 'd3-array';
import {axisBottom, axisLeft} from 'd3-axis';
import {scaleLinear} from 'd3-scale';
import {select} from 'd3-selection';
import {forceCollide, forceSimulation, forceX, forceY} from 'd3-force';
import {symbol} from 'd3-shape';

export default function() {

    let exports = {},

        /** private **/

            // d3 axis object for the x-axis
        xAxis = null,
        // d3 scale for the x-axis
        xScale = null,
        // d3 axis object for the y-axis
        yAxis = null,
        // d3 scale for the y-axis
        yScale = null,

        /** public **/

            // If true, positions x- and y-axis labels along the ends of each axis rather than
            // centering them outside the axis
        altAxisLabels = false,
        // Shaded background color to use when rendering the grid background
        backgroundStroke = '#cecece',
        backgroundStrokeWidth = 1,
        collisionForce = 5,
        // Data object containing objects/data to visualize
        data = null,
        // HTML element or ID the SVG should be appended to
        element = 'body',
        // Font to use when displaying text
        font = '"Helvetica neue", Helvetica, Arial, sans-serif',
        // Font size in pixels
        fontSize = 13,
        // SVG height
        height = 600,
        margin = {top: 50, right: 50, bottom: 50, left: 50},
        // Color used to fill in data points
        pointFill = '#d62333',
        // Radius of rendered points in the graph
        pointRadius = 3,
        // Color used when drawing strokes around the points
        pointStroke = '#000000',
        // Width of the stroke around points
        pointStrokeWidth = 1,
        // Render the x-domain line if true, otherwise only render ticks
        renderXDomain = true,
        // Render the y-domain line if true, otherwise only render ticks
        renderYDomain = true,
        tickSize = 6,
        // SVG object for the plot
        svg = null,
        // Draw background grid
        useBackground = false,
        useConnectedAxes = false,
        // Position points in the graph using collision forces to avoid overlap
        useForce = false,
        useMirroredXAxis = false,
        useMirroredYAxis = false,
        useOppositeTicks = false,
        useOuterXTicks = true,
        useOuterYTicks = true,
        useRegression = false,
        // SVG width
        width = 600,
        xAxisStrokeWidth = 1,
        xDomain = null,
        // Strength of the x forces used if force positioning is enabled
        xForceStrength = 0.7,
        // Text label for the x-axis
        xLabel = '',
        // Padding in pixels for the x-axis label
        xLabelPad = null,
        // Niceify the x-axis scale
        xNice = true,
        // d3 scale type to use for the x-axis
        xScaleFunction = scaleLinear,
        // Format string for x-axis ticks
        xTickFormat = null,
        // Suggestion for the number of ticks on the x-axis
        xTicks = 10,
        xTickValues = null,
        yAxisStrokeWidth = 1,
        yDomain = null,
        // Strength of the y forces used if force positioning is enabled
        yForceStrength = 0.7,
        // Text label for the y-axis
        yLabel = '',
        // Padding in pihels for the y-axis label
        yLabelPad = null,
        // Niceify the y-axis scale
        yNice = true,
        // d3 scale type to use for the y-axis
        yScaleFunction = scaleLinear,
        // Format string for y-axis ticks
        yTickFormat = null,
        // Suggestion for the number of ticks on the y-axis
        yTicks = 10,
        yTickValues = null
    ;

    /** private **/

    /**
     * Returns the width and height of the SVG while taking into account the margins.
     */
    let getHeight = function() { return height - margin.bottom - margin.top; };
    let getWidth = function() { return width - margin.left - margin.right; };

    /**
     * Creates the d3 scale objects for the x- and y-axes using the available x and y
     * domains.
     */
    let makeScales = function() {

        xDomain = xDomain ? xDomain : extent(data.values, d => d.x);
        yDomain = yDomain ? yDomain : extent(data.values, d => d.y);

        xScale = xScaleFunction()
            .domain(xDomain)
            //.range([useConnectedAxes ? yAxisPad : margin.left, getWidth()]);
            .range([margin.left, getWidth()]);

        yScale = yScaleFunction()
            .domain(yDomain)
            .range([getHeight(), 0]);

        if (xNice)
            xScale.nice();

        if (yNice)
            yScale.nice();
    };

    /**
     * Creates the d3 axis objects for x- and y-axes.
     */
    let makeAxes = function() {

        xAxis = axisBottom(xScale)
            .ticks(xTicks, xTickFormat)
            .tickSize(tickSize);
        yAxis = axisLeft(yScale)
            .ticks(yTicks, yTickFormat)
            .tickSize(tickSize);

        if (xTickValues)
            xAxis.tickValues(xTickValues);

        if (yTickValues)
            yAxis.tickValues(yTickValues);

        if (!useOuterXTicks)
            xAxis.tickSizeOuter(0);

        if (!useOuterYTicks)
            yAxis.tickSizeOuter(0);
    };

    /**
     * Renders the x- and y-axes and attaches them to the SVG.
     */
    let renderAxes = function() {

        // Set default positions for the x- and y-axis labels if necesssary
        if (xLabelPad === null && altAxisLabels)
            xLabelPad = -5;
        else if (xLabelPad === null)
            xLabelPad = 35;

        if (yLabelPad === null && altAxisLabels)
            yLabelPad = 12;
        else if (yLabelPad === null)
            yLabelPad = -35;

        let xAxisObject = svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${getHeight()})`)
            .attr('shape-rendering', 'auto')
            .attr('stroke-width', xAxisStrokeWidth)
            .call(xAxis);

        // Attach the x-axis label
        xAxisObject.append('text')
            .attr('class', 'x-axis-label')
            .attr('fill', '#000000')
            .attr('text-anchor', altAxisLabels ? 'end' : 'middle')
            .attr('x', altAxisLabels ? getWidth() : (margin.left + getWidth()) / 2)
            .attr('y', xLabelPad)
            .text(xLabel);

        // Update font styling for both ticks and the label
        xAxisObject.selectAll('text')
            .attr('font', font)
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', 'normal');

        let yAxisObject = svg.append('g')
            .attr('class', 'y-axis')
            .attr('transform', `translate(${margin.left}, 0)`)
            .attr('shape-rendering', 'auto')
            .attr('stroke-width', yAxisStrokeWidth)
            .call(yAxis);

        // Attach the y-axis label
        yAxisObject.append('text')
            .attr('class', 'y-axis-label')
            .attr('fill', '#000000')
            .attr('text-anchor', altAxisLabels ? 'end' : 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('x', altAxisLabels ? -2 : -getHeight() / 2)
            .attr('y', yLabelPad)
            .text(yLabel);

        // Update font styling for both ticks and the label
        yAxisObject.selectAll('text')
            .attr('font', font)
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', 'normal');

        // If either of these options are false, we remove the domain line and only
        // render the ticks
        if (!renderXDomain)
            xAxisObject.select('.domain').remove();

        if (!renderYDomain)
            yAxisObject.select('.domain').remove();

        if (useMirroredXAxis) {

            let x2AxisObject = svg.append('g')
                .attr('class', 'x2-axis')
                .attr('transform', `translate(0, 0)`)
                .attr('shape-rendering', 'auto')
                .attr('stroke-width', xAxisStrokeWidth)
                .call(xAxis);

            x2AxisObject.selectAll('text')
                .attr('font', font)
                .attr('font-size', fontSize)
                //.attr('font-weight', fontWeight)
                .remove();
        }

        if (useMirroredYAxis) {

            let y2AxisObject = svg.append('g')
                .attr('class', 'y2-axis')
                .attr('transform', `translate(${getWidth()}, 0)`)
                .attr('shape-rendering', 'auto')
                .attr('stroke-width', xAxisStrokeWidth)
                .call(yAxis);

            y2AxisObject.selectAll('text')
                .attr('font', font)
                .attr('font-size', fontSize)
                //.attr('font-weight', fontWeight)
                .remove();
        }

        if (useOppositeTicks) {

            yAxisObject.selectAll('.tick > line')
                .attr('transform', `translate(${tickSize}, 0)`);

            xAxisObject.selectAll('.tick > line')
                .attr('transform', `translate(0, ${-tickSize})`);
        }
    };

    /**
     * Adds a clipPath element to the plot so data points or other rendered shapes
     * don't overlap onto the axes.
     */
    let renderClipping = function() {

        svg.append('clipPath')
            .attr('id', 'clipping-area')
            .attr('class', 'clipping')
            .append('rect')
            .attr('x', margin.left)
            //.attr('x', useConnectedAxes ? yAxisPad : margin.left)
            .attr('y', 0)
            .attr('height', getHeight())
            .attr('width', getWidth() - margin.right);
    };

    /**
     * Renders each data point on the scatter plot.
     */
    let renderPoints = function() {

        // Apply clipping area to the rendered points
        let pointGroups = svg.append('g')
            .attr('class', 'points')
            .attr('clip-path', 'url(#clipping-area)')
            .selectAll('point')
            .data(data.values)
            .enter()
            .append('g')
            .attr('class', 'point');

        // This will render data points as circles. The user could render these points
        // as symbols, so we filter out any potential symbol points.
        let circles = pointGroups.filter(d => !d.symbol)
            .append('circle')
            .attr('cx', d => useForce ? d.x : xScale(d.x))
            .attr('cy', d => useForce ? d.y : yScale(d.y))
            .attr('r', d => d.radius ? d.radius : pointRadius);

        // In this case, symbols are used for points instead
        let symbols = pointGroups.filter(d => d.symbol)
            .append('path')
            .attr('x', d => xScale(d.x))
            .attr('y', d => yScale(d.y))
            .attr('d', symbol()
                .type(d => d.symbol)
                .size(d => d.radius ? d.radius * 20 : pointRadius * 20)
            );

        // Styling
        circles.attr('fill', d => d.fill ? d.fill : pointFill)
            .attr('stroke', d => d.stroke ? d.stroke : pointStroke)
            .attr(
                'stroke-width',
                d => d.strokeWidth ? d.strokeWidth : pointStrokeWidth
            )
            .attr('shape-rendering', 'auto');

        // Tooltip when hovering over a datapoint
        circles.append('title').text(d => d.label ? d.label : '');

        symbols.attr('fill', d => d.fill ? d.fill : pointFill)
            .attr('stroke', d => d.stroke ? d.stroke : pointStroke)
            .attr(
                'stroke-width',
                d => d.strokeWidth ? d.strokeWidth : pointStrokeWidth
            )
            .attr('shape-rendering', 'auto');

        // Tooltip when hovering over a datapoint
        symbols.append('title').text(d => d.label ? d.label : '');

    };

    let renderBackgroundGrid = function() {

        // Tick values. We remove the first ones since these overlap with the axes.
        let xticks = xScale.ticks().slice(1);
        let yticks = yScale.ticks().slice(1);

        svg.append('g')
            .attr('clip-path', 'url(#clipping-area)')
            .selectAll('background')
            .data(xticks)
            .enter()
            .append('line')
            .attr('x1', d => xScale(d))
            .attr('y1', 0)
            .attr('x2', d => xScale(d))
            .attr('y2', getHeight())
            .attr('shape-rendering', 'crispEdges')
            .attr('stroke', backgroundStroke)
            .attr('stroke-width', backgroundStrokeWidth);

        svg.append('g')
            .attr('clip-path', 'url(#clipping-area)')
            .selectAll('background')
            .data(yticks)
            .enter()
            .append('line')
            .attr('x1', 0)
            .attr('y1', d => yScale(d))
            .attr('x2', getWidth())
            .attr('y2', d => yScale(d))
            .attr('shape-rendering', 'crispEdges')
            .attr('stroke', backgroundStroke)
            .attr('stroke-width', backgroundStrokeWidth);
    };

    let positionWithForce = function() {

        let simulation = forceSimulation(data.values)
            .force('x', forceX(d => xScale(d.x)).strength(xForceStrength))
            .force('y', forceY(d => yScale(d.y)).strength(yForceStrength))
            .force('collide',
                forceCollide(collisionForce)
                    .radius(d => d.radius ? d.radius : pointRadius)
            )
            .stop();

        for (let i = 0; i < 250; i++)
            simulation.tick();
    };

    /** public **/

    exports.getHeight = getHeight;
    exports.getWidth = getWidth;

    exports.draw = function() {

        console.log(data);
        svg = select(element)
            .append('svg')
            .attr('height', height)
            .attr('width', width)
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        makeScales();
        makeAxes();

        renderClipping();

        if (useBackground)
            renderBackgroundGrid();

        if (useForce)
            positionWithForce();

        renderPoints();
        renderAxes();

        return exports;
    };

    /** setters/getters **/

    exports.svg = function() { return svg; };

    exports.altAxisLabels = function(_) {
        if (!arguments.length) return altAxisLabels;
        altAxisLabels = _;
        return exports;
    };

    exports.backgroundStroke = function(_) {
        if (!arguments.length) return backgroundStroke;
        backgroundStroke = _;
        return exports;
    };

    exports.backgroundStrokeWidth = function(_) {
        if (!arguments.length) return backgroundStrokeWidth;
        backgroundStrokeWidth = +_;
        return exports;
    };

    exports.data = function(_) {
        if (!arguments.length) return data;
        data = _;
        return exports;
    };

    exports.collisionForce = function(_) {
        if (!arguments.length) return collisionForce;
        collisionForce = +_;
        return exports;
    };

    exports.element = function(_) {
        if (!arguments.length) return element;
        element = _;
        return exports;
    };

    exports.font = function(_) {
        if (!arguments.length) return font;
        font = _;
        return exports;
    };

    exports.fontSize = function(_) {
        if (!arguments.length) return fontSize;
        fontSize = +_;
        return exports;
    };

    exports.height = function(_) {
        if (!arguments.length) return height;
        height = +_;
        return exports;
    };

    exports.margin = function(_) {
        if (!arguments.length) return margin;
        margin = _;
        return exports;
    };

    exports.marginBottom = function(_) {
        if (!arguments.length) return margin.bottom;
        margin.bottom = +_;
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

    exports.marginTop = function(_) {
        if (!arguments.length) return margin.top;
        margin.top = +_;
        return exports;
    };

    exports.pointFill = function(_) {
        if (!arguments.length) return pointFill;
        pointFill = _;
        return exports;
    };

    exports.pointRadius = function(_) {
        if (!arguments.length) return pointRadius;
        pointRadius = +_;
        return exports;
    };

    exports.pointStroke = function(_) {
        if (!arguments.length) return pointStroke;
        pointStroke = _;
        return exports;
    };

    exports.pointStrokeWidth = function(_) {
        if (!arguments.length) return pointStrokeWidth;
        pointStrokeWidth = +_;
        return exports;
    };

    exports.tickSize = function(_) {
        if (!arguments.length) return tickSize;
        tickSize = +_;
        return exports;
    };

    exports.useBackground = function(_) {
        if (!arguments.length) return useBackground;
        useBackground = _;
        return exports;
    };

    exports.useConnectedAxes = function(_) {
        if (!arguments.length) return useConnectedAxes;
        useConnectedAxes = _;
        return exports;
    };

    exports.useForce = function(_) {
        if (!arguments.length) return useForce;
        useForce = _;
        return exports;
    };

    exports.useMirroredXAxis = function(_) {
        if (!arguments.length) return useMirroredXAxis;
        useMirroredXAxis = _;
        return exports;
    };

    exports.useMirroredYAxis = function(_) {
        if (!arguments.length) return useMirroredYAxis;
        useMirroredYAxis = _;
        return exports;
    };

    exports.useOuterXTicks = function(_) {
        if (!arguments.length) return useOuterXTicks;
        useOuterXTicks = _;
        return exports;
    };

    exports.useOppositeTicks = function(_) {
        if (!arguments.length) return useOppositeTicks;
        useOppositeTicks = _;
        return exports;
    };

    exports.useOuterYTicks = function(_) {
        if (!arguments.length) return useOuterYTicks;
        useOuterYTicks = _;
        return exports;
    };

    exports.useRegression = function(_) {
        if (!arguments.length) return useRegression;
        useRegression = _;
        return exports;
    };

    exports.width = function(_) {
        if (!arguments.length) return width;
        width = +_;
        return exports;
    };

    exports.xAxisStrokeWidth = function(_) {
        if (!arguments.length) return xAxisStrokeWidth;
        xAxisStrokeWidth = +_;
        return exports;
    };

    exports.xDomain = function(_) {
        if (!arguments.length) return xDomain;
        xDomain = _;
        return exports;
    };

    exports.xForceStrength = function(_) {
        if (!arguments.length) return xForceStrength;
        xForceStrength = +_;
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

    exports.xNice = function(_) {
        if (!arguments.length) return xNice;
        xNice = _;
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
        xTicks = +_;
        return exports;
    };

    exports.xTickValues = function(_) {
        if (!arguments.length) return xTickValues;
        xTickValues = _;
        return exports;
    };

    exports.yAxisStrokeWidth = function(_) {
        if (!arguments.length) return yAxisStrokeWidth;
        yAxisStrokeWidth = +_;
        return exports;
    };

    exports.yDomain = function(_) {
        if (!arguments.length) return yDomain;
        yDomain = _;
        return exports;
    };

    exports.yForceStrength = function(_) {
        if (!arguments.length) return yForceStrength;
        yForceStrength = +_;
        return exports;
    };

    exports.yLabel = function(_) {
        if (!arguments.length) return yLabel;
        yLabel = _;
        return exports;
    };

    exports.yLabelPad = function(_) {
        if (!arguments.length) return yLabelPad;
        yLabelPad = +_;
        return exports;
    };

    exports.yNice = function(_) {
        if (!arguments.length) return yNice;
        yNice = _;
        return exports;
    };

    exports.yScaleFunction = function(_) {
        if (!arguments.length) return yScaleFunction;
        yScaleFunction = _;
        return exports;
    };

    exports.yTickFormat = function(_) {
        if (!arguments.length) return yTickFormat;
        yTickFormat = _;
        return exports;
    };

    exports.yTicks = function(_) {
        if (!arguments.length) return yTicks;
        yTicks = +_;
        return exports;
    };

    exports.yTickValues = function(_) {
        if (!arguments.length) return yTickValues;
        yTickValues = _;
        return exports;
    };

    // Enables testing for private methods
    if (process.env.NODE_ENV == 'development') {

        exports.makeScales = makeScales;
        exports.makeAxes = makeAxes;
        exports.renderAxes = renderAxes;
        exports.renderBackgroundGrid = renderBackgroundGrid;
        exports.renderPoints = renderPoints;
        exports.xAxis = () => xAxis;
        exports.xScale = () => xScale;
        exports.yScale = () => yScale;
        exports.yAxis = () => yAxis;

        exports.svg = function(_) {
            if (!arguments.length) return svg;
            svg = _;
            return exports;
        };
    }

    return exports;
}

