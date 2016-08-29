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
        categoryColor = null,
        // Nodes organized by the category they belong to
        classColor = null,
        // Nodes organized by the category they belong to
        axisScale = null,
        // Nodes organized by the category they belong to
        nodeMap = {}
        ;

    hive.height = function(_) {
        if (!arguments.length) return height;
        height = +_;
        return hive;
    };

    hive.width = function(_) {
        if (!arguments.length) return width;
        width = +_;
        return hive;
    };

    hive.nodes = function(_) {
        if (!arguments.length) return nodes;
        nodes = _;
        return hive;
    };

    hive.edges = function(_) {
        if (!arguments.length) return edges;
        edges = _;
        return hive;
    };

    hive.innerRadius = function(_) {
        if (!arguments.length) return innerRadius;
        innerRadius = +_;
        return hive;
    };

    hive.outerRadius = function(_) {
        if (!arguments.length) return outerRadius;
        outerRadius = +_;
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
        drawEdges();
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
            var count = 0,
                //lastClass = '';
                lastClass = d.values[0].class;

            d.values.forEach(function(v) {

                if (lastClass != v.class) {

                    lastClass = v.class;
                    count += 2;
                }

                //v.index = ++count;
                v.index = count++;

                nodeMap[v.id] = v;
            });

            d.count = count - 1;
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

    var classColors = function() {

        var nodesByClass = d3.nest()
            .key(function(d) { return d.class; })
            .entries(nodes);

        classColor = d3.scaleOrdinal()
            .domain(nodesByClass.map(function(d) { return d.key; }))
            .range(d3.schemeCategory10);
    };

    var makeAxisScale = function() {

        var extent = d3.extent(nodesByCat, function(d) { return d.count; });
        var aMin = extent[0],
            aMax = extent[1];
        
        axisScale = d3.scaleLinear()
            .domain([aMin, aMax + 1])
            .range([innerRadius, outerRadius]);
    };

    /**
     * Updates edge objects with proper radius and angle values based on the
     * nodes they connect.
     */
    var updateEdegs = function() {

        edges.forEach(function(d) {

            d.sourceNode = nodeMap[d.source];
            d.targetNode = nodeMap[d.target];
        });
    };

    var drawNodes = function() {

        classColors();

        svg.append('g')
            .attr('class', 'nodes')
            .selectAll('.node')
            .data(nodes)
            .enter()
            .append('g')
            .append('circle')
            .attr('class', 'node')
            .style('fill', function(d) { return classColor(d.class); })
            .style('stroke', '#000')
            .style('stroke-width', '1px')
            .attr('transform', function(d, i) {
                return 'rotate(' + categoryAngle(d.category) + ')';
            })
            .attr('cx', function(d) { return axisScale(d.index); })
            .attr('r', 4)
            ;
    };

    var drawEdges = function() {

        //var line = d3.line()
        //    .angle(function(d) { return categoryAngle(d.category); })
        //    .radius(function(d) { return axisScale(d.node.index); })
        //    .curve(d3.curveBasis)
        //    ;
        updateEdegs();

        var line = d3.radialLine()
            //.angle(function(d) { return categoryAngle(d.category); })
            //.radius(function(d) { return axisScale(d.node.index); })
            //.angle(function(d) { console.log(d.category); return categoryAngle(d.category); })
            //.angle(function(d) { return categoryAngle(d.angle); })
            //.radius(function(d) { return axisScale(d.radius); })
            //.radius(function(d) { return (d.radius); })
            //.angle(function(d) { return (d.angle); })
            .radius(function(d) { return Math.cos(degrees(d.angle)) * d.radius; })
            .angle(function(d) { return Math.sin(degrees(d.angle)) * d.radius; })
            .curve(d3.curveBundle.beta(1))
            //.curve(d3.curveBasis)
            ;
           
        line = d3.line()
            //.angle(function(d) { return categoryAngle(d.category); })
            //.radius(function(d) { return axisScale(d.node.index); })
            //.angle(function(d) { console.log(d.category); return categoryAngle(d.category); })
            //.x(function(d) { return axisScale(d.radius); })
            //.y(function(d) { return categoryAngle(d.angle); })
            //.x(function(d) { return (d.radius); })
            //.y(function(d) { return (d.angle); })
            .x(function(d) { return Math.cos(degrees(d.angle)) * d.radius; })
            .y(function(d) { return Math.sin(degrees(d.angle)) * d.radius; })
            .curve(d3.curveBundle.beta(1))
            //.curve(d3.curveBasis)
            //.curve(d3.curveCatmullRom.alpha(1))
            ;

        edges.forEach(function(d) {

            var edge = [
                //{angle: d.targetNode.category, radius: d.targetNode.index},
                //{angle: d.sourceNode.category, radius: d.sourceNode.index}
                {angle: categoryAngle(d.sourceNode.category), radius: axisScale(d.sourceNode.index)},
                {angle: categoryAngle(d.targetNode.category), radius: axisScale(d.targetNode.index)}
            ];

            //if (edge[0].angle < edge[1].angle) {
            //if (axisScale(edge[1].radius) < axisScale(edge[0].radius)) {
            if (edge[1].angle < edge[0].angle) {
            //if (categoryAngle(edge[1].angle) < categoryAngle(edge[0].angle)) {

                var x = edge[0];
                edge[0] = edge[1];
                edge[1] = x;
            }

            //if (edge[1].angle - edge[0].angle > Math.PI)
            //    edge[0].angle += 2 * Math.PI;

            if (count === 0) {
            svg.append('path')
                .datum(edge)
                .attr('d', line)
                .style('stroke', '#000')
                .style('stroke-width', '1px')
                ;
            }
            //count++;
            /* this sorta works
            svg
                .append('line')
                .datum(edge)
                .style('stroke', '#000')
                .style('stroke-width', '1px')
                .attr('class', 'edge')
                .attr('x1', function(d) { return axisScale(d[0].radius); })
                .attr('y1', function(d) { return categoryAngle(d[0].angle); })
                .attr('x2', function(d) { return axisScale(d[1].radius); })
                .attr('y2', function(d) { return categoryAngle(d[1].angle); })
            */
        });

        //svg.append('g')
        //svg.append('path')
        //    .datum(edges)
        //    //.data(edges)
        //    //.enter()
        //    //.append('path')
        //    .attr('d', line)
        //    //.attr('d', function(d) { console.log(d); return line; })
        //    ;
       // svg.append('g')
       //     .attr('class', 'edges')
       //     .selectAll('.edge')
       //     .data(edges)
       //     .enter()
       //     .append('path')
       //     //.attr('d', line)
       //     .attr('d', function(d) { console.log(d); return line; })
       //     ;
    };

    /**
     * Draws the axes (dependent on the number of categories) for the plot.
     */
    var drawAxes = function() {

        //var nbc = determineCategories();
        determineCategories();
        categoryAngles();
        makeAxisScale();
        //var angle = d3.scale.ordinal()
        //    .domain(nbc.map(function(d) { return d.key; }))
        //    .range(
        
        svg.selectAll('.axis')
            .data(nodesByCat)
            .enter()
            .append('line')
            .style('stroke', '#000')
            .style('stroke-width', '3px')
            .attr('class', 'axis')
            .attr('transform', function(d, i) {
                return 'rotate(' + categoryAngle(d.key) + ')';
            })
            //.attr('x1', axisScale(0))
            .attr('x1', function(d) { return axisScale(axisScale.domain()[0] - 1); })
            .attr('x2', function(d) { return axisScale(d.count + 1); });
    };


    return hive;
};

