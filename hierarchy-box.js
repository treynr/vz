/**
 * file:    hierarchy-box.js
 * desc:    d3js 4.0 implementation of hierarchical graph structures. Uses
 *          rectangular nodes similar to GeneWeaver's classic HiSim graph and
 *          forces a static, even-spaced layout.
 * vers:    0.2.0
 * auth:    TR
 */

/**
 * Validates the visualization options with sensible defaults when required.
 * The option struct has the following fields:
 *      height: 
 *          int, the height of the SVG in pixels
 *      width: 
 *          int, the width of the SVG in pixels
 *      radius: 
 *          int, the radius of the pie chart in pixels
 *      inRadius: 
 *          int, the inner radius of the donut in pixels.
 *          If 0, a pie chart is generated, otherwise a it's a donut.
 *      title: 
 *          string, the chart's title
 *      padding: 
 *          float, padding between pie sections
 *      colors: 
 *          an array of color strings, ensure this is the same size as the
 *          number of data points.
 *      margin: 
 *          an object of margin values
 *      opacity: 
 *          float, the opacity of the fill colors
 *      stroke: 
 *          string, color used to outline the visualization
 *      strokeWidth: 
 *          string, size in pixels of the stroke outline
 */
var validateOptions = function(opts) {

    // Height of the svg in pixels
    opts.height = opts.height || 500;
    // Width of the svg in pixels
    opts.width = opts.width || 800;
    // Radius for each node in the graph
    opts.radius = opts.radius || 8;
    // Node charge, negative numbers repel, positive attracts
    opts.charge = -200;
    // The (link) distance between nodes
    opts.distance = 40;
    // Use a fixed, static layout
    opts.fixed = opts.fixed || false;
    // The size of each layer in the heirarchy if the layout is fixed
    opts.layerSize = opts.fixed || false;
    opts.x = opts.width / 2;
    opts.y = opts.height / 2;
    opts.title = opts.title || '';

    // Margin between the actual visualization and SVG borders
    opts.margin = (opts.margin === undefined) ? {} : opts.margin;
    opts.margin.top = opts.margin.top || 10;
    opts.margin.bottom = opts.margin.bottom || 30;
    opts.margin.right = opts.margin.right || 30;
    opts.margin.left = opts.margin.left || 30;

    // Rounded rectangular nodes
    opts.round = opts.round || false;
    // Node color
    opts.nodeColor = opts.color || '#1d91c0';
    // Use a node color range instead of a single color
    opts.useColorRange = opts.useColorRange || false;
    // Node color opacity
    opts.nodeOpacity = opts.opacity || 1.0;
    // Node outline color
    opts.nodeStroke = opts.stroke || '#000';
    // Node outline thickness
    opts.nodeStrokeWidth = opts.nodeStrokeWidth || '1px';
    opts.nodeWidth = opts.nodeWidth || 90;
    opts.nodeHeight = opts.nodeHeight || 160;
    // Edge color
    opts.edgeColor = opts.color || '#1d91c0';
    // Edge color opacity
    opts.edgeOpacity = opts.opacity || 1.0;
    // Edge outline color
    opts.edgeStroke = opts.stroke || '#000';
    opts.edgeWidth = opts.edgeWidth || '1px';

    return opts;
};

var fixLayout = function(nodes, opts) {

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

        //countMap[i] = layerCounts[node.depth];
        countMap[node.id] = layerCounts[node.depth];
        nodeCounts[node.depth] = 1;
    }

    // Cushioning between nodes in the same layer
    var nodePadding = 10;
    //var layerSize = ((node.radius * 2) + 10) * maxCount + 50;
    var diameter = maxRadius * 2;

    for (var i = 0; i < nodes.length; i++) {
        
        //node[i].x = (diameter * nodeCounts[node.depth]) + nodePadding;

        nodeCounts[nodes[i].depth] += 1;
    }

    return {
        //maxRadius: maxRadius,
        maxCount: maxCount,
        nodeCounts: nodeCounts,
        countMap: countMap
    };
};

/**
 * Returns a path string which draws a rounded rectangle.
 *
 * arguments
 *      x: starting x coordinate (top left corner)
 *      y: starting y coordinate (top left corner)
 *      width: rectangle width
 *      height: rectangle height
 *      r: corner radius
 */
