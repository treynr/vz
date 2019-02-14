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
  */

'use strict';

import {extent} from 'd3-array';
import {axisBottom, axisLeft, axisRight, axisTop} from 'd3-axis';
import {cluster, hierarchy} from 'd3-hierarchy';
import {scaleBand, scaleLinear, scaleQuantize} from 'd3-scale';
import {line, curveBasis, curveStepAfter, linkVertical, linkHorizontal} from 'd3-shape';
import {schemeBlues} from 'd3-scale-chromatic';
import {select, selectAll} from 'd3-selection';

// Alignment positions used for x- and y-axes
const Align = {

    TOP: 0,
    RIGHT: 1,
    BOTTOM: 2,
    LEFT: 3
};

// Threshold comparators
const Threshold = {

    GT: (x, t) => x > t,
    LT: (x, t) => x < t,
    GTE: (x, t) => x >= t,
    LTE: (x, t) => x <= t
};

export default function() {

    let exports = {},

        /** private **/

        // d3 scale used for alt. secondary values
        altValueScale = null,
        // D3 clusters built from hierarchies of the data and used to render dendograms
        clusters = [],
        // d3 scale used to convert heatmap values to colors
        colorScale = null,
        // D3 hierarchies used as inputs to D3's clustering functions
        hierarchies = [],
        // x-axis scale
        xScale = null,
        // y-axis scale
        yScale = null,

        /** protected **/

        // SVG object for the plot
        svg = null,

        /** public **/

        // Color used for the stroke around alt. heatmap cells
        altCellStroke = '#000000',
        // Width of the stroke around alt. heatmap cells
        altCellStrokeWidth = 1,
        // Comparison operator to use when checking the threshold for alternative values
        altThresholdComparator = Threshold.GT,
        // Domain for the alternative
        altValueDomain = null,
        // Cutoff threshold to use when showing displaying sizes
        altValueThreshold = 1.0,
        // Range of sizes for the alternative value set
        altValueRange = null,
        // Positioning for the first cell of the heatmap, default is to begin
        // on the plot's left hand side
        cellAlignHorizontal = Align.LEFT,
        // Positioning for the first cell of the heatmap, default is to begin
        // on the plot's bottom axis
        cellAlignVertical = Align.BOTTOM,
        cellPadding = 0,
        // Color used for the stroke around heatmap cells
        cellStroke = '#000000',
        // Width of the stroke around heatmap cells
        cellStrokeWidth = 1,
        // Domain for values used to color the heatmap
        colorDomain = null,
        // List of user-defined colors to use for the quantized color scale
        colors = null,
        // Data object containing objects/data to visualize
        data = null,
        // The height (or width if positioned across left/right axes) of the dendrogram
        dendrogramSize = null,
        // Extra padding for the dendrogram position
        dendrogramPadding = 0,
        // Stroke color for dendrogram lines
        dendrogramStroke = '#222222',
        // Stroke width for dendrogram lines
        dendrogramStrokeWidth = 1,
        // HTML element or ID the SVG should be appended to
        element = 'body',
        // Font family
        font = 'sans-serif',
        // Font size
        fontSize = 11,
        // Font weight
        fontWeight = 'normal',
        // SVG height
        height = 600,
        // If true, inverts the alternative values scale
        invertAltValueScale = false,
        // Margin object
        margin = {top: 90, right: 90, bottom: 90, left: 90},
        // If true, rows == columns so the plot removes a diagonal portion of the heatmap
        mirrorAxes = false,
        normalizeRows = false,
        normalizeColumns = false,
        normalizeMatrix = false,
        // Number of colors to use for the quantized color scale
        numColors = 5,
        // If true, renders heatmap cells where row[i] == column[j]
        renderIdentities = false,
        // Rotate x-axis labels so they aren't a straight vertical line and easy to read
        rotateXLabels = true,
        // Factor to use for rounding out rectangles
        roundFactor = 0,
        useAltValues = false,
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
        // SVG width
        width = 600
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
      * Sorts the rows and columns of the matrix based on 1) dendogram clusters or 2)
      * labels. If the user provides clustering data to draw a dendogram, then we sort
      * rows/columns based on in-order traversal of the tree structure. Otherwise, we
      * just sort the rows/columns based on their labels.
      *
      * arguments
      *     xd: the x-domain (columns)
      *     yd: the y-domain (rows)
      *
      * returns
      *     sorted column and row lists
      */
    let sortMatrix = function(xd, yd) {

        if ((!data.clusters || !data.clusters.length) && mirrorAxes) {

            return [
                xd.sort((a, b) => a.localeCompare(b)),
                yd.sort((a, b) => a.localeCompare(b)),
            ];
        }

        for (let clust of data.clusters) {

            // In-order traversal of the tree, only returning leaves
            let leaves = clust.hierarchy.leaves();

            // Map labels to their indices in the array
            let indexMap = leaves.reduce((ac, d, idx) => {

                return ac[d.data.data.label] = idx, ac;
            }, {});

            let labels = null;

            // The the user wants the cluster positioned along the top/bottom axes, this
            // means we're clustering over columns
            if (clust.axis == Align.TOP || clust.axis == Align.BOTTOM)
                labels = new Set(xd);
            else
                labels = new Set(yd);

            // The intersection of all clustering labels and column labels
            let inters = new Set(Object.keys(indexMap).filter(d => labels.has(d)));

            // Ensure the clusters has exactly the same labels as the ones in the matrix
            if (inters.length != labels.length) {

                console.error(
                    'The cluster does not contain the same labels used by the matrix'
                );

                // Null out the clustering data so it isn't used later on
                data.clusters = null;

                break;
            }

            // Rearrange the domain based on cluster order
            for (let k of Object.keys(indexMap)) {

                if (clust.axis == Align.TOP || clust.axis == Align.BOTTOM)
                    xd[indexMap[k]] = k;
                else
                    yd[indexMap[k]] = k;
            }

            if (mirrorAxes) {

                if (clust.axis == Align.TOP || clust.axis == Align.BOTTOM)
                    yd = xd;
                else
                    xd = yd;
            }
        }

        return [xd, yd];
    };

    /**
      * Creates the d3 scale objects for x- and y-axes using the available x and y
      * domains. Also creates a scale of colors based on either the values 
      * associated with the data, or a custom domain specified by the user.
      */
    let makeScales = function() {

        xDomain = xDomain ? xDomain : getColumnCategories();
        yDomain = yDomain ? yDomain : (mirrorAxes ? xDomain : getRowCategories());

        //if (mirrorAxes) {

            [xDomain, yDomain] = sortMatrix(xDomain, yDomain);
            //xDomain.sort((a, b) => a.localeCompare(b));
            //yDomain.sort((a, b) => a.localeCompare(b));
        //}

        colorDomain = colorDomain ? colorDomain : extent(data.values.map(d => d.value));
        colors = colors ? colors : schemeBlues[numColors];

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
            .range(colors);
        
        if (useAltValues) {

            // Choose the smaller of the bandwidths to be the upper bound for the alt 
            // value scale
            let altMax = xScale.bandwidth() < yScale.bandwidth() ? 
                         xScale.bandwidth() : yScale.bandwidth();

            // The upper bound is set to be 95% of half bandwidth so it doesn't overlap
            // the cell edges
            altMax = Math.floor((altMax / 2) * 0.95);

            // Or just ignore everything we just did if the user specifies a range
            altValueRange = altValueRange ? altValueRange : [3, altMax];
            altValueDomain = altValueDomain ? 
                             altValueDomain : extent(data.values, d => d.altValue);

            altValueScale = scaleLinear()
                .domain(altValueDomain)
                .range(altValueRange);

            if (invertAltValueScale)
                altValueScale.domain([altValueDomain[1], altValueDomain[0]]);
        }

        // Cells begin at the right axis so change the scale to reflect that
        if (cellAlignHorizontal === Align.RIGHT)
            xScale.range([getWidth(), 0]);

        // Cells begin at the top axis 
        if (cellAlignVertical === Align.TOP)
            yScale.range([getHeight(), 0]);
    };

    /**
      * Draws the x- and y-axes.
      */
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

        xaxis = xaxis(xScale);
        yaxis = yaxis(yScale);

        let xAxisObject = svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', () => {
                return xAxisAlign == Align.TOP ? 'translate(0, 0)' :
                                                 `translate(0, ${getHeight()})`;
            })
            .call(xaxis);

        // Update the text properties and positioning for the axis ticks
        xAxisObject.selectAll('text')
            .attr('x', rotateXLabels ? 5 : 0)
            .attr('y', xAxisAlign == Align.TOP ? -8 : 12)
            .attr('dx', rotateXLabels ? '.35em' : '')
            .attr('dy', '.35em')
            .attr('font', font)
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', fontWeight)
            .attr('transform', () => {
                
                if (rotateXLabels)
                    return xAxisAlign == Align.TOP ? 'rotate(-45)' : 'rotate(-320)';

                return '';
            })
            .attr('text-anchor', rotateXLabels ? 'start' : 'middle');

        // Add the x-axis label
        xAxisObject.append('text')
            .attr('class', 'x-axis-label')
            .attr('x', getWidth() / 2)
            .attr('y', xLabelPad)
            .attr('fill', '#000000')
            .attr('text-anchor', 'middle')
            .text(xLabel);

        let yAxisObject = svg.append('g')
            .attr('class', 'y-axis')
            .attr('transform', () => {
                return yAxisAlign == Align.LEFT ? 
                       'translate(0, 0)' :
                       `translate(${getWidth()}, 0)`;
            })
            .call(yaxis);

        yAxisObject.selectAll('text')
            .attr('font', font)
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', fontWeight)
            .attr('text-anchor', 'start');

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

        // If we don't render the identity matrix (i.e. row[i] == col[j]) then we remove
        // these ticks otherwise they are just labeling empty space
        if (mirrorAxes && !renderIdentities) {

            xAxisObject.select('.tick:last-of-type').remove();
            yAxisObject.select('.tick:first-of-type').remove();
        }
    };

    /**
      * Draws each cell of the heatmap.
      */
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
                if (mirrorAxes && renderIdentities)
                    return indexMap[d.y] <= indexMap[d.x];
                else if (mirrorAxes)
                    return indexMap[d.y] < indexMap[d.x];
                else
                    return true;
            })
            .append('g')
            .attr('class', 'cell');

        cells.append('rect')
            .attr('x', d => xScale(d.x) + cellPadding)
            .attr('y', d => yScale(d.y) + cellPadding)
            .attr('rx', roundFactor)
            .attr('ry', roundFactor)
            .attr('height', yScale.bandwidth() - cellPadding)
            .attr('width', xScale.bandwidth() - cellPadding)
            .attr('fill', d => {

                if (d.fill)
                    return d.fill;

                if (!d.value)
                    return '#ffffff';

                return colorScale(d.value);
            })
            .attr('shape-rendering', 'crispEdges')
            .attr('stroke', cellStroke)
            .attr('stroke-width', cellStrokeWidth);

        // Mark identity cells if they are rendered
        cells.filter(d => d.x == d.y)
            .attr('class', 'cell identity-cell');

        cells.append('svg:title')
            .text(d => d.text ? d.text : '');
    };

    /**
      * Renders cells with alt. values.
      */
    let renderAltCells = function() {

        // Maps row and column categories to their indexed position on the plot
        let indexMap = {};

        getRowCategories().forEach(d => { indexMap[d] = xScale(d); });
        getColumnCategories().forEach(d => { indexMap[d] = yScale(d); });

        let cells = svg
            .append('g')
            .attr('class', 'alt-cells')
            .selectAll('cells')
            .data(data.values)
            .enter()
            .filter(d => altThresholdComparator(d.altValue, altValueThreshold))
            .filter(d => {

                // If rows == columns, we only a diagonal cross section of the heatmap
                if (mirrorAxes && renderIdentities)
                    return indexMap[d.y] <= indexMap[d.x];
                else if (mirrorAxes)
                    return indexMap[d.y] < indexMap[d.x];
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
            .append('circle')
            .attr('cx', d => xScale(d.x) + (xScale.bandwidth() / 2))
            .attr('cy', d => yScale(d.y) + (yScale.bandwidth() / 2))
            .attr('r', d => altValueScale(d.altValue))
            .attr('fill', d => {

                if (d.fill)
                    return d.fill;

                if (!d.value)
                    return '#ffffff';

                return colorScale(d.value);
            })
            .attr('shape-rendering', 'auto')
            .attr('stroke', altCellStroke)
            .attr('stroke-width', altCellStrokeWidth);

        cells.append('svg:title')
            .text(d => d.text ? d.text : '');
    };

    let determineDendrogramSize = function(axis=null) {

        if (dendrogramSize !== null)
            return dendrogramSize;

        if (axis == undefined || axis == null || axis == Align.TOP)
            return margin.top - 10;
        else if (axis == Align.BOTTOM)
            return margin.bottom - 10;
        else if (axis == Align.LEFT)
            return margin.left - 10;
        else
            return margin.right - 10;
    };

    let generateClusters = function() {

        if (!data.clusters || !data.clusters.length)
            return;

        for (let clust of data.clusters) {

            let dendogram = null;
            let dendSize = determineDendrogramSize(clust.axis);
            
            if (clust.axis == Align.TOP || clust.axis == Align.BOTTOM) {

                dendogram = cluster()
                    .size([xScale.bandwidth() * xScale.domain().length, dendSize])
                    .separation(() => xScale.bandwidth())
                    (clust.hierarchy);

            } else {

                dendogram = cluster()
                    .size([yScale.bandwidth() * yScale.domain().length, dendSize])
                    .separation(() => yScale.bandwidth())
                    (clust.hierarchy);
            }

            // Add a field specifying the axis the cluster should be rendered along
            dendogram.axis = clust.axis;

            clusters.push(dendogram);
        }
    };

    /**
      * Rneder dendrograms for the given clusters. We're lazy so we make a single
      * dendrograms and just flip/rotate it depending on the axis it should be aligned 
      * to.
      */
    let renderDendrogram = function() {

        // No clusters so no dendrograms
        if (!clusters.length)
            return;

        for (let dend of clusters) {

            let dendSVG = svg.append('g')
                .datum(dend)
                .attr('class', 'dend')
                .attr('transform', d => {

                    let dendSize = determineDendrogramSize(d.axis);

                    if (d.axis == Align.TOP) {

                        return `translate(0, ${-dendSize + dendrogramPadding})`

                    } else if (d.axis == Align.BOTTOM) {

                        return `translate(0, ${ getHeight() + dendSize + dendrogramPadding}) scale(1, -1)`;

                    } else if (d.axis == Align.LEFT) {

                        return `translate(${-dendSize + dendrogramPadding}, ${getHeight()}) rotate(-90) scale(1, 1)`;

                    } else {

                        return `translate(${getWidth() + dendSize + dendrogramPadding}, ${getHeight()}) rotate(90) scale(-1,1)`;
                    }
                });

            let link = line().curve(curveStepAfter);

            dendSVG.selectAll('edges')
                .data(dend.links())
                .enter()
                .append('path')
                .attr('class', 'dendogram-edge')
                .attr('fill', 'none')
                .attr('stroke', dendrogramStroke)
                .attr('stroke-width', dendrogramStrokeWidth)
                .attr('d', d => {
                    return link([
                        [d.source.x, d.source.y],
                        [d.target.x, d.target.y]
                    ]);
                });
        }
    };

    /** properties **/

    exports = {
        ...exports,
        get xScale() { return xScale; },
        get yScale() { return yScale; }
    };

    /** public **/

    exports.getHeight = getHeight;
    exports.getWidth = getWidth;

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

        if (useAltValues)
            renderAltCells();

        generateClusters();

        renderDendrogram();

        return exports;
    };


    /** properties **/

    exports.Threshold = Threshold;
    exports.Alignment = Align;

    /** setters/getters **/

    exports.svg = function() { return svg; };
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

    exports.altValueDomain = function(_) {
        if (!arguments.length) return altValueDomain;
        altValueDomain = _;
        return exports;
    };

    exports.altValueThreshold = function(_) {
        if (!arguments.length) return altValueThreshold;
        altValueThreshold = +_;
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

    exports.cellPadding = function(_) {
        if (!arguments.length) return cellPadding;
        cellPadding = +_;
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

    exports.dendrogramPadding = function(_) {
        if (!arguments.length) return dendrogramPadding;
        dendrogramPadding = +_;
        return exports;
    };

    exports.dendrogramSize = function(_) {
        if (!arguments.length) return dendrogramSize;
        dendrogramSize = +_;
        return exports;
    };

    exports.dendrogramStroke = function(_) {
        if (!arguments.length) return dendrogramStroke;
        dendrogramStroke = _;
        return exports;
    };

    exports.dendrogramStrokeWidth = function(_) {
        if (!arguments.length) return dendrogramStrokeWidth;
        dendrogramStrokeWidth = +_;
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

    exports.numColors = function(_) {
        if (!arguments.length) return numColors;
        numColors = +_;
        return exports;
    };

    exports.renderIdentities = function(_) {
        if (!arguments.length) return renderIdentities;
        renderIdentities = _;
        return exports;
    };

    exports.roundFactor = function(_) {
        if (!arguments.length) return roundFactor;
        roundFactor = +_;
        return exports;
    };

    exports.rotateXLabels = function(_) {
        if (!arguments.length) return rotateXLabels;
        rotateXLabels = _;
        return exports;
    };

    exports.useAltValues = function(_) {
        if (!arguments.length) return useAltValues;
        useAltValues = _;
        return exports;
    };

    exports.width = function(_) {
        if (!arguments.length) return width;
        width = +_;
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
        exports.renderAltCells = renderAltCells;

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

