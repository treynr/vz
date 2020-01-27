/**
  * file: bar.js
  * desc: Reusale d3js implementation of bar charts.
  * auth: TR
  */

'use strict';

import {extent} from 'd3-array';
import {axisBottom, axisLeft} from 'd3-axis';
import {scaleBand, scaleLinear, scaleOrdinal} from 'd3-scale';
import {select} from 'd3-selection';

/*
 * The data structure necessary for this viz is an array of objects, each of
 * which contains the following fields:
 *      x:  [REQUIRED], a discrete value representing the class or type of this
 *          object. This label is plotted on the x-axis.
 *
 *      y:  [REQUIRED], the numeric value associated with label x. Plotted on
 *          the y-axis.
 *
 *      group:  [OPTIONAL], a group label the data point belongs to. This is
 *              used to generate grouped bar charts.
 *
 * If x is not a discrete object, but some other numeric, continuous value, the
 * user can choose to bin the values together to produce a sort of histogram.
 * I say sort of because this doesn't completely use d3's histogram function.
 *
 */
export default function() {

    var exports = {},

        /** private **/

        // Scale used to color individual bars when the group option is used
        colorScale = scaleOrdinal().range([
            '#98abc5', '#8a89a6', '#7b6888', '#6b486b', '#a05d56', '#d0743c', '#ff8c00'
        ]),
        // List of data groups
        //groups = null,
        // d3 SVG object
        svg = null,
        // x-axis object
        xAxis = null,
        // Grouped chart scale for the x-axis
        xGroupScale = null,
        // Scale for the x-axis
        xScale = null,
        // y-axis object
        yAxis = null,
        // Scale for the y-axis
        yScale = null,

        /** public **/

        //
        altYAxis = false,
        // Padding between bands (bars) in the bandScale, should be [0, 1]
        bandPadding = 0.2,
        // Bar chart color
        barFill = '#98ABC5',
        // Bar chart edge color
        barStroke = '#222222',
        // Bar stroke width
        barStrokeWidth = 1,
        // Width of each bar in the chart
        barWidth = null,
        // Plot data
        data = null,
        fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif',
        // Font size for each axis and title
        fontSize = 13,
        // Use a grouped bar chart style
        grouped = null,
        // List of group bar colors
        groupColors = null,
        // SVG height
        height = 500,
        // Margin object
        margin = {top: 40, right: 30, bottom: 50, left: 50},
        // Boolean to draw or hide the outer x-axis ticks
        outerTicks = false,
        rotateXLabel = false,
        // Top level bar chart title
        title = '',
        useAltXAxis = false,
        useAltYAxis = false,
        // SVG width
        width = 800,
        xDomain = null,
        // X-axis text
        xLabel = '',
        // X-axis text padding to position it away from the x-axis
        xLabeldx = null,
        xLabeldy = null,
        xNice = false,
        // d3 format string for x-axis tick values
        xTickFormat = null,
        // Suggested number of x-axis ticks to render
        xTicks = 5,
        // X-axis tick values
        xTickValues = null,
        // Y-axis padding. Positive values shift the y-axis further to the
        // left.
        yAxisPad = 0,
        // Y-axis text
        yLabel = '',
        // Y-axis text padding. Positive values shift the y-axis label further
        // to the left.
        yLabeldy = null,
        yLabeldx = null,
        // d3 format string for y-axis tick values
        yTickFormat = null,
        noXLine = false,
        noYLine = false,
        xScaleFunction = scaleLinear,
        textures = []
        ;

    /** private **/

    let getWidth = function() { return width - margin.left - margin.right; };
    let getHeight = function() { return height - margin.top - margin.bottom; };

    let makeScales = function() {

        var ydomain = data.map(d => d.y);
        var xdomain = xDomain ? xDomain : extent(data, d => d.x);

        yScale = scaleBand()
            .domain(ydomain)
            .range([getHeight(), 0])
            .padding(bandPadding);

        xScale = xScaleFunction()
            .domain(xdomain)
            .range([0, getWidth()]);

        if (xNice)
            xScale.nice();
    };

    let makeAxes = function() {

        xAxis = axisBottom(xScale)
            .ticks(xTicks, xTickFormat);

        yAxis = axisLeft(yScale)
            .tickSizeOuter(outerTicks ? 6 : 0)
            .tickFormat(yTickFormat);

    };

    let renderAxes = function() {

        let xAxisObject = svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${getHeight() + 1})`)
            .attr('fill', 'none')
            .call(xAxis);

        xAxisObject.append('text')
            .attr('class', 'x-axis-label')
            .attr('x', () => {

                if (xLabeldx == null && useAltXAxis)
                    return getWidth();

                if (xLabeldx == null)
                    return getWidth() / 2;

                return xLabeldx;
            })
            .attr('y', () => {

                if (xLabeldy == null && useAltXAxis)
                    return -5;

                if (xLabeldy == null)
                    return 40;

                return xLabeldy
            })
            .attr('fill', '#000')
            .attr('text-anchor', useAltXAxis ? 'end' : 'middle')
            .text(xLabel);

        xAxisObject.selectAll('text')
            .attr('font-family', fontFamily)
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', 'normal');

        let yAxisObject = svg.append('g')
            .attr('class', 'y-axis')
            .attr('class', 'axis')
            .attr('transform', `translate(${yAxisPad}, 0)`)
            .attr('fill', 'none')
            .call(yAxis);

        yAxisObject.append('text')
            .attr('class', 'y-axis-label')
            // Weird x, y argumetnns cause of the -90 rotation
            .attr('x', () => {

                if (yLabeldx == null && useAltYAxis)
                    return 0;

                if (yLabeldx == null)
                    return -getHeight() / 2;

                return yLabeldx;
            })
            .attr('y', () => {

                if (yLabeldy == null && useAltYAxis)
                    return 0

                if (yLabeldy == null)
                    return -35;

                return yLabeldy;
            })
            .attr('fill', '#000')
            .attr('text-anchor', useAltYAxis ? 'start' : 'middle')
            .attr('transform', useAltYAxis ? '' : 'rotate(-90)')
            .text(yLabel);

        yAxisObject.selectAll('text')
            .attr('font-family', fontFamily)
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', 'normal');

        if (noXLine)
            xAxisObject.select('.domain').remove();

        if (noYLine)
            yAxisObject.select('.domain').remove();

        return [xAxisObject, yAxisObject];
    };

    let drawBars = function() {

        let bar = svg.selectAll('.bar')
            .data(data)
            .enter()
            .append('g')
            .attr('id', d => `${d.y.replace(/\s+/, '-').toLowerCase()}-bar`)
            .attr('class', 'bar')
            .attr('transform', 'translate(0, 0)');

        bar.append('rect')
            .attr('x', xScale.range()[0])
            // +1 so the bar converges with the x-axis
            .attr('y', d => yScale(d.y))
            .attr('width', d => xScale(d.x))
            .attr('height', yScale.bandwidth())
            .attr('shape-rendering', 'crispEdges')
            .attr('stroke', barStroke)
            .attr('stroke-width', barStrokeWidth)
            .attr('fill', d => {

                if (textures.length > 0 && d.texture)
                    return d.texture.url();

                if (d.fill)
                    return d.fill;

                return barFill;
            });
    };

    var renderConfidenceIntervals = function() {

        // Draws the confidence interval lines, first the upper line
        svg.selectAll('.bar')
            .filter(d => d.se !== undefined && d.se)
            .append('line')
            .attr('class', 'upper-ci')
            //.attr('x1', d => xScale(d.x + (1.96 * d.se)))
            //.attr('y1', d => yScale(d.y) + (yScale.bandwidth() / 2))
            //.attr('x2', d => xScale(d.x - (1.96 * d.se)))
            //.attr('y2', d => yScale(d.y) + (yScale.bandwidth() / 2))
            .attr('x1', d => xScale(d.x))
            .attr('y1', d => yScale(d.y) + (yScale.bandwidth() / 2))
            .attr('x2', d => xScale(d.x + (1.96 * d.se)) <= xScale.range()[1] ? xScale(d.x + (1.96 * d.se)) : xScale.range()[1])
            .attr('y2', d => yScale(d.y) + (yScale.bandwidth() / 2))
            .attr('shape-rendering', 'auto')
            .attr('stroke', '#000')
            .attr('stroke-width', 1);

        // Then the lower line
        svg.selectAll('.bar')
            .filter(d => d.se !== undefined && d.se)
            .append('line')
            .attr('class', 'lower-ci')
            .attr('x1', d => xScale(d.x))
            .attr('y1', d => yScale(d.y) + (yScale.bandwidth() / 2))
            //.attr('x2', d => xScale(d.x - (1.96 * d.se)))
            .attr('x2', d => xScale(d.x - (1.96 * d.se)) >= xScale.range()[0] ? xScale(d.x - (1.96 * d.se)) : xScale.range()[0])
            .attr('y2', d => yScale(d.y) + (yScale.bandwidth() / 2))
            //.attr('x1', d => xScale(d.x + (1.96 * d.se)))
            //.attr('y1', d => yScale(d.y) + (yScale.bandwidth() / 2))
            //.attr('x2', d => xScale(d.x - (1.96 * d.se)))
            //.attr('y2', d => yScale(d.y) + (yScale.bandwidth() / 2))
            .attr('shape-rendering', 'auto')
            .attr('stroke', '#000')
            .attr('stroke-width', 1);

        // Draw the whiskers at each end of the interval (first set of whiskers)
        svg.selectAll('.bar')
            .filter(d => d.se !== undefined && d.se)
            .append('line')
            .attr('class', 'upper-ci-whisker')
            .attr('x1', d => {
                return xScale(d.x + (1.96 * d.se)) <= xScale.range()[1] ?
                       xScale(d.x + (1.96 * d.se)) :
                       xScale.range()[1];
            })
            .attr('y1', d => {
                return yScale(d.y) + (yScale.bandwidth() / 2) +
                    (yScale.bandwidth() / 6);
            })
            //.attr('x2', d => xScale(d.x + (1.96 * d.se)))
            .attr('x2', d => {
                return xScale(d.x + (1.96 * d.se)) <= xScale.range()[1] ?
                    xScale(d.x + (1.96 * d.se)) :
                    xScale.range()[1];
            })
            .attr('y2', d => {
                return yScale(d.y) + (yScale.bandwidth() / 2) -
                    (yScale.bandwidth() / 6);
            })
            .attr('shape-rendering', 'auto')
            .attr('stroke', '#000')
            .attr('stroke-width', 1);

        // Second set of whiskers
        svg.selectAll('.bar')
            .filter(d => d.se !== undefined && d.se)
            .append('line')
            .attr('class', 'lower-ci-whisker')
            .attr('y1', d => {
                return yScale(d.y) + (yScale.bandwidth() / 2) +
                    (yScale.bandwidth() / 6);
            })
            //.attr('x1', d => xScale(d.x - (1.96 * d.se)))
            .attr('x1', d => {
                return xScale(d.x - (1.96 * d.se)) >= xScale.range()[0] ?
                       xScale(d.x - (1.96 * d.se)) :
                       xScale.range()[0];
            })
            .attr('y2', d => {
                return yScale(d.y) + (yScale.bandwidth() / 2) -
                    (yScale.bandwidth() / 6);
            })
            //.attr('x2', d => xScale(d.x - (1.96 * d.se)))
            .attr('x2', d => {
                return xScale(d.x - (1.96 * d.se)) >= xScale.range()[0] ?
                       xScale(d.x - (1.96 * d.se)) :
                       xScale.range()[0];
            })
            .attr('shape-rendering', 'auto')
            .attr('stroke', '#000')
            .attr('stroke-width', 1);
    };

    /** public **/

    exports.draw = function() {

        svg = select('body')
            .append('svg')
            .attr('height', height)
            .attr('width', width)
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        if (textures)
            for (var i = 0; i < textures.length; i++)
                svg.call(textures[i]);

        makeScales();
        makeAxes();
        drawBars();
        renderAxes();
        renderConfidenceIntervals();

        return exports;
    };

    /** Getters only **/
    exports._getHeight = getHeight;
    exports._getWidth = getWidth;
    exports._xScale = () => xScale;
    exports._yScale = () => xScale;

    /** setters/getters **/

    exports.svg = function() { return svg; };

    exports.data = function(_) {
        if (!arguments.length) return data;
        data = _;
        return exports;
    };

    exports.bandPadding = function(_) {
        if (!arguments.length) return bandPadding;
        bandPadding = +_;
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

    exports.margin = function(_) {
        if (!arguments.length) return margin;
        margin = _;
        return exports;
    };

    exports.marginBottom = function(_) {
        if (!arguments.length) return margin.bottom;
        margin.bottom = +_;
        return exports;
    };

    exports.marginTop = function(_) {
        if (!arguments.length) return margin.top;
        margin.top = +_;
        return exports;
    };

    exports.marginLeft = function(_) {
        if (!arguments.length) return margin.left;
        margin.left = +_;
        return exports;
    };

    exports.marginRight = function(_) {
        if (!arguments.length) return margin.right;
        margin.right = +_;
        return exports;
    };

    exports.barStroke = function(_) {
        if (!arguments.length) return barStroke;
        barStroke = _;
        return exports;
    };

    exports.barStrokeWidth = function(_) {
        if (!arguments.length) return barStrokeWidth;
        barStrokeWidth = +_;
        return exports;
    };

    exports.barFill = function(_) {
        if (!arguments.length) return barFill;
        barFill = _;
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

    exports.yTickFormat = function(_) {
        if (!arguments.length) return yTickFormat;
        yTickFormat = _;
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

    exports.yAxisPad = function(_) {
        if (!arguments.length) return yAxisPad;
        yAxisPad = +_;
        return exports;
    };

    exports.xLabeldx = function(_) {
        if (!arguments.length) return xLabeldx;
        xLabeldx = +_;
        return exports;
    };

    exports.xLabeldy = function(_) {
        if (!arguments.length) return xLabeldy;
        xLabeldy = +_;
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

    exports.fontFamily = function(_) {
        if (!arguments.length) return fontFamily;
        fontFamily = _;
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

    exports.yLabel = function(_) {
        if (!arguments.length) return yLabel;
        yLabel = _;
        return exports;
    };

    exports.useAltXAxis = function(_) {
        if (!arguments.length) return useAltXAxis;
        useAltXAxis = _;
        return exports;
    };

    exports.useAltYAxis = function(_) {
        if (!arguments.length) return useAltYAxis;
        useAltYAxis = _;
        return exports;
    };

    exports.rotateXLabel = function(_) {
        if (!arguments.length) return rotateXLabel;
        rotateXLabel = _;
        return exports;
    };

    exports.title = function(_) {
        if (!arguments.length) return title;
        title = _;
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

    exports.xDomain = function(_) {
        if (!arguments.length) return xDomain;
        xDomain = _;
        return exports;
    };

    exports.xNice = function(_) {
        if (!arguments.length) return xNice;
        xNice = _;
        return exports;
    };

    exports.xTickValues = function(_) {
        if (!arguments.length) return xTickValues;
        xTickValues = _;
        return exports;
    };

    exports.xTicks = function(_) {
        if (!arguments.length) return xTicks;
        xTicks = +_;
        return exports;
    };

    exports.xScaleFunction = function(_) {
        if (!arguments.length) return xScaleFunction;
        xScaleFunction = _;
        return exports;
    };

    exports.yLabeldx = function(_) {
        if (!arguments.length) return yLabeldx;
        yLabeldx = +_;
        return exports;
    };

    exports.yLabeldy = function(_) {
        if (!arguments.length) return yLabeldy;
        yLabeldy = +_;
        return exports;
    };

    return exports;
}

