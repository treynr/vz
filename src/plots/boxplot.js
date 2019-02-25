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
        // d3 axis object for the x-axis
        xAxis = null,
        // X value scale
        xScale = null,
        // d3 axis object for the y-axis
        yAxis = null,
        // Y value scale
        yScale = null,

        /** protected **/

        // SVG object
        svg = null,

        /** public **/

        // Color to use when filling in each boxplot
        boxFill = '#FFFFFF',
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
        font = 'sans-serif',
        // X and y axis font size
        fontSize = 12,
        // X and y axis font weight
        fontWeight = 'normal',
        // Margin object
        margin = {top: 40, right: 30, bottom: 50, left: 50},
        outlierFill = 'none',
        outlierRadius = 2,
        outlierStroke = '#000000',
        outlierStrokeWidth = 1,
        // Rotates x-axis labels so longer labels fit
        rotateXLabels = false,
        // If true, draws outliers
        showOutliers = false,
        // If true, colors in each individual boxplot using colors from the
        // colors array variable
        useColor = false,
        // SVG width
        width = 900,
        // X value domain
        xDomain = null,
        // X-axis label
        xLabel = '',
        // Padding in pixels for the x-axis label
        xLabelPad = 40,
        xTickFormat = null,
        // Y value domain
        yDomain = null,
        // Y-axis label
        yLabel = '',
        // Niceify the y-axis scale
        yNice = true,
        // d3 scale type to use for the x-axis
        yScaleFunction = scaleLinear,
        // Number of y-axis ticks
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
      * Returns the first quartile for the given set of values.
      */
    var getQ1 = function(values) { return quantile(values, 0.25); };

    /** 
      * Returns the third quartile for the given set of values.
      */
    var getQ3 = function(values) { return quantile(values, 0.75); };

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

        yScale = yScaleFunction()
            .domain(yDomain)
            .rangeRound([getHeight(), 0]);

        if (yNice)
            yScale.nice();
    };

    let makeAxes = function() {

        // An outer tick size of 0 disables outer ticks which looks weird on this 
        // chart
        xAxis = axisBottom(xScale)
            .ticks(xDomain.length, xTickFormat)
            .tickSizeOuter(0);

        yAxis = axisLeft(yScale)
            .ticks(yTicks, yTickFormat);
    };

    /** 
      * Creates the x and y axis objects and renders them.
      */
    let renderAxes = function() {

        let xAxisObject = svg.append('g')
            .attr('class', 'x-axis')
            .attr('fill', 'none')
            .attr('transform', `translate(0, ${getHeight()})`)
            .call(xAxis);

        xAxisObject.selectAll('text')
            .attr('dx', rotateXLabels ? '.35em' : '')
            .attr('text-anchor', rotateXLabels ? 'start' : 'middle')
            .attr('transform', rotateXLabels ? 'rotate(-320)' : '');

        xAxisObject.append('text')
            .attr('class', 'x-axis-label')
            .attr('x', getWidth() / 2)
            .attr('y', xLabelPad)
            .attr('fill', '#000000')
            .text(xLabel);

        xAxisObject.selectAll('text')
            .attr('font', font)
            .attr('font-size', fontSize)
            .attr('font-weight', fontWeight);

        let yAxisObject = svg.append('g')
            .attr('class', 'y-axis')
            .attr('transform', 'translate(0, 0)')
            .call(yAxis);

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
            .attr('font', font)
            .attr('font-size', fontSize)
            .attr('font-weight', fontWeight);
    };

    /**
      * Adds groups to the main SVG for each box plot. The selection is stored in
      * the boxSVG variable. This is done as a function to facilitate testing.
      */
    let renderBoxSVG = function() {

        boxSvg = svg.selectAll('box')
            .data(data)
            .enter()
            .append('g');
    };

    /** 
      * Render boxes for each dataset.
      */
    var renderBoxes = function() {

        // Draws the box. The top of the box is Q3 and the bottom is Q1.
        boxSvg.append('rect')
            .attr('class', 'box')
            .attr('x', d => xScale(d.label))
            .attr('y', d => yScale(getQ3(d.values)))
            .attr('width', xScale.bandwidth())
            .attr('height', d => yScale(getQ1(d.values)) - yScale(getQ3(d.values)))
            .attr('fill', (d, i) => {

                if (!useColor)
                    return boxFill;

                if (!d.color)
                    return colors[i];

                return d.color;
            })
            .attr('shape-rendering', 'crispEdges')
            .attr('stroke', boxStroke)
            .attr('stroke-width', boxStrokeWidth);

        // Draw the median line
        boxSvg.append('line')
            .attr('class', 'median')
            .attr('x1', d => xScale(d.label))
            .attr('y1', d => yScale(median(d.values)))
            .attr('x2', d => xScale(d.label) + xScale.bandwidth())
            .attr('y2', d => yScale(median(d.values)))
            .attr('shape-rendering', 'crispEdges')
            .attr('stroke', boxStroke)
            .attr('stroke-width', boxStrokeWidth);
    };

    /**
      * Render the whisker ends of of each boxplot. The end of each whisker 
      * corresponds to the min/max data point within the 1.5 * IQR, aka a Tukey
      * boxplot.
      */
    var renderWhiskers = function() {

        let whiskers = [];

        for (let d of data) {

            let iqr = getQ3(d.values) - getQ1(d.values);
            let q1end = getQ1(d.values) - 1.5 * iqr;
            let q3end = getQ3(d.values) + 1.5 * iqr;
            let min = 0.0;
            let max = 0.0;

            // This determines the position of the Q1 whisker
            for (let j = 0; j < d.values.length; j++) {

                if (d.values[j] > q1end) {
                    min = d.values[j];

                    break;
                }

                if (j == d.values.length - 1)
                    min = q1end;
            }

            // This determines the position of the Q3 whisker
            for (let j = d.values.length - 1; j >= 0; j--) {

                if (d.values[j] < q3end) {
                    max = d.values[j];

                    break;
                }

                if (j == 0)
                    max = getQ3(d.values);
            }

            // Prevents whiskers from being drawn inside the box itself
            if (max < getQ3(d.values))
                max = getQ3(d.values);

            whiskers.push({
                label: d.label, 
                max: max,
                min: min, 
                q1: getQ1(d.values),
                q3: getQ3(d.values),
            });
        }

        // Draws the Q1 whisker
        svg.selectAll('whiskers')
            .data(whiskers)
            .enter()
            .append('line')
            .attr('class', 'q1-whisker')
            .attr('x1', d => xScale(d.label) + xScale.bandwidth() / 4)
            .attr('y1', d => yScale(d.min))
            .attr('x2', d => xScale(d.label) + (xScale.bandwidth() / 4) * 3)
            .attr('y2', d => yScale(d.min))
            .attr('shape-rendering', 'auto')
            .attr('stroke', boxStroke)
            .attr('stroke-width', boxStrokeWidth);

        // Draws the Q3 whisker
        svg.selectAll('whiskers')
            .data(whiskers)
            .enter()
            .append('line')
            .attr('class', 'q3-whisker')
            .attr('x1', d => xScale(d.label) + xScale.bandwidth() / 4)
            .attr('y1', d => yScale(d.max))
            .attr('x2', d => xScale(d.label) + (xScale.bandwidth() / 4) * 3)
            .attr('y2', d => yScale(d.max))
            .attr('shape-rendering', 'auto')
            .attr('stroke', boxStroke)
            .attr('stroke-width', boxStrokeWidth);

        // Draws the Q3 line to the whisker
        svg.selectAll('whiskers')
            .data(whiskers)
            .enter()
            .append('line')
            .attr('class', 'q3-whisker-line')
            .attr('x1', d => xScale(d.label) + xScale.bandwidth() / 2)
            .attr('y1', d => yScale(d.max))
            .attr('x2', d => xScale(d.label) + xScale.bandwidth() / 2)
            .attr('y2', d => yScale(d.q3))
            .attr('shape-rendering', 'auto')
            .attr('stroke', boxStroke)
            .attr('stroke-width', boxStrokeWidth);

        // Draws the Q1 line to the whisker
        svg.selectAll('whiskers')
            .data(whiskers)
            .enter()
            .append('line')
            .attr('class', 'q1-whisker-line')
            .attr('x1', d => xScale(d.label) + xScale.bandwidth() / 2)
            .attr('y1', d => yScale(d.min))
            .attr('x2', d => xScale(d.label) + xScale.bandwidth() / 2)
            .attr('y2', d => yScale(d.q1))
            .attr('shape-rendering', 'auto')
            .attr('stroke', boxStroke)
            .attr('stroke-width', boxStrokeWidth);
    };

    /**
      * Render outliers--data points outside the 1.5 * IQR range--as circles.
      */
    let renderOutliers = function() {

        // Find outliers for each plot
        let outliers = data.reduce((ac, d) => {

            let q1 = getQ1(d.values);
            let q3 = getQ3(d.values);
            let iqr = q3 - q1;
            // If the data point is outside this range, we consider it an outlier
            let q1end = q1 - 1.5 * iqr;
            let q3end = q3 + 1.5 * iqr;

            // Check each observation
            d.values.forEach(x => {
                if ((x > q3end && x > q3) || (x < q1end && x < q1))
                    ac.push({label: d.label, value: x});
            });

            return ac;

        }, []);

        let outlierSvg = svg.selectAll('outliers')
            .data(outliers)
            .enter()
            .append('g');

        outlierSvg.append('circle')
            .attr('class', 'outlier')
            .attr('cx', d => xScale(d.label) + (xScale.bandwidth() / 2))
            .attr('cy', d => yScale(d.value))
            .attr('r', outlierRadius)
            .attr('fill', outlierFill)
            .attr('stroke', outlierStroke)
            .attr('stroke-width', outlierStrokeWidth);
    };


    /** 
      * Draws the background of the plot. Currently this is just a series ofgrey lines
      * indicating ticks on the y axis.
      */
    var renderBackground = function() {

        let ticks = yScale.ticks();

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
        makeAxes();
        // Render the background first that way it doesn't sit on top of the axes
        renderBackground();
        renderAxes();

        renderBoxSVG();
        renderBoxes();
        renderWhiskers();
        
        if (showOutliers)
            renderOutliers();

        return exports;
    };

    /**
      * Setters and getters.
      */

    exports.svg = function() { return svg; };

    exports.boxFill = function(_) {
        if (!arguments.length) return boxFill;
        boxFill = _;
        return exports;
    };

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

    exports.font = function(_) {
        if (!arguments.length) return font;
        font = _;
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

    exports.outlierFill = function(_) {
        if (!arguments.length) return outlierFill;
        outlierFill = _;
        return exports;
    };

    exports.outlierRadius = function(_) {
        if (!arguments.length) return outlierRadius;
        outlierRadius = +_;
        return exports;
    };

    exports.outlierStroke = function(_) {
        if (!arguments.length) return outlierStroke;
        outlierStroke = _;
        return exports;
    };

    exports.outlierStrokeWidth = function(_) {
        if (!arguments.length) return outlierStrokeWidth;
        outlierStrokeWidth = _;
        return exports;
    };

    exports.rotateXLabels = function(_) {
        if (!arguments.length) return rotateXLabels;
        rotateXLabels = _;
        return exports;
    };

    exports.showOutliers = function(_) {
        if (!arguments.length) return showOutliers;
        showOutliers = _;
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

    exports.yNice = function(_) {
        if (!arguments.length) return yNice;
        yNice = _;
        return exports;
    };

    exports.yScaleFunction = function(_) {
        if (!arguments.length) return yScaleFunction;
        yScaleFunction = _;
        return exports;
    };

    exports.yTicks = function(_) {
        if (!arguments.length) return yTicks;
        yTicks = _;
        return exports;
    };

    // Enables testing for private methods
    if (process.env.NODE_ENV == 'development') {

        exports.makeScales = makeScales;
        exports.makeAxes = makeAxes;
        exports.renderAxes = renderAxes;
        exports.renderBoxSVG = renderBoxSVG;
        exports.renderBoxes = renderBoxes;
        exports.renderWhiskers = renderWhiskers;
        exports.renderOutliers = renderOutliers;
        exports.xAxis = () => xAxis;
        exports.xScale = () => xScale;
        exports.yScale = () => yScale;
        exports.yAxis = () => yAxis;

        exports.svg = function(_) {
            if (!arguments.length) return svg;
            svg = _;
            return exports;
        };
    }

    return exports;
}

