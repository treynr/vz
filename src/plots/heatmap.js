/**
  * file: heatmap.js
  * desc: d3js implementation of heatmaps.
  * auth: TR
  */

/**
  * The data structure necessary for this viz is an array of objects. Each
  * object represents a separate box plot which may have >= 1 violins.
  * The design is similar to the scatter plot visualization and allows the user
  * to specify plot positions in a grid like arrangement; although this
  * complicates the codebase, it is much better for producing consistently 
  * aligned, publication-ready images.
  *
  * Each object has the following fields:
  *
  * plot {
  *     values: [required] an array of data point objects
  *     title:  [optional] text for the plot title
  *     label:  [optional] label text for indicating separate figures
  *     color:  [optional] hmmm idk yet
  * }
  *
  * value {
  *     x:      [required] x-axis (column) category
  *     y:      [required] y-axis (row) category
  *     value:  [required] the numeric value for this data point
  * }
  *
  */
/** TODO
  *
  * Add proper handling for groups.
  * Clean up code.
  * Normalize normalization functions.
  * TabNine::hide_promotional_message
  */

'use strict'

import {extent} from 'd3-array';
import {axisBottom, axisLeft, axisRight, axisTop} from 'd3-axis';
import {scaleBand, scaleLinear, scaleQuantize} from 'd3-scale';
import {schemeBlues} from 'd3-scale-chromatic';
import {select, selectAll} from 'd3-selection';

const Align = {
    TOP: 0,
    RIGHT: 1,
    BOTTOM: 2,
    LEFT: 3
};

