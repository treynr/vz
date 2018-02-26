/**
  * file: heat.js
  * desc: d3js 4.0 implementation of heatmaps.
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
  * value {
  *     x:      [required] x-axis (column) category
  *     y:      [required] y-axis (row) category
  *     value:  [required] the numeric value for this data point
  * }
  *
  */

var heatmap = function() {

    var exports = {},

        /** public **/

        data = null,
        // The x-axis domain range
        xDomain = null,
        // The y-axis domain range
        yDomain = null,
        // Font family
        font = 'sans-serif',
        // Font size
        fontSize = '11px',
        // Font weight
        fontWeight = 'normal',
        xLabel = '',
        yLabel = '',
        normalizeRows = false,
        normalizeColumns = false,
        normalizeMatrix = false,
        // Margin object
        margin = {top: 90, right: 90, bottom: 90, left: 90},
        // Cluster the results and draw a dendogram in the heat map margins
        cluster = false,
        // The values provided are distances and should be converted
        distances = false,

        /** private **/

        cScale = null,
        xScale = null,
        yScale = null,
        hierarchy = null,
        // SVG object
        svg = null
        ;

    /** 
      * Returns the margin corrected height of the plot.
      */
    var getHeight = function() { return height - margin.top - margin.bottom; };

    /** 
      * Returns the margin corrected width of the plot.
      */
    var getWidth = function() { return width - margin.left - margin.right; };

    /**
      * Returns the list of categories that make up the x-axis or the current
      * set of columns.
      */
    var getColumnCategories = function() {

        // Requries the Set object from the new ES6 standard which not all
        // browsers support. Removes duplicates.
        return Array
            .from(new Set(data.values.map(function(d) { return d.x; })));
    };

    /**
      * Returns the list of categories that make up the y-axis or the current
      * set of rows.
      */
    var getRowCategories = function() {

        // Requries the Set object from the new ES6 standard which not all
        // browsers support. Removes duplicates.
        return Array
            .from(new Set(data.values.map(function(d) { return d.y; })));
    };

    /**
      * Returns true if the row elements are the same as the column elements
      * (or vice versa). The function loops through each item in the rows and
      * columns for comparison since ordering may have shifted due to
      * clustering.
      */
    var isMirrored = function() { 
        var a = getColumnCategories().sort();
        var b = getRowCategories().sort();

        if (a.length !== b.length)
            return false;

        for (var i = 0; i < a.length; i++)
            if (a[i] !== b[i])
                return false;

        return true;
    };

    /**
      * Converts the values in the heatmap to similarities/distances by
      * subtracting 1 from each value. Assumes the values are normalized 
      * [0, 1]. Returns the altered list of objects.
      */
    var convertSimilarities = function() {

        // Deep copy of the values array otherwise the conversion uses the
        // fucking reference and alters the values in the original array.
        //return data.values.map(function(d) { 
        return JSON.parse(JSON.stringify(data.values)).map(function(d) { 
            d.value = 1 - d.value; 

            return d;
        });
    };

    var normalize = function(row) {

        var cats = [];
        var means = {}
        var accessor = '';

        if (row) {

            cats = getRowCategories();
            accessor = 'y';

        } else {

            cats = getColumnCategories();
            accessor = 'x';
        }

        for (var i = 0; i < cats.length; i++)
            means[cats[i]] = [];

        for (var i = 0; i < cats.length; i++) {
            for (var j = 0; j < data.values.length; j++) {

                if (data.values[j][accessor] === cats[i])
                    means[cats[i]].push(data.values[j].value);
            }
        }

        for (var i = 0; i < cats.length; i++) {

            var mean = d3.mean(means[cats[i]]);
            var dev = d3.deviation(means[cats[i]]);

            for (var j = 0; j < data.values.length; j++) {
                if (data.values[j][accessor] === cats[i])
                    data.values[j].value = (data.values[j].value - mean) / dev;
            }
        }
    };

    /**
      * Normalize values over the entire matrix rather that just a column or
      * row at a time. This should only be used when the elements in the rows
      * and columns are the same.
      */
    var matrixNormalization = function() {

        //var vals = data.values.map(function(d) { return d.value; });
        var vals = data.values
            .filter(function(d) { return d.x != d.y; })
            .map(function(d) { return d.value; });
        var mean = d3.mean(vals);
        var dev = d3.deviation(vals);

        for (var i = 0; i < data.values.length; i++) {
            if (data.values[i].x == data.values[i].y)
                data.values[i].value = 0;
            else
                data.values[i].value = (data.values[i].value - mean) / dev;
        }
    };

    /**
      * Normalize values over the entire matrix rather that just a column or
      * row at a time. This should only be used when the elements in the rows
      * and columns are the same.
      */
    var matrixNormalization2 = function() {

        var vals = data.values
            .filter(function(d) { return d.x != d.y; })
            .map(function(d) { return d.value; });
        
        var extent = d3.extent(vals);
        //var mean = d3.mean(vals);
        //var dev = d3.deviation(vals);

        for (var i = 0; i < data.values.length; i++) {
            if (data.values[i].x == data.values[i].y)
                data.values[i].value = 0;
            else
                data.values[i].value = (data.values[i].value - extent[0]) / extent[1];
        }
    };

    /** Makes sure all row/column pairs have values. Missing values are filled
      * in.
      */
    var ensureMatrixCompleteness = function(matrix) {

        var rows = getRowCategories();
        var cols = getColumnCategories();

        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];

            for (var j = 0; j < cols.length; j++) {
                var col = cols[j];

                if (matrix[row] === undefined)
                    matrix[row] = {};

                if (matrix[row][col] === undefined) {

                    matrix[row][col] = 1;
                }
            }
        }

        return matrix;
    };

    var makeDistanceMatrix = function(pts) {

        var matrix = {};

        for (var i = 0; i < pts.length; i++) {

            var x = pts[i].x;
            var y = pts[i].y;
            
            if (!(x in matrix))
                matrix[x] = {};

            if (!(y in matrix))
                matrix[y] = {};

            matrix[x][y] = pts[i].value;
        }

        return matrix;
    };

    /** 
      * Creates the x and y axis scales using the given domains and/or values.
      * Returns the D3 scale objects in a two element array.
      */
    var makeScales = function() {

        if (!xDomain)
            xDomain = getColumnCategories();

        if (!yDomain && isMirrored())
            yDomain = xDomain;
        else
            yDomain = getRowCategories();

        //cDomain = d3.extent(data.values.map(function(d) { return d.value; }));
        cDomain = d3.extent(
            data.values
            //.filter(function(d) { return d.x != d.y; })
            .map(function(d) { return d.value; })
        );

        xScale = d3.scaleBand()
            .domain(xDomain)
            .range([0, getWidth()])
            .paddingInner(0)
            .paddingOuter(0.05)
            .align(0)
            ;

        yScale = d3.scaleBand()
            .domain(yDomain)
            .range([0, getHeight()])
            .paddingInner(0)
            .paddingOuter(0.05)
            .align(0)
            ;

        //cScale = d3.scaleLinear()
        //    //.interpolate(d3.interpolateRgb)
        //    .interpolate(d3.interpolateYlGnBu)
        //    .domain(cDomain)
        //    .range([d3.rgb('#EDF3FE'), d3.rgb('#0767F8')])
        //    .range([d3.rgb(d3.schemeYlGnBu[0]), d3.rgb(d3.schemeYlGnBu[d3.schemeYlGnBu.length - 1])])
        //    ;
        //cScale = d3.scaleSequential(d3.interpolateYlGnBu)
        cScale = d3.scaleSequential(d3.interpolateBlues)
            //.interpolate(d3.interpolateRgb)
            .domain(cDomain)
            //.range([d3.rgb('#EDF3FE'), d3.rgb('#0767F8')])
            //.range([d3.rgb(d3.schemeYlGnBu[0]), d3.rgb(d3.schemeYlGnBu[d3.schemeYlGnBu.length - 1])])
            ;

        return [xScale, yScale];
    };

    /** 
      * Creates the x and y axis objects and draws them. The axis objects are
      * returned as a two element array.
      */
    var drawAxes = function() {

        var xaxis = d3.axisBottom(xScale)
            .tickSizeOuter(0)
            //.ticks(5)
            //.tickValues(xTickValues)
            //.tickFormat(d3.format(xFormat))
            ;//.tickSizeOuter(outerTicks ? 6 : 0);

        var yaxis = d3.axisRight(yScale)
            //.tickValues(yScale.ticks().concat(yScale.domain()))
            //.tickSizeOuter(0)
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
            ;

        xAxisObject
            .select('.domain')
            .remove()
            ;

        xAxisObject
            .selectAll('text')
            .attr('x', 5)
            .attr('y', 8)
            .attr('dy', '.35em')
            .attr('dx', '.35em')
            .attr('transform', 'rotate(-310)')
            .style('text-anchor', 'start')
            .append('text')
            .attr('x', function() { return getWidth() / 2; })
            .attr('y', 35)
            .attr('fill', '#000')
            .style('text-anchor', 'middle')
            .text(function(d) { return xLabel; })
            ;


        var yAxisObject = svg.append('g')
            .attr('transform', function() {
                return 'translate(' + getWidth() + ',0)';
            })
            .style('fill', 'none')
            .style('font-family', font)
            .style('font-size', fontSize)
            .style('font-weight', fontWeight)
            .call(yaxis)
            .select('.domain')
            .remove()
            //.append('text')
            //// Weird x, y argumetnns cause of the -90 rotation
            //.attr('x', function() { return -getHeight() / 2; })
            //.attr('y', -40)
            //.attr('fill', '#000')
            ////.attr('transform', 'rotate(-90)')
            //.style('text-anchor', 'middle')
            //.text(function(d) { return 'shit'; })
            ;

        return [xAxisObject, yAxisObject];
    };

    var drawCells = function() {

        var cellSvg = svg.selectAll('cells')
            .data(data.values)
            .enter()
            .append('rect')
            .attr('x', function(d) { return xScale(d.x); })
            .attr('y', function(d) { return yScale(d.y); })
            .attr('height', yScale.bandwidth())
            .attr('width', xScale.bandwidth())
            .style('fill', function(d) { 
                if (d.x == d.y)
                    return cScale(cScale.domain()[1]);

                return cScale(d.value); 
            })
            .style('stroke', '#000000')
            .style('stroke-width', 0)
            .append('title')
            .text(function(d) {
                return d.x + "\n" + d.y + "\n" + d.value;
            })
            ;
    };

    var drawLegend = function() {

        var cmin = cScale.domain()[0];
        var cmax = cScale.domain()[1];
        var cmid = (cmin + cmax) / 2;

        var gradient = svg.append('defs')
            .append('linearGradient')
            .attr("id", "gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%")
            .attr("spreadMethod", "pad")
            .selectAll('stop')
            .data([
                //{offset: '0%', color: cScale(0)},
                //{offset: '50%', color: cScale(0.5)},
                //{offset: '100%', color: cScale(1)},
                {offset: '0%', color: cScale(cmin)},
                {offset: '50%', color: cScale(cmid)},
                {offset: '100%', color: cScale(cmax)},
            ])
            .enter()
            .append('stop')
            .attr('offset', function(d) { return d.offset; })
            .attr('stop-color', function(d) { return d.color; })
            ;

        var legendSvg = svg.append('g');

        legendSvg.append('rect')
            .attr('x', function(d) { return -20; })
            .attr('y', function(d) { return 0; })
            .attr('height', getHeight() - 3)
            .attr('width', 10)
            .style('fill', 'url(#gradient)')
            .style('stroke', '#000000')
            .style('stroke-width', 1)
            ;

        var lscale = d3.scaleLinear()
            //.domain(cScale.domain())
            .domain([0, 1])
            .range([0, getHeight() - 3]);

        var laxis = d3.axisLeft(lscale)
            //.tickValues([0.0, 0.25, 0.5, 0.75, 1.0])
            .tickValues([0.0, 0.2, 0.4, 0.6, 0.8, 1.0])
            //.tickValues([0.0, 0.5, 1.0])
            //.tickValues(cScale.ticks().concat(cScale.domain()));
            .tickSizeOuter(0)
            ;

        var legendAxis = legendSvg.append('g')
            .attr('transform', function() {
                return 'translate(' + (-30) + ',' + 0 + ')';
            })
            .style('fill', 'none')
            .style('font-family', font)
            .style('font-size', fontSize)
            .style('font-weight', fontWeight)
            .call(laxis)
            ;

        //legendAxis
        //    .select('.domain')
        //    .remove()
        //    ;

        //xAxisObject
        //    .selectAll('text')
        //    .attr('x', 5)
        //    .attr('y', 8)
        //    .attr('dy', '.35em')
        //    .attr('dx', '.35em')
        //    .attr('transform', 'rotate(-310)')
        //    .style('text-anchor', 'start')
        //    .append('text')
        //    .attr('x', function() { return getWidth() / 2; })
        //    .attr('y', 35)
        //    .attr('fill', '#000')
        //    .style('text-anchor', 'middle')
        //    .text(function(d) { return xLabel; })
        //    ;

        //legendSvg.append('text')
        //    .attr('x', function() { return -30; })
        //    .attr('y', 0)
        //    .attr('fill', '#000')
        //    .style('text-anchor', 'middle')
        //    .text(function(d) { return '' + cScale.domain()[0] + ' -'; })
        //    ;
        //legendSvg.append('text')
        //    .attr('x', function() { return -30; })
        //    .attr('y', getHeight())
        //    .attr('fill', '#000')
        //    .style('text-anchor', 'middle')
        //    .text(function(d) { return '' + cScale.domain()[1] + ' -'; })
        //    ;
    };

    var getLabelsInOrder = function(hierarchy) {

        return clusterValues(hierarchy, 'label');
    };

    var clusterElements = function() {

        // Typically input to the heat map are similarity values, if they are
        // then they should be converted to distances prior to clustering.
        if (distances)
            var distMatrix = makeDistanceMatrix(data.values);
        else
            var distMatrix = makeDistanceMatrix(convertSimilarities());

        distMatrix = ensureMatrixCompleteness(distMatrix);
        console.log(distMatrix);

        var hierarchy = wards(distMatrix);

        return hierarchy;
    };

    var drawDendogram = function(hierarchy) {

		var root = d3.hierarchy(hierarchy);
		var clust2 = d3.cluster()
            .size([
                xScale.bandwidth() * xScale.domain().length,
                //yScale.bandwidth() * yScale.domain().length,
                margin.top - 10
            ])
            .separation(function() { return xScale.bandwidth(); })
            (root);

        var dendoSvg = svg.append('g')
            .attr('transform', 'translate(0,' + (-margin.top + 10) + ')')
        ;

        var line = d3.line()
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; })
            .curve(d3.curveCatmullRom.alpha(0.5));

		var linkStep = function(sx, sy, tx, ty) {

			var shit = 
				'M' + sx + ',' + sy +
				'L' + tx + ',' + sy + 
				'L' + tx + ',' + ty;

			return shit;
		};

		var link = dendoSvg.selectAll(".link")
            .data(root.links())
            .enter().append("path")
            .attr("class", "link")
            .style('fill', 'none')
            .style('stroke', '#222')
            .style('stroke-width', 2)
            .attr("d", function(d) {
			  return linkStep(d.source.x, d.source.y, d.target.x, d.target.y);
              //return line([d.source, d.target]);
            })
            // Attempts to have it on the left side.
            //.attr('transform', function() {
            //    return 'translate(' + 0 + ',' + (getHeight() + margin.top ) + ') ' + 'rotate(270) ';
            //})
            //.attr('transform', 'translate(50, 50)')
            
          ;

          /*
        var node = dendoSvg.selectAll(".node")
            .data(root.descendants())
            .enter().append("g")
            .style('fill', '#000')
            .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
            .attr("transform", function(d) { 
                  return "translate(" + d.x + "," + d.y + ")"; 
            })
            ;

        node.append("circle")
            .attr("r", 2.5);

        node.append("text")
            .attr("dy", 3)
            .attr("x", function(d) { return d.children ? -8 : 8; })
            .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
            //.text(function(d) { return d.id.substring(d.id.lastIndexOf(".") + 1); });
            ;
            */
        return hierarchy;
    };


    exports.draw = function() {

        svg = d3.select('body')
            .append('svg')
            .attr('height', height)
            .attr('width', width)
            .append('g')
            .attr('transform', 
                  'translate(' + margin.left + ',' + margin.top + ')'
            )
            ;

        if (normalizeRows)
            normalize(true);

        else if (normalizeColumns)
            normalize(false);

        else if (normalizeMatrix)
            matrixNormalization2();

        if (cluster) { 
            hierarchy = clusterElements();

            var orderedLabels = getLabelsInOrder(hierarchy);
            var labelMap = orderedLabels.reduce(function(ac, a, i) {
                ac[a] = i;

                return ac;
            }, {});

            // We have to sort the labels based on their ordering in the
            // hierarchy otherwise when the shaded cells are drawn, they won't
            // correspond to the correct nodes in the cluster.
            data.values = data.values.sort(function(a, b) { 
                return labelMap[a.x] - labelMap[b.x];
            });
        }

        // If the input data are distance values, convert them to similarities
        // before drawing
        if (distances)
            data.values = convertSimilarities();

        console.log(data.values);
        makeScales();
        drawAxes();
        drawCells();
        drawLegend();

        // Dendogram drawing must occurr after creating/drawing the scales
        // because we need the size of each heatmap cell.
        if (cluster)
            drawDendogram(hierarchy);
    };

    /**
      * Setters and getters.
      */

    exports.data = function(_) {
        if (!arguments.length) return data;
        data = _;
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

    exports.cluster = function(_) {
        if (!arguments.length) return cluster;
        cluster = _;
        return exports;
    };

    exports.distances = function(_) {
        if (!arguments.length) return distances;
        distances = _;
        return exports;
    };

    return exports;
};

