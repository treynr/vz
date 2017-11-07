/**
  * file: boxplot.js
  * desc: d3js 4.0 implementation of box plots.
  * vers: 0.2.0
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
  */
var boxplot = function() {

    var exports = {},

        /** public **/

        // Data objects
        data = null,
        // X and y axis font
        font = 'sans-serif',
        // X and y axis font size
        fontSize = '11px',
        // X and y axis font weight
        fontWeight = 'normal',
        // SVG height
        height = 800,
        // SVG width
        width = 900,
        // Determines whether to draw outer (first/last) ticks on the x-axis
        outerTicks = false,
        // X-axis label
        xLabel = '',
        // Y-axis label
        yLabel = '',
        // SVG label text
        svgLabel = '',
        // Width of the boxplot and whisker outline
        strokeWidth = 4,
        // Color of the boxplot and whisker outline
        strokeColor = '#333',
        // Y value domain
        yDomain = null,

        /** private **/

        // Color scale dependent on violin categories
        colorScale = null,
        // Margin object
        margin = {top: 30, right: 10, bottom: 40, left: 50},
        // SVG object
        svg = null,
        // SVG object
        violinSvg = null,
        // X value domain
        xDomain = null,
        // X value scale
        xScale = null,
        // Y value scale
        yScale = null
        ;

    /** private **/

    /** 
      * Returns the margin corrected height of the plot.
      */
    var getHeight = function() { return height - margin.top - margin.bottom; };

    /** 
      * Returns the margin corrected width of the plot.
      */
    var getWidth = function() { return width - margin.left - margin.right; };

    /** 
      * Returns the list of categories used in the plot.
      */
    var getCategories = function() { 
        return data.map(function(d) { return d.category; });
    };

    /** 
      * Iterates over each violin object and returns all distribution values
      * flattened into a single array.
      */
    var getAllValues = function() {
        return [].concat.apply([], data.map(function(d) { return d.values; }));
    };

    var makeDefaultColors = function() {

        return [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map(
            function(d) { 
                //return d3.interpolateRainbow(d);
                return d3.interpolateCool(d);
        });
    };

    /** 
      * Creates the x and y axis scales using the given domains and/or values.
      * Returns the D3 scale objects in a two element array.
      */
    var makeScales = function() {

        if (xDomain === undefined || !xDomain)
            xDomain = getCategories();

        if (yDomain === undefined || !yDomain) {

            yDomain = [
                d3.min(getAllValues()), 
                d3.max(getAllValues())
            ];
        }

        xScale = d3.scaleBand()
            .domain(xDomain)
            //.rangeRound([margin.left, width - margin.right])
            .rangeRound([0, getWidth()])
            //.rangeRound([margin.left, getWidth()])
            .padding(0.5)
            ;

        yScale = d3.scaleLinear()
            .domain(yDomain)
            //.rangeRound([height - margin.bottom, margin.top])
            .rangeRound([getHeight(), 0])
            ;

        colorScale = d3.scaleOrdinal()
            //.domain(data.categories)
            .domain(xDomain)
            .range(d3.schemeCategory10)
            ;

        return [xScale, yScale];
    };

    /** 
      * Creates the x and y axis objects and draws them. The axis objects are
      * returned as a two element array.
      */
    var makeAxes = function() {

        var xaxis = d3.axisBottom(xScale)
            .tickSizeOuter(outerTicks ? 6 : 0)
            //.ticks(5)
            //.tickValues(xTickValues)
            //.tickFormat(d3.format(xFormat))
            ;//.tickSizeOuter(outerTicks ? 6 : 0);

        var yaxis = d3.axisLeft(yScale)
            //.ticks(5)
            //.tickValues(yTicksValues)
            //.tickFormat(d3.format(yFormat))
            ;

        var xAxisObject = svg.append('g')
            .attr('transform', function() {
                return 'translate(0,' + getHeight() + ')';
            })
            .style('fill', 'none')
            .style('font-family', font)
            .style('font-size', fontSize)
            .style('font-weight', fontWeight)
            .call(xaxis)
            .append('text')
            .attr('x', function() { return getWidth() / 2; })
            .attr('y', 35)
            .attr('fill', '#000')
            .style('text-anchor', 'middle')
            .text(function(d) { return xLabel; })
            ;

        var yAxisObject = svg.append('g')
            .style('fill', 'none')
            .style('font-family', font)
            .style('font-size', fontSize)
            .style('font-weight', fontWeight)
            .call(yaxis)
            .append('text')
            // Weird x, y argumetnns cause of the -90 rotation
            .attr('x', function() { return -getHeight() / 2; })
            .attr('y', -40)
            .attr('fill', '#000')
            .attr('transform', 'rotate(-90)')
            .style('text-anchor', 'middle')
            .text(function(d) { return yLabel; })
            ;

        return [xAxisObject, yAxisObject];
    };

    var drawQ1 = function() {

        violinSvg.append('line')
            .attr('x1', function(d) { 
                return xScale(d.category); 
            })
            .attr('y1', function(d) { 
                return yScale(getQ1(d.values));
            })
            .attr('x2', function(d) { 
                return xScale(d.category) + xScale.bandwidth(); 
            })
            .attr('y2', function(d) {
                return yScale(getQ1(d.values));
            })
            //.style('stroke-linecap', 'round')
            .style('shape-rendering', 'auto')
            .style('stroke', '#666')
            .style('stroke-width', 2)
            ;
    };

    var drawQ3 = function() {

        violinSvg.append('line')
            .attr('x1', function(d) { 
                return xScale(d.category); 
            })
            .attr('y1', function(d) { 
                return yScale(getQ3(d.values));
            })
            .attr('x2', function(d) { 
                return xScale(d.category) + xScale.bandwidth(); 
            })
            .attr('y2', function(d) {
                return yScale(getQ3(d.values));
            })
            //.style('stroke-linecap', 'round')
            .style('shape-rendering', 'auto')
            .style('stroke', '#666')
            .style('stroke-width', 2)
            ;
    };

    /** 
      * Draws the interquartile range (IQR) for each violin..
      */
    var drawQuartiles = function() {

        // Draws the box. The top of the box is Q3 and the bottom is Q1.
        violinSvg.append('rect')
            .attr('x', function(d) { 
                return xScale(d.category); 
            })
            .attr('y', function(d) { 
                return yScale(getQ3(d.values));
            })
            .attr('width', function(d) { 
                return xScale.bandwidth(); 
            })
            .attr('height', function(d) {
                return yScale(getQ1(d.values)) - yScale(getQ3(d.values));
            })
            //.style('fill', 'none')
            .style('fill', function(d, i) {

                if (d.color === undefined)
                    return makeDefaultColors()[i];

                return d.color;
            })
            .style('shape-rendering', 'auto')
            .style('stroke', strokeColor)
            .style('stroke-width', strokeWidth)
            ;

        violinSvg.append('line')
            .attr('x1', function(d) { 
                return xScale(d.category); 
            })
            .attr('y1', function(d) { 
                return yScale(getMedian(d.values));
            })
            .attr('x2', function(d) { 
                return xScale(d.category) + xScale.bandwidth(); 
            })
            .attr('y2', function(d) { 
                return yScale(getMedian(d.values));
            })
            .style('shape-rendering', 'auto')
            .style('stroke', strokeColor)
            .style('stroke-width', strokeWidth)
            ;
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

            for (var j = 0; j < d.values.length; j++) {
                if (d.values[j] >= q1end) {
                    min = d.values[j];
                    break;
                }
            }

            for (var j = d.values.length - 1; j >= 0; j--) {
                if (d.values[j] <= q3end) {
                    max = d.values[j];
                    break;
                }
            }

            whiskers.push({
                category: d.category, 
                max: max,
                min: min, 
                q1: getQ1(d.values),
                q3: getQ3(d.values),
            });
        }

        violinSvg.selectAll('whiskers')
            .data(whiskers)
            .enter()
            .append('line')
            .attr('x1', function(d) { 
                return xScale(d.category) + xScale.bandwidth() / 4; 
            })
            .attr('y1', function(d) { 
                return yScale(d.min);
            })
            .attr('x2', function(d) { 
                return xScale(d.category) + (xScale.bandwidth() / 4) * 3; 
            })
            .attr('y2', function(d) { 
                return yScale(d.min);
            })
            .style('shape-rendering', 'auto')
            .style('stroke', strokeColor)
            .style('stroke-width', strokeWidth)
            ;

        violinSvg.selectAll('whiskers')
            .data(whiskers)
            .enter()
            .append('line')
            .attr('x1', function(d) { 
                return xScale(d.category) + xScale.bandwidth() / 4; 
            })
            .attr('y1', function(d) { 
                return yScale(d.max);
            })
            .attr('x2', function(d) { 
                return xScale(d.category) + (xScale.bandwidth() / 4) * 3; 
            })
            .attr('y2', function(d) { 
                return yScale(d.max);
            })
            .style('shape-rendering', 'auto')
            .style('stroke', strokeColor)
            .style('stroke-width', strokeWidth)
            ;

        violinSvg.selectAll('whiskers')
            .data(whiskers)
            .enter()
            .append('line')
            .attr('x1', function(d) { 
                return xScale(d.category) + xScale.bandwidth() / 2; 
            })
            .attr('y1', function(d) { 
                return yScale(d.max);
            })
            .attr('x2', function(d) { 
                return xScale(d.category) + xScale.bandwidth() / 2; 
            })
            .attr('y2', function(d) { 
                return yScale(d.q3);
            })
            .style('shape-rendering', 'auto')
            .style('stroke', strokeColor)
            .style('stroke-width', strokeWidth)
            ;

        violinSvg.selectAll('whiskers')
            .data(whiskers)
            .enter()
            .append('line')
            .attr('x1', function(d) { 
                return xScale(d.category) + xScale.bandwidth() / 2; 
            })
            .attr('y1', function(d) { 
                return yScale(d.min);
            })
            .attr('x2', function(d) { 
                return xScale(d.category) + xScale.bandwidth() / 2; 
            })
            .attr('y2', function(d) { 
                return yScale(d.q1);
            })
            .style('shape-rendering', 'auto')
            .style('stroke', strokeColor)
            .style('stroke-width', strokeWidth)
            ;
    };

    /** 
      * Returns the first quartile for the given set of values.
      */
    var getQ1 = function(values) { return d3.quantile(values, 0.25); };

    /** 
      * Returns the third quartile for the given set of values.
      */
    var getQ3 = function(values) { return d3.quantile(values, 0.75); };

    /** 
      * Returns the median for the given set of values.
      */
    var getMedian = function(values) { return d3.median(values); };

    /** 
      * Draws the median for each violin.
      */
    var drawMedian = function() {

        violinSvg.append('circle')
            //.attr('cx', xScale(quarts.x))
            //.attr('cy', yScale(quarts.median))
            .attr('cx', function(d) { 
                //return xScale(values[0].x); 
                return xScale(d.category) + (xScale.bandwidth() / 2); 
            })
            .attr('cy', function(d) {
                return yScale(getMedian(d.values));
            })
            .attr('r', 4)
            .style('fill', '#FFFFFF')
            .style('shape-rendering', 'auto')
            .style('stroke', 'none')
            ;
    };

    /** 
      * Returns the interquartile range for the given set of values.
      */
    var interQuartileRange = function(ds) {

        return getQ3(ds) - getQ1(ds);
    };

    /** 
      * Returns the position of the lower confidence interval for the given set
      * of values.
      */
    var lowerCI = function(ds) {

        var median = getMedian(ds);
        var iqr = interQuartileRange(ds)

        var lower = median - (1.75 * (iqr / Math.sqrt(ds.length)));

        return lower;
    };

    /** 
      * Returns the position of the upper confidence interval for the given set
      * of values.
      */
    var upperCI = function(ds) {

        var median = getMedian(ds);
        var iqr = interQuartileRange(ds)

        var upper = median + (1.75 * (iqr / Math.sqrt(ds.length)));

        return upper;
    };

    /** 
      * Draws the background of the plot. Currently this is just grey lines
      * indicating ticks on the y axis.
      */
    var drawBackground = function() {

        var ticks = yScale.ticks();

        for (var i = 0; i < ticks.length; i++) {

            // no fucking clue why this is one pixel off
            svg.append('line')
                .attr('x1', 0)
                .attr('y1', yScale(ticks[i]) + 1)
                .attr('x2', getWidth())
                .attr('y2', yScale(ticks[i]) + 1)
                .style('shape-rendering', 'crispEdges')
                .style('stroke', '#ddd')
                .style('stroke-width', 1);
        }
    };

    /** 
      * Draws the confidence intervals for each violin.
      */
    var drawCI = function() {

        violinSvg.append('line')
            // idk why everything is fucking off by one pixel
            .attr('x1', function(d) { 
                return xScale(d.category) + (xScale.bandwidth() / 2); 
            })
            .attr('y1', function(d) { 
                console.log(lowerCI(d.values));
                return yScale(lowerCI(d.values)); 
            })
            .attr('x2', function(d) { 
                return xScale(d.category) + (xScale.bandwidth() / 2); 
            })
            .attr('y2', function(d) { 
                console.log(upperCI(d.values));
                return yScale(upperCI(d.values)); 
            })
            .style('stroke-linecap', 'round')
            .style('shape-rendering', 'auto')
            .style('stroke', '#666')
            .style('stroke-width', 3)
            ;
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
            KERNELS.epanechnikov(kernelBandwidth), yScale.ticks(100)
        );
        //var kde = kdg(values.map(function(d) { return d.y; }));
        var kde = kdg(values);
        var kmid = Math.round(kde.length / 2);
        var kmin = 0;
        var kmax = kde.length - 1;
        //var median = getMedian(values);
        var median = d3.median(values);

        // These next three loops attempt to find a good cut off point for the
        // distribution area drawing. There are cases where zero density gaps
        // can be found throughout the distribution and the resulting drawn 
        // area contains these weird looking hills and valleys. So we we begin
        // at the bounds of the IQR and extend outward in both directions, 
        // trying to cut off all the areas past the first discovered zero 
        // density gap.
        for (var i = 0; i < kde.length; i++) {

            // Finds the midpoint of the density estimation
            if (kde[i][0] >= median) {

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
    var drawDistribution = function() {

        var distributionData = data.map(function(d) {

            var kde = makeKDE(d.values);

            if (d.upperBound)
                kde = kde.filter(function(a) { return a[0] <= d.upperBound; });

            if (d.lowerBound)
                kde = kde.filter(function(a) { return a[0] >= d.lowerBound; });

            // The left and right boundaries for the drawn areas
            var leftBound = xScale(d.category) - (xScale.bandwidth() / 2);
            var rightBound = xScale(d.category) + (xScale.bandwidth() / 2);

            // The width of each violin based on their boundaries, which in turn is
            // based on the banwdith of the x-axis band scale
            var violinWidth = (rightBound - leftBound) / 2;
            
            // The x and y scales are reversed for the drawn areas since we're
            // drawing them rotated @ 90 degrees
            var xAreaScale = yScale.copy();
            var yAreaScale = d3.scaleLinear()
                .domain([0, d3.max(kde, function(d) { return d[1]; })])
                .range([violinWidth, 0])
                .clamp(true)
                ;

            var area = d3.area()
                .x(function(d) { return xAreaScale(d[0]); })
                .y0(violinWidth)
                .y1(function(d) { return yAreaScale(d[1]); })
                .curve(d3.curveCatmullRom.alpha(0.5))
                ;

            var line = d3.line()
                .x(function(d) { return xAreaScale(d[0]); })
                .y(function(d) { return yAreaScale(d[1]); })
                .curve(d3.curveCatmullRom.alpha(0.5))
                ;

            return {
                kde: kde,
                leftBound: leftBound,
                rightBound: rightBound,
                violinWidth: violinWidth,
                area: area,
                line: line
            };
        });

        //var rightSide = svg.append('g');
        //var leftSide = svg.append('g');
        var rightSide = violinSvg.append('g');
        var leftSide = violinSvg.append('g');

        //rightSide.append('path')
        //    .attr('class', 'right-area-' + data.cat2id[category])
        //    .datum(kde)
        //    .attr('d', area)
        //    .style('fill', function() {

        //        if (data.cat2color && data.cat2color[category])
        //            return data.cat2color[category];
        //        else
        //            colorScale(category)
        //    })
        //    .style('opacity', 0.7)
        //    ;

        rightSide.append('path')
            .attr('class', function(d) { return 'right-area-' + d.id; })
            .datum(function(d, i) { return distributionData[i].kde; })
            .style('fill', function(d, i) {

                if (data[i].color)
                    return data[i].color;
                else
                    return colorScale(data[i].category)
            })
            .attr('d', function(d, i) { return distributionData[i].area(d); })
            .style('opacity', 0.7)
            ;

            /*
        leftSide.append('path')
            .attr('class', 'left-area-' + data.cat2id[category])
            .datum(kde)
            .attr('d', area)
            .style('fill', function() {

                if (data.cat2color && data.cat2color[category])
                    return data.cat2color[category];
                else
                    colorScale(category)
            })
            .style('opacity', 0.7)
            ;
            */
            console.log(distributionData[0].kde);
        leftSide.append('path')
            .attr('class', function(d) { return 'left-area-' + d.id; })
            .datum(function(d, i) { return distributionData[i].kde; })
            .style('fill', function(d, i) {

                if (data[i].color)
                    return data[i].color;
                else
                    return colorScale(data[i].category)
            })
            .attr('d', function(d, i) { return distributionData[i].area(d); })
            .style('opacity', 0.7)
            ;

            /*
        rightSide.append('path')
            .datum(kde)
            .attr('class', 'right-path-' + data.cat2id[category])
            .attr('d', line)
            .style('shape-rendering', 'auto')
            .style('stroke', '#666')
            .style('stroke-width', 3)
            .style('fill', 'none')
            ;
            */
        rightSide.append('path')
            .attr('class', function(d) { return 'right-path-' + d.id; })
            .datum(function(d, i) { return distributionData[i].kde; })
            .attr('d', function(d, i) { return distributionData[i].line(d); })
            .style('shape-rendering', 'auto')
            .style('stroke', '#666')
            .style('stroke-width', 3)
            .style('fill', 'none')
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
            .style('shape-rendering', 'auto')
            .style('stroke', '#666')
            .style('stroke-width', 3)
            .style('fill', 'none')
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

    var groupBy = function(vs, key) {

        return vs.reduce(function(o, k) {

            (o[k[key]] = o[k[key]] || []).push(k);

            return o;
        }, {});
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
                var miny = d3.min([abox.y, bbox.y]);
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

        svg = d3.select('body')
            .append('svg')
            .attr('height', height)
            .attr('width', width)
            .append('g')
            .attr('transform', 
                  'translate(' + margin.left + ',' + margin.top + ')'
            )
            //.datum(data)
            //.data(data)
            ;

        // Sorted values are necessary for the quantile functions later on
        data.forEach(function(o) { 
            o.values.sort(function(a, b) { return a - b; });
        });

        console.log(data);
        var scales = makeScales();
        var axes = makeAxes();

        drawBackground();

        violinSvg = svg.selectAll('violins')
            .append('g')
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

    exports.yLabel = function(_) {
        if (!arguments.length) return yLabel;
        yLabel = _;
        return exports;
    };

    exports.outerTicks = function(_) {
        if (!arguments.length) return outerTicks;
        outerTicks = _;
        return exports;
    };

    exports.strokeWidth = function(_) {
        if (!arguments.length) return strokeWidth;
        strokeWidth = +_;
        return exports;
    };

    exports.strokeColor = function(_) {
        if (!arguments.length) return strokeColor;
        strokeColor = _;
        return exports;
    };

    return exports;
};


//// data = [[values], [more values], ...]
//
//// opts :
////    dimensions : [int, int]; height and width of the SVG 
////    names : [string]; list of strings associating names to boxplots
////    lmin : local min
////    lmax : local max
////    gmin : global min
////    gmax : global max
//
function makeBoxPlot(data, opts) {

    var height = (opts.dimensions === undefined) ? 500 : opts.dimensions[0];
    var width = (opts.dimensions === undefined) ? 110 : opts.dimensions[1];
    var margin = {top: 10, right: 30, bottom: 30, left: 50};

    height = height - margin.top - margin.bottom;
    width = width - margin.left - margin.right;

    var tmm = []; // min/max for all boxplots

    for (var i = 0; i < data.length; i++) {

        // sort is where javascript shows how pants on head retarded it can be
        // srsly, go look up its behavior
        var dat = data[i].sort(function(a, b) { return a - b; });
        //var dmin = dat[0];
        //var dmax = dat[dat.length - 1];
        var dmin = (opts.lmin === undefined) ? dat[0] : opts.lmin;
        var dmax = (opts.lmax === undefined) ? dat[dat.length - 1] : opts.lmax;
        var quartiles = makeQuartiles(dat);
        //var whiskers = iqr(dat).map(function(i) { return dat[i]; });
        var whiskers = iqr(dat);

        tmm.push(dmin);
        tmm.push(dmax);

        var svg = d3.select('body')
            .append('svg')
            .attr('class', 'box')
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append('g')
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            ;

        var x1 = d3.scale.linear()
            .domain([dmin, dmax])
            .range([height, 0]);

        //var x0 = d3.scale.linear()
        //    .domain([0, Infinity])
        //    .range(x1.range());


        var center = svg.selectAll("line.center")
            .data([whiskers])
            ;

        center.enter().insert("line", "rect")
            .attr("class", "center")
            .attr("x1", width / 2)
            .attr("y1", function(d) { return x1(d[0]); })
            .attr("x2", width / 2)
            .attr("y2", function(d) { return x1(d[1]); })
            .style("opacity", 1)
            ;

      var box = svg.selectAll("rect.box")
        .data([quartiles])
        ;

      box.enter().append("rect")
        .attr("class", "box")
        .attr("x", 0)
        .attr("y", function(d) { return x1(d[2]); })
        .attr("width", width)
        .attr("height", function(d) { return x1(d[0]) - x1(d[2]); })
        ;

      var medianLine = svg.selectAll("line.median")
          .data([quartiles[1]]);

      medianLine.enter().append("line")
          .attr("class", "median")
          .style('stroke', '#FF0000')
          .style('fill', '#FF0000')
          .attr("x1", 1)
          .attr("y1", x1)
          .attr("x2", width - 1)
          .attr("y2", x1)
          ;

        //// Update whiskers.
        var whisker = svg.selectAll("line.whisker")
            .data(whiskers)
            ;

        whisker.enter().insert("line", "circle, text")
            .attr("class", "whisker")
            .attr("x1", 0)
            .attr("y1", x1)
            .attr("x2", width)
            .attr("y2", x1)
            .style("opacity", 1)
            ;

        if (opts.names !== undefined) {

            var name = svg.append('text')
                //.attr('x', (width / 3))
                .attr('x', 0 - 10)
                .attr('y', height + margin.top)
                .attr('dy', '1em')
                .text(opts.names[i]);
        }
    }

    var axis_svg = d3.select('body')
        .append('svg')
        .attr('class', 'axis')
        //.attr("width", width + margin.left + margin.right)
        .attr("width", margin.left + 10)
        .attr("height", height + margin.top + margin.bottom)
        .append('g')
        .attr("transform", "translate(" + 10 + "," + margin.top + ")")
        ;

    console.log(tmm);
    var yscale = d3.scale.linear()
        .domain([d3.min(tmm), d3.max(tmm)])
        .range([height, 0]);

    // Single axis for all the plots
    var yaxis = d3.svg.axis()
        .scale(yscale)
        .orient('right')
        .ticks(10);

    axis_svg//.append('g')
        //.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(yaxis);

}

// Various utility functions for constructing the boxplots. Might move 
// these outside of this function later.

//// makeQuartiles
//
var makeQuartiles = function(arr) {
    return [d3.quantile(arr, 0.25),
            d3.quantile(arr, 0.50),
            d3.quantile(arr, 0.75)];
}

//// iqr
//
//// Calculates interquartile range
//
var iqr = function(arr) {

    var qs = makeQuartiles(arr);
    var q1 = qs[0];
    var q3 = qs[2];
    //var iqr = (q3 - q1) * 1.5;
    var iqr = (q3 - q1);
    var i = -1;
    var j = arr.length;

    while (arr[++i] < q1 - (1.5 * iqr));
    while (arr[--j] > q3 + (1.5 * iqr));

    return [arr[i], arr[j]];
}