var makeRoundRect = function(x, y, width, height, r) {

    return 'M' + (x + r) + ',' + (y + r)
         + 'h' + (width - r * 2)
         + 'a' + r + ',' + r + ' 0 0 1 ' + r + ',' + r
         + 'v' + (height - 2 * r)
         + 'a' + r + ',' + r + ' 0 0 1 ' + -r + ',' + r
         + 'h' + (r * 2 - width)
         + 'a' + r + ',' + r + ' 0 0 1 ' + -r + ',' + -r
         + 'V' + (y + r * 2)
         + 'a' + r + ',' + r + ' 1 0 1 ' + r + ',' + -r
         ;
};

/**
 * Draws a hierarchical graph using d3js. 
 *
 * arguments
 *      data: a list of objects where each object contains the following fields
 *          name: a string identifier for a particular data point
 *          value: the numeric value of this data point
 *          color: a string representing a custom color for this data point
 *      opts: the options structure
 *
 */
var hierarchy = function(graph, opts) {

    opts = validateOptions(opts);

    var width = opts.width - opts.margin.left - opts.margin.right;
    var height = opts.height - opts.margin.top - opts.margin.bottom;

    var svg = d3.select('body')
        .append('svg')
        .attr('height', opts.height)
        .attr('width', opts.width);

    var simulation = d3.forceSimulation()
        .force('charge', d3.forceManyBody().strength(opts.charge))
        //
        // This lets us link nodes using their identifiers and not array
        // indices
        .force('link', d3.forceLink().id(function(d) { 
            return d.id;
        }).distance(opts.distance))
        //
        //;
        //.force('x', d3.forceX(width / 2))
        //.force('y', d3.forceY(height / 2))
        ;

    // Generate the color range if applicable
    if (opts.useColorRange) {

        var cmin = d3.min(graph.nodes, function(n) { return n.colorValue; });
        var cmax = d3.max(graph.nodes, function(n) { return n.colorValue; });

        opts.nodeColor = d3.interpolate('#DDDDFF', '#0000FF');
        opts.colorScale = d3.scaleLinear()
            .domain([cmin, cmax])
            .range([0, 1]);
    }

    var edges = svg.selectAll('line')
        .data(graph.edges)
        .enter()
        .append('line')
        .attr('shape-rendering', 'auto')
        .attr('stroke', function(d) {
            if (d.stroke === undefined)
                return opts.edgeStroke;

            return d.stroke;
        })
        .attr('stroke-width', function(d) {
            if (d.width === undefined)
                return opts.edgeWidth;

            return d.width;
        })
        ;

     var nodeGroups = svg.selectAll('g')
         .data(graph.nodes)
         .enter()
         .append('g');

    if (opts.round) {

        var nodes = nodeGroups
            .append('path')
            //.attr('d', function(d) {
            //    console.log(d);
            //    return makeRoundRect(d.x, d.y, opts.nodeWidth, opts.nodeHeight, 20);
            //})
            .attr('class', 'node')
            .attr('shape-rendering', 'auto')
            .attr('stroke', function(d) {
                if (d.stroke === undefined)
                    return opts.nodeStroke;

                return d.stroke;
            })
            .attr('stroke-width', function(d) {
                if (d.strokeWidth === undefined)
                    return opts.nodeStrokeWidth;

                return d.strokeWidth;
            })
            .style('fill', function(d) {

                if (opts.useColorRange)
                    return opts.nodeColor(opts.colorScale(d.colorValue));

                if (d.color)
                    return d.color;

                return opts.nodeColor;
            });

    } else {
        var nodes = nodeGroups
            //.data(graph.nodes)
            //.enter()
            .append('rect')
            .attr('class', 'node')
            .attr('height', opts.nodeHeight)
            .attr('width', opts.nodeWidth)
            .attr('shape-rendering', 'auto')
            .attr('stroke', function(d) {
                if (d.stroke === undefined)
                    return opts.nodeStroke;

                return d.stroke;
            })
            .attr('stroke-width', function(d) {
                if (d.strokeWidth === undefined)
                    return opts.nodeStrokeWidth;

                return d.strokeWidth;
            })
            .style('fill', function(d) {

                if (opts.useColorRange)
                    return opts.nodeColor(opts.colorScale(d.colorValue));

                if (d.color)
                    return d.color;

                return opts.nodeColor;
            })
            ;
    }

     var widthMap = {};
     var heightMap = {};

     //var nodeText = nodes
     var nodeText = nodeGroups
         .append('text')
         .style('font-family', 'Helvetica, Arial, sans-serif')
         .style('font-size', '12px')
         .style('color', '#000')
         .attr('height', opts.nodeHeight)
         .attr('width', opts.nodeWidth)
         //.attr('dx', function(d) { return 5; })
         //.attr('text-anchor', 'start')
         .each(function(d) {
         //.text(function(d) {

             var textLabel = d3.select(this)
                 .append('tspan')
                 .attr('x', 0)
                 .attr('y', 0)
                 .attr('dx', 5)
                 //.attr('dy', function() { return (i * 14) + 15; })
                 .attr('dy', function() { return (0 * 14) + 15; })
                 .text(d.label);


             //widthMap[d.name] = this.getComputedTextLength();
             widthMap[d.id] = this.getBoundingClientRect().width + 5;
             // + 5 for padding, + 15 for species circles
             heightMap[d.id] = this.getBoundingClientRect().height + 25;
         })
         ;

    if (!opts.round) {
    d3.selectAll('.node')
       .attr('width', function(d) { return widthMap[d.id] + 'px'; })
       .attr('height', function(d) { return heightMap[d.id] + 'px'; })
       ;
    }

    var shit = fixLayout(graph.nodes, opts);
    var layerSize = ((opts.nodeHeight * 2) + 10) * shit.maxCount + 120;

    simulation.on('tick', function() {

        // This forces the graph to conform to a static layout
        //d3Nodes.attr('transform', function(d, i) {
        nodes.attr('transform', function(d, i) {
            var layerChunk = layerSize / shit.nodeCounts[d.depth];

            // Uncomment to position the graph from left to right
            //
            //// Y axis node positions are determined based on the total number
            //// of nodes in a given layer/column. This enforces even spacing.
            //d.y = layerChunk * shit.countMap[d.id];
            //// +130 is extra padding between columns/layers
            //d.x = d.depth * (opts.nodeWidth + 130);

            d.y = d.depth * (opts.nodeWidth + 20);
            d.x = layerChunk * shit.countMap[d.id];
        if (opts.round) {
            nodes.attr('d', function(d) {

            var dx = d.x - (widthMap[d.id] / 2);
            var dy = d.y - (heightMap[d.id] / 2);
            //d3.select(this).attr('d', function(d2) {
                //return makeRoundRect(d.x, d.y, opts.nodeHeight, opts.nodeWidth, 20);
                //return makeRoundRect(d.x, d.y, widthMap[d.id], heightMap[d.id], 20);
                return makeRoundRect(dx - 10, dy - 20, widthMap[d.id] + 10, heightMap[d.id], 20);
            });
        }
            return '';
        });


        edges
            .attr('x1', function(d) { return d.source.x; })
            .attr('y1', function(d) { return d.source.y; })
            .attr('x2', function(d) { return d.target.x; })
            .attr('y2', function(d) { return d.target.y; });

        nodeGroups.attr('transform', function(d) {
        //nodes.attr('transform', function(d) {

            // Dividing by width and height ensures the edges converge on the
            // center of the box node rather than the top left corner
            //var dx = d.x - (nodeWidth / 2);
            //var dy = d.y - (nodeHeight / 2);
            var dx = d.x - (widthMap[d.id] / 2);
            var dy = d.y - (heightMap[d.id] / 2);

            //console.log(d.x);
            //console.log(d.y);

            return 'translate(' + dx + ',' + dy + ')';
        });

        /* Required for round
         *
        nodeText.attr('transform', function(d) {

            var dx = d.x - (widthMap[d.id] / 2);
            var dy = d.y - (heightMap[d.id] / 2);

            return 'translate(' + dx + ',' + dy + ')';
        });
        *
        */

    });


    simulation.nodes(graph.nodes);
    simulation.force('link').links(graph.edges);
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

