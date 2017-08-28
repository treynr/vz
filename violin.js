/**
  * file: violin.js
  * desc: d3js 4.0 implementation of violin plots.
  * vers: 0.2.0
  * auth: TR
  */

/**
  * The data structure necessary for this viz is an array of objects. Each
  * object represents a separate violin plot which may have >= 1 violins.
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
var violin = function() {

    var exports = {},

        /** public **/

        // Data objects
        data = null,
        // Opacity for the shaded distribution area around each violin
        distributionOpacity = 0.7,
        // X and y axis font
        font = 'sans-serif',
        // X and y axis font size
        fontSize = '11px',
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
        // X value domain
        xDomain = null,
        // X value scale
        xScale = null,
        // Y value domain
        yDomain = null,
        // Y value scale
        yScale = null
        ;

    /** private **/

    var KERNELS = {

        epanechnikov: function(scale) {
            return function(u) {
                return Math.abs(u /= scale) <= 1 ? 
                       .75 * (1 - u * u) / scale : 
                       0;
            };
        },

        triweight: function(scale) {
            return function(u) {
                return Math.abs(u /= scale) <= 1 ? 
                       (35/32) * Math.pow((1 - u * u), 3) / scale : 
                       0;
            };
        }

    };

    /**
      * Mike Bostock's kernel density estimation function
      */
    var kernelDensityGenerator = function(kernel, x) {

        return function(sample) {
            return x.map(function(x) {
                return [x, d3.mean(sample, function(v) { 
                    return kernel(x - v); 
                })];
            });
        };
    };

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

    /** 
      * Creates the x and y axis scales using the given domains and/or values.
      * Returns the D3 scale objects in a two element array.
      */
    var makeScales = function() {

        if (xDomain === undefined || !xDomain)
            xDomain = getCategories();
            //var xDomain = data.categories;

        if (yDomain === undefined || !yDomain) {

            yDomain = [
                //d3.min(data.values, function(d) { return d.y; }), 
                //d3.max(data.values, function(d) { return d.y; })
                d3.min(getAllValues()), 
                d3.max(getAllValues())
            ];
        }

        xScale = d3.scaleBand()
            .domain(xDomain)
            //.rangeRound([margin.left, width - margin.right])
            .rangeRound([0, getWidth()])
            //.rangeRound([margin.left, getWidth()])
            .padding(0.1)
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

    /** 
      * Draws the interquartile range (IQR) for each violin..
      */
    var drawQuartiles = function() {

        violinSvg.append('line')
            .attr('x1', function(d) { 
                //return xScale(values[0].x); 
                return xScale(d.category) + (xScale.bandwidth() / 2); 
            })
            .attr('y1', function(d) { 
                return yScale(getQ1(d.values));
            })
            .attr('x2', function(d) { 
                //return xScale(values[0].x); 
                return xScale(d.category) + (xScale.bandwidth() / 2); 
            })
            .attr('y2', function(d) {
                return yScale(getQ3(d.values));
            })
            .style('stroke-linecap', 'round')
            .style('shape-rendering', 'auto')
            .style('stroke', '#666')
            .style('stroke-width', 11)
            ;
    };

    /** 
      * Returns the first quartile for the given set of values.
      */
    var getQ1 = function(values) { return d3.quantile(values, 0.25); });

    /** 
      * Returns the third quartile for the given set of values.
      */
    var getQ3 = function(values) { return d3.quantile(values, 0.75); })

    /** 
      * Returns the median for the given set of values.
      */
    var getMedian = function(values) { return d3.median(values); });

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

        /*
        data.groups = groupBy(data.values, 'x');
        data.categories = d3.keys(data.groups);
        data.valueList = d3.values(data.groups);
        data.cat2id = {};
        data.cat2color = {};

        data.categories.forEach(function(c) {

            data.cat2id[c] = Math.random()
                .toString(36)
                .replace(/[^a-z]+/g, '')
                .substr(0, 5);
        });

        for (cat in data.groups) {

            if (data.groups[cat][0].color)
                data.cat2color[cat] = data.groups[cat][0].color;
        }

        data.valueList.forEach(function(d) {
            d.sort(function(a, b) { return a.y - b.y; });
        });
        */

        console.log(xDomain);
        svg = d3.select('body')
            .append('svg')
            .attr('height', height)
            .attr('width', width)
            .append('g')
            .attr('transform', 
                  'translate(' + margin.left + ',' + margin.top + ')'
            )
            .datum(data)
            //.data(data)
            ;

        console.log(xDomain);
        console.log(yDomain);
        var scales = makeScales();
        console.log(xDomain);
        var axes = makeAxes();

        drawBackground();

        violinSvg = svg.selectAll('violins')
            .append('g')
            .data(data)
            .enter()
            .append('g');

        drawDistribution();
        drawQuartiles();
        drawCI();
        drawMedian();
        //for (var i = 0; i < data.valueList.length; i++) {
        for (var i = 0; i < data.length; i++) {

            var values = data[i].values;

        /*
            drawDistribution(svg, values, data.categories[i]);
            drawQuartiles(svg, data.valueList[i]);
            drawCI(svg, data.valueList[i]);
            drawMedian(svg, data.valueList[i]);
            */
        }

        /*
        drawSignificance();
        */
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

    return exports;
};

