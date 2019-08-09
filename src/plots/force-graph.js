/**
  * file: force-graph.js
  * desc: d3js implementation of force directed graphs.
  * auth: TR
  */

'use strict';

import {drag} from 'd3-drag';
import {event, select} from 'd3-selection';
import {forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation} from 'd3-force';

export default function() {

    let exports = {},

        /** private **/

        // d3 node objects
        graphNodes = null,
        // d3 edge objects
        graphEdges = null,
        // force simulation for the graph
        simulation = null,

        /** public **/

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
        // Margin object
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
        // Radius size to use for the collide force
        collideForceRadius = 1,
        // Strength (should be [0, 1]) to use for the collide force
        collideForceStrength = 0.7,
        // Distance for the link force
        linkForceDistance = 30,
        // Strength for the many body force ((-) reples, (+) attracts)
        manyBodyForceStrength = -30,
        // If true, utilize a center force in the force simulation
        useCenterForce = true,
        // If true, utilize a collide force in the force simulation
        useCollideForce = false,
        // If true, utilize a link force in the force simulation
        useLinkForce = true,
        // If true, utilize a many body force in the force simulation
        useManyBodyForce = true,
        // SVG width
        width = 600;

    /** private **/

    /**
      * Returns the width and height of the SVG while taking into account the margins.
      */
    let getHeight = function() { return height - margin.bottom - margin.top; };
    let getWidth = function() { return width - margin.left - margin.right; };

    /**
      * Renders each node in the graph and attaches the objects to the SVG.
      */
    let renderNodes = function() {

        graphNodes = svg.append('g')
            .attr('class', 'nodes')
            .selectAll('node')
            .data(data.nodes)
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('id', d => `node-${d.id}`);

        graphNodes.append('circle')
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
            })
            .attr('r', d => {

                if (d.radius)
                    return d.radius;

                return nodeRadius;
            });

        graphNodes.append('title')
            .text(d => {

                if (d.label)
                    return d.label;

                return '';
            });
    };

    let renderEdges = function() {

        graphEdges = svg.append('g')
            .attr('class', 'edges')
            .selectAll('edges')
            .data(data.edges)
            .enter()
            .append('line')
            .attr('class', 'edge')
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

    //let positionWithForce = function() {
    let createSimulation = function() {

        simulation = forceSimulation(data.nodes)
            .force(
                'link',
                useLinkForce ?
                forceLink(data.edges).id(d => d.id).distance(linkForceDistance) :
                null
            )
            .force(
                'collide',
                useCollideForce ?
                    //forceCollide.radius(collideForceRadius).strength(collideForceStrength) : null
                    forceCollide(collideForceRadius).strength(collideForceStrength) : null
            )
            .force(
                'charge',
                useManyBodyForce ?
                forceManyBody().strength(manyBodyForceStrength) :
                null
            )
            .force(
                'center',
                useCenterForce ? forceCenter(getWidth() / 2, getHeight() / 2) : null
            );

        simulation.on('tick', () => {

            // Typically we just transform the node group (<g>) but if we do this,
            // the group transformation isn't preserved and when we
            // download/format/convert the image later on everything is fucked.
            graphNodes.attr('transform', d => `translate(${d.x}, ${d.y})`);
            //graphNodes//.attr('transform', d => `translate(${d.x}, ${d.y})`);
            //    .selectAll('circle')
            //    .attr('cx', d => d.x)
            //    .attr('cy', d => d.y);

            graphEdges
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
        });
    };

    let updateDragEvents = function() {

        let dragEvents = drag()
            .on('start', d => {

                if (!event.active)
                    simulation.alphaTarget(0.3).restart();

                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', d => {

                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', d => {

                if (!event.active)
                    simulation.alphaTarget(0);

                d.fx = null;
                d.fy = null;
            });

        graphNodes.call(dragEvents);
    };

    /** public **/

    exports.getHeight = getHeight;
    exports.getWidth = getWidth;
    exports.simulation = d => simulation;

    exports.draw = function() {

        svg = select(element)
            .append('svg')
            .attr('height', height)
            .attr('width', width)
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        renderEdges();
        renderNodes();
        createSimulation();
        updateDragEvents();

        return exports;
    };

    /** setters/getters **/

    exports.svg = function() { return svg; };

    exports.data = function(_) {
        if (!arguments.length) return data;
        data = _;
        return exports;
    };

    exports.collideForceRadius = function(_) {
        if (!arguments.length) return collideForceRadius;
        collideForceRadius = +_;
        return exports;
    };

    exports.collideForceStrength = function(_) {
        if (!arguments.length) return collideForceStrength;
        collideForceStrength = _;
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

    exports.linkForceDistance = function(_) { 
        if (!arguments.length) return linkForceDistance;
        linkForceDistance = +_;
        return exports;
    };

    exports.height = function(_) { 
        if (!arguments.length) return height;
        height = +_;
        return exports;
    };

    exports.manyBodyForceStrength = function(_) { 
        if (!arguments.length) return manyBodyForceStrength;
        manyBodyForceStrength = +_;
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

    exports.useCenterForce = function(_) {
        if (!arguments.length) return useCenterForce;
        useCenterForce = _;
        return exports;
    };

    exports.useCollideForce = function(_) {
        if (!arguments.length) return useCollideForce;
        useCollideForce = _;
        return exports;
    };

    exports.useLinkForce = function(_) {
        if (!arguments.length) return useLinkForce;
        useLinkForce = _;
        return exports;
    };

    exports.useManyBodyForce = function(_) {
        if (!arguments.length) return useManyBodyForce;
        useManyBodyForce = _;
        return exports;
    };

    exports.width = function(_) {
        if (!arguments.length) return width;
        width = +_;
        return exports;
    };

    // Enables testing for private methods
    if (process.env.NODE_ENV == 'development') {

        exports.renderNodes = renderNodes;
        exports.renderEdges = renderEdges;
        exports.createSimulation = createSimulation;
        exports.updateDragEvents = updateDragEvents;

        exports.graphNodes = () => graphNodes;
        exports.graphEdges = () => graphEdges;
        exports.simulation = () => simulation;
        exports.svg = function(_) {
            if (!arguments.length) return svg;
            svg = _;
            return exports;
        };
    }

    return exports;
}
