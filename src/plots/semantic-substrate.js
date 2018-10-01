/**
  * file: semantic-substrate.js
  * desc: d3js implementation of semantic substrate (2D graph scatter) plots.
  * auth: TR
  *
  * TODO: Consider a reimplementation of node and edge positioning using d3-force.
  */

'use strict';

import {extent} from 'd3-array';
import {axisBottom, axisLeft} from 'd3-axis';
import {scaleLinear} from 'd3-scale';
import {select, selectAll} from 'd3-selection';

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
        // d3 scale for values associated with each node
        //valueScale = null,

        /** public **/

        // If true, positions x- and y-axis labels along the ends of each axis rather than
        // centering them outside the axis
        altAxisLabels = false,
        // Data object containing objects/data to visualize
        data = null,
        // Transparency for rendered edges
        edgeOpacity = 0.6,
        // Edge color
        edgeStroke = '#999999',
        // Edge width
        edgeStrokeWidth = 2,
        // HTML element or ID the SVG should be appended to
        element = 'body',
        // Font to use when displaying text
        font = 'sans-serif',
        // Font size in pixels
        fontSize = 12,
        // SVG height
        height = 600,
        margin = {top: 50, right: 50, bottom: 50, left: 50},
        // Color used to fill in nodes
        nodeFill = '#d62333',
        // Radius of rendered nodes in the graph
        nodeRadius = 4,
        // Color used when drawing strokes around the nodes
        nodeStroke = '#ffffff',
        // Width of the stroke around nodes
        nodeStrokeWidth = 2,
        // SVG object for the plot
        svg = null,
        // SVG width
        width = 600,
        xDomain = null,
        // Text label for the x-axis
        xLabel = '',
        // Padding in pixels for the x-axis label, if set to null then
        // semi-sensible default values are used instead
        xLabelPad = null,
        // d3 scale type to use for the x-axis
        xScaleFunction = scaleLinear,
        // Format string for x-axis ticks
        xTickFormat = null,
        // Suggestion for the number of ticks on the x-axis
        xTicks = 5,
        yDomain = null,
        // Text label for the y-axis
        yLabel = '',
        // Padding in pihels for the y-axis label, if set to null then
        // semi-sensible default values are used instead
        yLabelPad = null,
        // d3 scale type to use for the y-axis
        yScaleFunction = scaleLinear,
        // Format string for y-axis ticks
        yTickFormat = null,
        // Suggestion for the number of ticks on the y-axis
        yTicks = 5
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

        xDomain = xDomain ? xDomain : extent(data.nodes, d => d.x);
        yDomain = yDomain ? yDomain : extent(data.nodes, d => d.y);

        xScale = xScaleFunction()
            .domain(xDomain)
            .nice()
            .range([margin.left, getWidth()]);

        yScale = yScaleFunction()
            .domain(yDomain)
            .nice()
            .range([getHeight(), 0]);
    };

    /**
      * Creates the d3 axis objects for x- and y-axes.
      */
    let makeAxes = function() {

        xAxis = axisBottom(xScale).ticks(xTicks, xTickFormat);
        yAxis = axisLeft(yScale).ticks(yTicks, yTickFormat);
    };

    /**
      * Renders the x- and y-axes and attaches them to the SVG.
      */
    let renderAxes = function() {

        let xAxisObject = svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${getHeight()})`)
            //.attr('font', font)
            //.attr('font-size', `${fontSize}px`)
            //.attr('font-weight', 'normal')
            .call(xAxis);

        xAxisObject.selectAll('text')
            .attr('font', font)
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', 'normal');

        // Attach the x-axis label
        xAxisObject.append('text')
            .attr('class', 'x-axis-label')
            .attr('fill', '#000000')
            .attr('text-anchor', altAxisLabels ? 'end' : 'middle')
            //.attr('transform', `translate(0, ${xLabelPad})`)
            .attr('x', altAxisLabels ? getWidth() : (margin.left + getWidth()) / 2)
            //.attr('y', altAxisLabels ? -5 : 45)
            .attr('y', () => {
                // My weak ass attempt at providing sane defaults for the label position
                if (xLabelPad !== null)
                    return xLabelPad;

                return altAxisLabels ? -5 : 50;
            })
            .text(xLabel);

        let yAxisObject = svg.append('g')
            .attr('class', 'y-axis')
            .attr('transform', `translate(${margin.left}, 0)`)
            //.attr('font', font)
            //.attr('font-size', `${fontSize}px`)
            //.attr('font-weight', 'normal')
            .call(yAxis);

        yAxisObject.selectAll('text')
            .attr('font', font)
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', 'normal');

        // Attach the y-axis label
        yAxisObject.append('text')
            .attr('class', 'y-axis-label')
            .attr('fill', '#000000')
            .attr('text-anchor', altAxisLabels ? 'start' : 'middle')
            .attr('transform', altAxisLabels ? '' : 'rotate(-90)')
            .attr('x', altAxisLabels ? 5 : -getHeight() / 2)
            .attr('y', () => {
                if (yLabelPad !== null)
                    return yLabelPad;

                return altAxisLabels ? 0 : -40;
            })
            .text(yLabel);
    };

    /**
      * Renders each node in the graph and attaches the objects to the SVG.
      */
    let renderNodes = function() {

        let nodes = svg.append('g')
            .attr('class', 'nodes')
            .selectAll('nodestuff')
            .data(data.nodes)
            .enter()
            .append('g')
            .attr('class', 'node');

        nodes.append('circle')
            .attr('cx', d => xScale(d.x))
            .attr('cy', d => yScale(d.y))
            .attr('r', d => {

                if (d.radius)
                    return d.radius;

                return nodeRadius;
            })
            .attr('fill', d => {

                if (d.fill)
                    return d.fill;

                return nodeFill;
            })
            .attr('shape-rendering', 'auto')
            .attr('stroke', d => {

                if (d.stroke)
                    return d.stroke;

                return nodeStroke;
            })
            .attr('stroke-width', d => {

                if (d.strokeWidth)
                    return d.strokeWidth;

                return nodeStrokeWidth;
            });
    };

    let renderEdges = function() {

        // We have to generate a list of points for each line based on the x, y
        // coordinates of the node SVG elements. Should think about redoing this using
        // d3-force.
        let nodePositions = {};

        //selectAll('.node > circle').each(function(d) {
        //selectAll('.node').each(function(d) {
        data.nodes.forEach(d => {

            //let node = select(this);

            //nodePositions[d.id] = {x: node.attr('cx'), y: node.attr('cy')};
            nodePositions[d.id] = {x: d.x, y: d.y};
        });

        let edges = svg.append('g')
            .attr('class', 'edges')
            .selectAll('edgestuff')
            .data(data.edges)
            .enter()
            .append('g')
            .attr('class', 'edge');

        edges.append('line')
            .attr('x1', d => xScale(nodePositions[d.source].x))
            .attr('y1', d => yScale(nodePositions[d.source].y))
            .attr('x2', d => xScale(nodePositions[d.target].x))
            .attr('y2', d => yScale(nodePositions[d.target].y))
            .attr('fill', 'none')
            .attr('opacity', d => {

                if (d.opacity)
                    return d.opacity;

                return edgeOpacity;
            })
            .attr('stroke', d => {

                if (d.stroke)
                    return d.stroke;

                return edgeStroke;
            })
            .attr('stroke-width', d => {

                if (d.strokeWidth)
                    return d.strokeWidth;

                return edgeStrokeWidth;
            });
    };

    exports.draw = function() {

        svg = select(element)
            .append('svg')
            .attr('height', height)
            .attr('width', width)
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        makeScales();
        makeAxes();
        renderAxes();
        renderEdges();
        renderNodes();
    };

    /** setters/getters **/

    exports.svg = function() { return svg; };

    exports.altAxisLabels = function(_) { 
        if (!arguments.length) return altAxisLabels;
        altAxisLabels = _;
        return exports;
    };

    exports.data = function(_) { 
        if (!arguments.length) return data;
        data = _;
        return exports;
    };

    exports.edgeOpacity = function(_) { 
        if (!arguments.length) return edgeOpacity;
        edgeOpacity = +_;
        return exports;
    };

    exports.edgeStroke = function(_) { 
        if (!arguments.length) return edgeStroke;
        edgeStroke = _;
        return exports;
    };

    exports.edgeStrokeWidth = function(_) { 
        if (!arguments.length) return edgeStrokeWidth;
        edgeStrokeWidth = +_;
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

    exports.width = function(_) { 
        if (!arguments.length) return width;
        width = +_;
        return exports;
    };

    exports.nodeFill = function(_) { 
        if (!arguments.length) return nodeFill;
        nodeFill = _;
        return exports;
    };

    exports.nodeRadius = function(_) { 
        if (!arguments.length) return nodeRadius;
        nodeRadius = +_;
        return exports;
    };

    exports.nodeStroke = function(_) { 
        if (!arguments.length) return nodeStroke;
        nodeStroke = _;
        return exports;
    };

    exports.nodeStrokeWidth = function(_) { 
        if (!arguments.length) return nodeStrokeWidth;
        nodeStrokeWidth = +_;
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

    exports.yLabelPad = function(_) { 
        if (!arguments.length) return yLabelPad;
        yLabelPad = +_;
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

    // Enables testing for private methods
    if (process.env.NODE_ENV == 'development') {

        exports.makeScales = makeScales;
        exports.makeAxes = makeAxes;
        exports.renderAxes = renderAxes;
        exports.renderNodes = renderNodes;
        exports.renderEdges = renderEdges;
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
