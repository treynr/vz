/**
 * file: bundle.js
 * desc: d3js 4.0 implementation of hierarchical edge bundling.
 * vers: 0.2.0
 * auth: TR
 */

// Don't fucking forget the id variables have to be strings or this thing shits
// the bed.

/**
  * The data structure necessary for this viz is an object containing two
  * fields, 'nodes' and 'edges', both of which are lists of objects. 
  * Since this is designed to visualize connections between various components
  * of a hierarchy, some nodes should represent internal clusters and others
  * are leaf-like ends. Edges are only visualized between leaves.
  * The following fields are used for node and edge objects:
  *
  * [node]
  *     id:     [required] string representing a unique ID
  *     parent: [required] parent node ID of this node
  *     name:   [optional] displayed name for this node
  *
  * [edge]
  *     source: [required] source node ID
  *     target: [required] target node ID
  *
  * So, an example input would look like this:
  *
  * var graph = {
  *     nodes: [
  *         {id: 'Cat-A', name: 'Category A', parent: ''},
  *         {id: 'Cat-B', name: 'Category B', parent: ''},
  *         {id: 'Mem-A1', name: 'A1', parent: 'Cat-A'},
  *         {id: 'Mem-A2', name: 'A2', parent: 'Cat-A'},
  *         {id: 'Mem-A3', name: 'A3', parent: 'Cat-A'},
  *         {id: 'Mem-B1', name: 'B1', parent: 'Cat-B'},
  *         {id: 'Mem-B2', name: 'B2', parent: 'Cat-B'}
  *     ],
  *     edges = [
  *         {source: 'Mem-A1', target: 'Mem-A2'},
  *         {source: 'Mem-A1', target: 'Mem-B1'},
  *         {source: 'Mem-A2', target: 'Mem-B2'},
  *         {source: 'Mem-A3', target: 'Mem-B1'}
  *     ]
  */
