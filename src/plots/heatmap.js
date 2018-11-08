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

import {extent, ticks} from 'd3-array';
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

const Threshold = {

    GT: (x, t) => x > t,
    LT: (x, t) => x < t,
    GTE: (x, t) => x >= t,
    LTE: (x, t) => x <= t
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
        altValueThreshold = 0.05,
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
        mirrorAxes = false,
        // Cluster the results and draw a dendogram in the heat map margins
        cluster = false,
        // The values provided are distances and should be converted
        distances = false,
        colorDomain = null,
        cellStroke = '#000000',
        cellStrokeWidth = 1,
        altCellStroke = '#000000',
        altCellStrokeWidth = 1,
        altThresholdComparator = Threshold.GT,
        altValueDomain = null,
        altValueRange = null,
        invertAltValueScale = false,
        useAltValues = false,
        altValueScale = null
        ;


    /** private **/

    let getHeight = function() { return height - margin.bottom - margin.top; };
    let getWidth = function() { return width - margin.left - margin.right; };

    let unique = function(a) { return Array.from(new Set(a)); };

    /**
      * Returns the list of column labels, i.e. the list of categories that make up the
      * x-axis.
      */
    let getColumnCategories = function() { return unique(data.values.map(d => d.x)); };

    /**
      * Returns the list of row labels, i.e. the list of categories that make up the
      * y-axis.
      */
    let getRowCategories = function() { return unique(data.values.map(d => d.y)); };

    /**
      * Forces x- and y-axis labels (row and column categories) to be strings.
      */
    let stringifyCategories = function() {

        data.values.forEach(v => { v.x = `${v.x}`; v.y = `${v.y}`; });
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

            columns = unique(columns.concat(rows));
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
                if (r in origMatrix && origMatrix[r][c] !== undefined)
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
        
        if (useAltValues) {

            // Choose the smaller of the bandwidths to be the upper bound for the alt value
            // scale
            let altMax = xScale.bandwidth() < yScale.bandwidth() ? 
                         xScale.bandwidth() : yScale.bandwidth();

            // The upper bound is set to be 95% of half bandwidth so it doesn't overlap the
            // cell edges
            altMax = Math.floor((altMax / 2) * 0.95);

            // Or just ignore everything we just did if the user specifies a range
            altValueRange = altValueRange ? altValueRange : [1, altMax];
            altValueDomain = altValueDomain ? 
                             altValueDomain : d3.extent(data.values, d => d.altValue);

            console.log(altValueDomain);
            altValueScale = scaleLinear()
                .domain(altValueDomain)
                .range(altValueRange)
                ;
                //.nice();
            //altValueScale = scaleQuantize()
            //    .domain(altValueDomain)
            //    .range(ticks(altValueRange[0], altValueRange[1], 5));

            console.log(altValueScale.domain());
            console.log(altValueScale.range());

            if (invertAltValueScale)
                altValueScale.domain([altValueDomain[1], altValueDomain[0]]);
                //altValueScale.range(ticks(altValueRange[1], altValueRange[0], 5));

            console.log(altValueScale(0.001));
            console.log(altValueScale(0.005));
            console.log(altValueScale(0.01));
            console.log(altValueScale(0.03));
            console.log(altValueScale(0.05));
        }

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

    let renderCells = function() {

        // Maps row and column categories to their indexed position on the plot
        let indexMap = {};

        getRowCategories().forEach(d => { indexMap[d] = xScale(d); });
        getColumnCategories().forEach(d => { indexMap[d] = yScale(d); });

        let cells = svg.append('g')
            .attr('class', 'cells')
            .selectAll('cells')
            .data(data.values)
            .enter()
            .filter(d => {

                // If rows == columns, we only a diagonal cross section of the heatmap
                if (mirrorAxes)
                    return indexMap[d.y] <= indexMap[d.x];
                else
                    return true;
            })
            .append('g')
            .attr('class', 'cell');

        cells.append('rect')
            .attr('x', d => xScale(d.x))
            .attr('y', d => yScale(d.y))
            .attr('height', yScale.bandwidth())
            .attr('width', xScale.bandwidth())
            .attr('fill', d => {

                if (d.fill)
                    return d.fill;

                if (!d.value)
                    return '#ffffff';

                return colorScale(d.value);
            })
            .attr('shape-rendering', 'crispEdges')
            .attr('stroke', cellStroke)
            .attr('stroke-width', cellStrokeWidth)
    };

    let renderAltCells = function() {

        // Maps row and column categories to their indexed position on the plot
        let indexMap = {};

        getRowCategories().forEach(d => { indexMap[d] = xScale(d); });
        getColumnCategories().forEach(d => { indexMap[d] = yScale(d); });

        let cells = svg.append('g')
            .attr('class', 'alt-cells')
            .selectAll('cells')
            .data(data.values)
            .enter()
            .filter(d => {

                // If rows == columns, we only a diagonal cross section of the heatmap
                if (mirrorAxes)
                    return indexMap[d.y] <= indexMap[d.x];
                else
                    return true;
            })
            .append('g')
            .attr('class', 'alt-cell');

        // Remove the fill from rendered cells which we will redraw
        selectAll('.cell > rect')
            .filter(d => altThresholdComparator(d.altValue, altValueThreshold))
            .attr('fill', 'none');

        cells
            .filter(d => altThresholdComparator(d.altValue, altValueThreshold))
            .append('circle')
            .attr('cx', d => xScale(d.x) + (xScale.bandwidth() / 2))
            .attr('cy', d => yScale(d.y) + (yScale.bandwidth() / 2))
            .attr('r', d => altValueScale(d.altValue))
            .attr('fill', d => {

                console.log(`altValue: ${d.altValue}`);
                console.log(`size: ${altValueScale(d.altValue)}`);
                if (d.fill)
                    return d.fill;

                if (!d.value)
                    return '#ffffff';

                return colorScale(d.value);
            })
            .attr('shape-rendering', 'auto')
            .attr('stroke', altCellStroke)
            .attr('stroke-width', altCellStrokeWidth)
            ;
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
        completeMatrix(mirrorAxes);

        makeScales();
        renderAxes();
        renderCells();
        renderAltCells();
        console.log(data.values);

        return exports;
    };


    /** properties **/

    exports.svg = svg;
    exports.Threshold = Threshold;

    /** setters/getters **/

    exports.data = function(_) {
        if (!arguments.length) return data;
        data = _;
        return exports;
    };

    exports.altThresholdComparator = function(_) {
        if (!arguments.length) return altThresholdComparator;
        altThresholdComparator = _;
        return exports;
    };

    exports.altCellStroke = function(_) {
        if (!arguments.length) return altCellStroke;
        altCellStroke = _;
        return exports;
    };

    exports.altCellStrokeWidth = function(_) {
        if (!arguments.length) return altCellStrokeWidth;
        altCellStrokeWidth = +_;
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
        cellStrokeWidth = +_;
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

    exports.invertAltValueScale = function(_) {
        if (!arguments.length) return invertAltValueScale;
        invertAltValueScale = _;
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

    exports.useAltValues = function(_) {
        if (!arguments.length) return useAltValues;
        useAltValues = _;
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
        exports.renderCells = renderCells;

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

