/**
 * file: contour.js
 * desc: d3js implementation of contour and density plots.
 * auth: TR
 */

'use strict';

import {extent, histogram, min, max, range} from 'd3-array';
import {axisBottom, axisLeft} from 'd3-axis';
import {contours, contourDensity} from 'd3-contour';
import {geoPath} from 'd3-geo';
import {scaleLinear, scaleSequential} from 'd3-scale';
import {interpolateYlGnBu} from 'd3-scale-chromatic';
import {select} from 'd3-selection';

export default function() {

    let exports = {},

        /** public **/
        bandwidth = 30,
        cellSize = 2,
        contourSize = null,
        data = null,
        svg = null,
        // HTML element or ID the SVG should be appended to
        element = 'contour',
        // SVG width
        width = 800,
        // SVG height
        height = 500,
        // Font size
        fontSize = '12px',
        // Font family/type
        font = 'sans-serif',
        // Margin object
        margin = {top: 50, right: 50, bottom: 50, left: 50},
        // Removes the x-axis domain line if true
        noXLine = false,
        // Removes the y-axis domain line if true
        noYLine = false,
        // X-axis domain
        xDomain = null,
        // X-axis text
        xLabel = '',
        // X-axis Label padding
        xLabelPad = 35,
        // Number of ticks to render on the x-axis (only a suggestion) if no tickValues
        // are specified by the user
        xTicks = 5,
        // d3 format function for x-axis values
        xTickFormat = null,
        xTickValues = null,
        // Y-axis padding
        yAxisPad = 0,
        // Y-axis domain
        yDomain = null,
        // Y-axis Label
        yLabel = '',
        // Y-axis Label padding
        yLabelPad = -35,
        // Number of ticks to render on the y-axis (only a suggestion) if no tickValues
        // are specified by the user
        yTicks = 5,
        // d3 format function for y-axis values
        yTickFormat = null,
        // Y-axis tick values
        yTickValues = null,

        useContourDensity = true,
        usePoints = false,
        useIntervalThresholds = false,

        contourInterval = 30,
        contourFill = null,
        contourStroke = '#000000',
        contourStrokeWidth = 1,
        contourBins = 500,

        /** private **/

        // Color scale for the contours
        colorScale = null,
        // d3 contour density function
        contour = null,
        // Scale for the x-axis
        xScale = null,
        // Scale for the y-axis
        yScale = null
    ;

    /** private **/

    let getWidth = function() { return width - margin.left - margin.right; };
    let getHeight = function() { return height - margin.top - margin.bottom; };

    /**
      * Generate the x, y, and color scales for the plot. The x and y scales are used
      * for each of the axes. The color scale is used to color the contour plot based
      * on density.
      */
    let makeScales = function() {

        colorScale = scaleSequential(interpolateYlGnBu);

        xScale = scaleLinear()
            .domain(xDomain ? xDomain : extent(data.values, d => d[0]))
            .nice()
            .rangeRound([margin.left, getWidth()]);

        yScale = scaleLinear()
            .domain(yDomain ? yDomain : extent(data.values, d => d[1]))
            .nice()
            .rangeRound([getHeight(), 0]);
    };

    /**
      * Create and render the x and y axes.
      */
    let makeAxes = function() {

        //let xticks = xTickValues ?
        //             xTickValues :
        //             xScale.ticks(xTicks).concat(xScale.domain());

        //let yticks = yTickValues ?
        //             yTickValues :
        //             yScale.ticks(yTicks).concat(yScale.domain());

        //let xAxis = axisBottom(xScale)
        //    .tickFormat(xTickFormat)
        //    .tickValues(xticks);

        //let yAxis = axisLeft(yScale)
        //    .tickFormat(yTickFormat)
        //    .tickValues(yticks);
        let tickSize = 6;

        let xAxis = axisBottom(xScale)
            .ticks(xTicks, xTickFormat)
            .tickSize(tickSize);

        let yAxis = axisLeft(yScale)
            .ticks(yTicks, yTickFormat)
            .tickSize(tickSize);

        if (xTickValues)
            xAxis.tickValues(xTickValues);

        if (yTickValues)
            yAxis.tickValues(yTickValues);

        let xAxisObject = svg.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(0, ${getHeight()})`)
            .style('font-family', font)
            .style('font-size', fontSize)
            .style('fill', 'none')
            .call(xAxis);

        //xAxisObject.append('text')
        //    .attr('x', (margin.left + getWidth()) / 2)
        //    .attr('y', xLabelPad)
        //    .attr('fill', '#000')
        //    .style('text-anchor', 'middle')
        //    .text(xLabel);

        xAxisObject.append('text')
            .attr('x', getWidth())
            .attr('y', -5)
            .attr('fill', '#000')
            .style('text-anchor', 'end')
            .text(xLabel);

        let yAxisObject = svg.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(${margin.left + yAxisPad}, 0)`)
            .style('font-family', font)
            .style('font-size', fontSize)
            .style('fill', 'none')
            .call(yAxis);

        //yAxisObject.append('text')
        //    // Weird x, y argumetnns cause of the -90 rotation
        //    .attr('x', function() { return -getHeight() / 2; })
        //    .attr('y', yLabelPad)
        //    .attr('fill', '#000')
        //    .attr('transform', 'rotate(-90)')
        //    .style('text-anchor', 'middle')
        //    .text(yLabel);

        yAxisObject.append('text')
        // Weird x, y argumetnns cause of the -90 rotation
            .attr('x', -6)
            .attr('y', -5)
            .attr('fill', '#000')
            //.attr('transform', 'rotate(-90)')
            .style('text-anchor', 'start')
            .text(yLabel);

        // Remove axis lines if the option is specified
        if (noXLine)
            xAxisObject.select('.domain').remove();

        if (noYLine)
            yAxisObject.select('.domain').remove();
    };

    let overlaps = function(x1, y1, x2, y2, r = 3)  {

        return (Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)) < Math.pow(r + r, 2);
    };

    let calculateOverlaps = function() {

        for (let i = 0; i < data.values.length; i++) {
            let di = data.values[i];

            data.values[i].weight = 0;

            for (let j = i + 1; j < data.values.length; j++) {
                let dj = data.values[j];

                if (overlaps(di[0], di[1], dj[0], dj[1]))
                    data.values[i].weight += 1;
            }
        }
    };

    function scaleContour(contours, scale) {
        return contours.map(({type, value, coordinates}) => (
            {type, value, coordinates: coordinates.map(rings => (
                    rings.map(points => (
                        points.map(([x, y]) => ([
                            x*scale, y*scale
                        ]))
                    ))
                ))}
        ));
    }

    let makeContours = function() {

        let xb = histogram()
            .domain(extent(data.values, d => d[0]))
            .thresholds(contourBins);

        let yb = histogram()
            .domain(extent(data.values, d => d[1]))
            .thresholds(contourBins);

        let xbins = xb(data.values.map(d => d[0]));
        let ybins = yb(data.values.map(d => d[1]));

        let arr = [];

        //for (let i = 0; i < xbins.length; i++) {
        //    let row = [];

        //    for (let j = 0; j < ybins.length; j++)
        //        row.push((xbins[i].length + ybins[j].length) / 2);

        //    arr.push(row);
        //}

        for (let i = 0; i < ybins.length; i++) {
            let col = [];

            for (let j = 0; j < xbins.length; j++)
                col.push((ybins[i].length + xbins[j].length) / 2);

            arr.push(col);
        }

        arr = [].concat.apply([], arr);

        console.log(arr);
        let c = contours()
            .size([contourBins, contourBins]);
            //.size(contourSize ? contourSize : [getWidth(), getHeight()]);


        if (useIntervalThresholds) {
            //let minweight = min(data.values, d => d.weight);
            //let maxweight = max(data.values, d => d.weight);
            let thresholds = range(
                Math.round(min(arr) / contourInterval), max(arr), contourInterval
            );

            console.log('thresholds');
            console.log(thresholds);
            c.thresholds(thresholds);
        }

        contour = c(arr);
    };

    let makeContourDensity = function() {

        let cd = contourDensity()
            .x(d => xScale(d[0]))
            .y(d => yScale(d[1]))
            .size(contourSize ? contourSize : [getWidth(), getHeight()])
            .cellSize(cellSize)
            .bandwidth(bandwidth);

        contour = cd(data.values);
    };

    var renderClipping = function() {

        svg.append('clipPath')
            .attr('id', 'clipped')
            .append('rect')
            .attr('x', margin.left)
            .attr('y', 0)
            .attr('height', getHeight())
            // Idk why this fucking thing is one pixel off
            .attr('width', getWidth() - margin.left + 1);
    };

    var renderContours = function() {

        console.log(contour);
        svg.append('g')
            .selectAll('contours')
            .data(contour)
            //.data(scaleContour(contour, 2))
            .enter()
            .append('path')
            .attr('clip-path', 'url(#clipped)')
            .attr('fill', d => {
                if (contourFill === null)
                    return colorScale(d.value);

                return contourFill;
            })
            .attr('stroke', contourStroke)
            .attr('stroke-width', contourStrokeWidth)
            .attr('stroke-linejoin', 'round')
            .attr('d', geoPath());
    };

    var renderPoints = function() {

        svg.append('g')
            .selectAll('ponts')
            .data(data.values)
            .enter()
            .append('circle')
            .attr('r', 2)
            .attr('cx', d => xScale(d[0]))
            .attr('cy', d => yScale(d[1]))
            .attr('clip-path', 'url(#clipped)')
            .attr('stroke', '#000')
            .attr('stroke-width', 0)
            .attr('fill', d => '#000');
    };

    var drawText = function() {

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

        svg = select('body')
            .append('svg')
            //.attr('id', svgId)
            .attr('height', height)
            .attr('width', width)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        ;

        //if (textures)
        //    for (var i = 0; i < textures.length; i++)
        //        svg.call(textures[i]);

        makeScales();
        if (useContourDensity)
            makeContourDensity();
        else
            makeContours();

        renderClipping();
        renderContours();

        if (usePoints)
            renderPoints();

        makeAxes();

        //if (distribution)
        //    drawdist();
        return exports;
    };

    /** setters/getters **/

    exports.svg = function(_) { return svg; };

    exports.bandwidth = function(_) {
        if (!arguments.length) return bandwidth;
        bandwidth = +_;
        return exports;
    };

    exports.cellSize = function(_) {
        if (!arguments.length) return cellSize;
        cellSize = +_;
        return exports;
    };

    exports.contourSize = function(_) {
        if (!arguments.length) return contourSize;
        contourSize = _;
        return exports;
    };

    exports.data = function(_) {
        if (!arguments.length) return data;
        data = _;
        return exports;
    };

    exports.svgId = function(_) {
        if (!arguments.length) return svgId;
        svgId = _;
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

    exports.strokeWidth = function(_) {
        if (!arguments.length) return strokeWidth;
        strokeWidth = +_;
        return exports;
    };

    exports.xTickFormat = function(_) {
        if (!arguments.length) return xTickFormat;
        xTickFormat = _;
        return exports;
    };

    exports.xTextPad = function(_) {
        if (!arguments.length) return xTextPad;
        xTextPad = +_;
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

    exports.yTickFormat = function(_) {
        if (!arguments.length) return yTickFormat;
        yTickFormat = _;
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

    exports.yLabelPad = function(_) {
        if (!arguments.length) return yLabelPad;
        yLabelPad = +_;
        return exports;
    };

    exports.yTickValues = function(_) {
        if (!arguments.length) return yTickValues;
        yTickValues = _;
        return exports;
    };

    exports.useContourDensity = function(_) {
        if (!arguments.length) return useContourDensity;
        useContourDensity = _;
        return exports;
    };

    exports.useIntervalThresholds = function(_) {
        if (!arguments.length) return useIntervalThresholds;
        useIntervalThresholds = _;
        return exports;
    };

    exports.usePoints = function(_) {
        if (!arguments.length) return usePoints;
        usePoints = _;
        return exports;
    };

    exports.contourBins = function(_) {
        if (!arguments.length) return contourBins;
        contourBins = _;
        return exports;
    };

    exports.contourFill = function(_) {
        if (!arguments.length) return contourFill;
        contourFill = _;
        return exports;
    };

    exports.contourInterval = function(_) {
        if (!arguments.length) return contourInterval;
        contourInterval = _;
        return exports;
    };

    exports.contourStroke = function(_) {
        if (!arguments.length) return contourStroke;
        contourStroke = _;
        return exports;
    };

    exports.contourStrokeWidth = function(_) {
        if (!arguments.length) return contourStrokeWidth;
        contourStrokeWidth = +_;
        return exports;
    };

    exports.xTicks = function(_) {
        if (!arguments.length) return xTicks;
        xTicks = +_;
        return exports;
    };

    exports.yTicks = function(_) {
        if (!arguments.length) return yTicks;
        yTicks = +_;
        return exports;
    };

    // Enables testing for private methods
    if (process.env.NODE_ENV == 'development') {

        exports.makeScales = makeScales;
        exports.makeAxes = makeAxes;

        exports.xScale = () => xScale;
        exports.yScale = () => yScale;
        //exports.renderNodes = renderNodes;
        //exports.renderEdges = renderEdges;
        //exports.createSimulation = createSimulation;
        //exports.updateDragEvents = updateDragEvents;

        //exports.graphNodes = () => graphNodes;
        //exports.graphEdges = () => graphEdges;
        //exports.simulation = () => simulation;
        //exports.svg = function(_) {
        //    if (!arguments.length) return svg;
        //    svg = _;
        //    return exports;
        //};
    }

    return exports;
};


