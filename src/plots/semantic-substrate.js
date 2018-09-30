/**
  * file: semantic-substrate.js
  * desc: d3js implementation of 2D graph plots.
  * auth: TR
  */

'use strict';

import {extent} from 'd3-array';
improt {axisBottom, axisLeft} from 'd3-axis';
import {scaleLinear} from 'd3-scale';
import {select} from 'd3-selection';

export default function() {

    let exports = {},

        /** private **/

        // d3 axis object for the x-axis
        xAxis = null,
        // d3 scale for the x-axis
        xScale = null,
        // d3 axis object for the y-axis
        yAxis = null,
        // d3 scale for the y-axis
        yScale = null,
        // d3 scale for values associated with each node
        //valueScale = null,

        /** public **/

        // Data object containing objects/data to visualize
        data = null,
        // HTML element or ID the SVG should be appended to
        element = 'body',
        // SVG height
        height = 600,
        margin = {top: 50, right: 50, bottom: 50, left: 50},
        // SVG object for the plot
        svg = null,
        // SVG width
        width = 600,
        // domains
        xDomain = null,
        // Text label for the x-axis
        xLabel = '',
        // Padding in pixels for the x-axis label
        xLabelPad = 50,
        // d3 scale type to use for the x-axis
        xScaleFunction = scaleLinear,

        yDomain = null,
        // Text label for the y-axis
        yLabel = '',
        // Padding in pixels for the x-axis label
        yLabelPad = 50,
        // d3 scale type to use for the y-axis
        yScaleFunction = scaleLinear
        ;
    
    /** private **/

    /**
      * Returns the width and height of the SVG while taking into account the margins.
      */
    let getHeight = function() { return height - margin.bottom - margin.top; };
    let getWidth = function() { return width - margin.left - margin.right; };

    /**
      * Creates the d3 scale objects for the x- and y-axes using the available x and y
      * domains.
      */
    let makeScales = function() {

        xDomain = xDomain ? xDomain : extent(data, d => d.x);
        yDomain = yDomain ? yDomain : extent(data, d => d.y);

        xScale = xScaleFunction()
            .domain(xDomain)
            .nice()
            .range([0, getWidth()]);

        yScale = yScaleFunction()
            .domain(yDomain)
            .nice()
            .range([getHeight(), 0]);
    };

    let makeAxes = function() {

        xAxis = axisBottom(xScale)
    };

    exports.draw = function() {

        svg = select(element)
            .append('svg')
            .attr('height', height)
            .attr('width', width)
            .attr('transform', `translate(${margin.left}, ${margin.top})`);
    };

    /** setters/getters **/

    exports.svg = function() { return svg; };

    exports.data = function(_) { 
    //exports.data = function(_) {
        if (!arguments.length) return data;
        data = _;
        return exports;
    };

    exports.element = function(_) { 
        if (!arguments.length) return element;
        element = _;
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

    exports.xLabelPad = function(_) { 
        if (!arguments.length) return xLabelPad;
        xLabelPad = +_;
        return exports;
    };

    exports.xScaleFunction = function(_) { 
        if (!arguments.length) return xScaleFunction;
        xScaleFunction = _;
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

    exports.yScaleFunction = function(_) { 
        if (!arguments.length) return yScaleFunction;
        yScaleFunction = _;
        return exports;
    };

    // Enables testing for private methods
    if (process.env.NODE_ENV == 'development') {

        exports.makeScales = makeScales;
        exports.xScale = () => xScale;
        exports.yScale = () => yScale;
    }

    return exports;
}
