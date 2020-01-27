/**
 * file: violin.js
 * desc: d3js implementation of violin plots.
 * auth: TR
 */

'use strict';

import {extent, max, mean, median, min, quantile} from 'd3-array';
import {axisBottom, axisLeft} from 'd3-axis';
import {scaleBand, scaleLinear, scaleOrdinal} from 'd3-scale';
import {schemeCategory10} from 'd3-scale-chromatic';
import {area, curveCatmullRom, line} from 'd3-shape';
import {select} from 'd3-selection';

export default function() {

    let exports = {},

        /** public **/

        // Data objects
        data = null,
        // Opacity for the shaded distribution area around each violin
        distributionOpacity = 0.7,
        // X and y axis font
        font = '"Helvetica neue", Helvetica, Arial, sans-serif',
        // X and y axis font size
        fontSize = 13,
        // X and y axis font weight
        fontWeight = 'normal',
        // SVG height
        height = 800,
        // Kernel density estimation bandwidth parameter
        kernelBandwidth = 50,
        // Determines whether to draw outer (first/last) ticks on the x-axis
        outerTicks = false,
        // X-axis label
        xLabel = '',
        // Y-axis label
        yLabel = '',
        // SVG label text
        svgLabel = '',
        // SVG width
        width = 900,

        /** private **/

            // Color scale dependent on violin categories
        colorScale = null,
        // Margin object
        margin = {top: 30, right: 10, bottom: 40, left: 50},
        // SVG object
        svg = null,
        // SVG object
        violinSvg = null,
        // Use alternate label position for the y-axis label
        useAltYAxisLabel = false,
        // d3 xAxis object
        xAxis = null,
        // X value domain
        xDomain = null,
        // Padding in pixels for the x-axis label, x padding...
        xLabeldx = null,
        // ... and y padding
        xLabeldy = null,
        // X value scale
        xScale = null,
        // d3 yAxis object
        yAxis = null,
        // Y value domain
        yDomain = null,
        // Padding in pixels for the y-axis label, x padding...
        yLabeldx = null,
        // ... and y padding
        yLabeldy = null,
        // Y value scale
        yScale = null,
        // Number of y-axis ticks to use
        yTicks = 10,
        // d3 format string for the y-axis tick numbers
        yTickFormat = null;


    /**
      * Kernel density functions.
      */
    const _kernels = {

        epanechnikov: (scale) => {
            return (u) => {
                return Math.abs(u /= scale) <= 1 ?
                    .75 * (1 - u * u) / scale :
                    0;
            };
        },

        triweight: (scale) => {
            return (u) => {
                return Math.abs(u /= scale) <= 1 ?
                    (35/32) * Math.pow((1 - u * u), 3) / scale :
                    0;
            };
        }

    };

    /**
      * Mike Bostock's kernel density estimation function
      */
    let kernelDensityGenerator = function(kernel, x) {

        return function(sample) {
            return x.map(function(x) {
                return [x, mean(sample, function(v) {
                    return kernel(x - v);
                })];
            });
        };
    };

    /**
     * Returns the margin corrected height of the plot.
     */
    let getHeight = function() { return height - margin.top - margin.bottom; };

    /**
     * Returns the margin corrected width of the plot.
     */
    let getWidth = function() { return width - margin.left - margin.right; };

    /**
     * Returns the list of violin labels used in the plot
     */
    let getLabels = function() {
        return data.map(d => d.label);
    };

    /**
     * Iterates over each violin object and returns all distribution values
     * flattened into a single array.
     */
    let getAllValues = function() {
        return [].concat.apply([], data.map(d => d.values));
    };

    /**
     * Creates the x and y axis scales using the given domains and/or values.
     * Returns the D3 scale objects in a two element array.
     */
    let makeScales = function() {

        if (xDomain === undefined || !xDomain)
            xDomain = getLabels();

        if (yDomain === undefined || !yDomain)
            yDomain = extent(getAllValues());

        xScale = scaleBand()
            .domain(xDomain)
            .rangeRound([0, getWidth()])
            .padding(0.1);

        yScale = scaleLinear()
            .domain(yDomain)
            .rangeRound([getHeight(), 0]);

        colorScale = scaleOrdinal()
            .domain(xDomain)
            .range(schemeCategory10);

        return [xScale, yScale];
    };

    let makeAxes = function() {

        xAxis = axisBottom(xScale)
            .tickSizeOuter(0);

        yAxis = axisLeft(yScale)
            .ticks(yTicks, yTickFormat);
    };

    /**
     * Creates the x and y axis objects and draws them. The axis objects are
     * returned as a two element array.
     */
    let renderAxes = function() {


        let xAxisObject = svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${getHeight()})`)
            .call(xAxis);

        xAxisObject.append('text')
            .attr('class', 'x-axis-label')
            .attr('x', xLabeldx != null ? xLabeldx : (getWidth() / 2))
            .attr('y', xLabeldy != null ? xLabeldy : 35)
            .attr('fill', '#000000')
            .attr('text-anchor', 'middle')
            .text(xLabel);

        xAxisObject.selectAll('text')
            .attr('font-family', font)
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', fontWeight);

        let yAxisObject = svg.append('g')
            .attr('class', 'y-axis')
            .call(yAxis);

        yAxisObject.append('text')
            .attr('class', 'y-axis-label')
            .attr('x', () => {

                if (yLabeldx != null)
                    return yLabeldx;

                return useAltYAxisLabel ? 5 : (-getHeight() / 2);
            })
            .attr('y', () => {

                if (yLabeldy != null)
                    return yLabeldy;

                return useAltYAxisLabel ? 5 : -35;
            })
            .attr('fill', '#000000')
            .attr('transform', 'rotate(-90)')
            .attr('text-anchor', useAltYAxisLabel ? 'end' : 'middle')
            .text(yLabel);

        yAxisObject.selectAll('text')
            .attr('font-family', font)
            .attr('font-size', `${fontSize}px`)
            .attr('font-weight', fontWeight);

        return [xAxisObject, yAxisObject];
    };

    /**
      * Make the <g> containers which encapsulate individual violin plots.
      */
    let makeViolinContainers = function() {

        violinSvg = svg.selectAll('violins')
            .append('g')
            .attr('class', 'violins')
            .data(data)
            .enter()
            .append('g')
            .attr('class', d => 'violin')
            .attr('id', d => `violin-${d.label}`);
    };

    /**
      * Draws the interquartile range (IQR) for each violin..
      */
    let renderQuartiles = function() {

        violinSvg.append('line')
            .attr('x1', function(d) {
                return xScale(d.label) + (xScale.bandwidth() / 2);
            })
            .attr('y1', function(d) {
                return yScale(getQ3(d.values));
            })
            .attr('x2', function(d) {
                return xScale(d.label) + (xScale.bandwidth() / 2);
            })
            .attr('y2', function(d) {
                return yScale(getQ1(d.values));
            })
            .attr('stroke-linecap', 'round')
            .attr('shape-rendering', 'auto')
            .attr('stroke', '#666')
            .attr('stroke-width', 11);
    };

    /**
     * Returns the first quartile for the given set of values.
     */
    let getQ1 = function(values) { return quantile(values.sort((a, b) => a - b), 0.25); };

    /**
     * Returns the third quartile for the given set of values.
     */
    let getQ3 = function(values) { return quantile(values.sort((a, b) => a - b), 0.75); };

    /**
     * Returns the median for the given set of values.
     */
    let getMedian = function(values) { return median(values); };

    /**
     * Draws the median for each violin.
     */
    let renderMedian = function() {

        violinSvg.append('circle')
        //.attr('cx', xScale(quarts.x))
        //.attr('cy', yScale(quarts.median))
            .attr('cx', function(d) {
                //return xScale(values[0].x);
                return xScale(d.label) + (xScale.bandwidth() / 2);
            })
            .attr('cy', function(d) {
                return yScale(getMedian(d.values));
            })
            .attr('r', 4)
            .attr('fill', '#FFFFFF')
            .attr('shape-rendering', 'auto')
            .attr('stroke', 'none');
    };

    /**
     * Returns the interquartile range for the given set of values.
     */
    let interQuartileRange = function(ds) { return getQ3(ds) - getQ1(ds); };

    /**
     * Returns the position of the lower confidence interval for the given set
     * of values.
     */
    let lowerCI = function(ds) {

        let med = median(ds);
        let iqr = interQuartileRange(ds)

        let lower = med - (1.75 * (iqr / Math.sqrt(ds.length)));

        return lower;
    };

    /**
     * Returns the position of the upper confidence interval for the given set
     * of values.
     */
    let upperCI = function(ds) {

        let med = getMedian(ds);
        let iqr = interQuartileRange(ds)

        let upper = med + (1.75 * (iqr / Math.sqrt(ds.length)));

        return upper;
    };

    /**
     * Draws the background of the plot. Currently this is just grey lines
     * indicating ticks on the y axis.
     */
    let renderBackground = function() {

        let ticks = yScale.ticks(yTicks);

        for (let i = 0; i < ticks.length; i++) {

            // no fucking clue why this is one pixel off
            svg.append('line')
                .attr('x1', 0)
                .attr('y1', yScale(ticks[i]) /*+ 1*/)
                .attr('x2', getWidth())
                .attr('y2', yScale(ticks[i]) /*+ 1*/)
                .attr('shape-rendering', 'crispEdges')
                .attr('stroke', '#ddd')
                .attr('stroke-width', 1);
        }
    };

    /**
     * Draws the confidence intervals for each violin.
     */
    let renderCI = function() {

        violinSvg.append('line')
            .attr('x1', function(d) {
                return xScale(d.label) + (xScale.bandwidth() / 2);
            })
            .attr('y1', function(d) {
                return yScale(lowerCI(d.values));
            })
            .attr('x2', function(d) {
                return xScale(d.label) + (xScale.bandwidth() / 2);
            })
            .attr('y2', function(d) {
                return yScale(upperCI(d.values));
            })
            .attr('stroke-linecap', 'round')
            .attr('shape-rendering', 'auto')
            .attr('stroke', '#666')
            .attr('stroke', '#FFFFFF')
            .attr('stroke-width', 3);
    };

    /**
     * Estimates density using the Epanechnikov kernel for the given set of
     * values.
     *
     * returns
     *     an array of two element arrays where the first element is a value
     *     from the given list of values, and the second element is its
     *     density.
     *
     *     e.g. an input like [0,1,2,1,3,5,5,5,4] might return
     *         [[0, 0.1], [1, 0.2], [2, 0.1], [3, 0.1], [4, 0.1], [5, 0.4]]
     */
    var makeKDE = function(values) {

        var kdg = kernelDensityGenerator(
            _kernels.epanechnikov(kernelBandwidth), yScale.ticks(100)
        );
        //var kde = kdg(values.map(function(d) { return d.y; }));
        var kde = kdg(values);
        var kmid = Math.round(kde.length / 2);
        var kmin = 0;
        var kmax = kde.length - 1;
        //var median = getMedian(values);
        var med = median(values);

        // These next three loops attempt to find a good cut off point for the
        // distribution area drawing. There are cases where zero density gaps
        // can be found throughout the distribution and the resulting drawn
        // area contains these weird looking hills and valleys. So we we begin
        // at the bounds of the IQR and extend outward in both directions,
        // trying to cut off all the areas past the first discovered zero
        // density gap.
        for (var i = 0; i < kde.length; i++) {

            // Finds the midpoint of the density estimation
            if (kde[i][0] >= med) {

                kmid = i;
                break
            }
        }
        for (var i = kmid; i > 0; i--) {

            // Find the first zero density area in one direction
            if (kde[i][1] == 0) {

                kmin = i;
                break;
            }
        }

        for (var i = kmid; i < kde.length; i++) {

            // Find the first zero density area in the other direction
            if (kde[i][1] == 0) {

                kmax = i + 1;
                break;
            }
        }

        // Save these densities for drawing
        kde = kde.slice(kmin, kmax);

        return kde;
    };

    /**
     * Draws each violin, or more precisely the area of its distribution.
     */
    let renderDistributions = function() {

        var distributionData = data.map(function(d) {

            var kde = makeKDE(d.values);

            if (d.upperBound)
                kde = kde.filter(function(a) { return a[0] <= d.upperBound; });

            if (d.lowerBound)
                kde = kde.filter(function(a) { return a[0] >= d.lowerBound; });

            // The left and right boundaries for the drawn areas
            var leftBound = xScale(d.label) - (xScale.bandwidth() / 2);
            var rightBound = xScale(d.label) + (xScale.bandwidth() / 2);

            // The width of each violin based on their boundaries, which in turn is
            // based on the banwdith of the x-axis band scale
            var violinWidth = (rightBound - leftBound) / 2;

            // The x and y scales are reversed for the drawn areas since we're
            // drawing them rotated @ 90 degrees
            var xAreaScale = yScale.copy();
            var yAreaScale = scaleLinear()
                .domain([0, max(kde, function(d) { return d[1]; })])
                .range([violinWidth, 0])
                .clamp(true)
            ;

            let violinArea = area()
                .x(function(d) { return xAreaScale(d[0]); })
                .y0(violinWidth)
                .y1(function(d) { return yAreaScale(d[1]); })
                .curve(curveCatmullRom.alpha(0.5))
            ;

            let violinLine = line()
                .x(function(d) { return xAreaScale(d[0]); })
                .y(function(d) { return yAreaScale(d[1]); })
                .curve(curveCatmullRom.alpha(0.5))
            ;

            return {
                kde: kde,
                leftBound: leftBound,
                rightBound: rightBound,
                violinWidth: violinWidth,
                area: violinArea,
                line: violinLine
            };
        });

        //var rightSide = svg.append('g');
        //var leftSide = svg.append('g');
        var rightSide = violinSvg.append('g');
        var leftSide = violinSvg.append('g');

        rightSide.append('path')
            .attr('class', function(d) { return 'right-area'; })
            .datum(function(d, i) { return distributionData[i].kde; })
            .attr('fill', function(d, i) {

                if (data[i].color)
                    return data[i].color;
                else
                    return colorScale(data[i].label)
            })
            .attr('d', function(d, i) { return distributionData[i].area(d); })
            .attr('opacity', 0.7)
        ;

        leftSide.append('path')
            .attr('class', function(d) { return 'left-area'; })
            .datum(function(d, i) { return distributionData[i].kde; })
            .attr('fill', function(d, i) {

                if (data[i].color)
                    return data[i].color;
                else
                    return colorScale(data[i].label)
            })
            .attr('d', function(d, i) { return distributionData[i].area(d); })
            .attr('opacity', 0.7)
        ;

        rightSide.append('path')
            .attr('class', function(d) { return 'right-path-' + d.id; })
            .datum(function(d, i) { return distributionData[i].kde; })
            .attr('d', function(d, i) { return distributionData[i].line(d); })
            .attr('shape-rendering', 'auto')
            .attr('stroke', '#666')
            .attr('stroke-width', 3)
            .attr('fill', 'none')
        ;

        /*
        leftSide.append('path')
            .datum(kde)
            .attr('d', line)
            .style('shape-rendering', 'auto')
            .style('stroke', '#666')
            .style('stroke-width', 3)
            .style('fill', 'none')
            ;
            */

        leftSide.append('path')
            .datum(function(d, i) { return distributionData[i].kde; })
            .attr('class', function(d) { return 'right-path-' + d.id; })
            .attr('d', function(d, i) { return distributionData[i].line(d); })
            .attr('shape-rendering', 'auto')
            .attr('stroke', '#666')
            .attr('stroke-width', 3)
            .attr('fill', 'none')
        ;

        rightSide.attr('transform', function(d, i) {
            var rightBound = distributionData[i].rightBound;
            var violinWidth = distributionData[i].violinWidth;

            return 'rotate(90,0,0) translate(0,-' + (rightBound + violinWidth) + ')'
        });

        leftSide.attr('transform', function(d, i) {
            var leftBound = distributionData[i].leftBound;
            var violinWidth = distributionData[i].violinWidth;

            return 'rotate(90,0,0) translate(0,-' + (leftBound + violinWidth) +
                ') scale(1,-1)';
        });
    };

    var drawSignificance = function() {

        // Don't draw anything if the user hasn't provided a list of
        // significantly different pairs
        if (!data.significance)
            return;

        // Draw the significance lines 20px above the tallest violin
        var heightPad = 20;
        // The vertical significance line == 15px
        var yLineLength = 15;

        for (var i = 0; i < data.significance.length; i++) {

            var cata = data.significance[i].sig[0];
            var catb = data.significance[i].sig[1];
            var cata = data.cat2id[cata];
            var catb = data.cat2id[catb];

            // Retrieves the DOM object (violin area) associated with the given
            // category.
            var abox = svg.select('.right-area-' + cata).node();
            var bbox = svg.select('.right-area-' + catb).node();

            if (!abox || !bbox)
                continue;

            // Object containing absolute positions and bound lengths/widths
            var abox = abox.getBoundingClientRect();
            var bbox = bbox.getBoundingClientRect();

            console.log(abox);
            console.log(bbox);
            //console.log(svg.select('.right-path-' + cata).node().getBoundingClientRect());
            //console.log(svg.select('.right-path-' + catb).node().getBoundingClientRect());
            //console.log(svg.select('.left-area-' + catb).node().getBoundingClientRect());
            //
            // The tallest violin, for some reason getBounding... returns
            // incorrect results in some cases. no idea why
            if (!data.significance[i].y)
                var miny = min([abox.y, bbox.y]);
            else
                var miny = data.significance[i].y;

            //console.log(abox.y - abox.height);

            var sigs = svg.append('g')
                // getBoundingClientRect returns true SVG coordinates so we
                // have to compensate for any transforms we do. idk why the
                // fucking positioning is off on this shit (the +2) but
                // whatever
                    .attr('transform',
                        'translate(' + (-margin.left - margin.right + 2) + ',' + (-margin.top) + ')'
                    )
            ;

            console.log(miny);
            // Draws the significance bars from one violin to another
            sigs.append('path')
                .attr('d', function() {

                    //miny = 61;
                    var yline1 = miny - heightPad;
                    var yline2 = yline1 - yLineLength;
                    console.log(abox);

                    // Fucking chrome doesn't attach x or y variables to the
                    // results of getBoundingClientRect like firefox does...
                    //return 'M' + abox.x + ',' + yline1 + ' ' +
                    //       'L' + abox.x + ',' + yline2 + ' ' +
                    //       'L' + bbox.x + ',' + yline2 + ' ' +
                    //       'L' + bbox.x + ',' + yline1 + ' ';
                    return 'M' + abox.left + ',' + yline1 + ' ' +
                        'L' + abox.left + ',' + yline2 + ' ' +
                        'L' + bbox.left + ',' + yline2 + ' ' +
                        'L' + bbox.left + ',' + yline1 + ' ';
                })
                .style('shape-rendering', 'crispEdges')
                .style('stroke', '#666')
                .style('stroke-width', 3)
                .style('fill', 'none');

            // Adds the asterisk to the middle of the significance bar
            sigs.append('text')
            //.attr('x', (abox.x + bbox.x) / 2)
                .attr('x', (abox.left + bbox.left) / 2)
                .attr('y', (miny - heightPad - (yLineLength / 2)))
                .style('font-family', 'sans-serif')
                .style('font-size', '30px')
                .style('font-weight', 'normal')
                .style('fill', '#666')
                .style('shape-rendering', 'crispEdges')
                .style('text-anchor', 'middle')
                .text('*');
        }
    };

    /** public **/

    /**
     * Draw the entire violin plot.
     */
    exports.draw = function() {

        svg = select('body')
            .append('svg')
            .attr('height', height)
            .attr('width', width)
            .append('g')
            .attr('transform',
                'translate(' + margin.left + ',' + margin.top + ')'
            )
            .datum(data);

        makeScales();
        makeAxes();
        renderBackground();
        renderAxes();
        makeViolinContainers();
        renderDistributions();
        renderQuartiles();
        renderCI();
        renderMedian();

        return exports;
    };

    /** Getters only, exposed as properties **/

    exports.svg = () => svg;
    exports.xAxis = () =>  xAxis;
    exports.xScale = () =>  xScale;
    exports.yScale = () =>  yScale;
    exports.yAxis = () =>  yAxis;

    /**
     * Setters and getters.
     */

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

    exports.fontColor = function(_) {
        if (!arguments.length) return fontColor;
        fontColor = _;
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

    exports.svgLabel = function(_) {
        if (!arguments.length) return svgLabel;
        svgLabel = _;
        return exports;
    };

    exports.textures = function(_) {
        if (!arguments.length) return textures;
        textures = _;
        return exports;
    };

    exports.useAltYAxisLabel = function(_) {
        if (!arguments.length) return useAltYAxisLabel;
        useAltYAxisLabel = _;
        return exports;
    };

    exports.xDomain = function(_) {
        if (!arguments.length) return xDomain;
        xDomain = _;
        return exports;
    };

    exports.yDomain = function(_) {
        if (!arguments.length) return yDomain;
        yDomain = _;
        return exports;
    };

    exports.xLabel = function(_) {
        if (!arguments.length) return xLabel;
        xLabel = _;
        return exports;
    };

    exports.xLabeldx = function(_) {
        if (!arguments.length) return xLabeldx;
        xLabeldx = +_;
        return exports;
    };

    exports.xLabeldy = function(_) {
        if (!arguments.length) return xLabeldy;
        xLabeldy = +_;
        return exports;
    };

    exports.yLabel = function(_) {
        if (!arguments.length) return yLabel;
        yLabel = _;
        return exports;
    };

    exports.yLabeldx = function(_) {
        if (!arguments.length) return yLabeldx;
        yLabeldx = +_;
        return exports;
    };

    exports.yLabeldy = function(_) {
        if (!arguments.length) return yLabeldy;
        yLabeldy = +_;
        return exports;
    };

    exports.yTicks = function(_) {
        if (!arguments.length) return yTicks;
        yTicks = _;
        return exports;
    };

    exports.yTickFormat = function(_) {
        if (!arguments.length) return yTickFormat;
        yTickFormat = _;
        return exports;
    };

    exports.distributionOpacity = function(_) {
        if (!arguments.length) return distributionOpacity;
        distributionOpacity = +_;
        return exports;
    };

    exports.kernelBandwidth = function(_) {
        if (!arguments.length) return kernelBandwidth;
        kernelBandwidth = _;
        return exports;
    };

    exports.outerTicks = function(_) {
        if (!arguments.length) return outerTicks;
        outerTicks = _;
        return exports;
    };

    // Enables testing for private methods
    if (process.env.NODE_ENV == 'development') {

        exports.makeScales = makeScales;
        exports.makeAxes = makeAxes;
        exports.renderAxes = renderAxes;
        exports.makeViolinContainers = makeViolinContainers;
        exports.renderDistributions = renderDistributions;
        exports.renderQuartiles = renderQuartiles;
        exports.renderCI = renderCI;
        exports.renderMedian = renderMedian;

        exports.svg = function(_) {
            if (!arguments.length) return svg;
            svg = _;
            return exports;
        };
    }

    return exports;
}