export default function() {

    let exports = {},

        /** private **/

        colorScale = null,
        xScale = null,
        yScale = null,

        /** public **/

        // Data object containing objects/data to visualize
        data = null,
        // Positioning for the first cell of the heatmap, default is to begin
        // on the plot's left hand side
        cellAlignHorizontal = Align.LEFT,
        // Positioning for the first cell of the heatmap, default is to begin
        // on the plot's bottom axis
        cellAlignVertical = Align.BOTTOM,
        // HTML element or ID the SVG should be appended to
        element = 'body',
        // Font family
        font = 'sans-serif',
        // Font size
        fontSize = '11px',
        // Font weight
        fontWeight = 'normal',
        height = 600,
        // Color legend positioning, default is aligned to the left of the heatmap
        legendAlign = Align.LEFT,
        // Margin object
        margin = {top: 90, right: 90, bottom: 90, left: 90},
        normalizeRows = false,
        normalizeColumns = false,
        normalizeMatrix = false,
        // SVG object for the plot
        svg = null,
        // Y-axis position, default is aligned to the right of the heatmap
        yAxisAlign = Align.RIGHT,
        // X-axis position, default is aligned to the bottom of the heatmap
        xAxisAlign = Align.BOTTOM,
        // The x-axis domain range
        xDomain = null,
        // Text label for the x-axis
        xLabel = '',
        // Padding in pixels for the x-axis label
        xLabelPad = 50,
        // The y-axis domain range
        yDomain = null,
        // Text label for the x-axis
        yLabel = '',
        // Padding in pixels for the x-axis label
        yLabelPad = 50,
        width = 600,
        mirrorAxes = true,
        // Cluster the results and draw a dendogram in the heat map margins
        cluster = false,
        // The values provided are distances and should be converted
        distances = false,
        colorDomain = null,
        cellStroke = '#000000',
        cellStrokeWidth = 1
        ;

    /** private **/

    let getHeight = function() { return height - margin.bottom - margin.top; };
    let getWidth = function() { return width - margin.left - margin.right; };

    /**
      * Returns the list of column labels, i.e. the list of categories that make up the
      * x-axis.
      */
    let getColumnCategories = function() {

        return Array.from(new Set(data.values.map(d => d.x)));
    };

    /**
      * Returns the list of row labels, i.e. the list of categories that make up the
      * y-axis.
      */
    let getRowCategories = function() {

        return Array.from(new Set(data.values.map(d => d.y)));
    };

    /**
      * Forces x- and y-axis labels (row and column categories) to be strings.
      */
    let stringifyCategories = function() {

        data.values.forEach(v => {

            v.x = `${v.x}`;
            v.y = `${v.y}`;
        });
    };

    /**
      * This function checks to see if comparisons between any rows/columns are missing.
      * If they are missing, the function will fill in those comparisons with
      * null values.
      *
      * arguments
      *     mirror: if true then rows == columns
      */
    let completeMatrix = function(mirror=false) {

        // Reduce the list of row/column comparisons into a 2D matrix
        let matrix = data.values.reduce((ac, d) => {

            ac[d.y] = ac[d.y] || {};
            ac[d.y][d.x] = ac[d.y][d.x] || d.value;

            return ac;
        }, {});

        // Deep copy of the original 2D matrix
        let origMatrix = JSON.parse(JSON.stringify(matrix));
        let columns = getColumnCategories();
        let rows = getRowCategories();

        // mirror == true if the rows and columns are just a mirror of one
        // another, i.e. rows == columns
        if (mirror) {

            columns = Array.from(new Set(columns.concat(rows)));
            rows = columns;
        }

        for (let r of rows) {
            for (let c of columns) {

                matrix[r] = matrix[r] || {};
                matrix[c] = matrix[c] || {};

                // If the (r, c) comparison is missing, and this matrix is mirrored, and
                // the inverse comparison (c, r) is available, we set (r, c) = (c, r)
                if (matrix[r][c] === undefined && mirror && matrix[c][r] !== undefined)
                    matrix[r][c] = matrix[c][r];

                // If (r, c) is missing and r is the same as c, we assume their
                // similarity is 1.0
                // TODO: this is behavior that should be user-defined
                else if (matrix[r][c] === undefined && r === c)
                    matrix[r][c] = 1.0;

                // (r, c) is missing so we just give it a default value of zero
                else if (matrix[r][c] === undefined)
                    matrix[r][c] = 0.0;

                // Otherwise (r, c) is not missing and there is nothing we need to do
            }
        }

        for (let r in matrix) {
            for (let c in matrix[r]) {

                // (r, c) is in the original set of comparisons so we don't do anything
                if (r in origMatrix && origMatrix[r][c])
                    continue;

                // otherwise we add the missing comparison to our values array
                data.values.push({x: c, y: r, value: matrix[r][c]});
            }
        }
    };

    /**
      * Creates the d3 scale objects for x- and y-axes using the available x and y
      * domains. Also creates a scale of colors based on either the values 
      * associated with the data, or a custom domain specified by the user.
      */
    let makeScales = function() {

        xDomain = xDomain ? xDomain : getColumnCategories();
        yDomain = yDomain ? yDomain : (mirrorAxes ? xDomain : getRowCategories());

        if (mirrorAxes) {

            xDomain.sort((a, b) => a.localeCompare(b));
            yDomain.sort((a, b) => a.localeCompare(b));
        }

        colorDomain = colorDomain ? colorDomain : extent(data.values.map(d => d.value));

        xScale = scaleBand()
            .domain(xDomain)
            .range([0, getWidth()])
            .paddingInner(0)
            .paddingOuter(0.05)
            .align(0);

        yScale = scaleBand()
            .domain(yDomain)
            .range([0, getHeight()])
            .paddingInner(0)
            .paddingOuter(0.05)
            .align(0);

        colorScale = scaleQuantize()
            .domain(colorDomain)
            .range(schemeBlues[5]);

        // Cells begin at the right axis so change the scale to reflect that
        if (cellAlignHorizontal === Align.RIGHT)
            xScale.range([getWidth(), 0]);

        // Cells begin at the top axis 
        if (cellAlignVertical === Align.TOP)
            yScale.range([getHeight(), 0]);
    };

    let renderAxes = function() {

        // Determine the position of each axis--top, right, bottom, or left of the plot
        let xaxis = {
            [Align.TOP]: axisTop,
            [Align.RIGHT]: axisRight,
            [Align.BOTTOM]: axisBottom,
            [Align.LEFT]: axisLeft
        }[xAxisAlign];

        let yaxis = {
            [Align.TOP]: axisTop,
            [Align.RIGHT]: axisRight,
            [Align.BOTTOM]: axisBottom,
            [Align.LEFT]: axisLeft
        }[yAxisAlign];

        //console.log(xaxis);
        //xaxis = xaxis.scale(xScale);
        //yaxis = yaxis.scale(yScale);
        xaxis = xaxis(xScale);
        yaxis = yaxis(yScale);

        let xAxisObject = svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', _ => {
                return xAxisAlign == Align.TOP ? `translate(0, 0)` :
                                                 `translate(0, ${getHeight()})`;
            })
            .call(xaxis);

        // Update the text properties and positioning for the axis ticks
        xAxisObject.selectAll('text')
            .attr('x', 5)
            .attr('y', xAxisAlign == Align.TOP ? -8 : 10)
            .attr('dx', '.35em')
            .attr('dy', '.35em')
            .attr('font', font)
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', fontWeight)
            .attr('transform', xAxisAlign == Align.TOP ? 'rotate(-45)' : 'rotate(-320)')
            .attr('text-anchor', 'start')
            ;

        // Add the x-axis label
        xAxisObject.append('text')
            .attr('class', 'x-axis-label')
            .attr('x', getWidth() / 2)
            .attr('y', xLabelPad)
            .attr('fill', '#000000')
            .attr('text-anchor', 'middle')
            .text(xLabel)
            ;

        let yAxisObject = svg.append('g')
            .attr('class', 'y-axis')
            .attr('transform', _ => {
                return yAxisAlign == Align.LEFT ? `translate(0, 0)` :
                                                  `translate(${getWidth()}, 0)`;
            })
            .call(yaxis);

        yAxisObject.selectAll('text')
            .attr('font', font)
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', fontWeight)
            .attr('text-anchor', 'start')
            ;

        yAxisObject.append('text')
            .attr('class', 'y-axis-label')
            .attr('x', 60)
            .attr('y', yLabelPad)
            .attr('fill', '#000000')
            .attr('text-anchor', 'middle')
            .text(yLabel);

        // Remove domain lines
        xAxisObject.select('.domain').remove();
        yAxisObject.select('.domain').remove();
    };

    /** public **/

    exports.draw = function() {

        svg = select(element)
            .append('svg')
            .attr('height', height)
            .attr('width', width)
            .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        stringifyCategories();
        completeMatrix(mirror=mirrorAxes);

        renderAxes();
    };

    /** setters/getters **/

    exports.svg = function(_) { return svg; };

    exports.data = function(_) {
        if (!arguments.length) return data;
        data = _;
        return exports;
    };

    exports.cellAlignHorizontal = function(_) {
        if (!arguments.length) return cellAlignHorizontal;
        cellAlignHorizontal = _;
        return exports;
    };

    exports.cellAlignVertical = function(_) {
        if (!arguments.length) return cellAlignVertical;
        cellAlignVertical = _;
        return exports;
    };

    exports.cellStroke = function(_) {
        if (!arguments.length) return cellStroke;
        cellStroke = _;
        return exports;
    };

    exports.cellStrokeWidth = function(_) {
        if (!arguments.length) return cellStrokeWidth;
        cellStrokeWidth = _;
        return exports;
    };

    exports.legendAlign = function(_) {
        if (!arguments.length) return legendAlign;
        legendAlign = _;
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

    exports.normalizeRows = function(_) {
        if (!arguments.length) return normalizeRows;
        normalizeRows = _;
        return exports;
    };

    exports.normalizeColumns = function(_) {
        if (!arguments.length) return normalizeColumns;
        normalizeColumns = _;
        return exports;
    };

    exports.normalizeMatrix = function(_) {
        if (!arguments.length) return normalizeMatrix;
        normalizeMatrix = _;
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

    exports.mirrorAxes = function(_) {
        if (!arguments.length) return mirrorAxes;
        mirrorAxes = _;
        return exports;
    };

    exports.colorScale = function(_) {
        if (!arguments.length) return colorScale;
        colorScale = _;
        return exports;
    };

    exports.colorDomain = function(_) {
        if (!arguments.length) return colorDomain;
        colorDomain = _;
        return exports;
    };
    
    exports.xAxisAlign = function(_) {
        if (!arguments.length) return xAxisAlign;
        xAxisAlign = _;
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
    
    exports.yAxisAlign = function(_) {
        if (!arguments.length) return yAxisAlign;
        yAxisAlign = _;
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

    // Enables testing for private methods
    if (process.env.NODE_ENV == 'development') {

        exports.completeMatrix = completeMatrix;
        exports.stringifyCategories = stringifyCategories;
        exports.makeScales = makeScales;
        exports.renderAxes = renderAxes;

        exports.xScale = () => xScale;
        exports.yScale = () => yScale;

        exports.svg = function(_) {
            if (!arguments.length) return svg;
            svg = _;
            return exports;
        };
    }

    return exports;
}

