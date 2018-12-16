/**
  * file: boxplot.js
  * desc: d3js implementation of box plots.
  * auth: TR
  */

'use strict';

import {extent, median, quantile, ticks} from 'd3-array';
import {axisBottom, axisLeft} from 'd3-axis';
import {scaleBand, scaleLinear} from 'd3-scale';
import {interpolateCool} from 'd3-scale-chromatic';
import {select} from 'd3-selection';


export default function() {

    let exports = {},

        /** private **/

        boxSvg = null,
        // X value domain
        xDomain = null,
        // X value scale
        xScale = null,
        // Y value scale
        yScale = null,

        /** protected **/

        // SVG object
        svg = null,

        /** public **/

        boxPadding = 0.5,
        // Color of the boxplot and whisker outline
        boxStroke = '#333',
        // Width of the boxplot and whisker outline
        boxStrokeWidth = 2,
        // Colors
        colors = ticks(0.0, 1.0, 10).map(d => interpolateCool(d)),
        // Data objects
        data = null,
        // SVG height
        height = 800,
        // X and y axis font
        fontFamily = 'sans-serif',
        // X and y axis font size
        fontSize = 11,
        // X and y axis font weight
        fontWeight = 'normal',
        // Margin object
        margin = {top: 40, right: 30, bottom: 50, left: 50},
        useColor = false,
        // SVG width
        width = 900,
        // X-axis label
        xLabel = '',
        xLabelPad = 40,
        xTickFormat = null,
        // Y value domain
        yDomain = null,
        // Y-axis label
        yLabel = '',
        yTicks = 10,
        yTickFormat = null;

    /** private **/

    var getHeight = function() { return height - margin.top - margin.bottom; };
    var getWidth = function() { return width - margin.left - margin.right; };

    /** 
      * Returns the list of categories used in the plot.
      */
    var getCategories = function() { return data.map(d => d.label); };

    /** 
      * Iterates over each violin object and returns all distribution values
      * flattened into a single array.
      */
    var getAllValues = function() {
        return [].concat.apply([], data.map(d => d.values));
    };

    /** 
      * Creates the x and y axis scales using the given domains and/or values.
      * Returns the D3 scale objects in a two element array.
      */
    let makeScales = function() {

        xDomain = xDomain ? xDomain : getCategories();
        yDomain = yDomain ? yDomain : extent(getAllValues());

        xScale = scaleBand()
            .domain(xDomain)
            .rangeRound([0, getWidth()])
            .padding(boxPadding);

        yScale = scaleLinear()
            .domain(yDomain)
            .rangeRound([getHeight(), 0])
            .nice();
    };

    /** 
      * Creates the x and y axis objects and draws them. The axis objects are
      * returned as a two element array.
      */
    let renderAxes = function() {

        // An outer tick size of 0 disables outer ticks which looks weird on this chart
        let xaxis = axisBottom(xScale)
            .ticks(xDomain.length, xTickFormat)
            .tickSizeOuter(0);
        let yaxis = axisLeft(yScale).ticks(yTicks, yTickFormat);

        let xAxisObject = svg.append('g')
            .attr('class', 'x-axis')
            .attr('fill', 'none')
            .attr('transform', `translate(0, ${getHeight()})`)
            .call(xaxis);

        xAxisObject.append('text')
            .attr('class', 'x-axis-label')
            .attr('x', getWidth() / 2)
            .attr('y', xLabelPad)
            .attr('fill', '#000000')
            .attr('text-anchor', 'middle')
            .text(xLabel);

        xAxisObject.selectAll('text')
            .attr('font', fontFamily)
            .attr('font-size', fontSize)
            .attr('font-weight', fontWeight);

        let yAxisObject = svg.append('g')
            .attr('class', 'y-axis')
            .attr('transform', 'translate(0, 0)')
            .call(yaxis);

        yAxisObject.append('text')
            .attr('class', 'y-axis-label')
            // Weird x, y arguments cause of the -90 rotation
            .attr('x', -getHeight() / 2)
            .attr('y', -30)
            .attr('fill', '#000000')
            .attr('transform', 'rotate(-90)')
            .attr('text-anchor', 'middle')
            .text(yLabel);

        yAxisObject.selectAll('text')
            .attr('font', fontFamily)
            .attr('font-size', fontSize)
            .attr('font-weight', fontWeight);

        // Remove the first and last ticks
        //xAxisObject.select('.tick:first-of-type').remove();
        //xAxisObject.select('.tick:last-of-type').remove();
    };

    /*
    var drawQ1 = function() {

        svg.append('line')
            .attr('x1', d => xScale(d.label))
            .attr('y1', d => yScale(getQ1(d.values)))
            .attr('x2', d => xScale(d.label) + xScale.bandwidth())
            .attr('y2', d => yScale(getQ1(d.values)))
            .attr('shape-rendering', 'auto')
            .attr('stroke', boxStroke)
            .attr('stroke-width', boxStrokeWidth);
    };

    var drawQ3 = function() {

        svg.append('line')
            .attr('x1', d => xScale(d.label))
            .attr('y1', d => yScale(getQ3(d.values)))
            .attr('x2', d => xScale(d.label) + xScale.bandwidth())
            .attr('y2', d => yScale(getQ3(d.values)))
            .attr('shape-rendering', 'auto')
            .attr('stroke', boxStroke)
            .attr('stroke-width', boxStrokeWidth);
    };
    */

    /** 
      * Draws the interquartile range (IQR) for each violin..
      */
    var drawQuartiles = function() {

        // Draws the box. The top of the box is Q3 and the bottom is Q1.
        boxSvg.append('rect')
            .attr('x', d => xScale(d.label))
            .attr('y', d => yScale(getQ3(d.values)))
            .attr('width', xScale.bandwidth())
            .attr('height', d => yScale(getQ1(d.values)) - yScale(getQ3(d.values)))
            .attr('fill', (d, i) => {

                if (!useColor)
                    return '#FFFFFF';

                if (!d.color)
                    return colors[i];

                return d.color;
            })
            .attr('shape-rendering', 'auto')
            .attr('stroke', boxStroke)
            .attr('stroke-width', boxStrokeWidth);

        boxSvg.append('line')
            .attr('x1', d => xScale(d.label))
            .attr('y1', d => yScale(median(d.values)))
            .attr('x2', d => xScale(d.label) + xScale.bandwidth())
            .attr('y2', d => yScale(median(d.values)))
            .attr('shape-rendering', 'auto')
            .attr('stroke', boxStroke)
            .attr('stroke-width', boxStrokeWidth);
    };

    /**
      * Draws the whisker ends of the boxplots. These are points with a range
      * of 1.5 * IQR.
      */
    var drawWhiskers = function() {

        var whiskers = [];
        //var iqr = getQ3(d.values) - getQ1(d.values);
        //var q1end = getQ1(d.values) - 1.5 * iqr;
        //var q3end = getQ3(d.values) + 1.5 * iqr;
        for (var i = 0; i < data.length; i++) {

            var d = data[i];
            var iqr = getQ3(d.values) - getQ1(d.values);
            var q1end = getQ1(d.values) - 1.5 * iqr;
            var q3end = getQ3(d.values) + 1.5 * iqr;
            var min = 0.0;
            var max = 0.0;

            for (let j = 0; j < d.values.length; j++) {
                if (d.values[j] >= q1end) {
                    min = d.values[j];
                    break;
                }
            }

            for (let j = d.values.length - 1; j >= 0; j--) {
                if (d.values[j] <= q3end) {
                    max = d.values[j];
                    break;
                }
            }

            whiskers.push({
                label: d.label, 
                max: max,
                min: min, 
                q1: getQ1(d.values),
                q3: getQ3(d.values),
            });
        }

        boxSvg.selectAll('whiskers')
            .data(whiskers)
            .enter()
            .append('line')
            .attr('x1', d => xScale(d.label) + xScale.bandwidth() / 4)
            .attr('y1', d => yScale(d.min))
            .attr('x2', d => xScale(d.label) + (xScale.bandwidth() / 4) * 3)
            .attr('y2', d => yScale(d.min))
            .attr('shape-rendering', 'auto')
            .attr('stroke', boxStroke)
            .attr('stroke-width', boxStrokeWidth);

        boxSvg.selectAll('whiskers')
            .data(whiskers)
            .enter()
            .append('line')
            .attr('x1', d => xScale(d.label) + xScale.bandwidth() / 4)
            .attr('y1', d => yScale(d.max))
            .attr('x2', d => xScale(d.label) + (xScale.bandwidth() / 4) * 3)
            .attr('y2', d => yScale(d.max))
            .attr('shape-rendering', 'auto')
            .attr('stroke', boxStroke)
            .attr('stroke-width', boxStrokeWidth);

        boxSvg.selectAll('whiskers')
            .data(whiskers)
            .enter()
            .append('line')
            .attr('x1', d => xScale(d.label) + xScale.bandwidth() / 2)
            .attr('y1', d => yScale(d.max))
            .attr('x2', d => xScale(d.label) + xScale.bandwidth() / 2)
            .attr('y2', d => yScale(d.q3))
            .attr('shape-rendering', 'auto')
            .attr('stroke', boxStroke)
            .attr('stroke-width', boxStrokeWidth);

        boxSvg.selectAll('whiskers')
            .data(whiskers)
            .enter()
            .append('line')
            .attr('x1', d => xScale(d.label) + xScale.bandwidth() / 2)
            .attr('y1', d => yScale(d.min))
            .attr('x2', d => xScale(d.label) + xScale.bandwidth() / 2)
            .attr('y2', d => yScale(d.q1))
            .attr('shape-rendering', 'auto')
            .attr('stroke', boxStroke)
            .attr('stroke-width', boxStrokeWidth);
    };

    /** 
      * Returns the first quartile for the given set of values.
      */
    var getQ1 = function(values) { return quantile(values, 0.25); };

    /** 
      * Returns the third quartile for the given set of values.
      */
    var getQ3 = function(values) { return quantile(values, 0.75); };

    /** 
      * Draws the background of the plot. Currently this is just grey lines
      * indicating ticks on the y axis.
      */
    var drawBackground = function() {

        var ticks = yScale.ticks();

        // Don't draw for the first tick which is essentially the x-axis
        for (var i = 1; i < ticks.length; i++) {

            // no fucking clue why this is one pixel off
            svg.append('line')
                .attr('x1', 0)
                .attr('y1', yScale(ticks[i]) + 0)
                .attr('x2', getWidth())
                .attr('y2', yScale(ticks[i]) + 1)
                .attr('shape-rendering', 'crispEdges')
                .attr('stroke', '#ddd')
                .attr('stroke-width', 1);
        }
    };

    /** public **/

    /** 
      */
    exports.draw = function() {

        svg = select('body')
            .append('svg')
            .attr('height', height)
            .attr('width', width)
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        // Sorted values are necessary for the quantile functions later on
        data.forEach(d => { d.values.sort((a, b) => a - b ); });

        makeScales();
        drawBackground();
        renderAxes();

        boxSvg = svg.selectAll('box')
            .data(data)
            .enter()
            .append('g');

        //drawDistribution();
        drawQuartiles();
        drawWhiskers();
        //drawCI();
        //drawMedian();

        return exports;
    };

    /**
      * Setters and getters.
      */

    exports.svg = function() { return svg; };

    exports.boxPadding = function(_) {
        if (!arguments.length) return boxPadding;
        boxPadding = _;
        return exports;
    };

    exports.boxStrokeWidth = function(_) {
        if (!arguments.length) return boxStrokeWidth;
        boxStrokeWidth = +_;
        return exports;
    };

    exports.boxStroke = function(_) {
        if (!arguments.length) return boxStroke;
        boxStroke = _;
        return exports;
    };

    exports.data = function(_) {
        if (!arguments.length) return data;
        data = _;
        return exports;
    };

    exports.fontFamily = function(_) {
        if (!arguments.length) return fontFamily;
        fontFamily = _;
        return exports;
    };

    exports.fontSize = function(_) {
        if (!arguments.length) return fontSize;
        fontSize = +_;
        return exports;
    };

    exports.fontWeight = function(_) {
        if (!arguments.length) return fontWeight;
        fontWeight = _;
        return exports;
    };

    exports.height = function(_) {
        if (!arguments.length) return height;
        height = +_;
        return exports;
    };

    exports.width = function(_) {
        if (!arguments.length) return width;
        width = +_;
        return exports;
    };

    exports.xDomain = function(_) {
        if (!arguments.length) return xDomain;
        xDomain = _;
        return exports;
    };

    exports.xLabel = function(_) {
        if (!arguments.length) return xLabel;
        xLabel = _;
        return exports;
    };

    exports.yDomain = function(_) {
        if (!arguments.length) return yDomain;
        yDomain = _;
        return exports;
    };

    exports.yLabel = function(_) {
        if (!arguments.length) return yLabel;
        yLabel = _;
        return exports;
    };

    return exports;
}

