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
        drawEdges();
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

            //d.sourceNode = nodeMap[d.source];
            //d.targetNode = nodeMap[d.target];
            d.source = {node: nodeMap[d.source], category: nodeMap[d.source].category};
            d.target = {node: nodeMap[d.target], category: nodeMap[d.target].category};
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

        updateEdegs();

        //var line = d3.radialLine()
        //    .radius(function(d) { return Math.cos(degrees(d.angle)) * d.radius; })
        //    .angle(function(d) { return Math.sin(degrees(d.angle)) * d.radius; })
        //    .curve(d3.curveBundle.beta(1))
        //    ;
           
       var line = d3.line()
            //.x(function(d) { return Math.cos(degrees(d.angle)) * d.radius; })
            //.y(function(d) { return Math.sin(degrees(d.angle)) * d.radius; })
            .x(function(d) { return d.x;})//Math.cos(degrees(d.angle)) * d.radius; })
            .y(function(d) { return d.y;})//Math.sin(degrees(d.angle)) * d.radius; })
            .curve(d3.curveBundle.beta(1))
            ;

        edges.forEach(function(d) {

            var edge = [
                //{angle: d.targetNode.category, radius: d.targetNode.index},
                //{angle: d.sourceNode.category, radius: d.sourceNode.index}
                {angle: categoryAngle(d.source.category), radius: axisScale(d.source.node.index)},
                {angle: categoryAngle(d.target.category), radius: axisScale(d.target.node.index)}
            ];

            //if (edge[0].angle < edge[1].angle) {
            //if (axisScale(edge[1].radius) < axisScale(edge[0].radius)) {
            if (edge[1].angle < edge[0].angle) {
            //if (categoryAngle(edge[1].angle) < categoryAngle(edge[0].angle)) {

                var x = edge[0];
                edge[0] = edge[1];
                edge[1] = x;
            }
            /*
            var px0 = Math.cos(degrees(edge[0].angle)) * edge[0].radius;
            var py0 = Math.sin(degrees(edge[0].angle)) * edge[0].radius;
            var px1 = Math.cos(degrees(edge[1].angle)) * edge[1].radius;
            var py1 = Math.sin(degrees(edge[1].angle)) * edge[1].radius;

            var pp = d3.path();
                pp.moveTo(px0, py0);
                //pp.lineTo(px1, py1);
                //pp.quadraticCurveTo(px0, py0, px1, py1);
                pp.arcTo(px1, py1, px0, py0, 40);
                pp.closePath();
                console.log(pp.toString());
                */

            //if (edge[1].angle - edge[0].angle > Math.PI)
            //    edge[0].angle += 2 * Math.PI;

            svg.append('path')
                .datum(edge)
                .style('stroke', '#000')
                .style('stroke-width', '1px')
                .style('fill', 'none')
                .attr('d', line)
                ;
                /*
                .attr('d', function(d) {

                    var sx = Math.cos(degrees(d[0].angle)) * d[0].radius;
                    var sy = Math.sin(degrees(d[0].angle)) * d[0].radius;
                    var tx = Math.cos(degrees(d[1].angle)) * d[1].radius;
                    var ty = Math.sin(degrees(d[1].angle)) * d[1].radius;
                    var c0 = degrees(d[0].angle) + (degrees(d[1].angle) - degrees(d[0].angle)) / 3;
                    var c1 = degrees(d[1].angle) - (degrees(d[1].angle) - degrees(d[0].angle)) / 3;
                    var c0x = Math.cos(c0) * d[0].radius;
                    var c0y = Math.sin(c0) * d[0].radius;
                    var c1x = Math.cos(c1) * d[0].radius;
                    var c1y = Math.sin(c1) * d[0].radius;

                    return "M" + sx + "," + sy
                        //+ "C" + (sx + tx) / 2 + "," + sy
                        + "C" + c0x + "," + c0y
                        //+ " " + (sx + tx) / 2 + "," + ty
                        + " " + c1x + "," + c1y
                        + " " + sx + "," + ty;
                /*
                    return "M" + d.source.y + "," + d.source.x
                        + "C" + (d.source.y + d.target.y) / 2 + "," + d.source.x
                        + " " + (d.source.y + d.target.y) / 2 + "," + d.target.x
                        + " " + d.target.y + "," + d.target.x;
                        */
                //})
                ;
        });
      
        /*
        svg.selectAll('.edge')
            .data(edges)
            .enter()
            .append('path')
            .style('stroke', '#000')
            .style('stroke-width', '1px')
            .style('fill', 'none')
            .attr('d', link()
                .angle(function(d) { return degrees(categoryAngle(d.category)); })
                .radius(function(d) { return axisScale(d.node.index); }))
            // Super hack-ish but Bostock's link code won't work without it.
            // Other than that we use my edge code, but it doesn't look as good
            // since it doesn't generate curves, just straight lines
            .attr('transform', function(d, i) {
                return 'rotate(' + -270 + ')';
            })
            ;
        */

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

        function link() {
  var source = function(d) { return d.source; },
      target = function(d) { return d.target; },
      angle = function(d) { return d.angle; },
      startRadius = function(d) { return d.radius; },
      endRadius = startRadius,
      arcOffset = -Math.PI / 2;

  function link(d, i) {
    var s = node(source, this, d, i),
        t = node(target, this, d, i),
        x;
    if (t.a < s.a) x = t, t = s, s = x;
    if (t.a - s.a > Math.PI) s.a += 2 * Math.PI;
    var a1 = s.a + (t.a - s.a) / 3,
        a2 = t.a - (t.a - s.a) / 3;
    return s.r0 - s.r1 || t.r0 - t.r1
        ? "M" + Math.cos(s.a) * s.r0 + "," + Math.sin(s.a) * s.r0
        + "L" + Math.cos(s.a) * s.r1 + "," + Math.sin(s.a) * s.r1
        + "C" + Math.cos(a1) * s.r1 + "," + Math.sin(a1) * s.r1
        + " " + Math.cos(a2) * t.r1 + "," + Math.sin(a2) * t.r1
        + " " + Math.cos(t.a) * t.r1 + "," + Math.sin(t.a) * t.r1
        + "L" + Math.cos(t.a) * t.r0 + "," + Math.sin(t.a) * t.r0
        + "C" + Math.cos(a2) * t.r0 + "," + Math.sin(a2) * t.r0
        + " " + Math.cos(a1) * s.r0 + "," + Math.sin(a1) * s.r0
        + " " + Math.cos(s.a) * s.r0 + "," + Math.sin(s.a) * s.r0
        : "M" + Math.cos(s.a) * s.r0 + "," + Math.sin(s.a) * s.r0
        + "C" + Math.cos(a1) * s.r1 + "," + Math.sin(a1) * s.r1
        + " " + Math.cos(a2) * t.r1 + "," + Math.sin(a2) * t.r1
        + " " + Math.cos(t.a) * t.r1 + "," + Math.sin(t.a) * t.r1;
  }

  function node(method, thiz, d, i) {
      console.log(method);
      console.log(thiz);
      console.log(angle);
    var node = method.call(thiz, d, i),
        a = +(typeof angle === "function" ? angle.call(thiz, node, i) : angle) + arcOffset,
        r0 = +(typeof startRadius === "function" ? startRadius.call(thiz, node, i) : startRadius),
        r1 = (startRadius === endRadius ? r0 : +(typeof endRadius === "function" ? endRadius.call(thiz, node, i) : endRadius));
    return {r0: r0, r1: r1, a: a};
  }

  link.source = function(_) {
    if (!arguments.length) return source;
    source = _;
    return link;
  };

  link.target = function(_) {
    if (!arguments.length) return target;
    target = _;
    return link;
  };

  link.angle = function(_) {
    if (!arguments.length) return angle;
    angle = _;
    return link;
  };

  link.radius = function(_) {
    if (!arguments.length) return startRadius;
    startRadius = endRadius = _;
    return link;
  };

  link.startRadius = function(_) {
    if (!arguments.length) return startRadius;
    startRadius = _;
    return link;
  };

  link.endRadius = function(_) {
    if (!arguments.length) return endRadius;
    endRadius = _;
    return link;
  };

  return link;
}
