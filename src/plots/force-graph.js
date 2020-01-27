/**
 * file: force-graph.js
 * desc: d3js implementation of force directed graphs.
 * auth: TR
 */

'use strict';

import {drag} from 'd3-drag';
import {event, select} from 'd3-selection';
import {forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY} from 'd3-force';

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
        font = '"Helvetica Neue", Helvetica, Arial, sans-serif',
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
        simulationIterations = 0,
        // If true, utilize a center force in the force simulation
        useCenterForce = true,
        // If true, utilize a collide force in the force simulation
        useCollideForce = false,
        // If true, utilize a link force in the force simulation
        useLinkForce = true,
        // If true, utilize a many body force in the force simulation
        useManyBodyForce = true,
        useMultiEdges = true,
        useStickyNodes = false,
        useXForce = false,
        useYForce = false,
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

        // Actual colored node. This selects nodes that don't have a symbol key
        // in their object.
        let graphCircles = graphNodes
            .filter(function(d) { return d.rect == undefined; })
            .append('circle')
            .attr('r', function(d) {
                if (d.value !== undefined && useSizeRange)
                    return sizeScale(d.value);

                if (d.radius === undefined)
                    return nodeRadius;

                return d.radius;
            });

        // delete
        // Actual colored node. This selects nodes that don't have a symbol key
        // in their object.
        let graphRects = graphNodes
                .filter(function(d) { return d.rect !== undefined; })
                .append('rect')
                .attr('width', function(d) {
                    if (d.value !== undefined && useSizeRange)
                        return sizeScale(d.value);

                    if (d.width !== undefined)
                        return d.width;

                    if (d.radius === undefined)
                        return nodeRadius;

                    return d.radius * 2;
                })
                .attr('height', function(d) {
                    if (d.value !== undefined && useSizeRange)
                        return sizeScale(d.value);

                    if (d.height !== undefined)
                        return d.height;

                    if (d.radius === undefined)
                        return nodeRadius;

                    return d.radius;
                })
                .attr('rx', d => d.round == undefined ? 4 : d.round)
                .attr('ry', d => d.round == undefined ? 4 : d.round)
            //.attr('x', function(d) { return -((d.radius*2) / 2); })
            //.attr('y', function(d) { return -(d.radius / 2); })
        ;

        for (let nodes of [graphCircles, graphRects]) {

            nodes//.append('circle')
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

            nodes.append('svg:title')
                .text(d => {

                    if (d.label)
                        return d.label;

                    return d.id;
                });
        }
    };

    let renderEdges = function() {

        graphEdges = svg.append('g')
            .attr('class', 'edges')
            .selectAll('edges')
            .data(data.edges)
            .enter()
            .append(useMultiEdges ? 'path' : 'line')
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
            )
            .force(
                'x',
                useXForce ? forceX() : null
            )
            .force(
                'y',
                useYForce ? forceY() : null
            );

        simulation.on('tick', () => {

            // Typically we just transform the node group (<g>) but if we do this,
            // the group transformation isn't preserved and when we
            // download/format/convert the image later on everything is fucked.
            //graphNodes.attr('transform', d => `translate(${d.x}, ${d.y})`);
            graphNodes//.attr('transform', d => `translate(${d.x}, ${d.y})`);
                .selectAll('circle')
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);
            graphNodes//.attr('transform', d => `translate(${d.x}, ${d.y})`);
                .selectAll('rect')
                .attr('x', d => d.x - (d.width / 2))
                .attr('y', d => d.y - (d.height / 2));
            //.attr('x', function(d) { return -((d.radius*2) / 2); })
            //.attr('y', function(d) { return -(d.radius / 2); })

            if (useMultiEdges) {

                let multiEdges = {};
                let multiEdgeCount = {};

                data.edges.forEach(d => {

                    if (!(d.source.id in multiEdges)) {
                        multiEdges[d.source.id] = {};
                        multiEdgeCount[d.source.id] = {};
                    }
                    if (!(d.target.id in multiEdges)) {
                        multiEdges[d.target.id] = {};
                        multiEdgeCount[d.target.id] = {};
                    }
                    if (!(d.target.id in multiEdges[d.source.id])) {
                        multiEdges[d.source.id][d.target.id] = 0;
                        multiEdgeCount[d.source.id][d.target.id] = 0;
                    }
                    if (!(d.source.id in multiEdges[d.target.id])) {
                        multiEdges[d.target.id][d.source.id] = 0;
                        multiEdgeCount[d.target.id][d.source.id] = 0;
                    }

                    multiEdges[d.source.id][d.target.id]++;
                    multiEdges[d.target.id][d.source.id]++;

                    // idc
                });

                //return;
                //console.log(multiEdges);
                graphEdges
                    .attr('d', d => {

                        if (multiEdges[d.source.id][d.target.id] == 1) {
                            return `
                                M${d.source.x}, ${d.source.y}
                                L${d.target.x}, ${d.target.y}
                            `;

                        } else {
                            let numEdges = multiEdges[d.source.id][d.target.id];
                            let seen = multiEdgeCount[d.source.id][d.target.id];

                            multiEdgeCount[d.source.id][d.target.id]++;
                            multiEdgeCount[d.target.id][d.source.id]++;

                            // midpoints
                            let midx = (d.source.x + d.target.x) / 2;
                            let midy = (d.source.y + d.target.y) / 2;
                            let theta = Math.atan2(d.target.y - d.source.y, d.target.x - d.target.y) - Math.PI / 2;
                            let offset = 0;
                            let minOffset = 10;
                            let bpx = 0;
                            let bpy = 0;

                            if (seen % numEdges > 0){
                                offset = Math.ceil(seen / 2) * minOffset;

                                if (seen % 2)
                                    offset = -offset;
                            }

                            bpx = midx + offset * Math.cos(theta);
                            bpy = midy + offset * Math.sin(theta);
                            //if (seen == 0) {
                            //    bpx = midx + offset * Math.cos(theta);
                            //    bpy = midy + offset * Math.sin(theta);
                            //} else {
                            //    bpx = midx - offset * Math.cos(theta);
                            //    bpy = midy - offset * Math.sin(theta);
                            //}

                            return `
                                M ${d.source.x}, ${d.source.y}
                                Q ${bpx}, ${bpy}
                                  ${d.target.x}, ${d.target.y}
                            `;
                        }
                    });

                //return 'M' + d.source.x + ',' + d.source.y
                //     + 'C' + (d.target.x) + ',' + (d.source.y + 50)
                //     + ' ' + (d.target.x) + ',' + (d.target.y)
                //     + ' ' + d.target.x + ',' + d.target.y;
            } else {

                graphEdges
                    .attr('x1', d => d.source.x)
                    .attr('y1', d => d.source.y)
                    .attr('x2', d => d.target.x)
                    .attr('y2', d => d.target.y);
            }
        });
    };

    let updateDragEvents = function() {

        let dragEvents = drag()
            .on('start', function(d) {

                if (!event.active)
                    simulation.alphaTarget(0.3).restart();

                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', function(d) {

                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', d => {

                if (!event.active)
                    simulation.alphaTarget(0);

                if (useStickyNodes) {

                    console.log('wut');
                    d.fx = event.x;
                    d.fy = event.y;

                } else {

                    console.log('wut1');
                    d.fx = null;
                    d.fy = null;
                }
            });

        graphNodes.call(dragEvents);

        if (useStickyNodes) {

            graphNodes.on('dblclick', d => {
                console.log('fuck');
                d.fx = null;
                d.fy = null;
            });
        }
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

        //simulation.stop();
        //if (simulationIterations > 0) {
        //    simulation.stop();

        //    for (let i = 0; i < simulationIterations; i++)
        //        simulation.tick();
        //}

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

    exports.simulationIterations = function(_) {
        if (!arguments.length) return simulationIterations;
        simulationIterations = +_;
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

    exports.useMultiEdges = function(_) {
        if (!arguments.length) return useMultiEdges;
        useMultiEdges = _;
        return exports;
    };

    exports.useStickyNodes = function(_) {
        if (!arguments.length) return useStickyNodes;
        useStickyNodes = _;
        return exports;
    };

    exports.useXForce = function(_) {
        if (!arguments.length) return useXForce;
        useXForce = _;
        return exports;
    };

    exports.useYForce = function(_) {
        if (!arguments.length) return useYForce;
        useYForce = _;
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

