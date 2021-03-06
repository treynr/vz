/**
 * file: legend.js
 * desc: d3js 4.0 drawing of simple legends/keys.
 * vers: 0.1.0
 * auth: TR
 */

/*
 * The data object is a list of objects containing key types and information.
 * Each key object has the following structure:
 *  key {
 *      text:       [required] text to display for the key
 *      color:      [req//opt] key color, required if gradient is not used
 *      gradient:   [req//opt] key gradient color, required if color is not used
 *      symbol:     [optional] symbol used to represent the key
 *      size:       [optional] size of the drawn key
 *      tx:         [optional] x-axis offset for text placement
 *      ty:         [optional] y-axis offset for text placement
 * }
 *
 */

'use strict';

import {max, range} from 'd3-array';
import {axisBottom} from 'd3-axis';
import {select} from 'd3-selection';
import {scaleLinear, scaleSequential, scaleQuantize} from 'd3-scale';
import {interpolateBlues, schemeBlues} from 'd3-scale-chromatic';
import {symbol, symbolSquare} from 'd3-shape';

export default function() {

    var exports = {},
        /** private **/
        svg = null,
        data = null,

        legendAxis = null,
        legendScale = null,
        quantScale = null,
        circleScale = null,
        seqScale = null,
        /** public **/

        // HTML element or ID the SVG should be appended to
        element = 'body',
        // Font family for the legend text
        font = '"Helvetica neue", Helvetica, Arial, sans-serif',
        // Font size for the legend text
        fontSize = 13,
        // Font weight for the legend text
        fontWeight = 'normal',
        interpolator = interpolateBlues,
        keySize = 150,
        // Vertical padding in-between individual keys in the legend
        keyPad = 30,
        lineStroke = '#000000',
        lineStrokeWidth = '#000000',
        width = 300,
        height = 300,
        // Margin object
        margin = {top: 25, right: 25, bottom: 25, left: 25},
        tx = 15,
        ty = 5,
        rectWidth = 30,
        rectHeight = 30,
        fillOpacity = 1.0,
        textures = null,
        // Domain values, only required when rendering scales
        scaleDomain = [0, 1],
        // Range values, only required when rendering scales
        scaleRange = [15, 5],
        // Number of ticks to render on the scale
        scaleTicks = 4,
        // Color to use for unicolor scales
        scaleColor = schemeBlues[3][2],
        // Array of colors to use for the scale
        scaleColors = null,
        scaleFormat = null,
        scaleTickSize = 15,
        scaleTitle = '',
        scaleTitlePosition = 'end',
        symbolStroke = '#000000',
        symbolStrokeWidth = 1,
        // Use a d3 symbol for colored keys
        symbolType = null,
        // Render a quantized scale
        useCircleScale = false,
        useLine = false,
        // Use a combination line and symbol legend
        useLineSymbol = false,
        useRect = false,
        useSequentialScale = false,
        // Render a quantized scale
        useQuantizeScale = false;

    let getHeight = function() { return height - margin.bottom - margin.top; };
    let getWidth = function() { return width - margin.left - margin.right; };

    let makeGradient = function(svg, gid, type, c0, c1) {

        gid = (gid === undefined) ? 'gradient' : gid;
        type = (type === undefined) ? 'linearGradient' : type;
        c0 = (c0 === undefined) ? '#FFFFFF' : c0;
        c1 = (c1 === undefined) ? '#DD0000' : c1;

        var gradient = svg.append(type)
            .attr('id', gid)
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '100%')
            .attr('spreadMethod', 'pad');

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', c0)
            .attr('stop-opacity', 1);

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', c1)
            .attr('stop-opacity', 1);
    };

    let makeSplitColor = function(svg, gid, c0, c1) {

        gid = (gid === undefined) ? 'gradient' : gid;
        c0 = (c0 === undefined) ? '#FFFFFF' : c0;
        c1 = (c1 === undefined) ? '#DD0000' : c1;

        let gradient = svg.append('linearGradient')
            .attr('id', gid)
            .attr('x1', '0%')
            //.attr('y1', '0%')
            .attr('y1', '100%')
            .attr('x2', '100%')
            //.attr('y2', '100%')
            .attr('y2', '0%')
            .attr('spreadMethod', 'pad');

        gradient.append('stop')
            .attr('offset', '50%')
            .attr('stop-color', c0)
            .attr('stop-opacity', 1);

        gradient.append('stop')
            .attr('offset', '50%')
            .attr('stop-color', c1)
            .attr('stop-opacity', 1);
    };

    let makeCircleScales = function() {

        circleScale = scaleLinear()
            .domain(scaleDomain)
            .range(scaleRange);

        legendScale = scaleLinear()
            .domain(circleScale.domain())
            .rangeRound([0, getWidth()]);

        legendAxis = axisBottom(legendScale)
            .ticks(legendScale.ticks(scaleTicks).length, scaleFormat)
            .tickSize(scaleTickSize);
    };

    let makeSequentialScale = function() {

        seqScale = scaleSequential(interpolateBlues)
            .domain(scaleDomain);
    };

    let renderCircleScale = function() {

        let legScale = svg.append('g')
            .attr('class', 'legend-scale');

        console.log(`scaleColor ${scaleColor}`);
        legScale.selectAll('legend')
            //.data(quantScale.range().map(d => quantScale.invertExtent(d)))
            .data(circleScale.ticks(scaleTicks))
            .enter()
            .append('circle')
            .attr('cx', d => legendScale(d))
            .attr('r', d => circleScale(d))
            .attr('fill', scaleColor)
            .attr('stroke', 'none')
            .attr('stroke-width', 0)
            .attr('shape-rendering', 'auto');

        let legAxis = legScale.append('g')
            .attr('class', 'ticks')
            // Shift axis so it doesn't overlap the circles
            .attr('transform', `translate(0,${max(circleScale.range())})`)
            .call(legendAxis);

        legAxis.selectAll('text')
            .attr('font-family', font)
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', fontWeight);

        // Remove the domain line
        svg.select('.ticks > .domain').remove();

        // Add legend text
        svg.append('text')
            .attr('class', 'legend-title')
            .attr('fill', '#000000')
            .attr('font-family', font)
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', fontWeight)
            .attr('x', 0)
            .attr('text-anchor', scaleTitlePosition)
            //.attr('x', getWidth())
            //.attr('text-anchor', 'end')
            // Prevent the text from overlapping with any circles
            .attr('y', -max(circleScale.range()) - 5)
            .text(scaleTitle);
    };

    let makeQuantizeScales = function() {

        let colors = null;

        // Select the default color scheme if no colors have been specified
        if (!scaleColors)
            colors = schemeBlues[scaleTicks + 1];
        else
            colors = scaleColors;

        quantScale = scaleQuantize()
            .domain(scaleDomain)
            .range(colors);

        legendScale = scaleLinear()
            .domain(quantScale.domain())
            .rangeRound([0, getWidth()]);

        console.log(`scaleTicks: ${scaleTicks}`);
        console.log(`lengend ticks: ${legendScale.ticks(scaleTicks)}`);
        // Specifying a value for the ticks function is just a suggestion, it may return
        // more or less values, so we have to align our colors with the correct number of
        // values. -2 because we don't render the first and last ticks.
        if ((legendScale.ticks(scaleTicks).length - 2) != scaleTicks) {

            // The formula for this is actually (length - 2) + 1, simplified it's just 
            // (length - 1). The logic: remove the first and last ticks from the count, 
            // add one to the count since we will render N+1 colors for the scale.
            scaleTicks = legendScale.ticks(scaleTicks).length - 1;

            // TODO: handle user-specified colors properly:
            //     This is a first attempt at handling user-defined colors, if they don't
            //     provide enough colors in the array an exception will be thrown. Not 
            //     sure how to gracefully handle this scenario just yet.
            // Color schemes only range in length from [3, 9]
            //scaleColors = scaleTicks > 9 ? schemeBlues[9] : schemeBlues[scaleTicks];
            //scaleColors = scaleTicks < 3 ? schemeBlues[3].slice(1) : schemeBlues[scaleTicks];
            if (scaleColors) {

                colors = scaleColors;
            } else {

                colors = scaleTicks > 9 ? schemeBlues[9] : schemeBlues[scaleTicks];
                colors = scaleTicks < 3 ? schemeBlues[3].slice(1) : schemeBlues[scaleTicks];
            }

            // Redo the scale
            quantScale.range(colors);
        }


        legendAxis = axisBottom(legendScale)
            //.tickValues(legendScale.ticks(scaleTicks))
            .ticks(legendScale.ticks(scaleTicks).length, scaleFormat)
            .tickSize(scaleTickSize);
    };

    let makeQuantizeScales2 = function() {

        let colors = null;

        // Select the default color scheme if no colors have been specified
        if (!scaleColors)
            colors = schemeBlues[scaleTicks + 1];
        else
            colors = scaleColors;

        quantScale = scaleQuantize()
            .domain(scaleDomain)
            .range(colors);

        legendScale = scaleLinear()
            .domain(quantScale.domain())
            .rangeRound([0, getWidth()]);

        console.log('ticks');
        let tstep = (scaleDomain[1] - scaleDomain[0]) / 5;
        console.log(`tstep: ${tstep}`);
        console.log(range(scaleDomain[0], scaleDomain[1] + tstep, tstep));

        // Specifying a value for the ticks function is just a suggestion, it may return
        // more or less values, so we have to align our colors with the correct number of
        // values. -2 because we don't render the first and last ticks.
        //if ((legendScale.ticks(scaleTicks).length - 2) != scaleTicks) {

        //    // The formula for this is actually (length - 2) + 1, simplified it's just 
        //    // (length - 1). The logic: remove the first and last ticks from the count, 
        //    // add one to the count since we will render N+1 colors for the scale.
        //    scaleTicks = legendScale.ticks(scaleTicks).length - 1;

        //    // TODO: handle user-specified colors properly:
        //    //     This is a first attempt at handling user-defined colors, if they don't
        //    //     provide enough colors in the array an exception will be thrown. Not 
        //    //     sure how to gracefully handle this scenario just yet.
        //    // Color schemes only range in length from [3, 9]
        //    //scaleColors = scaleTicks > 9 ? schemeBlues[9] : schemeBlues[scaleTicks];
        //    //scaleColors = scaleTicks < 3 ? schemeBlues[3].slice(1) : schemeBlues[scaleTicks];
        //    if (scaleColors) {

        //        colors = scaleColors;
        //    } else {

        //        colors = scaleTicks > 9 ? schemeBlues[9] : schemeBlues[scaleTicks];
        //        colors = scaleTicks < 3 ? schemeBlues[3].slice(1) : schemeBlues[scaleTicks];
        //    }

        //    // Redo the scale
        //    quantScale.range(colors);
        //}


        legendAxis = axisBottom(legendScale)
            //.tickValues(legendScale.ticks(scaleTicks))
            //.ticks(legendScale.ticks(scaleTicks).length, scaleFormat)
            //.ticks(someticks.count, scaleFormat)
            .tickValues(range(scaleDomain[0], scaleDomain[1] + tstep, tstep))
            .tickFormat(scaleFormat)
            .tickSize(scaleTickSize);
    };

    let renderQuantizeScale = function() {

        let legScale = svg.append('g')
            .attr('class', 'legend-scale');

        legScale.selectAll('legend')
            .data(quantScale.range().map(d => quantScale.invertExtent(d)))
            .enter()
            .append('rect')
            .attr('x', d => legendScale(d[0]))
            .attr('height', 10)
            .attr('width', d => legendScale(d[1]) - legendScale(d[0]))
            .attr('fill', d => quantScale(d[0]))
            .attr('stroke', 'none')
            .attr('stroke-width', 0)
            .attr('shape-rendering', 'crispEdges');

        let legAxis = legScale.call(legendAxis);

        legAxis.selectAll('text')
            .attr('font-family', font)
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', fontWeight);

        // Remove the first and last ticks, and the domain line
        svg.select('.legend-scale > .tick:first-of-type').remove();
        svg.select('.legend-scale > .tick:last-of-type').remove();
        svg.select('.legend-scale > .domain').remove();

        // Add legend text
        svg.append('text')
            .attr('class', 'legend-title')
            .attr('fill', '#000000')
            .attr('font-family', font)
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', fontWeight)
            .attr('text-anchor', scaleTitlePosition)
            //.attr('x', getWidth())
            .attr('x', 0)
            .attr('y', -5)
            .text(scaleTitle);
    };

    let makeLegendObjects = function() {

        let legend = svg.selectAll('stuff')
            .data(data)
            .enter()
            .append('g')
            .attr('transform', (_, i) => {

                return `translate(${margin.left}, ${(i + 1) * keyPad})`
            })
            .attr('class', (d, i) => {

                if (d.id)
                    return `key-${d.id}`;

                return `key-${i}`;
            });

        return legend;
    };

    let renderRectLegend = function(objects) {

        return objects.append('rect')
            .attr('width', rectWidth)
            .attr('height', rectHeight);
    };

    let renderSymbolLegend = function(objects) {

        return objects.append('path')
            .attr('d', symbol()
                .type(d => {

                    if (d.symbol)
                        return d.symbol;
                    if (symbolType)
                        return symbolType;

                    return symbolSquare;
                })
                .size(d => {
                    if (d.size === undefined)
                        return keySize;

                    return d.size;
                })
            )
            .attr('transform', useLineSymbol ? `translate(${35 / 2}, 0)` : null)
            ;
    };

    let renderLineLegend = function(objects) {

        return objects.append('path')
            .attr('d', 'M0,0 L35,0');
    };

    let styleSymbols = function(legend) {

        legend
            .attr('fill-opacity', fillOpacity)
            .attr('fill', (d) => {

                if (d.fill === undefined)
                    return '#000000';

                return d.fill;
            })
            .attr('stroke', d => {
                if (d.stroke)
                    return d.stroke;

                return symbolStroke;
            })
            .attr('stroke-width', d => d.strokeWidth ? d.strokeWidth : symbolStrokeWidth)
            .attr('shape-rendering', 'auto');
    };

    let styleLines = function(legend, isLine = false) {

        legend
            .attr('fill-opacity', fillOpacity)
            .attr('fill', 'none')
            .attr('stroke', d => {

                if (d.stroke)
                    return d.stroke;

                return lineStroke;
            })
            .attr('stroke-width', d => d.strokeWidth ? d.strokeWidth : lineStrokeWidth)
            .attr('shape-rendering', 'auto');
    };

    let renderLegendText = function(legend) {

        legend.append('text')
            .attr('dx', d => {
                if (useRect && d.tx)
                    return rectWidth + 5 + d.tx;

                if (useRect)
                    return rectWidth + 5;

                if ((useLine || useLineSymbol) && d.tx)
                    return 35 + d.tx;

                if (useLine || useLineSymbol)
                    return 35 + tx;

                return d.tx ? d.tx : tx; 
            })
            .attr('dy', d => {
                if (useRect && d.ty)
                    return (rectHeight / 2) + d.ty;

                if (useRect)
                    return rectHeight / 2;

                return d.ty ? d.ty : ty; 
            })
            .attr('font-family', font)
            .attr('font-size', fontSize)
            .attr('font-weight', fontWeight)
            .text(d => d.text);
    };

    exports.draw = function() {

        svg = select(element)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('class', 'legend-svg')
            .append('g')
            .attr('class', 'legend');
            //.attr('transform', `translate(${margin.left}, ${margin.top})`);

        if (useCircleScale) {

            makeCircleScales();
            renderCircleScale();

        } else if (useSequentialScale) {

            //makeSequentialScale();
            seqScale = scaleSequential(interpolateBlues)
                .domain([0, width]);

            let bars = svg.selectAll(".bars")
                .data(range(getWidth()), d => d)
                .enter()
                .append('rect')
                .attr('transform', `translate(${-margin.left}, ${-margin.top})`)
                .attr('class', 'bars')
                .attr('x', (d, i) => i)
                .attr('y', 0)
                .attr('height', height)
                .attr('width', 1)
                .attr('fill', (d, i) => seqScale(d));

        legendScale = scaleLinear()
            .domain(scaleDomain)
            .rangeRound([0, getWidth()]);

        legendAxis = axisBottom(legendScale)
            //.tickValues(legendScale.ticks(scaleTicks))
            .ticks(legendScale.ticks(scaleTicks).length, scaleFormat)
            .tickSize(scaleTickSize);

        let legAxis = svg.append('g')
            //.attr('transform', `translate(0, ${height + 1})`)
            .call(legendAxis);

        legAxis.selectAll('text')
            .attr('font-family', font)
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', fontWeight);

        // Remove the first and last ticks, and the domain line
        svg.select('.legend-scale > .tick:first-of-type').remove();
        svg.select('.legend-scale > .tick:last-of-type').remove();
        svg.select('.legend-scale > .domain').remove();

        // Add legend text

        //let legScale = svg.append('g')
        //    .attr('class', 'legend-scale');

        //legScale.selectAll('legend')
        //    .data(quantScale.range().map(d => quantScale.invertExtent(d)))
        //    .enter()
        //    .append('rect')
        //    .attr('x', d => legendScale(d[0]))
        //    .attr('height', 10)
        //    .attr('width', d => legendScale(d[1]) - legendScale(d[0]))
        //    .attr('fill', d => quantScale(d[0]))
        //    .attr('stroke', 'none')
        //    .attr('stroke-width', 0)
        //    .attr('shape-rendering', 'crispEdges');

        //let legAxis = legScale.call(legendAxis);

        //legAxis.selectAll('text')
        //    .attr('font-family', font)
        //    .attr('font-size', `${fontSize}px`)
        //    .attr('font-weight', fontWeight);

        //// Remove the first and last ticks, and the domain line
        //svg.select('.legend-scale > .tick:first-of-type').remove();
        //svg.select('.legend-scale > .tick:last-of-type').remove();
        //svg.select('.legend-scale > .domain').remove();

        //// Add legend text
        //svg.append('text')
        //    .attr('class', 'legend-title')
        //    .attr('fill', '#000000')
        //    .attr('font-family', font)
        //    .attr('font-size', `${fontSize}px`)
        //    .attr('font-weight', fontWeight)
        //    .attr('text-anchor', 'end')
        //    .attr('x', getWidth())
        //    .attr('y', -5)
        //    .text(scaleTitle);

        } else if (useQuantizeScale) {

            makeQuantizeScales2();
            renderQuantizeScale();

        } else {

            let objects = makeLegendObjects();
            let legend = null;

            if (useRect) {

                legend = renderRectLegend(objects);

            } else if (useLineSymbol) {

                let lineObjects = makeLegendObjects();
                let lineLegend = renderLineLegend(lineObjects);

                styleLines(lineLegend);

                legend = renderSymbolLegend(objects);

            } else if (useLine) {

                legend = renderLineLegend(objects);

            } else {

                legend = renderSymbolLegend(objects);
            }

            if (useLine)
                styleLines(legend);
            else
                styleSymbols(legend);

            renderLegendText(objects);
        }

        let no = null;

        // Just to prevent eslint errors
        if (no) {

            makeGradient();
            makeSplitColor();
        }

        /*
        if (textures)
            for (var i = 0; i < textures.length; i++)
                legend.call(textures[i]);

        if (useRect) {

            var legendKey = legend.append('rect')
                .attr('width', rectWidth)
                .attr('height', rectHeight);

        } else if (useLine) {

            var legendKey = legend.append('path')
                .attr('d', 'M0,0 L35,0');

        } else { 

            var legendKey = legend.append('path')
                .attr('d', d3.symbol()
                    .type(function(d) { 
                        if (d.symbol)
                            return d.symbol;
                        if (symbol)
                            return symbol;

                        return d3.symbolSquare;
                    })
                    .size(function(d) {
                        if (d.size === undefined)
                            return keySize;

                        return d.size;
                    })
                );
        }

        legendKey
            .attr('stroke', function(d) {
                if (useLine)
                    return d.color;

                return stroke;
            })
            .attr('stroke-width', strokeWidth)
            .attr('shape-rendering', 'auto')
            .style('fill-opacity', fillOpacity)
            .style('fill', function(d, i) {

                if (textures && d.texture)
                    return d.texture.url();

                if (d.gradient) {

                    makeGradient(
                        legend, 
                        d.text + '-grad', 'radialGradient', 
                        d.gradient[0], 
                        d.gradient[1]
                    );

                    return 'url(#' + (d.text + '-grad') + ')';
                }

                if (d.colors && d.colors.length >= 2) {

                    makeSplitColor(
                        legend, 
                        d.idText + '-grad',
                        d.colors[0], 
                        d.colors[1]
                    );

                    return 'url(#' + (d.idText + '-grad') + ')';
                    //return 'url(#shit-a)';
                }

                if (d.color === undefined)
                    return '#000000';

                return d.color;
            });

        legend.append("text")
            .attr('dx', function(d) { 
                if (useRect && d.tx)
                    return rectWidth + 5 + d.tx;

                if (useRect)
                    return rectWidth + 5;

                return d.tx ? d.tx : tx; 
            })
            .attr('dy', function(d) { 
                if (useRect && d.ty)
                    return (rectHeight / 2) + d.ty;

                if (useRect)
                    return rectHeight / 2;

                return d.ty ? d.ty : ty; 
            })
            .attr('font-family', font)
            .attr('font-size', fontSize)
            .attr('font-weight', fontWeight)
            .text(function(d) { return d.text; });
            */

        return exports;
    };

    exports.svg = function() { return svg; };

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

    exports.font = function(_) {
        if (!arguments.length) return font;
        font = _;
        return exports;
    };

    exports.fontSize = function(_) {
        if (!arguments.length) return fontSize;
        fontSize = _;
        return exports;
    };

    exports.fontWeight = function(_) {
        if (!arguments.length) return fontWeight;
        fontWeight = _;
        return exports;
    };

    exports.keySize = function(_) {
        if (!arguments.length) return keySize;
        keySize = _;
        return exports;
    };

    exports.lineStroke = function(_) {
        if (!arguments.length) return lineStroke;
        lineStroke = _;
        return exports;
    };

    exports.lineStrokeWidth = function(_) {
        if (!arguments.length) return lineStrokeWidth;
        lineStrokeWidth = _;
        return exports;
    };

    exports.symbolStroke = function(_) {
        if (!arguments.length) return symbolStroke;
        symbolStroke = _;
        return exports;
    };

    exports.symbolStrokeWidth = function(_) {
        if (!arguments.length) return symbolStrokeWidth;
        symbolStrokeWidth = _;
        return exports;
    };

    exports.tx = function(_) {
        if (!arguments.length) return tx;
        tx = +_;
        return exports;
    };

    exports.ty = function(_) {
        if (!arguments.length) return ty;
        ty = +_;
        return exports;
    };

    exports.useRect = function(_) {
        if (!arguments.length) return useRect;
        useRect = _;
        return exports;
    };

    exports.useLine = function(_) {
        if (!arguments.length) return useLine;
        useLine = _;
        return exports;
    };

    exports.rectWidth = function(_) {
        if (!arguments.length) return rectWidth;
        rectWidth = _;
        return exports;
    };

    exports.rectHeight = function(_) {
        if (!arguments.length) return rectHeight;
        rectHeight = _;
        return exports;
    };

    exports.keyPad = function(_) {
        if (!arguments.length) return keyPad;
        keyPad = +_;
        return exports;
    };

    exports.symbolType = function(_) {
        if (!arguments.length) return symbolType;
        symbolType = _;
        return exports;
    };

    exports.fillOpacity = function(_) {
        if (!arguments.length) return fillOpacity;
        fillOpacity = _;
        return exports;
    };

    exports.textures = function(_) {
        if (!arguments.length) return textures;
        textures = _;
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

    exports.scaleColors = function(_) {
        if (!arguments.length) return scaleColors;
        scaleColors = _;
        return exports;
    };

    exports.scaleColor = function(_) {
        if (!arguments.length) return scaleColor;
        scaleColor = _;
        return exports;
    };

    exports.scaleDomain = function(_) {
        if (!arguments.length) return scaleDomain;
        scaleDomain = _;
        return exports;
    };

    exports.scaleFormat = function(_) {
        if (!arguments.length) return scaleFormat;
        scaleFormat = _;
        return exports;
    };

    exports.scaleRange = function(_) {
        if (!arguments.length) return scaleRange;
        scaleRange = _;
        return exports;
    };

    exports.scaleTicks = function(_) {
        if (!arguments.length) return scaleTicks;
        scaleTicks = +_;
        return exports;
    };

    exports.scaleTickSize = function(_) {
        if (!arguments.length) return scaleTickSize;
        scaleTickSize = +_;
        return exports;
    };

    exports.scaleTitle = function(_) {
        if (!arguments.length) return scaleTitle;
        scaleTitle = _;
        return exports;
    };

    exports.scaleTitlePosition = function(_) {
        if (!arguments.length) return scaleTitlePosition;
        scaleTitlePosition = _;
        return exports;
    };

    exports.useCircleScale = function(_) {
        if (!arguments.length) return useCircleScale;
        useCircleScale = _;
        return exports;
    };

    exports.useLineSymbol = function(_) {
        if (!arguments.length) return useLineSymbol;
        useLineSymbol = _;
        return exports;
    };

    exports.useSequentialScale = function(_) {
        if (!arguments.length) return useSequentialScale;
        useSequentialScale = _;
        return exports;
    };

    exports.useQuantizeScale = function(_) {
        if (!arguments.length) return useQuantizeScale;
        useQuantizeScale = _;
        return exports;
    };

    return exports;
}
