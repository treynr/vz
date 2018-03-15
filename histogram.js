/**
 * file: histogram.js
 * desc: d3js 4.0 implementation of histograms.
 * vers: 0.1.0
 * auth: TR
 */

/*
 * The data structure necessary for this viz can be one of two objects
 * depending on how the user wants to draw the histogram. 
 * If the user wants a basic histogram layout, the data structure is 
 * simply a list of values that are automatically binned and plotted:
 * 
 *      [1, 2, 2, 8, 1, 9, 3, 5, 5, 5, 5, 7, 3]
 *
 * If the user wants to select bins themselves, a list of objects containing x
 * and y axis values are provided instead.
 *
 *      [{x: 4, y: 1}, {x: 2, y: 2}, {x: 3, y: 1}]
 *
 */

var histogram = function() {

    var exports = {},
        data = null,
        svg = null,
        svgLabel = '',
        // Top level bar chart title
        title = '',
        // SVG width
        width = 800,
        // SVG height
        height = 500,
        // Margin object
        margin = {top: 40, right: 30, bottom: 50, left: 50},
        // Bar chart color
        barColor = '#98ABC5',
        // Bar chart edge color
        barStroke = '#222222',
        // Bar stroke width
        strokeWidth = 1,
        // Boolean to draw or hide the outer x-axis ticks
        outerTicks = false,
        // Width of each bar in the chart
        barWidth = null,
        // Use a grouped bar chart style
        grouped = null,
        // List of data groups
        groups = null,
        // List of group bar colors
        groupColors = null,
        // Generate the chart as a histogram
        asHistogram = false,
        // The number of bins to use
        numBins = 15,
        // An array containing custom binning values to use
        customBins = [],
        // Drops the last bin which is sometimes auto generated by d3
        dropLastBin = false,
        // Calculate histogram y-axis values as percentages
        binPercent = false,
        // Overlay chart with normalized distribution
        distribution = false,
        // Axis text size
        fontSize = '11px',
        // X-axis text
        xText = '',
        // X-axis text padding
        xTextPad = 35,
        // Y-axis text
        yText = ''
        // Y-axis text padding
        yTextPad = 35,
        // Y-axis padding
        yAxisPad = 35,
        // Padding between bars
        innerPadding = 0.1,
        // Scale for the x-axis
        xScale = null,
        // Grouped chart scale for the x-axis
        xGroupScale = null,
        // Histogram scale for the x-axis
        xHistoScale = null,
        xTickFormat = d3.format(''),
        // Scale for the y-axis
        yScale = null,
        // Format string for y-axis labels
        yTickFormat = null,
        // Y-axis tick values
        yTickValues = null,
        // Y-axis tick values
        yDomain = null,
        // Display values at the peak of each bar
        barValues = false,
        // Bar chart object
        chart = null,
        textures = [],
        xDomain = null,
        // Binned data generated by the histogram
        bins = null
        ;

    /** private **/

    var getWidth = function() { return width - margin.left - margin.right; };
    var getHeight = function() { return height - margin.top - margin.bottom; };

    var makeScales = function() {

        xScale = d3.scaleLinear()
            .domain(xDomain ? xDomain : d3.extent(data))
            .nice()
            // margin.left instead of 0 to make extra room for y-axis scale
            .rangeRound([margin.left, getWidth()]);

        yScale = d3.scaleLinear()
            .rangeRound([getHeight(), 0]);
    };

    var makeHistogram = function() {

        bins = d3.histogram()
            .domain(xScale.domain())
            .thresholds(xScale.ticks(20))
            (data);

        yScale.domain([0, d3.max(bins, d => d.length)])
            .nice();
    };

    var makeAxes = function() {

        xAxis = d3.axisBottom(xScale)
            .tickSizeOuter(outerTicks ? 6 : 0)
            .tickFormat(xTickFormat)
            ;

        yAxis = d3.axisLeft(yScale)
            .tickFormat(yTickFormat)
            .tickValues(yTickValues)
            ;

        var xAxisObject = svg.append('g')
            .attr('class', 'axis')
            .attr('transform', function() {
                return 'translate(0' + ',' + (getHeight() + 1) + ')';
            })
            //.style('font', '11px sans-serif')
            .style('font-family', 'sans-serif')
            .style('font-size', fontSize)
            //.style('font-weight', opts.fontWeight)
            .style('font-weight', 'normal')
            .style('fill', 'none')
            .call(xAxis)
            ;

        xAxisObject.append('text')
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
            ;

        yAxisObject.append('text')
            // Weird x, y argumetnns cause of the -90 rotation
            .attr('x', function() { return -getHeight() / 2; })
            .attr('y', yTextPad)
            .attr('fill', '#000')
            .attr('transform', 'rotate(-90)')
            .style('text-anchor', 'middle')
            .text(yText)
            ;

            //yAxisObject.select('.domain').remove();
            //xAxisObject.select('.domain').remove();
        //return [xAxisObject, yAxisObject];
    };


    var makeCustomBins = function() {

        var b = [];

        for (var i = 2; i <= 12; i++)
            //console.log(i + ', ' + Math.pow(i, 2));
            b.push(Math.pow(2, i));

        return b;
    };

    var checkGrouped = function() {

        if (data[0]['group'] === undefined)
            return false;

        return true;
    };

    var returnKeyUniques = function(key) {
        var unique = {};

        for (var i = 0; i < data.length; i++)
            unique[data[i][key]] = 0;

        return Object.keys(unique);
    };

    var drawBars = function() {

        var bar = svg.selectAll('.bar')
            .data(bins)
            .enter()
            .append('g')
            .attr('class', 'bar')
            //.attr('transform', d => {
            //    return 'translate(' + xScale(d.x0) + ',' + yScale(d.length) + ')';
            //})
            ;

        bar.append('rect')
            //.attr('x', 1)
            .attr('x', d => xScale(d.x0) + 1)
            .attr('y', d => yScale(d.length) + 1)
            //.attr('width', xScale(bins[0].x1) - xScale(bins[0].x0) - 1)
            .attr('width', d => xScale(d.x1) - xScale(d.x0) - 1)
            //.attr('height', d => getHeight() - yScale(d.length))
            .attr('height', d => yScale(0) - yScale(d.length))
            .attr('fill', barColor)
            .attr('stroke', barStroke)
            .attr('stroke-width', strokeWidth)
            ;

            /*
            bar.append('rect')
                .attr('x', function(d) { return xScale(d.group); })
                // +1 so the bar converges with the x-axis
                .attr('y', function(d) { return yScale(d.y) + 1; })
                .attr('width', function(d) { 
                    return xScale.bandwidth();
                })
                .attr('height', function(d) { 
                    return getHeight() - yScale(d.y); 
                })
                .style('shape-rendering', 'crispEdges')
                .style('stroke', barStroke)
                .style('stroke-width', strokeWidth)
                .style('fill', function(d) { 
                    console.log(d);
                    if (textures.length > 0 && d.texture)
                        return d.texture.url();

                    return colorScale(d.group); 
                })
                ;
                if (barValues) {
                    bar.append('text')
                        .attr('x', function(d) { 
                            if (asHistogram)
                                return xScale(d.x1); 
                            else
                                return xScale(d.x); 
                        })
                        // +1 so the bar converges with the x-axis
                        .attr('y', function(d) { 
                            if (asHistogram) {
                                if (binPercent)
                                    return yScale(d.length / binPercent) + 1;
                                else
                                    return yScale(d.length) + 1;
                            } else { 
                                return yScale(d.y) + 1; 
                            }
                        })
                        .style('font-family', 'sans-serif')
                        .style('font-size', '15px')
                        //.style('font-weight', 'bold')
                        .text(function(d) {
                            return Math.round(d.y * 1000) / 1000;
                        });
                }
        }
        */

    };

    var drawText = function() {

    };


    var mean = function(data) {

        return data
            .reduce(function(a, d) { return a + d; }) / data.length;
        //return data
        //    .map(function(d) { return d.y; })
        //    .reduce(function(a, d) { return a + d; }) / data.length;
    };

    var variance = function(data, mean) {

        return data
            .map(function(d) { return Math.pow(d - mean, 2); })
            .reduce(function(a, d) { return a + d; }) / data.length;
        //return data
        //    .map(function(d) { return Math.pow(d.y - mean, 2); })
        //    .reduce(function(a, d) { return a + d; }) / data.length;
    };

    var pdf = function(d, mean, variance, total) {

        //return (1 / Math.sqrt(2 * variance * Math.PI)) * 
        //       Math.exp(-(Math.pow(d - mean, 2) / (2 * variance)));
        return (1 / Math.sqrt(2 * variance * Math.PI)) * 
               Math.exp(-(Math.pow(d - mean, 2) / (2 * variance))) ;//*
               //d * total;
    };

    var drawdist = function() {

        var binVals = bins
            .reduce(function(a, b) { return a.concat(b); }, [])
            .sort(function(a, b) { return a - b; });
        var u = mean(binVals);
        var v = variance(binVals, u);
        var binned = [];
        var probs = [];

        for (var i = 0; i < bins.length; i++) {
            for (var j = 0; j < bins[i].length; j++) {

            }
        }
        var allVals = [];
        var binned = [];

        for (var i = 0; i < bins.length; i++) {
            for (var j = 0; j < bins[i].length; j++) {

                allVals.push(i + 1);
            }
        }
        var u = mean(allVals);
        var v = variance(allVals, u);
        var allProbs = [];

        for (var i = 0; i < bins.length; i++) {
            var probs = 0.0;
            for (var j = 0; j < bins.length; j++) {

                //probs.push(pdf(bins[i][j], u, v));
                //probs += pdf(bins[i][j], u, v);
                probs += pdf(i+1, u, v);
            }
            allProbs.push(probs);
            binned.push({x: i+1, y: probs});
            probs = 0.0;
        }
        var xDistScale = d3.scaleLinear()
            .domain([d3.min(allVals), d3.max(allVals)])
            .range([margin.left, getWidth()])
            ;
        var yDistScale = d3.scaleLinear()
            .domain([d3.min(allProbs), d3.max(allProbs)])
            .range([getHeight(), 0])
            ;

        var line = d3.line()
            .curve(d3.curveCatmullRom.alpha(0.5))
            .x(function(d) { return xDistScale(d.x); })
            .y(function(d) { return yDistScale(d.y); })
            ;

        var svgLines = svg.selectAll('aline')
            .data([binned])
            .enter()
            .append('g')
            .attr('transform', function(d) { 
                return 'translate(0,0)'; 
            })
            ;

        svgLines.append('path')
            .attr('d', function(d) { return line(d); })
            .style('stroke', '#BB0000')
            .style('stroke-width', 3)
            .style('stroke-dasharray', '5,5')
            .style('fill', 'none');

        console.log(allVals);
        console.log(binned);

        console.log(u);
        console.log(v);
    };

    var drawDistribution = function() {

        var bs = bins.map(function(b) { return b.length; });
        var tot = bs.reduce(function(a, b) { return a + b; });
        var dbins = [];
        var minlen = -1;

        for (var i = 0; i < bins.length; i++) {
            if (minlen === -1 || bins[i].length < minlen)
                minlen = bins[i].length;

            dbins.push({
                x0: bins[i].x0,
                x1: bins[i].x1,
                length: bins[i].length
            });
        }

        var line = d3.line()
            .curve(d3.curveCatmullRom.alpha(0.5))
            //.curve(d3.curveCatmullRom)
            //.x(function(d) { return xScale(d.x); })
            //.x(function(d) { console.log(xHistoScale((d.x0 + d.x1)/2)); return xHistoScale((d.x0 + d.x1) / 2); })
            //.x(function(d) { console.log(xHistoScale((d.x0 + d.x1)/2)); return xHistoScale((d.x0 + d.x1) / 2); })
            //.x(function(d) { return xScale((d.x0 + d.x1) / 2); })
            .x(function(d) { return xScale(d.x1) + (xScale.bandwidth() / 2); })
            //.x(function(d) { return xHistoScale((d.x0 + d.x1) / 2); })
            //.y(function(d) { return yScale(pdf(d.y, u, v)); })
            //.y(function(d) { return yScale(pdf(d.y, u, v, tot)); })
            //.y(function(d) { return yScale(d.y); })
            //.y(function(d) { console.log(yScale(d.length / tot)); return yScale(d.length); })
            //.y(function(d) { return yScale(d.length / tot) - (yScale(minlen / tot) - getHeight()); })
            .y(function(d) { return yScale(d.length / tot); })
            ;


        var svgLines = svg.selectAll('aline')
            .data([dbins])
            .enter()
            .append('g')
            .attr('transform', function(d) { 
                return 'translate(0,0)'; 
            })
            ;

        svgLines.append('path')
            .attr('d', function(d) { return line(d); })
            .style('stroke', '#BB0000')
            .style('stroke-width', 3)
            .style('stroke-dasharray', '5,5')
            .style('fill', 'none');


    };

    var drawText = function() {

        if (svgLabel) {

            svg.append('text')
                .attr('transform', 'translate(-' + margin.left + ',-' + margin.top + ')')
                .attr('x', 10)
                .attr('y', 15)
                .style('font-family', 'sans-serif')
                .style('font-size', '15px')
                .style('font-weight', 'bold')
                .text(svgLabel);
        }

        if (title) {

            var ma = margin.left + margin.right;
            svg.append('text')
                //.attr('transform', 'translate(-' + margin.left  + ',-' + margin.top + ')')
                .attr('transform', 'translate(' + 0  + ',-' + margin.top + ')')
                //.attr('x', getWidth() / 2)
                //.attr('x', getWidth() / 2)
                .attr('y', margin.top / 2)
                .attr('x', function() { return (margin.left + getWidth()) / 2; })
                //.attr('y', 45)
                .attr('text-anchor', 'middle')
                .style('font-family', 'sans-serif')
                .style('font-size', '13px')
                .style('font-weight', 'normal')
                .text(title);
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

        if (textures)
            for (var i = 0; i < textures.length; i++)
                svg.call(textures[i]);

        //grouped = checkGrouped();

        makeScales();
        makeHistogram();

        makeAxes();
        drawBars();
        //drawDistribution();
        drawText();

        //if (distribution)
        //    drawdist();
        return exports;
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

    exports.barStroke = function(_) {
        if (!arguments.length) return barStroke;
        barStroke = _;
        return exports;
    };

    exports.strokeWidth = function(_) {
        if (!arguments.length) return strokeWidth;
        strokeWidth = +_;
        return exports;
    };

    exports.barColor = function(_) {
        if (!arguments.length) return barColor;
        barColor = _;
        return exports;
    };

    exports.barWidth = function(_) {
        if (!arguments.length) return barWidth;
        barWidth = +_;
        return exports;
    };

    exports.outerTicks = function(_) {
        if (!arguments.length) return outerTicks;
        outerTicks = _;
        return exports;
    };

    exports.xTickFormat = function(_) {
        if (!arguments.length) return xTickFormat;
        xTickFormat = _;
        return exports;
    };

    exports.grouped = function(_) {
        if (!arguments.length) return grouped;
        grouped = _;
        return exports;
    };

    exports.numBins = function(_) {
        if (!arguments.length) return numBins;
        numBins = +_;
        return exports;
    };

    exports.asHistogram = function(_) {
        if (!arguments.length) return asHistogram;
        asHistogram = _;
        return exports;
    };

    exports.customBins = function(_) {
        if (!arguments.length) return customBins;
        customBins = _;
        return exports;
    };

    exports.dropLastBin = function(_) {
        if (!arguments.length) return dropLastBin;
        dropLastBin = _;
        return exports;
    };

    exports.binPercent = function(_) {
        if (!arguments.length) return binPercent;
        binPercent = _;
        return exports;
    };

    exports.yAxisPad = function(_) {
        if (!arguments.length) return yAxisPad;
        yAxisPad = +_;
        return exports;
    };

    exports.yTextPad = function(_) {
        if (!arguments.length) return yTextPad;
        yTextPad = +_;
        return exports;
    };

    exports.xTextPad = function(_) {
        if (!arguments.length) return xTextPad;
        xTextPad = +_;
        return exports;
    };

    exports.innerPadding = function(_) {
        if (!arguments.length) return innerPadding;
        innerPadding = +_;
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

    exports.yTickFormat = function(_) {
        if (!arguments.length) return yTickFormat;
        yTickFormat = _;
        return exports;
    };

    exports.yText = function(_) {
        if (!arguments.length) return yText;
        yText = _;
        return exports;
    };

    exports.title = function(_) {
        if (!arguments.length) return title;
        title = _;
        return exports;
    };

    exports.svgLabel = function(_) {
        if (!arguments.length) return svgLabel;
        svgLabel = _;
        return exports;
    };

    exports.groupColors = function(_) {
        if (!arguments.length) return groupColors;
        groupColors = _;
        return exports;
    };

    exports.textures = function(_) {
        if (!arguments.length) return textures;
        textures = _;
        return exports;
    };

    exports.distribution = function(_) {
        if (!arguments.length) return distribution;
        distribution = _;
        return exports;
    };

    exports.yTickValues = function(_) {
        if (!arguments.length) return yTickValues;
        yTickValues = _;
        return exports;
    };

    exports.yDomain = function(_) {
        if (!arguments.length) return yDomain;
        yDomain = _;
        return exports;
    };

    exports.barValues = function(_) {
        if (!arguments.length) return barValues;
        barValues = _;
        return exports;
    };

    exports.xDomain = function(_) {
        if (!arguments.length) return xDomain;
        xDomain = _;
        return exports;
    };

    return exports;
};