var bundle = function() {

    var exports = {},

        /** public **/

        // Graph data struct which should contain a key for nodes and edges
        graph = null,
        // SVG diameter (width and height)
        diameter = 960,
        // Radius used to generate the circular bundle graph
        radius = diameter / 2,
        // Inner radius of the bundle graph
        innerRadius = radius - 120,
        // Renders node name text for leaf nodes
        useNodeText = false,
        // Draws rectangles indicating upper level node groups
        useCircumference = false,
        // Draws rectangles indicating upper level node groups
        useGroupBoxes = false,
        // The width of the node group boxes
        groupBoxWidth = 5,
        // Fill color for the node group boxes
        groupBoxFill = '#555555',
        // Stroke color for the node group boxes
        groupBoxStroke = '#000000',
        // Stroke width for the node group boxes
        groupBoxStrokeWidth = 1,
        // Spacing between the start of the boxes and edges
        groupBoxSpacing = 5,
        // Separation distance between nodes of the same group
        intraSeparation = 0.5,
        // Separation distance between nodes of different groups
        interSeparation = 2,

        /** private **/

        // Root node of a d3 generated hierarchy
        rootNode = null,
        // List of node objects
        d3Nodes = null,
        // List of edge objects
        d3Edges = null,
        // SVG object
        svg = null
        ;

    /** private **/

    /**
     * Because the d3js stratify() function is fucked when it comes to
     * hierarchies and clusters.
     *
     */
    var buildHierarchy = function(nodes) {

        var map = {};

        function find(id, data) {

            var node = map[id];

            if (!node) {

                node = map[id] = data || {id: id, children: []};

                if (node.children === undefined)
                    node.children = [];

                if (id.length) {

                    node.parent = find(node.parent);
                    node.parent.children.push(node);
                }

            }

            return node;
        }

        nodes.forEach(function(d) {
            find(d.id, d);
        });

        return map[''];
    };

    /**
     * Rebuilds the user provided edge list by replacing source and target with
     * node objects generated by d3.cluster().
     *
     */
    var buildEdges = function(nodes, edges) {

		var map = {};

		nodes.forEach(function(d) {
			map[d.data.id] = d;
		});

		edges.forEach(function(d) {
			d.source = map[d.source];
			d.target = map[d.target];
		});

		return edges;
    };

    var drawNodes = function() {

        var nodes = rootNode.descendants();

        var d3Nodes = svg.append('g')
            .selectAll('.node')
            .data(nodes.filter(function(n) { return !n.children; }))
            .enter()

            /*
            .append('circle')
            .attr('r', 7)
            .attr('transform', function(d) { 

                return 'rotate(' + (d.x - 90) + ')' + 
                    'translate(' + (d.y + 8) + ',0)' + 
                    (d.x < 180 ? '' : 'rotate(180)'); 
            })
            .style('stroke', '#000')
            .style('stroke-width', 1)
            .style('fill', function(d) {
                console.log(d);
                console.log(d.data);
                return d.data.color ? d.data.color : '#000';
            })
            */

            .append('text')
            .attr('class', 'node-text')
            .attr('fill', '#000000')
            .attr('dy', '.31em')
            .attr('transform', function(d) { 

                return 'rotate(' + (d.x - 90) + ')' + 
                    'translate(' + (d.y + 8) + ',0)' + 
                    (d.x < 180 ? '' : 'rotate(180)'); 
            })
            .style('text-anchor', function(d) { 
                return d.x < 180 ? 'start' : 'end'; 
            })
            .style('font-family', 'sans-serif')
            .style('font-size', '12px')
            .style('text-decoration', function(d) {

                return d.data.textDecoration ? d.data.textDecoration : 'none';
            })
            .text(function(d) { return d.data.name; })
            ;
    };

    var drawEdges = function() {

        var edges = buildEdges(rootNode.descendants(), graph.edges);
        var line = d3.radialLine()
            .radius(function(d) { return d.y; })
            .angle(function(d) { return d.x / 180 * Math.PI; })
            .curve(d3.curveBundle.beta(0.55))
            ;

        link = svg.append('g')
            .selectAll('.link')
            .data(edges)
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', function(d) { 
                return line(d.source.path(d.target)); 
            })
			.attr('stroke', function(d) {
                if (d.color == 'steelblue')
                    //return '#feb24c';
                    return 'steelblue';
                else
                    return '#4682b4';
				return d.color ? d.color : 'steelblue';
			})
			.attr('stroke-opacity', 0.6)
			.attr('stroke-width', 
				function(d) { return d.width ? d.width : 2;
			})
			.attr('fill', 'none')
			;
    };

    var drawGroupBoxes = function() {

        var maxTextWidth = 0;

        if (useNodeText) {

            // Computes the max text width only if node names are rendered.
            // This way the drawn group boxes don't overlap the text and look
            // ugly.
            d3.selectAll('.node-text')
                .each(function(d) {

                    maxTextWidth = d3.max([
                        maxTextWidth, this.getComputedTextLength()
                    ]);
                })
        }

        var nodes = rootNode.descendants().filter(function(n) { 
            return !n.children; 
        });
        var edges = [[]];

        // Groups the coordinates of all related nodes together
        for (var i = 0; i < nodes.length - 1; i++) {
            var a = nodes[i];
            var b = nodes[i + 1];

            if (a.parent == b.parent) { 
                edges[edges.length - 1].push({
                    id: a.data.id + '-group',
                    start: a.x, 
                    end: b.x, 
                    radius: a.y,
                    tag: a.parent.data.name
                });
                    
                //edges.push({start: a.x, end: b.x, radius: a.y});
            } else {
                //edges.push([{start: a.x, end: b.x, radius: a.y}]);
                edges.push([]);
            }
        }

        edges = edges.filter(function(a) { return a.length !== 0; });

        edges.forEach(function(d, i) {

            var min = d3.min(d, function(e) { return d3.min([e.start, e.end]); });
            var max = d3.max(d, function(e) { return d3.max([e.start, e.end]); });

            edges[i] =  {
                id: d[0].id,
                start: min, 
                end: max, 
                radius: d[0].radius,
                tag: d[0].tag
            };
        });

        var arc = d3.arc()
            //.innerRadius(radius - 5)
            //.outerRadius(radius)
            .innerRadius(function(d) { 
                return d.radius + groupBoxSpacing + maxTextWidth; 
            })
            .outerRadius(function(d) { 
                return d.radius + groupBoxSpacing + groupBoxWidth + maxTextWidth;
            })
            .startAngle(function (d) { return d.start / 180 * Math.PI; })
            .endAngle(function (d) { return d.end / 180 * Math.PI; })
            ;

        link = svg.append('g')
            .selectAll('.link')
            .data(edges)
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('id', function(d) { return d.tag; })
            .attr('d', function(d) { return arc(d); })
			.style('stroke', function(d) { return groupBoxStroke; })
			.style('stroke-width', function(d) { return groupBoxStrokeWidth; })
			.style('fill', function(d) { return groupBoxFill; })
			.style('stroke-opacity', 1)
			;

        var texts = svg.selectAll('linkTexts')
            .data(edges)
            .enter()
            .append('text')
            .attr('class', 'group-text')
            .attr('dy', -5)
            .style('text-anchor', 'middle')

            //.attr('dx', '1.61em')
            .attr('transform', function(d) { 

                d.x = d.end / 180 * Math.PI;
                d.y = d.start / 180 * Math.PI;
                
                //return 'rotate(' + d.x + ')';
                //return 'rotate(' + 180 + ' ' + d.x + ' ' + d.y + ')';
                //return 'rotate(' + (d.x - 90) + ')' + 
                //    'translate(' + (d.y + 8) + ',0)' + 
                //    (d.x < 180 ? '' : 'rotate(180)'); 
            })
            //.style('text-anchor', function(d) { 
            //    return d.x < 180 ? 'start' : 'end'; 
            //})
            .style('font-family', 'sans-serif')
            .style('font-size', '12px')
            //.style('text-decoration', function(d) {

            //    return d.data.textDecoration ? d.data.textDecoration : 'none';
            //})

            .append('textPath')
            .attr('xlink:href', function(d) { return '#' + d.tag; })
            //.attr('startOffset', '0%')
            .style('text-anchor', function(d) { 
                return 'start';
            })
            .text(function(d) { return d.tag; })
            ;
    };

    var drawCircumference = function() {

        var arc = d3.arc()
            .innerRadius(innerRadius + 7)
            .outerRadius(innerRadius + 7)
            .startAngle(function (d) { return 0; })
            .endAngle(function (d) { return 360; })
            ;

        link = svg.append('g')
            .append('path')
            .attr('class', 'link')
            //.attr('d', function(d) { return line(d.source.path(d.target)); })
            //.attr('d', function(d) { return line([d.source, d.target]); })
            //.attr('d', function(d) { return arc([d.source.x, d.target.x]); })
            .attr('d', function(d) { return arc(); })
			.style('stroke', function(d) {
				//return d.color ? d.color : '#555';
				return '#555';
			})
			.style('fill', function(d) {
				//return d.color ? d.color : '#555';
				return '#555';
			})
			.attr('stroke-opacity', 1)
			.attr('stroke-width', 
				function(d) { return 2;//d.width ? d.width : 2;
			})
			;
    };

    var recalculateRadii = function() {

        radius = diameter / 2;
        innerRadius = radius - 120;
    };

    /** public **/

    exports.draw = function() {

        // Radius used to generate the circular bundle graph (d / 2)
        radius = diameter / 2;
        // Inner radius of the bundle graph
        innerRadius = radius - 120;

        svg = d3.select('body')
            .append('svg')
            .attr('height', diameter)
            .attr('width', diameter)
            .append('g')
            .attr('transform', 'translate(' + radius + ',' + radius + ')')
            ;

        var cluster = d3.cluster()
            .size([360, innerRadius])
            .separation(function(a, b) {
                return a.parent == b.parent ? intraSeparation : interSeparation;
            });

        graph.nodes = buildHierarchy(graph.nodes);
        rootNode = d3.hierarchy(graph.nodes);

        cluster(rootNode);
        drawEdges();

        if (useNodeText)
            drawNodes();

        if (useGroupBoxes)
            drawGroupBoxes();

        if (useCircumference)
            drawCircumference();
    };

    /** setters and getters **/

    exports.graph = function(_) {
        if (!arguments.length) return graph;
        graph = _;
        return exports;
    };

    exports.innerRadius = function(_) {
        if (!arguments.length) return innerRadius;
        innerRadius = +_;
        return exports;
    };

    exports.diameter = function(_) {
        if (!arguments.length) return diameter;
        diameter = +_;
        return exports;
    };

    exports.radius = function(_) {
        if (!arguments.length) return radius;
        radius = +_;
        return exports;
    };

    exports.useNodeText = function(_) {
        if (!arguments.length) return useNodeText;
        useNodeText = _;
        return exports;
    };

    exports.useCircumference = function(_) {
        if (!arguments.length) return useCircumference;
        useCircumference = _;
        return exports;
    };

    exports.useGroupBoxes = function(_) {
        if (!arguments.length) return useGroupBoxes;
        useGroupBoxes = _;
        return exports;
    };

    exports.groupBoxWidth = function(_) {
        if (!arguments.length) return groupBoxWidth;
        groupBoxWidth = +_;
        return exports;
    };

    exports.groupBoxFill = function(_) {
        if (!arguments.length) return groupBoxFill;
        groupBoxFill = _;
        return exports;
    };

    exports.groupBoxStroke = function(_) {
        if (!arguments.length) return groupBoxStroke;
        groupBoxStroke = +_;
        return exports;
    };

    exports.groupBoxStrokeWidth = function(_) {
        if (!arguments.length) return groupBoxStrokeWidth;
        groupBoxStrokeWidth = +_;
        return exports;
    };

    exports.groupBoxSpacing = function(_) {
        if (!arguments.length) return groupBoxSpacing;
        groupBoxSpacing = +_;
        return exports;
    };

    exports.font = function(_) {
        if (!arguments.length) return font;
        font = _;
        return exports;
    };

    exports.fontColor = function(_) {
        if (!arguments.length) return fontColor;
        fontColor = _;
        return exports;
    };

    exports.fontSize = function(_) {
        if (!arguments.length) return fontSize;
        fontSize = _;
        return exports;
    };

    exports.intraSeparation = function(_) {
        if (!arguments.length) return intraSeparation;
        intraSeparation = _;
        return exports;
    };

    exports.interSeparation = function(_) {
        if (!arguments.length) return interSeparation;
        interSeparation = _;
        return exports;
    };

    exports.fontWeight = function(_) {
        if (!arguments.length) return fontWeight;
        fontWeight = _;
        return exports;
    };

    return exports;
};

