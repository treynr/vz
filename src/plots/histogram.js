/**
  * file: histogram.js
  * desc: d3js 4.0 implementation of histograms.
  * auth: TR
  */

import {extent, histogram, max, min, mean, variance} from 'd3-array';
import {axisBottom, axisLeft} from 'd3-axis';
import {scaleLinear} from 'd3-scale';
import {select} from 'd3-selection';
import {line, curveCatmullRom} from 'd3-shape';

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

export default function() {

    var exports = {},
        data = null,
        svg = null,
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
        // The number of bins to use
        numBins = 20,
        // Overlay chart with normalized distribution
        distribution = false,
        font = 'sans-serif',
        // Axis text size
        fontSize = 13,
        // X-axis text
        xLabel = '',
        // X-axis text padding
        xLabelPad = 35,
        // Y-axis text
        yLabel = '',
        // Y-axis text padding
        yLabelPad = -35,
        // Y-axis padding
        yAxisPad = 35,
        xAxis = null,
        yAxis = null,
        // Padding between bars
        innerPadding = 0.1,
        // Scale for the x-axis
        xScale = null,
        // Grouped chart scale for the x-axis
        xGroupScale = null,
        // Histogram scale for the x-axis
        xHistoScale = null,
        xTickFormat = null,
        // Scale for the y-axis
        yScale = null,
        // Format string for y-axis labels
        yTickFormat = null,
        // Y-axis tick values
        yTickValues = null,
        // Y-axis tick values
        yDomain = null,
        noXLine = false,
        noYLine = false,
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

    /**
      * Generates the X and Y scales used for the plot. The input domain for
      * the Y scale is not specified since it is dependent on how the data is
      * binned.
      */
    var makeScales = function() {

        xScale = scaleLinear()
            .domain(xDomain ? xDomain : extent(data))
            .nice()
            .rangeRound([margin.left, getWidth()]);

        yScale = scaleLinear()
            .rangeRound([getHeight(), 0]);
    };

    /**
      * Generates the histogram bins for the given data set.
      */
    var makeHistogram = function() {

        bins = histogram()
            .domain(xScale.domain())
            .thresholds(xScale.ticks(numBins))
            (data);

        yScale.domain([0, max(bins, d => d.length)])
            .nice();
    };

    /**
      * Creates and renders the X and Y axes including text and/or labels.
      */
    var makeAxes = function() {

        xAxis = axisBottom(xScale)
            .tickSizeOuter(outerTicks ? 6 : 0)
            .tickFormat(xTickFormat);

        yAxis = axisLeft(yScale)
            .tickFormat(yTickFormat)
            .tickValues(yTickValues);

        let xAxisObject = svg.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(0, ${getHeight() + 1})`)
            .style('font-family', font)
            .style('font-size', `${fontSize}px`)
            .style('font-weight', 'normal')
            .style('fill', 'none')
            .call(xAxis)
            ;

        xAxisObject.append('text')
            .attr('x', (margin.left + getWidth()) / 2)
            .attr('y', 45)
            .attr('fill', '#000')
            .style('text-anchor', 'middle')
            .text(xLabel)
            ;

        let yAxisObject = svg.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(${yAxisPad}, 0)`)
            .style('font-family', font)
            .style('font-size', `${fontSize}px`)
            .style('font-weight', 'normal')
            .style('fill', 'none')
            .call(yAxis)
            ;

        yAxisObject.append('text')
            // Weird x, y argumetnns cause of the -90 rotation
            .attr('x', (-getHeight() / 2))
            .attr('y', yLabelPad)
            .attr('fill', '#000')
            .attr('transform', 'rotate(-90)')
            .style('text-anchor', 'middle')
            .text(yLabel)
            ;

        if (noXLine)
            xAxisObject.select('.domain').remove();

        if (noYLine)
            yAxisObject.select('.domain').remove();
    };

    /**
      * Renders the histogram bars.
      */
    var drawBars = function() {

        let bar = svg.selectAll('.bar')
            .data(bins)
            .enter()
            .append('g')
            .attr('class', 'bar');

        bar.append('rect')
            .attr('x', d => xScale(d.x0) + 1)
            .attr('y', d => yScale(d.length) + 1)
            .attr('width', d => xScale(d.x1) - xScale(d.x0) - 1)
            .attr('height', d => yScale(0) - yScale(d.length))
            .attr('fill', barColor)
            .attr('stroke', barStroke)
            .attr('stroke-width', strokeWidth);
    };

    var drawdist = function() {

        let allVals = bins.map((d, i) => d.map(_ => i + 1))
            .reduce((a, b) => a.concat(b), []);

        let binAvg = mean(allVals);
        let binVar = variance(allVals);
        var binned = [];
        let allProbs = [];

        for (var i = 0; i < bins.length; i++) {
           
            let probs = 0.0;

            for (var j = 0; j < bins.length; j++) {

                probs += (1 / Math.sqrt(2 * binVar * Math.PI)) * 
                         Math.exp(-(Math.pow((i+1) - binAvg, 2) / (2 * binVar)));
            }

            allProbs.push(probs);
            binned.push({x: i+1, y: probs});
        }

        let xDistScale = scaleLinear()
            .domain(extent(allVals))
            .rangeRound([margin.left, getWidth()]);

        let yDistScale = scaleLinear()
            .domain(extent(allProbs))
            .range([getHeight(), 0]);

        let distLine = line()
            .curve(curveCatmullRom.alpha(0.1))
            .x(d => xDistScale(d.x))
            .y(d => yDistScale(d.y));

        let svgLines = svg.selectAll('distribution')
            .data([binned])
            .enter()
            .append('g');

        svgLines.append('path')
            .attr('d', d => distLine(d))
            .style('stroke', '#BB0000')
            .style('stroke-width', 3)
            .style('stroke-dasharray', '5,5')
            .style('fill', 'none');
    };

    var drawText = function() {

        if (title) {

            var ma = margin.left + margin.right;
            svg.append('text')
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

    exports.getWidth = getWidth;
    exports.getHeight = getHeight;

    exports.draw = function() {

        svg = select('body')
            .append('svg')
            .attr('height', height)
            .attr('width', width)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
            ;

        if (textures)
            for (var i = 0; i < textures.length; i++)
                svg.call(textures[i]);

        makeScales();
        makeHistogram();

        makeAxes();
        drawBars();
        drawText();

        if (distribution)
            drawdist();

        return exports;
    };

    /** setters/getters **/

    exports.svg = function(_) { return svg; };

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

    exports.yAxisPad = function(_) {
        if (!arguments.length) return yAxisPad;
        yAxisPad = +_;
        return exports;
    };

    exports.yLabelPad = function(_) {
        if (!arguments.length) return yLabelPad;
        yLabelPad = +_;
        return exports;
    };

    exports.xLabelPad = function(_) {
        if (!arguments.length) return xLabelPad;
        xLabelPad = +_;
        return exports;
    };

    exports.noXLine = function(_) {
        if (!arguments.length) return noXLine;
        noXLine = _;
        return exports;
    };

    exports.noYLine = function(_) {
        if (!arguments.length) return noYLine;
        noYLine = _;
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

    exports.xLabel = function(_) {
        if (!arguments.length) return xLabel;
        xLabel = _;
        return exports;
    };

    exports.yTickFormat = function(_) {
        if (!arguments.length) return yTickFormat;
        yTickFormat = _;
        return exports;
    };

    exports.yLabel = function(_) {
        if (!arguments.length) return yLabel;
        yLabel = _;
        return exports;
    };

    exports.title = function(_) {
        if (!arguments.length) return title;
        title = _;
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

    exports.xDomain = function(_) {
        if (!arguments.length) return xDomain;
        xDomain = _;
        return exports;
    };

    return exports;
};

