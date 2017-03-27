//// opts {
//      xdom : [a, b]
//      ydom : [a, b]
//      dimensions : [height, width]
//      nbins : number of bins (histogram only)
//      title : title string
//      color : a color string, either a name (e.g. red) or hex (e.g. #ff0000)
//   }
//

var line = function() {

    var exports = {},
        // Line plot input data
        data = null,
        // SVG object for this plot
        svg = null,
        svgLabel = '',
        // SVG width
        width = 800,
        // SVG height
        height = 500,
        // Margin object
        margin = {top: 10, right: 30, bottom: 50, left: 50},
        // Line width
        lineWidth = 2,
        // Line color
        //lineColor = '#98ABC5',
        lineColors = d3.scaleOrdinal(d3.schemeCategory10),
        // If nodes are drawn, the node fill color
        nodeColor = '#F0F0F0',
        //nodeColors = d3.scaleCategory10(),
        // If nodes are drawn, the node stroke color
        //nodeStroke = '#98ABC5',
        nodeStrokes = d3.scaleOrdinal(d3.schemeCategory10),
        // If nodes are drawn, the width of the node's stroke
        nodeStrokeWidth = 2,
        // If nodes are drawn, the node radius
        nodeRadius = 5,
        // Draws nodes at each X-axis point if true
        useNodes = false,
        // Boolean to draw or hide the outer x-axis ticks
        outerTicks = false,
        // Axis text size
        fontSize = '11px',
        // X-axis text
        xText = '',
        // Y-axis text
        yText = ''
        // Y-axis padding
        yAxisPad = 35,
        // Scale for the x-axis
        xScale = null,
        // Scale for the y-axis
        yScale = null,
        // Start the x-scale at zero if true, otherwise use min()
        xScaleZero = null,
        // Start the y-scale at zero if true, otherwise use min()
        yScaleZero = null,
        // Format string for y-axis labels
        yFormat = ''
        // y-axis tick values
        yTickValues = null
        ;

    /** private **/

    var getWidth = function() { return width - margin.left - margin.right; };
    var getHeight = function() { return height - margin.top - margin.bottom; };

    var makeScales = function() {

        // Retrieves all elements from the list of lists and flattens
        // everything into a single array
        var xdomain = data.reduce(function(acc, d) { 
            return acc.concat(d.points.map(function(e) { return e.x; }));
        }, []);

        // Removes duplicates
        xdomain = xdomain.filter(function(item, dex) { 
            return xdomain.indexOf(item) == dex;
        });

        // for linear x scale
        xdomain = [
            xScaleZero ? 0 : d3.min(data, function(d) { 
                return d3.min(d.points, function(e) { return e.x; });
            }),
            d3.max(data, function(d) { 
                return d3.max(d.points, function(e) { return e.x; });
            })
        ];

        var ydomain = [
            yScaleZero ? 0 : d3.min(data, function(d) { 
                return d3.min(d.points, function(e) { return e.y; });
            }),
            d3.max(data, function(d) { 
                return d3.max(d.points, function(e) { return e.y; });
            })
        ];

        //xScale = d3.scaleBand()
        //    .domain(xdomain)
        //    .range([margin.left, getWidth()])
        //    .padding(0.2);

        xScale = d3.scaleLinear()
            .domain(xdomain)
            .range([margin.left, getWidth()]);

        yScale = d3.scaleLinear()
            .domain(ydomain)
            .range([getHeight(), 0]);
    };

    var makeAxes = function() {

        xAxis = d3.axisBottom(xScale)
            .tickSizeOuter(outerTicks ? 6 : 0);

        yAxis = d3.axisLeft(yScale)
            .tickValues(yTickValues)
            .tickFormat(d3.format(yFormat));

        var xAxisObject = svg.append('g')
            .attr('class', 'axis')
            .attr('transform', function() {
                return 'translate(0' + ',' + (getHeight() + 1) + ')';
            })
            .style('font-family', 'sans-serif')
            .style('font-size', fontSize)
            .style('font-weight', 'normal')
            .style('fill', 'none')
            .call(xAxis)
            .append('text')
            .attr('x', function() { return (margin.left + getWidth()) / 2; })
            .attr('y', 45)
            .attr('fill', '#000')
            .style('text-anchor', 'middle')
            .text(xText)
            ;

        var yAxisObject = svg.append('g')
            .attr('class', 'axis')
            .attr('transform', function() {
                return 'translate(' + yAxisPad + ',0)';
            })
            .style('font-family', 'sans-serif')
            .style('font-size', fontSize)
            .style('font-weight', 'normal')
            .style('fill', 'none')
            .call(yAxis)
            .append('text')
            // Weird x, y argumetnns cause of the -90 rotation
            .attr('x', function() { return -getHeight() / 2; })
            .attr('y', -50)
            .attr('fill', '#000')
            .attr('transform', 'rotate(-90)')
            .style('text-anchor', 'middle')
            .text(yText)
            ;

        return [xAxisObject, yAxisObject];
    };

    var drawLines = function() {

        var linePath = d3.line()
            //.curve(d3.curveBasis)
            .curve(d3.curveCatmullRom)
            .x(function(d) { return xScale(d.x); })
            .y(function(d) { return yScale(d.y); });

        var svgLine = svg.selectAll('aline')
            .data(data)
            .enter()
            .append('g');

        svgLine.append('path')
            .attr('d', function(d) { return linePath(d.points); })
            .style('stroke', function(d, i) { 

                if (d.color)
                    return d.color;

                return lineColors(i); 
            })
            .style('stroke-width', function(d) { 

                if (d.width)
                    return d.width;

                return lineWidth;
            })
            .style('fill', 'none')
            ;
    };

    var drawNodes = function() {

        for (var i = 0; i < data.length; i++) {

            var nodes = svg.selectAll('node')
                .data(data[i].points)
                .enter()
                .append('g');

            nodes.append('circle')
                .attr('cx', function(d) { return xScale(d.x); })
                .attr('cy', function(d) { return yScale(d.y); })
                .attr('r', function(d) {
                    if (d.radius)
                        return d.radius;

                    return nodeRadius;
                })
                .style('fill', nodeColor)
                //.style('stroke', nodeStroke)
                .style('stroke', function() { return nodeStrokes(i); })
                .style('stroke-width', nodeStrokeWidth)
                ;
        }
    };

    /** public **/

    exports.draw = function() {

        svg = d3.select('body')
            .append('svg')
            .attr('height', height)
            .attr('width', width)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
            ;

        if (svgLabel) {

            svg.append('text')
                //.attr('transform', 'translate(-' + margin.left + ',-' + margin.top + ')')
                .attr('x', 10)
                .attr('y', 15)
                .style('font-family', 'sans-serif')
                .style('font-size', '15px')
                .style('font-weight', 'bold')
                .text(svgLabel);
        }

        makeScales();
        makeAxes();
        drawLines();

        if (useNodes)
            drawNodes();
    };

    /** setters/getters **/

    exports.data = function(_) {
        if (!arguments.length) return data;
        data = _;
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

    exports.lineWidth = function(_) {
        if (!arguments.length) return lineWidth;
        lineWidth = +_;
        return exports;
    };

    exports.lineColors = function(_) {
        if (!arguments.length) return lineColors;
        lineColors = _;
        return exports;
    };

    exports.outerTicks = function(_) {
        if (!arguments.length) return outerTicks;
        outerTicks = _;
        return exports;
    };

    exports.yAxisPad = function(_) {
        if (!arguments.length) return yAxisPad;
        yAxisPad = +_;
        return exports;
    };

    exports.fontSize = function(_) {
        if (!arguments.length) return fontSize;
        fontSize = _;
        return exports;
    };

    exports.xText = function(_) {
        if (!arguments.length) return xText;
        xText = _;
        return exports;
    };

    exports.yFormat = function(_) {
        if (!arguments.length) return yFormat;
        yFormat = _;
        return exports;
    };

    exports.yText = function(_) {
        if (!arguments.length) return yText;
        yText = _;
        return exports;
    };

    exports.svgLabel = function(_) {
        if (!arguments.length) return svgLabel;
        svgLabel = _;
        return exports;
    };

    exports.nodeColor = function(_) {
        if (!arguments.length) return nodeColor;
        nodeColor = _;
        return exports;
    };

    exports.nodeStrokes = function(_) {
        if (!arguments.length) return nodeStrokes;
        nodeStrokes = d3.scaleOrdinal(_);
        return exports;
    };

    exports.nodeRadius = function(_) {
        if (!arguments.length) return nodeRadius;
        nodeRadius = +_;
        return exports;
    };

    exports.useNodes = function(_) {
        if (!arguments.length) return useNodes;
        useNodes = _;
        return exports;
    };

    exports.xScaleZero = function(_) {
        if (!arguments.length) return xScaleZero;
        xScaleZero = _;
        return exports;
    };

    exports.yScaleZero = function(_) {
        if (!arguments.length) return yScaleZero;
        yScaleZero = _;
        return exports;
    };

    exports.yTickValues = function(_) {
        if (!arguments.length) return yTickValues;
        yTickValues = _;
        return exports;
    };

    return exports;
};
