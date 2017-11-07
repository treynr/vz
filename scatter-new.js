/**
 * file: scatter.js
 * desc: d3js 4.0 implementation of scatter plots.
 * vers: 0.1.0
 * auth: TR
 */

/*
 * The data structure necessary for this viz is an array of objects. Each
 * object is a separate scatter plot object containing the following fields:
 *
 * plot {
 *      values: [required], a list of objects, one for each data point
 *      title: [optional], text for the scatter plot title
 *      label: [optional], label text for indicating separate figures
 *      color: [optional], fill color for data points
 * }
 *
 * The values array is a list of objects, one for each data point. It has the
 * following format:
 *
 * value {
 *      x: [required], x value for this point
 *      y: [required], y value for this point
 *      color: [optional], fill color for this point
 *      radius: [optional], radius of the data point circle
 * }
 *
 */
var scatter = function() {

    var exports = {},
        data = null,
        svg = null,
        svgLabel = '',
        // SVG width
        width = 800,
        // SVG height
        height = 500,
        // Radius for each data point
        radius = 4,
        // Margin object
        margin = {top: 30, right: 90, bottom: 100, left: 70},
        // Generate an N x M grid of plots
        grid = [1, 1],
        // Draw lines for a background grid
        gridBackground = true,
        // Background grid color
        backgroundColor = '#FFF',
        // Background grid line/stroke color
        backgroundStroke = '#000',
        // Background grid line width
        backgroundStrokeWidth = 1,
        // Data point color
        pointColor = '#98ABC5',
        // Stroke color for each data point
        pointStroke = '#222222',
        // Stroke width for each data point
        pointStrokeWidth = 1,
        // Data point colors for grouped/labeled data
        groupColors = [],
        // Boolean to draw or hide the outer x-axis ticks
        outerTicks = false,
        // Calculate and draw regression line, r2
        regression = false,
        // Suggested number of X-axis ticks to draw
        xTicks = null,
        // Suggested number of y-axis ticks to draw
        yTicks = null,
        // Suggested number of X-axis ticks to draw
        xTickValues = null,
        // Suggested number of y-axis ticks to draw
        yTicksValues = null,
        // Format string for X-axis labels
        xFormat = '',
        // Format string for Y-axis labels
        yFormat = '',
        // Plot title
        title = '',
        // X-axis text
        xText = '',
        // Y-axis text
        yText = '',
        // Y-axis padding
        yAxisPad = 35,
        // X/Y-axis scales and domains
        xScale = null,
        yScale = null,
        xDomain = null,
        yDomain = null
        ;

    /** private **/

    var getWidth = function() { return width - margin.left - margin.right; };
    var getHeight = function() { return height - margin.top - margin.bottom; };

    var makeScales = function(data, xd, yd, sx, sy, sw, sh) {

        if (xd === undefined || !xd)
            var xdomain = [0, d3.max(data, function(d) { return d.x; })];
        else
            var xdomain = xd;

        if (yd === undefined || !yd)
            var ydomain = [0, d3.max(data, function(d) { return d.y; })];
        else
            var ydomain = yDomain;

        xScale = d3.scaleLinear()
            .domain(xdomain)
            .range([0, sw]);

        yScale = d3.scaleLinear()
            .domain(ydomain)
            .range([sh, 0]);
    };

    var makeAxes = function(ssvg, sw, sh, tx, ty) {

        xAxis = d3.axisBottom(xScale)
            .ticks(5)
            .tickValues(xTickValues)
            .tickFormat(d3.format(xFormat))
            ;//.tickSizeOuter(outerTicks ? 6 : 0);
        yAxis = d3.axisLeft(yScale)
            .ticks(5)
            .tickValues(yTicksValues)
            .tickFormat(d3.format(yFormat))
            ;

        var xAxisObject = ssvg.append('g')
            .attr('transform', function() {
                return 'translate(' + 0 + ',' + (sh + 5) + ')';
            })
            .style('font', '11px sans-serif')
            .style('font-weight', 'normal')
            .style('fill', 'none')
            .call(xAxis)
            .append('text')
            .attr('x', function() { return sw / 2; })
            .attr('y', 30)
            .attr('fill', '#000')
            .style('text-anchor', 'middle')
            .text(function(d) {
                if (tx)
                    return tx;
                
                return xText;
            })
            ;

        var yAxisObject = ssvg.append('g')
            .attr('transform', function() {
                return 'translate(' + (-5) + ',' + '0)';
            })
            .style('font', '11px sans-serif')
            .style('font-weight', 'normal')
            .style('fill', 'none')
            .call(yAxis)
            .append('text')
            // Weird x, y argumetnns cause of the -90 rotation
            .attr('x', function() { return -sh / 2; })
            .attr('y', -35)
            .attr('fill', '#000')
            .attr('transform', 'rotate(-90)')
            .style('text-anchor', 'middle')
            .text(function(d) {
                if (ty)
                    return ty;
                
                return yText;
            })
            ;

        return [xAxisObject, yAxisObject];
    };


    var drawPoints = function(values) {

        var points = svg.selectAll('circle')
            .data(values)
            .enter()
            .append('g');

        // Actual colored circle. This selects elements that don't have a symbol key
        // in their object.
        points
            .filter(function(d) { return d.symbol === undefined; })
            .append('circle')
            .attr('cx', function(d) { return xScale(d.x); })
            .attr('cy', function(d) { return yScale(d.y); })
            .attr('r', function(d) {
                if (d.radius === undefined)
                    return radius;

                return d.radius;
            });

        // In case symbols are used
        points
            .filter(function(d) { return d.symbol !== undefined; })
            .append('path')
            //.attr('x', function(d) { return xScale(d.x); })
            //.attr('y', function(d) { return yScale(d.y); })
            //.attr('dx', function(d) { return xScale(d.x); })
            .attr('transform', function(d) {
                return 'translate(' + xScale(d.x) + ',' + yScale(d.y) + ')'
                //return 'translate(' + (d.x + 50) + ',' + (d.y) + ')'
            })

            //.attr('dy', function(d) { return yScale(d.y); })
            .attr('d', d3.symbol()
                .type(function(d) { return d.symbol; })
                .size(function(d) {
                    if (d.radius === undefined)
                        return radius * 22;

                    return d.radius * 22;
                }));

        points
            .attr('shape-rendering', 'auto')
            .attr('title', function(d) { return d.label; })
            .style('stroke', function(d) {
                if (d.stroke === undefined)
                    return pointStroke;

                if (d.color && useDarkStroke)
                    return d3.rgb(d.color).darker(1.5);

                return d.stroke;
            })
            .style('stroke-width', function(d) {
                if (d.width === undefined)
                    return pointStrokeWidth;

                return d.width;
            })
            .style('fill', function(d) {
                if (d.gradient) {

                    makeGradient(
                        svg, 
                        d.id + '-grad', 'radialGradient', 
                        d.gradient[0], 
                        d.gradient[1]
                    );

                    return 'url(#' + (d.id + '-grad') + ')';
                }

                if (d.color)
                    return d.color;

                return pointColor;
            })

    };

    var drawBackgroundGrid = function() {

    };

    var calculateRegressionLine = function(data) {

        var sumx = 0;
        var sumy = 0;
        var sumx2 = 0;
        var sumy2 = 0;
        var sumxy = 0;
        var n = data.length;


        for (var i = 0; i < data.length; i++) {

            sumx += data[i].x;
            sumy += data[i].y;
            sumx2 += (data[i].x * data[i].x);
            sumy2 += (data[i].y * data[i].y);
            sumxy += (data[i].x * data[i].y);
        }

        var a = ((n * sumxy) - (sumx * sumy)) / ((n * sumx2) - (sumx * sumx));
        var b = ((sumy * sumx2) - (sumx * sumxy)) / ((n * sumx2) - (sumx * sumx));

        var x1 = d3.min(data, function(d) { return d.x; });
        var y1 = a + b;
        var x2 = d3.max(data, function(d) { return d.x; });;
        var y2 = a * data.length + b;

        // slope, intercept
        return [a, b];
        //return [x1, y1, x2, y2];
    };

    var leastSquares2 = function(data) {

        var xBar = 0;
        var yBar = 0;
        var xStd = 0;
        var yStd = 0;

        for (var i = 0; i < data.length; i++) {

            xBar += data[i].x;
            yBar += data[i].y;
        }

        xBar /= data.length;
        yBar /= data.length;

        for (var i = 0; i < data.length; i++) {

            xStd += Math.pow((data[i].x - xBar), 2);
            yStd += Math.pow((data[i].y - yBar), 2);
        }

        xStd = Math.sqrt(xStd / (data.length - 1));
        yStd = Math.sqrt(yStd / (data.length - 1));

        var b = 0;
        var a = 0;

        for (var i = 0; i < data.length; i++) {

            b += (data[i].x - xBar) * (data[i].y - yBar);
            a += Math.pow((data[i].x - xBar), 2);
        }

        b = b / a;
        a = yBar - b * xBar;

        return [a, b];
    };

    function leastSquares(xSeries, ySeries) {
        var reduceSumFunc = function(prev, cur) { return prev + cur; };
        
        var xBar = xSeries.reduce(reduceSumFunc) * 1.0 / xSeries.length;
        var yBar = ySeries.reduce(reduceSumFunc) * 1.0 / ySeries.length;

        var ssXX = xSeries.map(function(d) { return Math.pow(d - xBar, 2); })
            .reduce(reduceSumFunc);
        
        var ssYY = ySeries.map(function(d) { return Math.pow(d - yBar, 2); })
            .reduce(reduceSumFunc);
            
        var ssXY = xSeries.map(function(d, i) { return (d - xBar) * (ySeries[i] - yBar); })
            .reduce(reduceSumFunc);
            
        var slope = ssXY / ssXX;
        var intercept = yBar - (xBar * slope);
        var rSquare = Math.pow(ssXY, 2) / (ssXX * ssYY);

        return [slope, intercept, rSquare];
    }

    var leastSquares = function(data) {
        var xBar = data
            .reduce(function(a, b) { return a + b.x; }, 0) / data.length;
        var yBar = data
            .reduce(function(a, b) { return a + b.y; }, 0) / data.length;

        var xVar = data
            .reduce(function(a, b) { return a + Math.pow(b.x - xBar, 2); }, 0);
        var yVar = data
            .reduce(function(a, b) { return a + Math.pow(b.y - yBar, 2); }, 0);

        var slopeNumerator = data.reduce(
            function(a, b) { return a + (b.x - xBar) * (b.y - yBar); },
            0
        );

        var slope = slopeNumerator / xVar;
        var intercept = yBar - slope * xBar;
        var rsquared = Math.pow(slopeNumerator, 2) / (xVar * yVar);

        return {slope: slope, intercept: intercept, rsquared: rsquared};
    };


    /** public **/

    exports.draw = function() {

        svg = d3.select('body')
            .append('svg')
            .attr('height', height)
            .attr('width', width)
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
            ;

        var gridX = 1;
        var gridY = 1;

        for (var i = 0; i < data.length; i++) {

            var plotData = data[i];

            if (gridX > grid[0]) {

                gridX = 1;
                gridY++;
            }

            if (gridY > grid[1])
                gridY = 1;

            // Don't draw left over scatters
            if (i >= (grid[0] * grid[1]))
                break;

            var padX = 65;
            var padY = 55;
            var subWidth = (getWidth() - padX) / grid[0];
            var subHeight = getHeight() / grid[1];
            var sx = (subWidth * (gridX - 1)) + (padX * (gridX - 1));
            var sy = (subHeight * (gridY - 1)) + (padY * (gridY - 1));
            console.log('--');
            console.log(subWidth);

            var scatterBox = svg.append('g')
                .attr('transform', 'translate(' + sx + ',' + sy + ')');

            scatterBox.append('clipPath')
                .attr('id', 'clip-area-' + i)
                .append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', subWidth)
                .attr('height', subHeight)
                ;

            // Background if wanted
            scatterBox.append('rect')
                //.attr('x', sx)
                //.attr('y', sy)
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', subWidth)
                .attr('height', subHeight)
                .style('stroke', '#000')
                .style('stroke-width', 1)
                .style('fill', backgroundColor)
                ;

            // Scatter border
            scatterBox.append('rect')
                //.attr('x', sx)
                //.attr('y', sy)
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', subWidth)
                .attr('height', subHeight)
                .style('stroke', '#000')
                .style('stroke-width', 2)
                .style('fill', 'none')
                ;

            // Plot title
            scatterBox.append('text')
                .attr('x', subWidth / 2)
                .attr('y', -5)
                .style('font', '11px sans-serif')
                .style('font-weight', 'normal')
                .style('fill', '#000')
                .text(function() { 
                    return plotData.title ? plotData.title : title; 
                });


            makeScales(plotData.values, xDomain, yDomain, sx, sy, subWidth, subHeight);
            makeAxes(scatterBox, subWidth, subHeight);

            if (gridBackground) {

                var ticks = xScale.ticks(5);

                for (var j = 0; j < ticks.length; j++) {

                    scatterBox.append('line')
                        .attr('x1', xScale(ticks[j]))
                        .attr('y1', 0)
                        .attr('x2', xScale(ticks[j]))
                        .attr('y2', subHeight)
                        .style('shape-rendering', 'auto')
                        .style('stroke', backgroundStroke)
                        .style('stroke-width', backgroundStrokeWidth);
                }

                var ticks = yScale.ticks(5);

                for (var j = 0; j < ticks.length; j++) {

                    scatterBox.append('line')
                        .attr('x1', 0)
                        .attr('y1', yScale(ticks[j]))
                        .attr('x2', subWidth)
                        .attr('y2', yScale(ticks[j]))
                        .style('shape-rendering', 'auto')
                        .style('stroke', backgroundStroke)
                        .style('stroke-width', backgroundStrokeWidth);
                }
            }

            //drawPoints(plotData.values);
            scatterBox.append('g')
                .attr('clip-path', 'url(#clip-area-' + i + ')')
                .selectAll('circle')
                .data(plotData.values)
                .enter()
                .append('circle')
                .attr('cx', function(d) { return xScale(d.x); })
                .attr('cy', function(d) { return yScale(d.y); })
                .attr('r', function(d) {
                    if (d.radius)
                        return d.radius;

                    return radius;
                })
                .style('fill', function(d) {
                    if (d.color)
                        return d.color;
                    
                    if (plotData.color)
                        return plotData.color;

                    return '#98abc5';
                })
                .style('stroke', function(d) {
                    return '#000';
                })
                .style('stroke-width', function(d) {
                    return 2;
                })
                ;
            /*    */

            if (regression) {

                var reg = leastSquares(plotData.values);

                var x1 = 0;
                var y1 = reg.intercept;
                //var x2 = d3.max(plotData.values, function(d) { return d.x; });;
                var x2 = xScale.domain()[1];
                var y2 = (x2 * reg.slope) + reg.intercept;

                scatterBox.selectAll('regressionLine')
                    .data([[x1, y1, x2, y2]])
                    .enter()
                    .append('line')
                    .attr('x1', function(d) { return xScale(d[0]); })
                    .attr('y1', function(d) { return yScale(d[1]); })
                    .attr('x2', function(d) { return xScale(d[2]); })
                    .attr('y2', function(d) { return yScale(d[3]); })
                    //.attr('stroke-dasharray', '5,5')
                    .style('stroke', 'red')
                    .style('stroke-width', 2);

                var rtext = scatterBox.append('text')
                    .attr('x', function() { return subWidth - 22; })
                    .attr('y', -2)
                    .attr('fill', '#000')
                    .style('text-anchor', 'middle')
                    //.text('r2 = ' + (Math.round(reg.rsquared * 1000) / 1000))
                    ;
                rtext.append('tspan')
                    .text('r');
                rtext.append('tspan')
                    .attr('baseline-shift', 'super')
                    .text('2');
                rtext.append('tspan')
                    .text(' = ' + (Math.round(reg.rsquared * 1000) / 1000));

                // Draws an additional border so the red line doesn't bleed
                // outside the plot.
                scatterBox.append('rect')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', subWidth)
                    .attr('height', subHeight)
                    .style('stroke', '#000')
                    .style('stroke-width', 2)
                    .style('fill', 'none')
                    ;
            }

            if (plotData.label) {

                scatterBox.append('text')
                    .attr('x', -10)
                    .attr('y', -10)
                    .style('font', '13px sans-serif')
                    .style('font-weight', 'bold')
                    .style('fill', '#000')
                    .text(plotData.label);
            }

            gridX++;
        }

    };

    /** setters/getters **/

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

    exports.pointStroke = function(_) {
        if (!arguments.length) return pointStroke;
        pointStroke = +_;
        return exports;
    };

    exports.pointColor = function(_) {
        if (!arguments.length) return pointColor;
        pointColor = _;
        return exports;
    };

    exports.pointStrokeWidth = function(_) {
        if (!arguments.length) return pointStrokeWidth;
        pointStrokeWidth = +_;
        return exports;
    };

    exports.backgroundStroke = function(_) {
        if (!arguments.length) return backgroundStroke;
        backgroundStroke = _;
        return exports;
    };

    exports.backgroundStrokeWidth = function(_) {
        if (!arguments.length) return backgroundStrokeWidth;
        backgroundStrokeWidth = +_;
        return exports;
    };

    exports.backgroundColor = function(_) {
        if (!arguments.length) return backgroundColor;
        backgroundColor = _;
        return exports;
    };

    exports.outerTicks = function(_) {
        if (!arguments.length) return outerTicks;
        outerTicks = _;
        return exports;
    };

    exports.grouped = function(_) {
        if (!arguments.length) return grouped;
        grouped = _;
        return exports;
    };

    exports.numBins = function(_) {
        if (!arguments.length) return numBins;
        numBins = +_;
        return exports;
    };

    exports.customBins = function(_) {
        if (!arguments.length) return customBins;
        customBins = _;
        return exports;
    };

    exports.dropLastBin = function(_) {
        if (!arguments.length) return dropLastBin;
        dropLastBin = _;
        return exports;
    };

    exports.binPercent = function(_) {
        if (!arguments.length) return binPercent;
        binPercent = _;
        return exports;
    };

    exports.yAxisPad = function(_) {
        if (!arguments.length) return yAxisPad;
        yAxisPad = +_;
        return exports;
    };

    exports.xText = function(_) {
        if (!arguments.length) return xText;
        xText = _;
        return exports;
    };

    exports.yText = function(_) {
        if (!arguments.length) return yText;
        yText = _;
        return exports;
    };

    exports.svgLabel = function(_) {
        if (!arguments.length) return svgLabel;
        svgLabel = _;
        return exports;
    };

    exports.groupColors = function(_) {
        if (!arguments.length) return groupColors;
        groupColors = _;
        return exports;
    };

    exports.regression = function(_) {
        if (!arguments.length) return regression;
        regression = _;
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

    exports.grid = function(_) {
        if (!arguments.length) return grid;
        grid = _;
        return exports;
    };

    exports.title = function(_) {
        if (!arguments.length) return title;
        title = _;
        return exports;
    };

    exports.xTicks = function(_) {
        if (!arguments.length) return xTicks;
        xTicks = +_;
        return exports;
    };

    exports.yTicks = function(_) {
        if (!arguments.length) return yTicks;
        yTicks = +_;
        return exports;
    };

    exports.xTickValues = function(_) {
        if (!arguments.length) return xTickValues;
        xTickValues = _;
        return exports;
    };

    exports.yTickValues = function(_) {
        if (!arguments.length) return yTickValues;
        yTickValues = _;
        return exports;
    };

    exports.xFormat = function(_) {
        if (!arguments.length) return xFormat;
        xFormat = _;
        return exports;
    };

    exports.yFormat = function(_) {
        if (!arguments.length) return yFormat;
        yFormat = _;
        return exports;
    };

    return exports;
};

