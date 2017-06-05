/*
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
        // Data objects
        data = null,
        svg = null,
        svgLabel = '',
        // SVG height
        height = 800,
        // SVG width
        width = 900,
        // Margin object
        margin = {top: 10, right: 10, bottom: 40, left: 50},
        xDomain = null,
        yDomain = null,
        xScale = null,
        yScale = null,
        colorScale = null,
        distributionOpacity = 0.7,
        xLabel = '',
        yLabel = '',
        kernelBandwidth = 50
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

    var kernelDensityGenerator = function(kernel, x) {

        return function(sample) {
            return x.map(function(x) {
                return [x, d3.mean(sample, function(v) { 
                    return kernel(x - v); 
                })];
            });
        };
    };

    var kernelTest = function(kernel, arr) {
        return function(test) {
            return d3.mean(arr, function(x) { return kernel(test - x); });
        };
    };

    var returnKeyUniques = function(key, data) {
        var unique = {};

        for (var i = 0; i < data.length; i++)
            unique[data[i][key]] = 0;

        return Object.keys(unique);
    };

    var getHeight = function() { return height - margin.top - margin.bottom; };
    var getWidth = function() { return width - margin.left - margin.right; };

    var makeScales = function() {

        if (xDomain === undefined || !xDomain)
            var xDomain = data.categories;//returnKeyUniques('x', data.values);

        if (yDomain === undefined || !yDomain) {

            var yDomain = [
                d3.min(data.values, function(d) { return d.y; }), 
                d3.max(data.values, function(d) { return d.y; })
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
            .domain(data.categories)
            .range(d3.schemeCategory10)
            ;

        return [xScale, yScale];
    };

    var makeAxes = function() {

        var xaxis = d3.axisBottom(xScale)
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
            .style('font-family', 'sans-serif')
            .style('font-weight', 'normal')
            .style('fill', 'none')
            .call(xaxis)
            .append('text')
            .attr('x', function() { return getWidth() / 2; })
            .attr('y', 35)
            .attr('fill', '#000')
            .style('text-anchor', 'middle')
            .text(function(d) { return xLabel; })
            ;

        var yAxisObject = svg.append('g')
            //.attr('transform', function() {
            //    return 'translate(' + margin.left + ',' + '0)';
            //})
            .style('font-family', 'sans-serif')
            .style('font-weight', 'normal')
            .style('fill', 'none')
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

    var yAccess = function(d) { return d.y; };

    var makeQuartiles = function(pts) {

        var yAccess = function(d) { return d.y; };

        return {
            x:      pts[0].x,
            q1:     d3.quantile(pts, 0.25, yAccess),
            median: d3.quantile(pts, 0.50, yAccess),
            q3:     d3.quantile(pts, 0.75, yAccess)
        };
    };

    var drawQuartiles = function(svg, values) {

        svg.append('line')
            //.attr('x1', xScale(quarts.x))
            //.attr('y1', yScale(quarts.q1))
            //.attr('x2', xScale(quarts.x))
            //.attr('y2', yScale(quarts.q3))
            .attr('x1', function() { 
                //return xScale(values[0].x); 
                return xScale(values[0].x) + (xScale.bandwidth() / 2) + 1; 
            })
            .attr('y1', function() { 
                return yScale(d3.quantile(values, 0.25, yAccess));
            })
            .attr('x2', function() { 
                //return xScale(values[0].x); 
                return xScale(values[0].x) + (xScale.bandwidth() / 2) + 1; 
            })
            .attr('y2', function() {
                return yScale(d3.quantile(values, 0.75, yAccess));
            })
            //.attr('transform', function() {
            //    //return 'translate(' + (margin.left + margin.right) + ',' + margin.top + ')';
            //    return 'translate(' + (margin.left + margin.right) + ',0)';
            //})
            .style('stroke-linecap', 'round')
            .style('shape-rendering', 'auto')
            .style('stroke', '#666')
            .style('stroke-width', 11)
            ;
    };

    var drawMedian = function(svg, values) {

        svg.append('circle')
            //.attr('cx', xScale(quarts.x))
            //.attr('cy', yScale(quarts.median))
            .attr('cx', function() { 
                //return xScale(values[0].x); 
                return xScale(values[0].x) + (xScale.bandwidth() / 2) + 1; 
            })
            .attr('cy', function() {
                return yScale(d3.median(values, yAccess));
            })
            .attr('r', 4)
            .style('fill', '#FFFFFF')
            .style('shape-rendering', 'auto')
            .style('stroke', 'none')
            ;
    };

    var confidenceIntervals = function(quarts) {

        var yAccess = function(d) { return d.y; };
        var median = d3.median(pts, yAccess);
        var iqr = quarts.q3 - quarts.q1;

        var lower = median - (1.75 * (iqr / Math.sqrt(pts.length)));
        var upper = median + (1.75 * (iqr / Math.sqrt(pts.length)));


        return [lower, upper];
    };

    var interQuartileRange = function(ds) {

        var yAccess = function(d) { return d.y; };

        return d3.quantile(ds, 0.75, yAccess) - d3.quantile(ds, 0.25, yAccess);
    };

    var lowerCI = function(ds) {

        var median = d3.median(ds, yAccess);
        var iqr = interQuartileRange(ds)

        var lower = median - (1.75 * (iqr / Math.sqrt(ds.length)));

        //console.log(ds[0].x + ' ci: ' + lower);

        return lower;
    };

    var upperCI = function(ds) {

        var median = d3.median(ds, yAccess);
        var iqr = interQuartileRange(ds)

        var upper = median + (1.75 * (iqr / Math.sqrt(ds.length)));

        return upper;
    };

    var drawCI = function(svg, values) {

        svg.append('line')
            // idk why everything is fucking off by one pixel
            .attr('x1', function() { 
                return xScale(values[0].x) + (xScale.bandwidth() / 2) + 1; 
            })
            .attr('y1', function() { 
                return yScale(lowerCI(values)); 
            })
            .attr('x2', function() { 
                return xScale(values[0].x) + (xScale.bandwidth() / 2) + 1; 
            })
            .attr('y2', function() { 
                return yScale(upperCI(values)); 
            })
            .style('stroke-linecap', 'round')
            .style('shape-rendering', 'auto')
            .style('stroke', '#666')
            .style('stroke-width', 3)
            ;

        //svg.append('line')
        //    //.attr('x1', xscale(quarts.x))
        //    //.attr('y1', yscale(quarts.q3))
        //    //.attr('x2', xscale(quarts.x))
        //    //.attr('y2', yscale(cis[1]))
        //    .attr('x1', function(d) { return xScale(d[0].x); })
        //    .attr('y1', function(d) { return lowerIC(d); })
        //    .attr('x2', function(d) { return xScale(d[0].x); })
        //    .attr('y2', function(d) { return upperCI(d); })
        //    .style('stroke-linecap', 'round')
        //    .style('shape-rendering', 'auto')
        //    .style('stroke', '#666')
        //    .style('stroke-width', 3)
        //    ;
    };

    var drawDistribution = function(svg, values, category) {

        //console.log('bandwidth');
        //console.log(xscale.bandwidth());

        var yAccess = function(d) { return d.y; };
        var kde = kernelDensityGenerator(KERNELS.epanechnikov(kernelBandwidth), yScale.ticks(100));
        var kdeData = kde(values.map(function(d) { return d.y; }));

        var imax = d3.max(values, function(d) { return d.y; });
        var imin = d3.min(values, function(d) { return d.y; });

        imax = d3.min(kdeData.filter(function(d) {
            return (d[0] > d3.max(values, function(d) { return d.y; }) && d[1] == 0);
        }), function(d) { return d[0]; });
        imin = d3.max(kdeData.filter(function(d) {
            return (d[0] < d3.min(values, function(d) { return d.y; }) && d[1] == 0);
        }), function(d) { return d[0]; });

        if (!imax) {
            var ktest = kernelTest(KERNELS.epanechnikov(kernelBandwidth), values.map(yAccess));
            var imy = ktest(d3.max(values, yAccess));
            var imx = d3.max(values, yAccess);
            var c = 25;

            while (c > 0 && imy != 0) {

                imy = ktest(imx);
                imx += 1;
                c -= 1;
            }
            imax = imx;
        }

        if (!imin) {
            var ktest2 = kernelTest(KERNELS.epanechnikov(kernelBandwidth), values.map(yAccess));
            var imy2 = ktest2(d3.min(values, yAccess));
            var imx2 = d3.min(values, yAccess);
            var c = 25;

            while (c > 0 && imy != 0) {

                imy2 = ktest2(imx2);
                imx2 -= 1;
                c -= 1;
            }
            imin = imx2;
        }

        var kmid = Math.round(kdeData.length / 2);
        var kmin = 0;
        var kmax = kdeData.length - 1;
        var median = d3.median(values, yAccess);

        for (var i = 0; i < kdeData.length; i++) {

            //console.log('i: ' + i);
            if (kdeData[i][0] >= median) {

                //console.log(kdeData[i][0]);
                //console.log(quarts.median);
                kmid = i;
                break
            }
        }

        //console.log('ks');
        //console.log(kmid);
        //console.log(kdeData[kmid]);

        /*
        for (var i = 0; i < kdeData.length; i++) {

            //if (kdeData[i][0] <= quarts.q1 && kdeData[i][1] == 0) {
            if (kdeData[i][0] >= quarts.q1) {

                kmin = i;
                break
            }
        }
        for (var i = (kdeData.length - 1); i > 0; i--) {

            //if (kdeData[i][0] >= quarts.q3 && kdeData[i][1] == 0) {
            if (kdeData[i][0] <= quarts.q3) {

                kmax = i;
                break
            }
        }
        */
        for (var i = kmid; i > 0; i--) {
        //for (var i = kmin; i > 0; i--) {

            if (kdeData[i][1] == 0) {

                kmin = i;
                break;
            }
        }
        for (var i = kmid; i < kdeData.length; i++) {
        //for (var i = kmax; i < kdeData.length; i++) {

            if (kdeData[i][1] == 0) {

                kmax = i + 1;
                break;
            }
        }

        //console.log(kmin);
        //console.log(kmax);
        //console.log(kdeData);
        kdeData = kdeData.slice(kmin, kmax);



        kdeData
            .filter(function(d) { return (!imin || d[0] >= imin); })
            .filter(function(d) { return (!imax || d[0] <= imax); })
            ;

       // console.log('mins/maxs');
       // console.log(imax);
       // console.log(imin);
       // console.log(kdeData);

        //var leftBound = xScale(values[0].x) - (xScale.bandwidth() / 2.2);
        //var rightBound = xScale(values[0].x) + (xScale.bandwidth() / 2.2);
        var leftBound = xScale(values[0].x) - (xScale.bandwidth() / 2);
        var rightBound = xScale(values[0].x) + (xScale.bandwidth() / 2);


        // Theres this stupid fucking gap between the areas (or overlap) and I 
        // can't get rid of it!
        var vwidth = 0.09 + ((rightBound - leftBound) / 2);
        
        var xAreaScale = yScale.copy();
        var yAreaScale = d3.scaleLinear()
            .domain([0, d3.max(kdeData, function(d) { return d[1]; })])
            //.range([rightBound, leftBound])
            .range([vwidth - 0.5, 0])
            //.range([leftBound, rightBound])
            //.range([xscale.bandwidth(), 0])
            //.clamp(true)
            ;

        var area = d3.area()
            .x(function(d) { return xAreaScale(d[0]); })
            .y0(vwidth)
            .y1(function(d) { return yAreaScale(d[1]); })
            .curve(d3.curveCatmullRom.alpha(0.5))
            ;

        var line = d3.line()
            .x(function(d) { return xAreaScale(d[0]); })
            .y(function(d) { return yAreaScale(d[1]); })
            .curve(d3.curveCatmullRom.alpha(0.5))
            ;

        var rightSide = svg.append('g');
        var leftSide = svg.append('g');

        rightSide.append('path')
            .attr('class', 'right-area-' + category)
            .datum(kdeData)
            .attr('d', area)
            .style('fill', colorScale(category))
            .style('opacity', 0.7)
            ;

        leftSide.append('path')
            .attr('class', 'left-area-' + category)
            .datum(kdeData)
            .attr('d', area)
            .style('fill', colorScale(category))
            .style('opacity', 0.7)
            ;

        rightSide.append('path')
            .datum(kdeData)
            .attr('d', line)
            .style('stroke', '#666')
            .style('stroke-width', 2)
            .style('fill', 'none')
            ;

        leftSide.append('path')
            .datum(kdeData)
            .attr('d', line)
            .style('stroke', '#666')
            .style('stroke-width', 2)
            .style('fill', 'none')
            ;

        rightSide.attr('transform', function() { 
            return 'rotate(90,0,0) translate(0,-' + (rightBound + vwidth) + ')'
        });

        leftSide.attr('transform', function() {
            return 'rotate(90,0,0) translate(0,-' + (leftBound + vwidth) + 
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

        // Draw the significance lines 20px above the tallest violin
        var heightPad = 20;
        // The vertical significance line == 15px
        var yLineLength = 15;

        for (var i = 0; i < data.significance.length; i++) {

            var cata = data.significance[i][0];
            var catb = data.significance[i][1];

            // Retrieves the DOM object (violin area) associated with the given
            // category.
            var abox = svg.select('.right-area-' + cata).node();
            var bbox = svg.select('.right-area-' + catb).node();

            if (!abox || !bbox)
                continue;

            // Object containing absolute positions and bound lengths/widths
            var abox = abox.getBoundingClientRect();
            var bbox = bbox.getBoundingClientRect();

            // The tallest violin
            var miny = d3.min([abox.y, bbox.y]);

            var sigs = svg.append('g')
                // getBoundingClientRect returns true SVG coordinates so we 
                // have to compensate for any transforms we do. idk why the 
                // fucking positioning is off on this shit (the +2) but
                // whatever
                .attr('transform', 
                      'translate(' + (-margin.left - margin.right + 2) + ',' + (-margin.top) + ')'
                );

            // Draws the significance bars from one violin to another
            sigs.append('path')
                .attr('d', function() {

                    var yline1 = miny - heightPad;
                    var yline2 = yline1 - yLineLength;

                    return 'M' + abox.x + ',' + yline1 + ' ' +
                           'L' + abox.x + ',' + yline2 + ' ' +
                           'L' + bbox.x + ',' + yline2 + ' ' +
                           'L' + bbox.x + ',' + yline1 + ' ';
                })
                .style('stroke', '#666')
                .style('stroke-width', 3)
                .style('fill', 'none');

            // Adds the asterisk to the middle of the significance bar
            sigs.append('text')
                .attr('x', (abox.x + bbox.x) / 2)
                .attr('y', (miny - heightPad - (yLineLength / 2)))
                .style('font-family', 'sans-serif')
                .style('font-size', '40px')
                .style('font-weight', 'normal')
                .style('fill', '#666')
                .style('text-anchor', 'middle')
                .text('*');
        }
    };

    /** public **/

    exports.draw = function() {

        data.groups = groupBy(data.values, 'x');
        data.categories = d3.keys(data.groups);
        data.valueList = d3.values(data.groups);

        data.valueList.forEach(function(d) {
            d.sort(function(a, b) { return a.y - b.y; });
        });

        svg = d3.select('body')
            .append('svg')
            .attr('height', height)
            .attr('width', width)
            .append('g')
            .attr('transform', 
                  'translate(' + margin.left + ',' + margin.top + ')'
            )
            .datum(data)
            ;

        //var groups = groupBy(data.values, 'x');
        //var categories = Object.keys(groups);
        //var values = Object.values(groups);
        //Object.values(groups).forEach(function(d) { 
        //    d.sort(function(a, b) { return a.y - b.y; });
        //});

        //console.log(values);
        var scales = makeScales();
        var axes = makeAxes();

        //var violins = svg.selectAll('.violin')
        //    .data(values)
        //    .enter()
        //    .append('g')
            //.attr('transform', function() {
            //    //return 'translate(' + (margin.left + margin.right) + ',' + margin.top + ')';
            //    return 'translate(' + (margin.left) + ',0)';
            //})
            ;

        //var quartiles = makeQuartiles(catValues);
        //var cis = confidenceIntervals(catValues, quartiles);

        for (var i = 0; i < data.valueList.length; i++) {

            //drawDistribution(violins, values[i]);//, catValues, quartiles, xscale, yscale);
            drawDistribution(svg, data.valueList[i], data.categories[i]);
            drawQuartiles(svg, data.valueList[i]);
            drawCI(svg, data.valueList[i]);
            drawMedian(svg, data.valueList[i]);

            //drawQuartiles(violins, values[i]);//, quartiles, xscale, yscale);
            //drawCI(violins, values[i]);//, quartiles, cis, xscale, yscale);
            //drawMedian(violins, values[i]);//, quartiles, xscale, yscale);
        }
        drawSignificance();

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

    exports.grid = function(_) {
        if (!arguments.length) return grid;
        grid = _;
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

    return exports;
};

