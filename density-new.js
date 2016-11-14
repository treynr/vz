/**
 * file: density.js
 * desc: d3js 4.0 implementation of density plots.
 * vers: 0.2.0
 * auth: TR
 */

var density = function() {

    var exports = {},
        svg = null,
        data = null,
        xaxis = null,
        yaxis = null,
        xscale = null,
        yscale = null,
        // Default colors for shading in areas
        colors = ['#1f77b4', '#2ca02c', '#d62728', '#9467bd', '#ff7f0e'],
        // SVG width in pixels
        width = 600,
        // SVG height in pixels
        height = 500,
        // X-axis label
        xlabel = '',
        // Y-axis label
        ylabel = '',
        margin = {top: 30, right: 30, bottom: 30, left: 30}

        ;

    /** private **/

    var getDataValues = function() {

        var values = [];

        for (var i = 0; i < data.length; i++)
            values.push(data[i].values);

        return values;
    };

    var makeAxes = function() {

        var xmin = d3.min(data.map(function (a) { return d3.min(a.values); }));
        var xmax = d3.max(data.map(function (a) { return d3.max(a.values); }));

        xscale = d3.scaleLinear()
            .domain([xmin, xmax])
            .range([0, width]);

        xaxis = d3.axisBottom(xscale);

        // Y-axis is depndent on KDE
        var dataValues = [].concat.apply([], getDataValues());

        //var kde = kernelDensity(KERNELS.epanechnikov(0.5), xscale.ticks(50));
        var kde = kernelDensity(KERNELS.triweight(0.5), xscale.ticks(50));

        //dataValues = kernelDensity(dataValues)
        //    .map(function(e, i, a) { return e[1]; });
        //dataValues = kde(dataValues)
        //    .map(function(e, i, a) { return e[1]; });
        var yValues = kde(dataValues).map(function(e) { return e[1]; })
        

        //var ymin = d3.min(dataValues);
        //var ymax = d3.max(dataValues);
        var ymax = d3.max(yValues);

        yscale = d3.scaleLinear()
            //.domain([ymin, ymax])
            .domain([0, ymax])
            .range([height - 1, 0]);

        yaxis = d3.axisLeft(yscale);
    };

    var kernelDensity = function(kernel, x) {

        return function(sample) {
            return x.map(function(x) {
                return [x, d3.mean(sample, function(v) { return kernel(x - v); })];
            });
        };
    };

    var KERNELS = {
        epanechnikov: function(scale) {
            return function(u) {
                return Math.abs(u /= scale) <= 1 ? 
                       .75 * (1 - u * u) / scale : 
                       0;
            };
        },
        triweight: function(scale) {
            return function(u) {
                return Math.abs(u /= scale) <= 1 ? 
                       (35/32) * Math.pow((1 - u * u), 3) / scale : 
                       0;
            };
        }
    };

    var drawLines = function() {

        var kde = kernelDensity(KERNELS.epanechnikov(0.5), xscale.ticks(50));

        var line = d3.line()
            .x(function(d) { return xscale(d[0]); })
            .y(function(d) { return yscale(d[1]); })
            .curve(d3.curveCatmullRom.alpha(0.5));

        for (var i = 0; i < data.length; i++) {

			svg.append('path')
				.datum(kde(data[i].values))
                .style('fill', 'none')
                .style('stroke', '#000')
                .attr('shape-rendering', 'geometricPrecision')
				.attr('d', line)
				.style('stroke-width', 1)
                ;
        }
    };

    var drawAreas = function() {

        var kde = kernelDensity(KERNELS.epanechnikov(0.5), xscale.ticks(50));

        var area = d3.area()
            .x(function(d) { return xscale(d[0]); })
            .y0(height)
            .y1(function(d) { return yscale(d[1]); })
            .curve(d3.curveCatmullRom.alpha(0.5));

        for (var i = 0; i < data.length; i++) {

			svg.append('path')
				.datum(kde(data[i].values))
				.style('opacity', 0.5)
                .style('stroke', '#000')
                .style('fill', function(d) {

                    if (d.color === undefined)
                        return colors[i];

                    return d.color;
                })
				.attr('d', area)
				;
        }
    };

    var drawAxes = function() {

		svg.append('g')
            .attr('transform', 'translate(0,' + height + ')')
			.attr('class', 'y axis')
			.call(xaxis)
            .append('text')
            .attr('x', width)
            .attr('y', -6)
            .style('text-anchor', 'end')
            .style('font', '12px sans-serif')
            .style('font-weight', 'normal')
            .style('fill', '#000')
            .text(xlabel);

		svg.append('g')
			.attr('class', 'y axis')
			.call(yaxis);
    };

    /** public **/

    exports.draw = function() {

        svg = d3.select('body')
            .append('svg')
            .attr('height', height)
            .attr('width', width)
            .attr('transform', 
                  'translate(' + margin.left + ',' + margin.top + ')')
            ;

        // Place a margin around the SVG so elements aren't cut off
        height = height - margin.top - margin.bottom;
        width = width - margin.left - margin.right;

        makeAxes();

        drawLines();
        drawAreas();
        drawAxes();

		svg.append('text')
			.attr('class', 'label')
			.style('text-anchor', 'middle')
			.attr('x', width / 2)
			.attr('y', 15)
			//.text(opts.title);
            ;
    };

    /**
     * Setters and getters.
     */

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

    exports.xlabel = function(_) {
        if (!arguments.length) return xlabel;
        xlabel = _;
        return exports;
    };

    exports.ylabel = function(_) {
        if (!arguments.length) return ylabel;
        ylabel = _;
        return exports;
    };

    exports.margin = function(_) {
        if (!arguments.length) return margin;
        margin = _;
        return exports;
    };

    exports.marginLeft = function(_) {
        if (!arguments.length) return margin.left;
        margin.left = +_;
        return exports;
    };

    exports.marginTop = function(_) {
        if (!arguments.length) return margin.top;
        margin.top = +_;
        return exports;
    };

    exports.marginBottom = function(_) {
        if (!arguments.length) return margin.bottom;
        margin.bottom = +_;
        return exports;
    };

    exports.marginRight = function(_) {
        if (!arguments.length) return margin.right;
        margin.right = +_;
        return exports;
    };

    return exports;
};