var clusterValues = function(clust, ac) {

    if (clust.singleton)
        return clust[ac];

    var vals = [];

    for (var i = 0; i < clust.children.length; i++) {

        //console.log(clust);
        var v = clusterValues(clust.children[i], ac);

        if (v.length === undefined)
            vals.push(v);
        else
            vals = vals.concat(v);
    }

    return vals;
};

var wards = function(matrix) {

    var merge = function(a, b) {

        var clust = {children: [a, b]};
        var cid = clusterValues(clust, 'id').join('');

        clust.id = cid;

        return clust;
    };

    var clusterSize = function(c) {

        if (c.singleton)
            return 1;

        return c.children.reduce(function(ac, cl) { 
            return ac + clusterSize(cl);
        }, 0);
    };

    var updateDistances = function(pts, matrix) {

        var merged = pts[pts.length - 1];
        var a = merged.children[0];
        var b = merged.children[1];
        var aSize = clusterSize(a);
        var bSize = clusterSize(b);

        matrix[merged.id] = {};

        for (var i = 0; i < pts.length - 1; i++) {
            var c = pts[i];
            var cSize = clusterSize(c);
            var all = aSize + bSize + cSize;
            
            // Lance-Williams formula for minimum variance
            matrix[merged.id][c.id] = 
                ((aSize + cSize) / all) * matrix[a.id][c.id] + 
                ((bSize + cSize) / all) * matrix[b.id][c.id] - 
                (cSize / all) * matrix[a.id][b.id];

            if (isNaN(matrix[merged.id][c.id])) {
                console.log('--nan--');
                console.log(a);
                console.log(b);
                console.log(c);
                console.log(aSize);
                console.log(bSize);
                console.log(cSize);
                console.log(all);
                console.log(matrix);
                console.log(((aSize + cSize) / all) * matrix[a.id][c.id]);
                console.log(matrix[a.id][c.id]);
                console.log(((bSize + cSize) / all) * matrix[b.id][c.id]);
                console.log((cSize / all) * matrix[a.id][b.id]);

            }

            matrix[c.id][merged.id] = matrix[merged.id][c.id];
        }
    };

    // Convert each item in the distance matrix into simple cluster objects
    var pts = Object.keys(matrix)
        .map(function(d) { return {id: d, label: d, singleton: true}; });

    while (pts.length !== 1) {

        var minDistance = Number.MAX_SAFE_INTEGER;
        var amerge = null;
        var bmerge = null;

        // Calculate distances to figure out what clusters to merge
        for (var i = 0; i < pts.length; i++) {
            for (var j = i + 1; j < pts.length; j++) {
                var a = pts[i];
                var b = pts[j];
                var dist = matrix[a.id][b.id];

                //console.log(a);
                //console.log(b);
                //console.log(matrix[a.id]);
                if (dist < minDistance) {

                    minDistance = dist;
                    amerge = a;
                    bmerge = b;
                }
            }
        }

        // Remove the items being merged together 
        pts = pts.filter(function(d) { 
            return d != amerge && d != bmerge; 
        })

        pts.push(merge(amerge, bmerge));

        // Update the distance matrix to account for the newly merged cluster
        // using Ward's linkage criterion
        updateDistances(pts, matrix);
    }

    return pts[0];
};
