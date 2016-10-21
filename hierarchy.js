/**
 * file:    hierarchy.js
 * desc:    d3js 4.0 implementation of hierarchical graph structures. Very 
 *          similar to other graph or tree implementations, but forces a strict
 *          hierarchy and spacing between nodes.
 * vers:    0.2.0
 * auth:    TR
 */

var hierarchy = function() {

    var exports = {},
        svg = null,
        // d3js Force directed simulation
        simulation = null,
        colorScale = null,
        d3Nodes = null,
        d3Edges = null,
        fixedStruct = null,
        //
        // Everything below can be accessed and modified using getters/setters
        //
        // Graph data struct which should contain a key for nodes and edges
        graph = null,
        // SVG width
        width = 800,
        // SVG height
        height = 500,
        // Node radius
        radius = 8,
        // Node charge, negative numbers repel, positive attracts
        charge = -200,
        // The (link) distance between nodes
        distance = 40,
        // Use a fixed, static layout
        fixed = false,
        // The size of each layer in the heirarchy if the layout is fixed
        layerSize = 100,
        // Vertical spacing between node layers
        verticalSpacing = 50,
        // Margin between the actual visualization and SVG borders
        //margin = {},
        //margin.top = 10,
        //margin.bottom = 30,
        //margin.right = 30,
        //margin.left = 30,
        // Node color
        nodeColor = '#1d91c0',
        // Node color opacity
        nodeOpacity = 1.0,
        // The d3 scale function to use when generating colors
        scaleFxn = d3.scaleLinear,
        // Use a node color range instead of a single color
        useColorRange = false,
        // Use a darkened version of the node color as its stroke
        useDarkStroke = false,
        // Apply a drop shadow to the nodes
        useShadow = false,
        // Node stroke color
        nodeStroke = '#000',
        // Node stroke thickness
        nodeStrokeWidth = '1px',
        // Use an alternate, pretty node style
        prettifyNodes = false,
        // Edge color
        edgeColor = '#1d91c0',
        // Edge color opacity
        edgeOpacity = 1.0,
        // Edge color
        edgeStroke = '#000',
        // Edge width
        edgeWidth = '1px';

    /** private **/

    /**
     * Generates a drop shadow and appends it to the SVG element so it can be
     * applied to any drawn shapes. The generated shadow element has the ID
     * "#drop-shadow" and can be applied to an element using
     * url('#drop-shadow').
     *
     */
    var makeDropShadow = function() {

        var defs = svg.append('defs');

        var filter = defs.append('filter')
            .attr('id', 'drop-shadow')
            .attr('filterUnits', 'userSpaceOnUse')
            .attr('height', '250%')
            .attr('width', '250%');

        filter.append('feGaussianBlur')
            .attr('in', 'SourceGraphic')
            .attr('stdDeviation', 2.5)
            .attr('result', 'blur-out');

        filter.append('feColorMatrix')
            .attr('in', 'blur-out')
            .attr('type', 'hueRotate')
            .attr('values', 180)
            .attr('result', 'color-out');

        filter.append('feOffset')
            .attr('in', 'color-out')
            .attr('dx', 3)
            .attr('dy', 3)
            .attr('result', 'the-shadow');

        filter.append('feBlend')
            .attr('in', 'SourceGraphic')
            .attr('in2', 'the-shadow')
            .attr('mode', 'normal');
    };

    var dragNodes = function() {

    };

    var makeRegularNodes = function() {

        var nodeGroups = svg.selectAll('circle')
            .data(graph.nodes)
            .enter()
            .append('g');

        if (useShadow) {

            nodeGroups
                .append('circle')
                .attr('r', function(d) {
                    if (d.radius === undefined)
                        return radius - 1;

                    return d.radius - 1;
                })
                .style('stroke', 'none')
                .style('fill', '#000000')
                .style('filter', 'url(#drop-shadow)');
        }

        nodeGroups
            .append('circle')
            .attr('shape-rendering', 'auto')
            .attr('title', function(d) { return d.label; })
            .attr('r', function(d) {
                if (d.radius === undefined)
                    return radius;

                return d.radius;
            })
            .style('stroke', function(d) {
                if (useColorRange && useDarkStroke)
                    return d3.rgb(nodeColor(colorScale(d.colorValue))).darker(1.5);

                if (d.stroke === undefined)
                    return nodeStroke;

                if (d.color && useDarkStroke)
                    return d3.rgb(d.color).darker(1.5);

                return d.stroke;
            })
            .style('stroke-width', function(d) {
                if (d.width === undefined)
                    return nodeStrokeWidth;

                return d.width;
            })
            .style('fill', function(d) {
                if (useColorRange)
                    return nodeColor(colorScale(d.colorValue));

                if (d.color)
                    return d.color;

                return nodeColor;
            })
            // Enables nodes to be dragged and moved
            .call(d3.drag()
                .on('start', function(d) {

                    if (!d3.event.active)
                        simulation.alphaTarget(0.3).restart();

                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on('drag', function(d) {

                    d.fx = d3.event.x;
                    d.fy = d3.event.y;
                })
                .on('end', function(d) {

                    if (!d3.event.active)
                        simulation.alphaTarget(0);

                    d.fx = null;
                    d.fy = null;
                }));

        return nodeGroups;
    };

    var makePrettyNodes = function() {

        var nodeGroups = svg.selectAll('circle')
            .data(graph.nodes)
            .enter()
            .append('g');

        // Shadow circle
        nodeGroups
            .append('circle')
            .attr('shape-rendering', 'auto')
            .attr('r', function(d) {
                if (d.radius === undefined)
                    return radius + 2;

                return d.radius + 2;
            })
            .style('stroke', 'none')
            .style('fill', '#000000')
            .style('filter', function() { 
                return useShadow ? 'url(#drop-shadow)' : ''; 
            });

        // Cream colored outline
        nodeGroups
            .append('circle')
            .attr('r', function(d) {
                if (d.radius === undefined)
                    return radius + 3;

                return d.radius + 3;
            })
            .style('fill', '#FFFDD0')
            .style('stroke', 'none');

        // Actual colored node
        nodeGroups
            .append('circle')
            .attr('title', function(d) { return d.label; })
            .attr('r', function(d) {
                if (d.radius === undefined)
                    return radius;

                return d.radius;
            })
            .style('stroke', function(d) {
                if (useColorRange)
                    return d3.color(nodeColor(colorScale(d.colorValue))).darker(1.5);

                if (d.color)
                    return d3.color(d.color).darker(1.5);

                return d3.color(nodeColor).darker(1.5);
            })
            .style('stroke-width', '1px')
            .style('fill', function(d) {
                if (useColorRange)
                    return nodeColor(colorScale(d.colorValue));

                if (d.color)
                    return d.color;

                return nodeColor;
            })
            // Enables nodes to be dragged and moved
            .call(d3.drag()
                .on('start', function(d) {

                    if (!d3.event.active)
                        simulation.alphaTarget(0.3).restart();

                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on('drag', function(d) {

                    d.fx = d3.event.x;
                    d.fy = d3.event.y;
                })
                .on('end', function(d) {

                    if (!d3.event.active)
                        simulation.alphaTarget(0);

                    d.fx = null;
                    d.fy = null;
                }));

        return nodeGroups;
    };

    var makeEdges = function() {

        var edges = svg.selectAll('path')
            .data(graph.edges)
            .enter()
            .append('path')
            .attr('shape-rendering', 'auto')
            .attr('stroke', function(d) {
                if (d.stroke === undefined)
                    return edgeColor;

                return d.stroke;
            })
            .attr('stroke-width', function(d) {
                if (d.width === undefined)
                    return edgeWidth;

                return d.width;
            })
            .attr('fill', 'none');

        return edges;
    };

    var interpolateColors = function() {

        var cmin = d3.min(graph.nodes, function(n) { return n.colorValue; });
        var cmax = d3.max(graph.nodes, function(n) { return n.colorValue; });

        if (Array.isArray(nodeColor) && nodeColor.length >= 2)
            nodeColor = d3.interpolate(nodeColor[0], nodeColor[1]);
        else
            nodeColor = d3.interpolate('#FFF', nodeColor);

        colorScale = scaleFxn()
            .domain([cmin, cmax])
            .range([0, 1]);
    };

    /**
     * Fixes the node and edge layout into a single, static position. Returns a
     * structure containing information about the nodes and layout.
     *
     */
    var fixLayout = function(nodes) {

        var layerCounts = {};
        var nodeCounts = {};
        var countMap = {};
        var maxCount = 0;
        var maxRadius = 0;

        // Determine the largest layer and keep track of nodes per layer, this way
        // we can determine x-axis positions
        for (var i = 0; i < nodes.length; i++) {

            var node = nodes[i];

            if (layerCounts[node.depth] === undefined)
                layerCounts[node.depth] = 1;
            else
                layerCounts[node.depth] += 1;

            if (layerCounts[node.depth] > maxCount)
                maxCount = layerCounts[node.depth];

            if (node.radius === undefined) {
                maxRadius = radius;
                
            } else {

                if (node.radius > maxRadius)
                    maxRadius = node.radius;
            }

            countMap[node.id] = layerCounts[node.depth];
            nodeCounts[node.depth] = 1;
        }

        // Cushioning between nodes in the same layer
        //var nodePadding = 10;
        //var diameter = maxRadius * 2;

        for (var i = 0; i < nodes.length; i++)
            nodeCounts[nodes[i].depth] += 1;

        return {
            maxRadius: maxRadius,
            maxCount: maxCount,
            nodeCounts: nodeCounts,
            countMap: countMap
        };
    };

    var tick = function() {

        // Forces a hierarchical structure
        d3Nodes.attr('transform', function(d) {

            var layerChunk = layerSize / (fixedStruct.nodeCounts[d.depth]);

            // Forces even spacing between nodes in a layer otherwise the
            // nodes are positioned (and move) according to the force layout
            if (fixed)
                d.x = layerChunk * fixedStruct.countMap[d.id];

            d.y = d.depth * verticalSpacing + 100;

            return 'translate(' + d.x + ',' + d.y + ')';
        });

        // Here for posterity. If I ever need to take the nodes out of their
        // groups they must be positioned using cx/cy.
        //d3Nodes
        //    .attr('cx', function(d) { return d.x; })
        //    .attr('cy', function(d) { return d.y; });

        d3Edges
            .attr('x1', function(d) { return d.source.x; })
            .attr('y1', function(d) { return d.source.y; })
            .attr('x2', function(d) { return d.target.x; })
            .attr('y2', function(d) { return d.target.y; })
            //.attr('d', function(d) {
            //    return line([{x: d.source.x, y: d.source.y}, {x: d.target.x, y: d.target.y}]);
            //})
            .attr('d', function(d) {
                return 'M' + d.source.x + ',' + d.source.y
                     + 'C' + (d.target.x) + ',' + (d.source.y + 50)
                     + ' ' + (d.target.x) + ',' + (d.target.y)
                     + ' ' + d.target.x + ',' + d.target.y;
            });
    };

    /** public **/

    exports.draw = function() {

        svg = d3.select('body')
            .append('svg')
            .attr('height', height)
            .attr('width', width);

        simulation = d3.forceSimulation()
            .force('charge', d3.forceManyBody().strength(charge))
            //
            // This lets us link nodes using their identifiers and not array
            // indices
            .force('link', 
                   d3.forceLink().id(function(d) { 
                       return d.id;
                   }).distance(distance))
            //
            .force('x', d3.forceX(width / 2))
            .force('y', d3.forceY(height / 2));

        if (useColorRange)
            interpolateColors();

        if (useShadow)
            makeDropShadow();

        d3Edges = makeEdges();

        if (prettifyNodes)
            d3Nodes = makePrettyNodes();
        else
            d3Nodes = makeRegularNodes();

        fixedStruct = fixLayout(graph.nodes);

        simulation.on('tick', tick);
        simulation.nodes(graph.nodes);
        simulation.force('link').links(graph.edges);

        //fixLayout(graph.nodes);
    };

    /**
     * Setters and getters.
     */

    exports.graph = function(_) {
        if (!arguments.length) return graph;
        graph = _;
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

    exports.radius = function(_) {
        if (!arguments.length) return radius;
        radius = +_;
        return exports;
    };

    exports.charge = function(_) {
        if (!arguments.length) return charge;
        charge = +_;
        return exports;
    };

    exports.distance = function(_) {
        if (!arguments.length) return distance;
        distance = +_;
        return exports;
    };

    exports.fixed = function(_) {
        if (!arguments.length) return fixed;
        fixed = _;
        return exports;
    };

    exports.layerSize = function(_) {
        if (!arguments.length) return layerSize;
        layerSize = +_;
        return exports;
    };

    exports.verticalSpacing = function(_) {
        if (!arguments.length) return verticalSpacing;
        verticalSpacing = +_;
        return exports;
    };

    exports.nodeColor = function(_) {
        if (!arguments.length) return nodeColor;
        nodeColor = _;
        return exports;
    };

    exports.nodeOpacity = function(_) {
        if (!arguments.length) return nodeOpacity;
        nodeOpacity = +_;
        return exports;
    };

    exports.useColorRange = function(_) {
        if (!arguments.length) return useColorRange;
        useColorRange = _;
        return exports;
    };

    exports.useDarkStroke = function(_) {
        if (!arguments.length) return useDarkStroke;
        useDarkStroke = _;
        return exports;
    };

    exports.useShadow = function(_) {
        if (!arguments.length) return useShadow;
        useShadow = _;
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

    exports.prettifyNodes = function(_) {
        if (!arguments.length) return prettifyNodes;
        prettifyNodes = _;
        return exports;
    };

    exports.edgeColor = function(_) {
        if (!arguments.length) return edgeColor;
        edgeColor = _;
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

    return exports;
};

var legend = function(data, opts) {

    opts = validateLegendOptions(opts);

    var legend = d3.select('body').append('svg')
        .attr('width', opts.width)
        .attr('height', opts.height)
        .selectAll('g')
        .data(data)
        .enter().append('g')
        .attr("transform", function(d, i) { 
            return "translate(40," + (i + 1) * opts.keyPadding + ")"; 
        });

    legend.append('rect')
        .attr('width', opts.keyWidth)
        .attr('height', opts.keyHeight)
		.attr('stroke', opts.stroke)
		.attr('stroke-width', opts.strokeWidth)
        .attr('shape-rendering', 'crispEdges')
        .style('fill-opacity', opts.opacity)
        .style('fill', function(d, i) {
            if (d.color === undefined)
                return opts.colors[i];

            return d.color;
        });

    legend.append("text")
        .attr("x", opts.textX)
        .attr("y", opts.textY)
        .attr("dy", ".35em")
        .attr('font-family', opts.font)
        .attr('font-size', opts.fontSize)
        .attr('font-weight', opts.fontWeight)
        .text(function(d) { 
			return d.name;
        });
};

/**
 *      height: int, the height of the SVG in pixels
 *      width: int, the width of the SVG in pixels
 *      keyHeight: int, the height of the color box in pixels
 *      keyWidth: int, the width of the color box in pixels
 *      keyPadding: int, padding between color boxes
 *      title: string, legend title
 *      colors: an array of color strings, ensure this is the same size as the
 *          number of data points.
 *      margin: an object of margin values
 *      opacity: float, the opacity of the fill colors
 *      stroke: string, color used to outline the visualization
 *      strokeWidth: string, size in pixels of the stroke outline
 *      font: string, font to use for the legend text
 *      fontSize: string, font size in pixels
 *      fontWeight: string, font weight
 *      textX: int, x coordinate position of each key/color box text
 *      textY: int, y coordinate position of each key/color box text
 */
var validateLegendOptions = function(opts) {

    opts.height = opts.height || 500;
    opts.width = opts.width || 800;
    opts.keyHeight = opts.keyHeight || 20;
    opts.keyWidth = opts.keyWidth || 20;
    opts.keyPadding = opts.keyPadding || 30;
    opts.title = opts.title || '';
    opts.margin = (opts.margin === undefined) ? {} : opts.margin;

    opts.margin.top = opts.margin.top || 10;
    opts.margin.bottom = opts.margin.bottom || 30;
    opts.margin.right = opts.margin.right || 30;
    opts.margin.left = opts.margin.left || 30;

    // These are all the visualization styling options and heavily dependent on
    // the visualization type
    opts.colors = (opts.colors === undefined) ? d3.schemeSet3 : opts.colors;
    opts.opacity = opts.opacity || 1.0;
    opts.stroke = (opts.stroke === undefined) ? '#000' : opts.stroke;
    opts.strokeWidth = (opts.strokeWidth === undefined) ? '1px' : 
                       opts.strokeWidth;
    opts.font = opts.font || 'sans-serif';
    opts.fontSize = opts.fontSize || '15px';
    opts.fontWeight = opts.fontWeight || 'normal';
    opts.textX = opts.textX || (opts.keyWidth + 2);
    opts.textY = opts.textY || (opts.keyHeight / 2 - 2);

    return opts;
};

