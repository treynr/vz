/**
  * file: bar.js
  * desc: Reusale d3js implementation of bar charts.
  * auth: TR
  */

'use strict';

import {deviation, extent, max, min} from 'd3-array';
import {axisBottom, axisLeft} from 'd3-axis';
import {scaleBand, scaleLinear, scaleOrdinal} from 'd3-scale';
import {select} from 'd3-selection';
import {line, curveCatmullRom} from 'd3-shape';

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
        groups = null,
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

        // Bar chart color
        barColor = '#98ABC5',
        // Bar chart edge color
        barStroke = '#222222',
        // Bar stroke width
        barStrokeWidth = 1,
        // Width of each bar in the chart
        barWidth = null,
        // Plot data
        data = null,
        // Font size for each axis and title
        fontSize = 13,
        // Use a grouped bar chart style
        grouped = null,
        // List of group bar colors
        groupColors = null,
        // SVG height
        height = 500,
        // Margin object
        margin = {top: 40, right: 30, bottom: 60, left: 50},
        // Boolean to draw or hide the outer x-axis ticks
        outerTicks = false,
        rotateXLabel = false,
        // Top level bar chart title
        title = '',
        // SVG width
        width = 800,
        // X-axis text
        xLabel = '',
        // X-axis text padding to position it away from the x-axis
        xLabelPad = 50,
        // Y-axis padding. Positive values shift the y-axis further to the
        // left.
        yAxisPad = 40,
        // Y-axis text
        yLabel = '',
        // Y-axis text padding. Positive values shift the y-axis label further
        // to the left.
        yLabelPad = -35,
        // d3 format string for x-axis tick values
        xTickFormat = null,
        // d3 format string for y-axis tick values
        yTickFormat = null,
        // Y-axis tick values
        yTickValues = null,
        yDomain = null,
        noXLine = false,
        noYLine = false,
        yScaleFunction = scaleLinear,
        textures = []
        ;

    /** private **/

    var getWidth = function() { return width - margin.left - margin.right; };
    var getHeight = function() { return height - margin.top - margin.bottom; };

    var makeScales = function() {

        var xdomain = data.map(d => d.x);
        var ydomain = yDomain ? yDomain : extent(data, d => d.y);

        if (grouped) {

            xGroupScale = scaleBand()
                .domain(returnKeyUniques('x'))
                .rangeRound([margin.left, getWidth()])
                .paddingInner(0.1);

            xScale = scaleBand()
                .domain(returnKeyUniques('group'))
                .range([0, xGroupScale.bandwidth()])
                .padding(0.20);

        } else {

            xScale = scaleBand()
                .domain(xdomain)
                .range([margin.left, getWidth()])
                .padding(0.2);
        }

        yScale = yScaleFunction()
            .domain(ydomain)
            .nice()
            .range([getHeight(), 0]);

        if (groupColors)
            colorScale = scaleOrdinal().range(groupColors);
    };

    var makeAxes = function() {

        if (grouped) {
            xAxis = axisBottom(xGroupScale)
                .tickSizeOuter(outerTicks ? 6 : 0)
                .tickFormat(null)
                ;
        } else {
            xAxis = axisBottom(xScale)
                .tickSizeOuter(outerTicks ? 6 : 0)
                .tickFormat(xTickFormat)
                ;
        }

        yAxis = axisLeft(yScale)
            .tickFormat(yTickFormat)
            .tickValues(yTickValues)
            ;

        var xAxisObject = svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', function() {
                return 'translate(0' + ',' + (getHeight() + 1) + ')';
            })
            .attr('fill', 'none')
            .call(xAxis)
            ;

        xAxisObject.selectAll('text')
            .attr('transform', d => rotateXLabel ? 'rotate(-320)' : '')
            .attr('x', d => rotateXLabel ? 5 : 0)
            .attr('y', d => rotateXLabel ? 8 : fontSize + 2)
            .attr('dy', '.35em')
            .attr('dx', d => rotateXLabel ? '.30em' : '')
            .attr('text-anchor', d => rotateXLabel ? 'start': 'middle')
            ;

        xAxisObject.append('text')
            .attr('class', 'x-axis-label')
            .attr('x', function() { return (margin.left + getWidth()) / 2; })
            .attr('y', xLabelPad)
            .attr('fill', '#000')
            .attr('text-anchor', 'middle')
            .text(xLabel)
            ;

        xAxisObject.selectAll('text')
            .attr('font-family', 'sans-serif')
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', 'normal');

        var yAxisObject = svg.append('g')
            .attr('class', 'y-axis')
            .attr('class', 'axis')
            .attr('transform', function() {
                return 'translate(' + yAxisPad + ',0)';
            })
            .attr('fill', 'none')
            .call(yAxis);

        yAxisObject.append('text')
            .attr('class', 'y-axis-label')
            // Weird x, y argumetnns cause of the -90 rotation
            .attr('x', function() { return -getHeight() / 2; })
            .attr('y', yLabelPad)
            .attr('fill', '#000')
            .attr('transform', 'rotate(-90)')
            .attr('text-anchor', 'middle')
            .text(yLabel);

        yAxisObject.selectAll('text')
            .attr('font-family', 'sans-serif')
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', 'normal');

        if (noXLine)
            xAxisObject.select('.domain').remove();

        if (noYLine)
            yAxisObject.select('.domain').remove();

        return [xAxisObject, yAxisObject];
    };

    var returnKeyUniques = function(key) {
        var unique = {};

        for (var i = 0; i < data.length; i++)
            unique[data[i][key]] = 0;

        return Object.keys(unique);
    };

    var drawBars = function() {

        let bar = svg.selectAll('.bar')
            .data(data)
            .enter()
            .append('g')
            .attr('class', 'bar')
            .attr('transform', d => {
                if (grouped)
                    return 'translate(' + xGroupScale(d.x) + ',0)'; 
                else
                    return 'translate(0,0)'; 
            });

        bar.append('rect')
            .attr('x', d => {
                if (grouped)
                    return xScale(d.group); 
                else
                    return xScale(d.x); 
            })
            // +1 so the bar converges with the x-axis
            .attr('y', d => {
                return yScale(d.y) + 1; 
            })
            .attr('width', xScale.bandwidth()) 
            .attr('height', d => getHeight() - yScale(d.y))
            .attr('shape-rendering', 'crispEdges')
            .attr('stroke', barStroke)
            .attr('stroke-width', barStrokeWidth)
            .attr('fill', d => {

                if (textures.length > 0 && d.texture)
                    return d.texture.url();

                if (d.color)
                    return d.color;

                if (grouped)
                    return colorScale(d.group);

                return barColor;
            });
    };

    var renderConfidenceIntervals = function() {

        // Draws the confidence interval lines
        svg.selectAll('.bar')
            .filter(d => d.se !== undefined && d.se)
            .append('line')
            .attr('x1', d => xScale(d.x) + (xScale.bandwidth() / 2))
            .attr('y1', d => yScale(d.y + (1.96 * d.se)))
            .attr('x2', d => xScale(d.x) + (xScale.bandwidth() / 2))
            .attr('y2', d => yScale(d.y - (1.96 * d.se)))
            .attr('shape-rendering', 'auto')
            .attr('stroke', '#000')
            .attr('stroke-width', 1);

        // Draw the whiskers at each end of the interval
        svg.selectAll('.bar')
            .filter(d => d.se !== undefined)
            .append('line')
            .attr('x1', d => {
                return xScale(d.x) + (xScale.bandwidth() / 2) +
                       (xScale.bandwidth() / 6);
            })
            .attr('y1', d => yScale(d.y + (1.96 * d.se)))
            .attr('x2', d => {
                return xScale(d.x) + (xScale.bandwidth() / 2) -
                       (xScale.bandwidth() / 6);
            })
            .attr('y2', d => yScale(d.y + (1.96 * d.se)))
            .attr('shape-rendering', 'auto')
            .attr('stroke', '#000')
            .attr('stroke-width', 1);

        svg.selectAll('.bar')
            .filter(d => d.se !== undefined)
            .append('line')
            .attr('x1', d => {
                return xScale(d.x) + (xScale.bandwidth() / 2) +
                       (xScale.bandwidth() / 6);
            })
            .attr('y1', d => yScale(d.y - (1.96 * d.se)))
            .attr('x2', d => {
                return xScale(d.x) + (xScale.bandwidth() / 2) -
                       (xScale.bandwidth() / 6);
            })
            .attr('y2', d => yScale(d.y - (1.96 * d.se)))
            .attr('shape-rendering', 'auto')
            .attr('stroke', '#000')
            .attr('stroke-width', 1);
    };

    var drawText = function() {

        if (title) {

            var ma = margin.left + margin.right;
            svg.append('text')
                //.attr('transform', 'translate(-' + margin.left  + ',-' + margin.top + ')')
                .attr('transform', 'translate(' + 0  + ',-' + margin.top + ')')
                //.attr('x', getWidth() / 2)
                .attr('x', getWidth() / 2)
                .attr('y', margin.top / 2)
                .attr('text-anchor', 'middle')
                .attr('font-family', 'sans-serif')
                .attr('font-size', '17px')
                .attr('font-weight', 'normal')
                .text(title);
        }


    };

    /** public **/

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

        grouped = ('group' in data[0]) ? true : false;

        makeScales();

        if (grouped)
            groups = returnKeyUniques('group');

        makeAxes();
        drawBars();
        drawText();
        drawSE();

        //if (distribution)
        //    drawdist();

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

    exports.yTickValues = function(_) {
        if (!arguments.length) return yTickValues;
        yTickValues = _;
        return exports;
    };

    exports.yScaleFunction = function(_) {
        if (!arguments.length) return yScaleFunction;
        yScaleFunction = _;
        return exports;
    };

    exports.yDomain = function(_) {
        if (!arguments.length) return yDomain;
        yDomain = _;
        return exports;
    };

    return exports;
}

