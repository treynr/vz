/**
 * file: hive.js
 * desc: d3js 4.0 implementation of hive plots.
 * vers: 0.1.0
 * auth: TR
 */

/**
 * Hive module for visualizing complex networks. At minimum, it requires a 
 * list of node and edge objects. Each node object can have the following
 * properties:
 *      <NODE OBJECT>
 *          id <string>             unique node ID
 *          class <string>          class ID used to label/color similar nodes
 *          category <string>       category ID used to group similar nodes
 *          color <string>          node fill color
 *          stroke <string>         stroke color
 *          strokeWidth <string>    stroke width in pixels
 *          opacity <float>         node opacity [0, 1]
 */
viz.hive = function() {

    var hive = {},
        // SVG height in pixels
        height = 500,
        // SVG width in pixels
        width = 800,
        // Margin between SVG edges and the visualization
        margin = {top: 10, bottom: 30, left: 30, right: 30},
        // Hive plot inner circle radius
        innerRadius = 45,
        // Hive plot outer circle radius
        outerRadius = 400,
        // Nodes in the graph being visualized
        nodes = [],
        // Edges in the graph being visualized
        edges = [],
        // SVG object being drawn
        svg = null,
        // Nodes organized by the category they belong to
        nodesByCat = null,
        // Nodes organized by the category they belong to
        categoryAngle = null,
        // Nodes organized by the category they belong to
        categoryColor = null
        ;

    hive.height = function(_) {
        if (!arguments.length)
            return height;

        height = +_;

        return hive;
    };

    hive.width = function(_) {
        if (!arguments.length)
            return width;

        width = +_;

        return hive;
    };

    hive.nodes = function(_) {
        if (!arguments.length)
            return nodes;

        nodes = _;

        return hive;
    };

    hive.edges = function(_) {
        if (!arguments.length)
            return edges;

        edges = _;

        return hive;
    };

    /**
     * Draws the hive plot.
     */
    hive.draw = function() {

        svg = d3.select('body')
            .append('svg')
            .attr('height', height)
            .attr('width', width)
            .append('g')
            .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')
            ;

        //var nbc = determineCategories();

        //console.log(nbc);
        drawAxes();
        drawNodes();
    };

    var degrees = function(d) {

        return d * (Math.PI / 180);
    };

    /**
     * Iterates over the node list, determines the number of unique
     * categories the nodes can be lumped into and returns the nodes organized
     * by their category. Additionally this function assigns node counts per
     * category and indices for each node in each category.
     */
    var determineCategories = function() {

        nodesByCat = d3.nest()
            .key(function(d) { return d.category; })
            .entries(nodes)
            ;

        nodesByCat.forEach(function(d) {
            var count = 0;

            d.values.forEach(function(v) {

                v.index = count++;
            });

            d.count = count;
        });
    };

    var categoryAngles = function() {

        //d3.scaleOrdinal
        categoryAngle = d3.scaleBand()
            .domain(nodesByCat.map(function(d) { return d.key; }))
            .range([0, 360]);
    };

    var categoryColors = function() {

        //d3.scaleOrdinal
        categoryColor = d3.scaleOrdinal()
            .domain(nodesByCat.map(function(d) { return d.key; }))
            .range(d3.schemeCategory10);
    };

    var drawNodes = function() {

        categoryAngles();
        categoryColors();
        console.log(categoryColor);

        var radius = d3.scaleLinear()
            .domain(d3.extent(nodesByCat, function(d) { return d.count; }))
            .range([innerRadius, outerRadius]);

        svg.append('g')
            .attr('class', 'nodes')
            .selectAll('.node')
            .data(nodes)
            .enter()
            .append('g')
            .append('circle')
            .attr('class', 'node')
            //.style('fill', '#ff0000')
            .style('fill', function(d) { return categoryColor(d.category); })
            .style('stroke', '#000')
            .style('stroke-width', '1px')
            .attr('transform', function(d, i) {

                return 'rotate(' + categoryAngle(d.category) + ')';
            })
            .attr('cx', function(d) { return radius(d.index); })
            .attr('r', 4)
            ;

    };
    /**
     * Draws the axes (dependent on the number of categories) for the plot.
     */
    var drawAxes = function() {

        //var nbc = determineCategories();
        determineCategories();
        //var angle = d3.scale.ordinal()
        //    .domain(nbc.map(function(d) { return d.key; }))
        //    .range(
        
        //console.log(nbc);
        //console.log(d3.extent(nbc, function(d) { return d.values.length; }));
        // Determines x1, y1 positions for each line on the invisible inner
        // circle of the hive plot.
        var radius = d3.scaleLinear()
            .domain(d3.extent(nodesByCat, function(d) { return d.count; }))
            .range([innerRadius, outerRadius]);
        
        svg.selectAll('.axis')
            .data(nodesByCat)
            .enter()
            .append('line')
            .style('stroke', '#000')
            .style('stroke-width', '3px')
            .attr('class', 'axis')
            .attr('transform', function(d, i) {

                var space = 360 / nodesByCat.length;
                return 'rotate(' + (i * space) + ')';
                //return 'rotate(' + degrees(i * space) + ')';
            })
            .attr('x1', radius(1))
            .attr('x2', function(d) { return radius(d.values.length + 2); });
    };


    return hive;
};

