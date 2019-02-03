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
import {select} from 'd3-selection';
import {forceCollide, forceSimulation, forceX, forceY} from 'd3-force';

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
        // Shaded background color to use when rendering the grid background
        backgroundColor = '#cecece',
        collisionForce = 5,
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
        // Remove nodes that don't have edges to other nodes
        removeLoners = true,
        // SVG object for the plot
        svg = null,
        // Position nodes in the graph using collision forces to avoid node overlap
        useForce = false,
        // SVG width
        width = 600,
        xDomain = null,
        // Strength of the x forces used if force positioning is enabled
        xForceStrength = 1.0,
        // Text label for the x-axis
        xLabel = '',
        // Padding in pixels for the x-axis label, if set to null then
        // semi-sensible default values are used instead
        xLabelPad = null,
        // Niceify the x-axis scale
        xNice = true,
        // d3 scale type to use for the x-axis
        xScaleFunction = scaleLinear,
        // Format string for x-axis ticks
        xTickFormat = null,
        // Suggestion for the number of ticks on the x-axis
        xTicks = 5,
        xTickValues = null,
        yDomain = null,
        // Strength of the y forces used if force positioning is enabled
        yForceStrength = 1.0,
        // Text label for the y-axis
        yLabel = '',
        // Padding in pihels for the y-axis label, if set to null then
        // semi-sensible default values are used instead
        yLabelPad = null,
        // Niceify the y-axis scale
        yNice = true,
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

        xAxis = axisBottom(xScale).ticks(xTicks, xTickFormat);
        yAxis = axisLeft(yScale).ticks(yTicks, yTickFormat);

        if (xTickValues)
            xAxis.tickValues(xTickValues);
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

        xAxisObject.selectAll('text')
            .attr('font', font)
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', 'normal');

        let yAxisObject = svg.append('g')
            .attr('class', 'y-axis')
            .attr('transform', `translate(${margin.left}, 0)`)
            //.attr('font', font)
            //.attr('font-size', `${fontSize}px`)
            //.attr('font-weight', 'normal')
            .call(yAxis);

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

        yAxisObject.selectAll('text')
            .attr('font', font)
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', 'normal');
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
            .attr('class', 'node')
            .attr('id', d => `node-${d.id}`)
            ;

        nodes.append('circle')
            .attr('cx', d => d.cx !== undefined ? d.cx : xScale(d.x))
            .attr('cy', d => d.cy !== undefined ? d.cy : yScale(d.y))
            //.attr('cy', d => yScale(d.y))
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

        nodes.append('title')
            .text(d => {

                if (d.label)
                    return d.label;

                return '';
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
            if (d.cx !== undefined && d.cy !== undefined) {
                nodePositions[d.id] = {x: d.cx, y: d.cy};
            } else {
                nodePositions[d.id] = {x: xScale(d.x), y: yScale(d.y)};
            }
        });

        let edges = svg.append('g')
            .attr('class', 'edges')
            .selectAll('edgestuff')
            .data(data.edges)
            .enter()
            .append('g')
            .attr('class', 'edge');

        edges.append('line')
            .attr('x1', d => nodePositions[d.source].x)
            .attr('y1', d => nodePositions[d.source].y)
            .attr('x2', d => nodePositions[d.target].x)
            .attr('y2', d => nodePositions[d.target].y)
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

    let positionWithForce = function() {

        let simulation = forceSimulation(data.nodes)
            .force('x', forceX(d => xScale(d.x)).strength(xForceStrength))
            .force('y', forceY(d => yScale(d.y)).strength(yForceStrength))
            .force('collide', forceCollide(collisionForce))
            .stop();

        for (let i = 0; i < 120; i++)
            simulation.tick();

        for (let node of data.nodes) {

            node.cx = node.x;
            node.cy = node.y;
        }
    };

    let renderGrid = function() {

        // This is a shitty hack but we need to determine if the y-scale continues in
        // rounded increments (e.g. 1, 2, 3, ...) or if it's being displayed in steps 
        // (e.g. 2, 4, 6, ...). If it's the former, simply calling ticks() will cause an
        // incorrect number of grid lines to be drawn. But, we have to render the grid
        // first otherwise it will overlap the axis and any labels. So we render the
        // axis, get the ticks, then remove the axis. 
        renderAxes();

        let values = svg.selectAll('.y-axis > .tick > text')
            .nodes()
            .map(d => d.innerHTML);
        let ticks = [];

        svg.selectAll('.y-axis').remove();
        svg.selectAll('.x-axis').remove();

        if (values.length >= 2 && parseInt(values[1]) - parseInt(values[0]) == 1)
            ticks = yScale.ticks(yTicks);
        else
            ticks = yScale.ticks();

        for (let i = 0; i < ticks.length; i++) {

            let yt = yScale(ticks[i]);
            let yt1 = 0;
            let x1 = xScale.range()[0] + 1;
            let x2 = xScale.range()[1];
            let y1 = 0;
            let y2 = 0;

            if (i == 0) {

                yt1 = yScale(ticks[i + 1]);
                y1 = yt + ((yt1 - yt) / 2);
                y2 = yt;

            } else if (i == ticks.length - 1) {
                
                yt1 = yScale(ticks[i - 1]);
                y1 = yt - ((yt - yt1) / 2);
                y2 = yt;

            } else {

                yt1 = yScale(ticks[i - 1]);
                y1 = yt + ((yt - yt1) / 2);
                y2 = yt - ((yt - yt1) / 2);
            }

            svg.append('path')
                .attr('class', `background-${i}`)
                .attr('d', () => {

                    return `M ${x1}, ${y1} ` +
                           `L ${x2}, ${y1} ` +
                           `L ${x2}, ${y2} ` +
                           `L ${x1}, ${y2} ` +
                           `L ${x1}, ${y1} `;
                })
                .attr('stroke', 'none')
                .attr('fill', i % 2 ? '#fff': backgroundColor);
        }
    };

    /**
      * Performs data integrity checks. This function ensures node and edge objects have
      * the required fields. In cases of invalid or missing attributes, those objects are
      * removed from the dataset.
      */
    let checkIntegrity = function() {

        // Lists of node IDs that shouldn't be removed from the graph
        let nodeIds = {};
        let edgeTargets = {};

        // Remove nodes lacking an identifier
        data.nodes = data.nodes.filter(n => {

            // Make sure this node has an ID
            if (n.id == undefined || n.id == null) {
                //console.warn('The following node object is missing an ID: %o', n);
                return false;
            }

            nodeIds[n.id] = 0;

            return true;
        });

        // Remove edges that don't have valid node IDs, or are missing a required field
        data.edges = data.edges.filter(e => {

            if (e.source == undefined || e.source == null) {
                //console.warn('The following edge object is missing a source: %o', e);
                return false;
            }

            if (e.target == undefined || e.target == null) {
                //console.warn('The following edge object is missing a target: %o', e);
                return false;
            }

            if (!(e.source in nodeIds) || !(e.target in nodeIds)) {
                //console.warn('The following edge object has an invalid node ID: %o', e);
                return false;
            }

            edgeTargets[e.source] = 0;
            edgeTargets[e.target] = 0;

            return true;
        });

        if (removeLoners)
            data.nodes = data.nodes.filter(n => n.id in edgeTargets);
    };

    /** public **/

    exports.getHeight = getHeight;
    exports.getWidth = getWidth;

    exports.draw = function() {

        svg = select(element)
            .append('svg')
            .attr('height', height)
            .attr('width', width)
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        checkIntegrity();
        makeScales();
        makeAxes();
        renderGrid();
        renderAxes();

        if (useForce)
            positionWithForce();

        renderEdges();
        renderNodes();

        return exports;
    };

    /** setters/getters **/

    exports.svg = function() { return svg; };

    exports.altAxisLabels = function(_) { 
        if (!arguments.length) return altAxisLabels;
        altAxisLabels = _;
        return exports;
    };

    exports.backgroundColor = function(_) { 
        if (!arguments.length) return backgroundColor;
        backgroundColor = _;
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

    exports.useForce = function(_) { 
        if (!arguments.length) return useForce;
        useForce = _;
        return exports;
    };

    exports.removeLoners = function(_) { 
        if (!arguments.length) return removeLoners;
        removeLoners = _;
        return exports;
    };

    exports.width = function(_) { 
        if (!arguments.length) return width;
        width = +_;
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
