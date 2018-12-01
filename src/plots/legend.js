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

import {ticks, max} from 'd3-array';
import {axisBottom} from 'd3-axis';
import {select} from 'd3-selection';
import {scaleLinear, scaleQuantize} from 'd3-scale';
import {schemeBlues} from 'd3-scale-chromatic';
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
        /** public **/

        // HTML element or ID the SVG should be appended to
        element = 'body',
        // Font family for the legend text
        font = 'sans-serif',
        // Font size for the legend text
        fontSize = 12,
        // Font weight for the legend text
        fontWeight = 'normal',
        keySize = 150,
        // Vertical padding in-between individual keys in the legend
        keyPad = 30,
        width = 300,
        height = 300,
        // Margin object
        margin = {top: 25, right: 25, bottom: 25, left: 25},
        tx = 15,
        ty = 5,
        stroke = '#000000',
        strokeWidth = 1,
        useRect = false,
        useLine = false,
        rectWidth = 30,
        rectHeight = 30,
        fillOpacity = 1.0,
        // Use a d3 symbol for colored keys
        symbol = null,
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
        useCircleScale = false,
        useQuantizeScale = false,
        // Render a quantized scale
        quantize = false
        ;

    let getHeight = function() { return height - margin.bottom - margin.top; };
    let getWidth = function() { return width - margin.left - margin.right; };

    var makeGradient = function(svg, gid, type, c0, c1) {

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
    }

    var makeSplitColor = function(svg, gid, c0, c1) {

        gid = (gid === undefined) ? 'gradient' : gid;
        c0 = (c0 === undefined) ? '#FFFFFF' : c0;
        c1 = (c1 === undefined) ? '#DD0000' : c1;

        var gradient = svg.append('linearGradient')
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
    }

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

    let renderCircleScale = function() {

        let legScale = svg.append('g')
            .attr('class', 'legend-scale');

        legScale.selectAll('legend')
            //.data(quantScale.range().map(d => quantScale.invertExtent(d)))
            .data(circleScale.ticks(scaleTicks))
            .enter()
            .append('circle')
            .attr('cx', d => legendScale(d))
            .attr('r', d => circleScale(d))
            .attr('fill', d => scaleColor)
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
            .attr('text-anchor', 'end')
            .attr('x', getWidth())
            // Prevent the text from overlapping with any circles
            .attr('y', -max(circleScale.range()) - 5)
            .text(scaleTitle);
    };

    let makeQuantizeScales = function() {

        // Select the default color scheme if no colors have been specified
        if (!scaleColors)
            scaleColors = schemeBlues[scaleTicks + 1];

        quantScale = scaleQuantize()
            .domain(scaleDomain)
            .range(scaleColors);

        legendScale = scaleLinear()
            .domain(quantScale.domain())
            .rangeRound([0, getWidth()])
            ;

        // Specifying a value for the ticks function is just a suggestion, it may return
        // more or less values, so we have to align our colors with the correct number of
        // values. -2 because we don't render the first and last ticks.
        if ((legendScale.ticks(scaleTicks).length - 2) != scaleTicks) {

            // The formula for this is actually (length - 2) + 1, simplified it's just 
            // (length - 1). The logic: remove the first and last ticks from the count, 
            // add one to the count since we will render N+1 colors for the scale.
            scaleTicks = legendScale.ticks(scaleTicks).length - 1;

            // TODO: handle user-specified colors properly
            // Color schemes only range in length from [3, 9]
            scaleColors = scaleTicks > 9 ? schemeBlues[9] : schemeBlues[scaleTicks];
            scaleColors = scaleTicks < 3 ? schemeBlues[3].slice(1) : schemeBlues[scaleTicks];

            // Redo the scale
            quantScale.range(scaleColors);
        }

        legendAxis = axisBottom(legendScale)
            .tickValues(legendScale.ticks(scaleTicks))
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
            .attr('text-anchor', 'end')
            .attr('x', getWidth())
            .attr('y', -5)
            .text(scaleTitle);
    };

    exports.draw = function() {

        svg = select('body')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${margin.left}, ${margin.top})`)
            ;
            //.selectAll('g')
            //.data(data)
            //.enter()
            //.append('g')
            //.attr('transform', function(d, i) { 
            //    return 'translate(40,' + (i + 1) * keyPad + ')'; 
            //});

        if (useCircleScale) {

            makeCircleScales();
            renderCircleScale();

        } else if (useQuantizeScale) {

            makeQuantizeScales();
            renderQuantizeScale();
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

    exports.stroke = function(_) {
        if (!arguments.length) return stroke;
        stroke = _;
        return exports;
    };

    exports.strokeWidth = function(_) {
        if (!arguments.length) return strokeWidth;
        strokeWidth = +_;
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

    exports.symbol = function(_) {
        if (!arguments.length) return symbol;
        symbol = _;
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

    exports.useCircleScale = function(_) {
        if (!arguments.length) return useCircleScale;
        useCircleScale = _;
        return exports;
    };

    exports.useQuantizeScale = function(_) {
        if (!arguments.length) return useQuantizeScale;
        useQuantizeScale = _;
        return exports;
    };

    return exports;
}
