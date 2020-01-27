/**
 * file: transit.js
 * desc: d3js implementation of transit plots for visualizing directed acyclic
 *       graphs (DAGs).
 * auth: TR
 */

'use strict';

import {extent, min, max} from 'd3-array';
import {axisBottom, axisLeft} from 'd3-axis';
import {scaleLinear, scaleOrdinal} from 'd3-scale';
import {select} from 'd3-selection';
import {schemeDark2} from 'd3-scale-chromatic';

import _ from 'lodash';


export default function() {

    let exports = {},


        /** These public variables affect the structure and placement of the
          * nodes/edges. Some combinations of them will cause the plot to render
          * incorrectly.
          */
        fixedLayerSpace = 0,
        yNodeSpacing = 22,
        xNodeSpacing = 40,
        bundleWidth = 14,
        yLevelPadding = 16,
        bundleHeight = 4,
        c = 16,
        minFamilyHeight = 16,

        /** private **/

            // d3 axis object for the x-axis
        xAxis = null,
        // d3 axis for a discontinuous log scale
        x0Axis = null,
        // d3 scale for the x-axis
        xScale = null,
        // d3 axis object for the y-axis
        yAxis = null,
        // d3 scale for the y-axis
        yScale = null,
        // d3 scale for values associated with each node
        //valueScale = null,

        /** public **/

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
        // Font weight
        fontWeight = 'normal',
        // SVG height
        height = 600,
        margin = {top: 10, right: 0, bottom: 0, left: 10},
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


        // If true, positions x- and y-axis labels along the ends of each axis rather than
        // centering them outside the axis
        altAxisLabels = false,
        // Shaded background color to use when rendering the grid background
        backgroundColor = '#cecece',
        collisionForce = 5,
        manyBodyForce = null,
        // Data object containing objects/data to visualize
        data = null,
        disableXAxis = false,
        // Remove nodes that don't have edges to other nodes
        removeLoners = true,
        useBackgroundBox = false,
        useHorizontalLayout = false,
        // Prevent nodes from being rendered outside the plot boundaries
        useClipping = false,
        // Position nodes in the graph using collision forces to avoid node overlap
        useForce = false,
        useSingleAxis = false,
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
        xLabeldx = 0,
        // Niceify the x-axis scale
        xNice = true,
        // If true, will model the zero tick as discontinuous from the rest of the
        // x-axis scale. Useful for log scales.
        xScaleDiscontinuity = false,
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

        xDomain = _.chain(data.nodes)
            .sortBy(d => d.data.x)
            .map(d => d.data.x)
            .sortedUniq()
            .value();

        let xRange = _.chain(data.nodes)
            .sortBy(d => d.data.x)
            .map(d => d.x)
            .sortedUniq()
            .value();

        xScale = scaleOrdinal()
            .domain(xDomain)
            .range(xRange);

        yScale = yScaleFunction()
            .domain(yDomain)
            .range([getHeight(), 0]);
    };

    /**
     * Creates the d3 axis objects for x- and y-axes.
     */
    let makeAxes = function() {

        xAxis = useHorizontalLayout ? axisLeft(xScale) : axisBottom(xScale);

        xAxis.tickValues(
            _.chain(data.nodes)
                .map(d => d.data.x)
                .uniq()
                .sortBy()
                .value()
        );

        yAxis = axisLeft(yScale).ticks(yTicks, yTickFormat);
    };

    /**
     * Renders the x- and y-axes and attaches them to the SVG.
     */
    let renderAxes = function() {

        let xAxisObject = svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', _ => {

                if (useHorizontalLayout)
                    return 'translate(0, 0)';

                return `translate(0, ${max(data.nodes, d => d.y) + 10})`;
            })
            .call(xAxis);

        xAxisObject.attr('stroke-width', 2);

        // Attach the x-axis label
        xAxisObject.append('text')
            .attr('class', 'x-axis-label')
            .attr('fill', '#000000')
            .attr('text-anchor', _ => {
                if (useHorizontalLayout)
                    return 'start';
                return altAxisLabels ? 'start' : 'middle'
            })
            .attr('transform', useHorizontalLayout ? 'rotate(-90)' : '')
            .attr('x', _ => {

                if (useHorizontalLayout)
                    return -max(data.nodes, d => d.x);

                return altAxisLabels ? margin.left + xLabeldx : (margin.left + getWidth()) / 2
            })
            .attr('y', () => {

                if (useHorizontalLayout)
                    return 15;

                // My weak ass attempt at providing sane defaults for the label position
                if (xLabelPad !== null)
                    return xLabelPad;

                return altAxisLabels ? -5 : 50;
            })
            .text(xLabel);

        xAxisObject.selectAll('text')
            .attr('font', font)
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', fontWeight);
    };


    /**
     * Format the graph by dividing it into layers and identifying
     * parent->child relationships.
     */
    let formatGraph = function() {

        let parentMap = data.edges.reduce((ac, d) => {

            ac[d.target] = ac[d.target] || [];
            ac[d.target].push(d.source);

            return ac;

        }, {});

        let nodeMap = data.nodes.reduce((ac, d) => {
            ac[d.id] = d;
            return ac;
        }, {});

        data.nodes.forEach(d => {
            d.data = _.cloneDeep(d);
            d.parents = (d.id in parentMap) ? parentMap[d.id] : [];
            d.parents = d.parents.map(e => nodeMap[e]);

            d.parents.sort((a, b) => b.layer - a.layer);
        });
    };

    let constructRelations = function() {

        _.chain(data.nodes)
            .groupBy('layer')
            .each((layer, k) => {

                let relations = {};

                layer.forEach(d => {

                    if (!d.parents)
                        return;

                    let relationId = _.chain(d.parents)
                        .sortBy(d => d.layer)
                        .reverse()
                        .map(d => `${d.id}`)
                        .join('.')
                        .value();

                    if (!relationId)
                        return;

                    if (relationId in relations) {

                        relations[relationId].parents = relations[relationId]
                            .parents
                            .concat(d.parents);

                    } else {

                        relations[relationId] = {
                            id: relationId,
                            parents: d.parents.slice(),
                            level: d.layer
                        };
                    }

                    d.bundle = relations[relationId];
                });

                layer.bundles = Object.keys(relations).map(d => relations[d]);
                layer.bundles.forEach((d, i) => d.i = i);
            })
            .value();

        data.edges = data.nodes.reduce((ac, d) => {
            return ac.concat(
                d.parents.map(x => ({source: d, bundle: d.bundle, target: x}))
            );
        }, []);

        // Isolate bundles
        let bundles = _.chain(data.nodes)
            .map(d => d.bundle)
            .filter(d => d !== undefined)
            .uniqBy('id')
            .value();

        // Point parents -> bundles
        bundles.forEach(d => {
            d.parents.forEach(p => {

                if (p.bundleIndex === undefined)
                    p.bundleIndex = {};

                if (!(d.id in p.bundleIndex))
                    p.bundleIndex[d.id] = [];

                p.bundleIndex[d.id].push(d);
            });
        });

        data.nodes.forEach(d => {

            if (d.bundleIndex !== undefined) {

                d.bundles = Object.values(d.bundleIndex);

            } else {

                d.bundleIndex = {};
                d.bundles = [];
            }

            d.bundles.forEach((x, i) => x.i = i);
        });

        data.edges.forEach(d => {

            if (d.bundle.edges === undefined)
                d.bundle.edges = [];

            d.bundle.edges.push(d);
        });
    };

    let organizeLayout = function() {

        data.nodes.forEach(
            d => d.height = (Math.max(1, d.bundles.length) - 1) * bundleHeight
        );

        let xOffset = margin.left;
        let yOffset = margin.top;

        _.chain(data.nodes)
            .groupBy('layer')
            .each((layer, k) => {

                if (fixedLayerSpace > 0) {

                    xOffset += fixedLayerSpace * bundleWidth;

                } else {

                    xOffset += _.chain(layer)
                        .map('bundle')
                        .uniq('id')
                        .value()
                        .length * bundleWidth;
                }

                yOffset += yLevelPadding;

                layer.forEach(d => {

                    //d.x = d.level * xNodeSpacing + xOffset;
                    d.x = k * xNodeSpacing + xOffset;
                    //d.y = yNodeSpacing + yOffset + d.height / 2;
                    d.y = (d.yNodeSpacing ? d.yNodeSpacing : yNodeSpacing) +
                          yOffset + d.height / 2;

                    //yOffset += yNodeSpacing + d.height;
                    yOffset += (d.yNodeSpacing ? d.yNodeSpacing : yNodeSpacing) +
                               d.height;
                });
            })
            .value();

        let i = 0;

        let layers = _.chain(data.nodes)
            .groupBy('layer')
            .each((layer, k) => {
                layer.bundles = _.chain(layer)
                    .map('bundle')
                    .uniq('id')
                    .filter(d => d !== undefined)
                    .value();

                layer.bundles.forEach(d => {

                    d.x = d.parents[0].x + xNodeSpacing +
                          (layer.bundles.length - 1 - d.i) * bundleWidth;
                    //d.y = i * yNodeSpacing;
                    d.y = i * (d.yNodeSpacing ? d.yNodeSpacing : yNodeSpacing);
                });

                i += layer.length;
            })
            .value();

        data.edges.forEach(d => {

            d.xt = d.target.x;
            d.yt = d.target.y + d.target.bundleIndex[d.bundle.id].i * bundleHeight -
                d.target.bundles.length * bundleHeight / 2 + bundleHeight / 2;
            d.xb = d.bundle.x;
            d.xs = d.source.x;
            d.ys = d.source.y;
        });

        let yNegativeOffset = 0;

        _.each(layers, (layer, k) => {
            yNegativeOffset += -minFamilyHeight +
                min(
                    layer.bundles, d => min(d.edges, e => (e.ys - c) - (e.yt + c))
                ) || 0;

            layer.forEach(d => d.y -= (yNegativeOffset + 30));
        });

        data.edges.forEach(d => {
            d.yt = d.target.y + d.target.bundleIndex[d.bundle.id].i * bundleHeight -
                d.target.bundles.length * bundleHeight / 2 + bundleHeight / 2;
            d.ys = d.source.y;
            d.c1 = d.source.level - d.target.level > 1 ? xNodeSpacing + c : c;
            d.c2 = c;
        });
    };

    let renderGraph = function() {

        let paths = svg.append('g')
            .attr('class', 'edges');

        let color = scaleOrdinal(schemeDark2);

        data.edges.forEach(d => {

            let svgEdges2 = paths.append('path')
                .attr('d', _ => {

                    if (useHorizontalLayout) {

                        return `
                                M${d.yt} ${d.xt}
                                L${d.yt} ${d.xb - d.c1} 
                                A${d.c1} ${d.c1} 90 0 0 ${d.yt + d.c1} ${d.xb}
                                L${d.ys - d.c2} ${d.xb}
                                A${d.c2} ${d.c2} 90 0 1 ${d.ys} ${d.xb + d.c2}
                                L${d.ys} ${d.xs}
                            `.replace(/\s+/g, ' ');
                    }

                    return `
                            M${d.xt} ${d.yt}
                            L${d.xb - d.c1} ${d.yt}
                            A${d.c1} ${d.c1} 90 0 1 ${d.xb} ${d.yt + d.c1}
                            L${d.xb} ${d.ys - d.c2}
                            A${d.c2} ${d.c2} 90 0 0 ${d.xb + d.c2} ${d.ys}
                            L${d.xs} ${d.ys}
                        `.replace(/\s+/g, ' ');
                })
                .attr('fill', 'none')
                .attr('stroke', '#FFFFFF')
                .attr('stroke-width', () => {
                    return edgeStrokeWidth * 2.5;
                });

            let svgEdges = paths.append('path')
                .attr('d', _ => {
                    if (useHorizontalLayout) {

                        return `
                                M${d.yt} ${d.xt}
                                L${d.yt} ${d.xb - d.c1} 
                                A${d.c1} ${d.c1} 90 0 0 ${d.yt + d.c1} ${d.xb}
                                L${d.ys - d.c2} ${d.xb}
                                A${d.c2} ${d.c2} 90 0 1 ${d.ys} ${d.xb + d.c2}
                                L${d.ys} ${d.xs}
                            `.replace(/\s+/g, ' ');
                    }

                    return `
                            M${d.xt} ${d.yt}
                            L${d.xb - d.c1} ${d.yt}
                            A${d.c1} ${d.c1} 90 0 1 ${d.xb} ${d.yt + d.c1}
                            L${d.xb} ${d.ys - d.c2}
                            A${d.c2} ${d.c2} 90 0 0 ${d.xb + d.c2} ${d.ys}
                            L${d.xs} ${d.ys}
                        `.replace(/\s+/g, ' ');
                })
                .attr('fill', 'none')
                //.attr('stroke', '#000000')
                .attr('stroke', color(d.bundle.id))
                .attr('stroke-width', () => {
                    return edgeStrokeWidth;
                });

        });

        let nodes = svg.append('g')
            .attr('class', 'nodes');

        let svgNodes = nodes.selectAll('nodes')
            .data(data.nodes)
            .enter()
            .append('line')
            .attr('class', 'node-stroke')
            .attr(useHorizontalLayout ? 'y1' : 'x1', d => d.x)
            .attr(useHorizontalLayout ? 'x1' : 'y1', d => d.y - d.height / 2)
            .attr(useHorizontalLayout ? 'y2' : 'x2', d => d.x)
            .attr(useHorizontalLayout ? 'x2' : 'y2', d => d.y + d.height / 2)
            .attr('stroke', '#000000')
            .attr('stroke-width', d => {

                return nodeRadius * 2;
            })
            .attr('stroke-linecap', 'round');

        //if (useHorizontalLayout) {
        //
        //    svgNodes
        //        .attr('y1', d => d.x)
        //        .attr('x1', d => d.y - d.height / 2)
        //        .attr('y2', d => d.x)
        //        .attr('x2', d => d.y + d.height / 2);
        //
        //} else {
        //
        //    svgNodes
        //        .attr('x1', d => d.x)
        //        .attr('y1', d => d.y - d.height / 2)
        //        .attr('x2', d => d.x)
        //        .attr('y2', d => d.y + d.height / 2);
        //}

        let svgNodes2 = nodes.selectAll('nodes')
            .data(data.nodes)
            .enter()
            .append('line')
            .attr('class', 'node-fill')
            .attr(useHorizontalLayout ? 'y1' : 'x1', d => d.x)
            .attr(useHorizontalLayout ? 'x1' : 'y1', d => d.y - d.height / 2)
            .attr(useHorizontalLayout ? 'y2' : 'x2', d => d.x)
            .attr(useHorizontalLayout ? 'x2' : 'y2', d => d.y + d.height / 2)
            .attr('stroke', '#FFFFFF')
            .attr('stroke-width', d => {

                return nodeRadius;
            })
            .attr('stroke-linecap', 'round');

        svgNodes2.append('svg:title').text(d => d.label);
        /*
        let labelOutlines = svg.selectAll('labels')
            .data(data.nodes)
            .enter()
            .append('text')
            .attr('x', d => d.x + 4)
            .attr('y', d => d.y  - d.height / 2 - 4)
            .attr('font-family', 'sans-serif')
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', fontWeight)
            .attr('stroke', '#FFFFFF')
            .attr('stroke-width', 2)
            .attr('text-anchor', 'start')
            .text(d => d.label ? d.label : '');

        let labels = svg.selectAll('labels')
            .data(data.nodes)
            .enter()
            .append('text')
            .attr('x', d => d.x + 4)
            .attr('y', d => d.y - d.height / 2 - 4)
            .attr('font-family', 'sans-serif')
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', fontWeight)
            .attr('text-anchor', 'start')
            .text(d => d.label ? d.label : '');
         */
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

        formatGraph();
        constructRelations();
        organizeLayout();
        renderGraph();

        makeScales();
        makeAxes();
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

    exports.backgroundColor = function(_) {
        if (!arguments.length) return backgroundColor;
        backgroundColor = _;
        return exports;
    };

    exports.bundleHeight = function(_) {
        if (!arguments.length) return bundleHeight;
        bundleHeight = +_;
        return exports;
    };

    exports.bundleWidth = function(_) {
        if (!arguments.length) return bundleWidth;
        bundleWidth = +_;
        return exports;
    };

    exports.c = function(_) {
        if (!arguments.length) return c;
        c = +_;
        return exports;
    };

    exports.data = function(_) {
        if (!arguments.length) return data;
        data = _;
        return exports;
    };

    exports.disableXAxis = function(_) {
        if (!arguments.length) return disableXAxis;
        disableXAxis = _;
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

    exports.fixedLayerSpace = function(_) {
        if (!arguments.length) return fixedLayerSpace;
        fixedLayerSpace = +_;
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

    exports.fontWeight = function(_) {
        if (!arguments.length) return fontWeight;
        fontWeight = _;
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

    exports.manyBodyForce = function(_) {
        if (!arguments.length) return manyBodyForce;
        manyBodyForce = +_;
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

    exports.minFamilyHeight = function(_) {
        if (!arguments.length) return minFamilyHeight;
        minFamilyHeight = +_;
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

    exports.useBackgroundBox = function(_) {
        if (!arguments.length) return useBackgroundBox;
        useBackgroundBox = _;
        return exports;
    };

    exports.useClipping = function(_) {
        if (!arguments.length) return useClipping;
        useClipping = _;
        return exports;
    };

    exports.useForce = function(_) {
        if (!arguments.length) return useForce;
        useForce = _;
        return exports;
    };

    exports.useHorizontalLayout = function(_) {
        if (!arguments.length) return useHorizontalLayout;
        useHorizontalLayout = _;
        return exports;
    };

    exports.xNodeSpacing = function(_) {
        if (!arguments.length) return xNodeSpacing;
        xNodeSpacing = _;
        return exports;
    };

    exports.yNodeSpacing = function(_) {
        if (!arguments.length) return yNodeSpacing;
        yNodeSpacing = _;
        return exports;
    };

    exports.yLevelPadding = function(_) {
        if (!arguments.length) return yLevelPadding;
        yLevelPadding = +_;
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

    exports.xLabeldx = function(_) {
        if (!arguments.length) return xLabeldx;
        xLabeldx = +_;
        return exports;
    };

    exports.xNice = function(_) {
        if (!arguments.length) return xNice;
        xNice = _;
        return exports;
    };

    exports.xScaleDiscontinuity = function(_) {
        if (!arguments.length) return xScaleDiscontinuity;
        xScaleDiscontinuity = _;
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

