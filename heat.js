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

        /** private **/

        cScale = null,
        // Margin object
        margin = {top: 90, right: 90, bottom: 90, left: 90},
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

    var reflect = function(row) {

        var accessor = '';
        var mirror = '';
        var matrix = {};

        if (row) {

            accessor = 'y';
            mirror = 'x';

        } else {

            accessor = 'x';
            mirror = 'y';
        }
        console.log(data.values);

        for (var i = 0; i < data.values.length; i++) {

            var value = data.values[i];
            var va = value[accessor];
            var vm = value[mirror];

            if (!(va in matrix))
                matrix[va] = {}

            matrix[va][vm] = value.value;
        }

        for (var i = 0; i < data.values.length; i++) {

            var va = data.values[i][accessor];
            var vm = data.values[i][mirror];

            //if (data.values[mirror] == data.values[accessor])
            //if (vm === va)
                data.values.value = matrix[va][vm];
        }
    };

    /** 
      * Creates the x and y axis scales using the given domains and/or values.
      * Returns the D3 scale objects in a two element array.
      */
    var makeScales = function() {

        if (!xDomain)
            xDomain = getColumnCategories();

        if (!yDomain)
            yDomain = getRowCategories();

        //cDomain = d3.extent(data.values.map(function(d) { return d.value; }));
        cDomain = d3.extent(
            data.values
            //.filter(function(d) { return d.x != d.y; })
            .map(function(d) { return d.value; })
        );
        console.log(cDomain);

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
            .tickSizeOuter(0)
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
            .style('stroke-width', 1)
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

        var legendSvg = svg.append('rect')
            .attr('x', function(d) { return -20; })
            .attr('y', function(d) { return 0; })
            .attr('height', getHeight() - 3)
            .attr('width', 10)
            .style('fill', 'url(#gradient)')
            .style('stroke', '#000000')
            .style('stroke-width', 1)
            ;
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
            matrixNormalization();
        console.log(data.values);

        makeScales();
        drawAxes();
        drawCells();
        drawLegend();

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

    return exports;
};

// opts.rg = reverse the gradient coloring
var heats = function(data, rlabels, clabels, title, grps, opts) {

    var margin = { top: 300, right: 10, bottom: 50, left: 300 };
    var in_height = (opts.dimensions === undefined) ? 500 : opts.dimensions[0];
    var in_width = (opts.dimensions === undefined) ? 700 : opts.dimensions[1];
    var longbar = (opts.longbar === undefined) ? false : opts.longbar;
    var center = (opts.center === undefined) ? false : opts.center;
    var height = in_height + 100;
    var width = in_width + 50;
    var xpad = 50;
    var ypad = 30;
    var row_ind = [];
    var col_ind = [];
    var cell_size = 13;
    var row_size = rlabels.length;
    var col_size = clabels.length;
    var height = row_size * cell_size;
    var width = col_size * cell_size;

    var svg = d3.select('body')
        .append('svg')
        .attr('height', height + margin.top + margin.bottom + 50)
        .attr('width', width + margin.left + margin.right + 50)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

    // Title
    svg.append("text")
        .text(title)
        .attr("x", function() {
            if (width > 600)
                return width / 5
            else
                return width / 3
        })
        .attr("y", 150)
        .style("text-anchor", "middle")
        .style('font-size', '15px')
        .style('font-family', 'sans-serif')
        .style('font-weight', 'bold')
        .attr('transform', 'translate(' + -margin.left + ', ' + -margin.top + ')');
        //.attr("transform", "translate("+cell_size/2 + ",-6) rotate (-90)")
        //.attr("class",  function (d,i) { return 'mono'; });
        //.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

    for (var i = 0; i < rlabels.length; i++) {
        row_ind.push(i + 1);
    }
    for (var i = 0; i < clabels.length; i++) {
        col_ind.push(i + 1);
    }

    //if (grps !== null) {
    if (false) {
        
        svg.append('rect')
            .attr('x', margin.left + 5)
            .attr('y', margin.top - 150)
            .attr('height', 1)
            .attr('width', width - 10)
            .style('stroke-width', '0.5px')
            .style('stroke', 'black')
            .attr('transform', 'translate(' + -margin.left + ', ' + -margin.top + ')')
            .style('fill', 'black');
            //.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

        svg.selectAll('rect')
            .data(grps)
            .enter()
            .append('rect')
            .attr('x', function(d){
                return (d.start * cell_size) + (margin.left );
            })
            .attr('y', margin.top - 150)
            .attr('transform', 'translate(' + -margin.left + ', ' + -margin.top + ')')
            .attr('height', 30)
            .attr('width', 2);

        svg.selectAll('text')
            .data(grps)
            .enter()
            .append('text')
            .attr('x', function(d, i){
                return ((d.start * cell_size) + (margin.left));
            })
            .attr('y', margin.top - 160)
            .style("text-anchor", "middle")
      //.attr("transform", "translate(-6," + cell_size / 1.5 + ")")
        //.attr("transform", "translate("+cell_size/2 + ",-6) rotate (-90)")
            //.attr("class", function (d,i) { return "rowLabel mono r"+i;} ) 
            //.attr('transform', 'translate(' + -margin.left + ', ' + -margin.top + ')')
              .attr("transform", "translate("+cell_size/2 + ",-6) rotate (-90)")
              .attr("class",  function (d,i) { return "colLabel mono c"+i;} )
            .text(function(d){ 
                    return d.name; 
            });

        // first tick
        svg.append('rect')
            .attr('x', function(d){
                return (margin.left + 5);
            })
            .attr('y', margin.top - 150)
            .attr('transform', 'translate(' + -margin.left + ', ' + -margin.top + ')')
            .attr('height', 30)
            .attr('width', 2)
        // last tick
        svg.append('rect')
            .attr('x', function(d){
                return (margin.left + 5) + width - 10;
            })
            .attr('y', margin.top - 150)
            .attr('transform', 'translate(' + -margin.left + ', ' + -margin.top + ')')
            .attr('height', 30)
            .attr('width', 2)

        var axscale = d3.scale.linear()
            .domain([0, width])
            .range([0, width]);

        var xaxis = d3.svg.axis().scale(axscale);
        var axgrp = svg.append('g').call(xaxis);

        var line = d3.svg.line()
            .x(function(d){ return (d.start * cell_size) + 10; })
            .y(function(d){ return 20;});//(d.start * cell_size) + 10 + (d.length * cell_size); });
            //.x(function(d){ return d[0]; })
            //.y(function(d){ return d[1]; });

        svg.selectAll('path')
            .data(grps)
            .enter()
            .append('path')
            .attr('d', function(d){ return line(d); })
            .style('stroke', 'black');
        //var groups = svg.append('g')
        //    .selectAll('grp')
        //    .data(grps)
        //    .enter()
        //    .append('line')
        //    .attr('x0', function(d, i) {
        //        if (i == 0)
        //            return 100;
        //        return (d.start * cell_size) + 10; 
        //    })
        //    .attr('x1', function(d, i) {
        //        return (d.start * cell_size) + (d.length * cell_size) - 10;
        //    })
        //    .attr('y0', 20)
        //    .attr('y1', 20)
        //    .style('stroke', 'black')
        //    .style('stroke-width', '2px');

    }

    //var colorScale = d3.interpolateRgb('#0AAAF5', '#FFF');
    //var colorScale = d3.interpolateRgb('#0767F8', '#EDF3FE');
    var colorScale = d3.interpolateRgb( '#EDF3FE','#0767F8');
    //var colorScale = d3.interpolateRgb( '#fecc5c','#fd8d3c');
    //var colorScale = d3.scale.linear()
    //    .domain(opts.domain)
    //    .range(d3.range

    var grpcolors = d3.scale.category20();

    if (grps) {

		var keywidth = 300;
         //var keysvg = d3.select('#dsvg').append('svg')
         var keysvg = d3.select('body').append('svg')
                        .style('font-weight', 'bold')
                        .attr('width', 300)//width)
                        .attr('height', 250);//height);

            keysvg.append('text')
                .attr({
                    'text-anchor': 'middle',
                    'font-family': 'sans-serif',
                    'font-size': '15px',
                    'y': '15',
                    //'x': 85//(width / 2)
                    'x': (keywidth / 2)
                })
                .text('Geneset Group Legend');

            var key = keysvg.selectAll('g')
                //.data(json.nodes)
                //.data(keynodes)
                .data(grps[0])
                .enter()
                .append('g')
                .attr('class', 'legend');

            key.append('circle')
                .attr('cx', 10)
                .attr('cy', function(d, i){ return (i * 20) + 30; })
                .attr('r', 6)
                .attr('fill', function(d, i){
                    return 'rgb(31, 119, 180);'
                    //return grpcolors(grps[0].indexOf(d));
                    //return colors(keymap[d]);
                    //return colors(d.old_index);
                });
            key.append('text')
                .attr('x', 30)
                .attr('y', function(d, i){ return (i * 20) + 35; })
                .attr('font-family', 'sans-serif')
                .attr('font-size', '12px')
                //.text(function(d){ return d.name });
                .text(function(d){ return d; });

    }

    var rowLabels = svg.append("g")
      .selectAll(".rowLabelg")
      .data(rlabels)
      .enter()
      .append("text")
      .text(function (d, i) { 
            if (d.length > 20)
                return d.substr(0,20) + '...';
            else
          return d; 
              })
      .style('fill', function(d){ 
            if (grps)
                //return grpcolors(grps[0].indexOf(grps[1][d])); 
                return '#1F77B4';//grpcolors(grps[0].indexOf(grps[1][d])); 
            else
                return 'black';
        })
      .style('font-weight', 'bold')
      .style('stroke', 'black')
      .style('stroke-width', '0.3px')
      .attr("x", 0)
      //.attr("y", function (d, i) { return hcrow.indexOf(i+1) * cellSize; })
      .attr("y", function (d, i) { return row_ind.indexOf(i+1) * cell_size + 1; })
      .style("text-anchor", "end")
      .attr("transform", "translate(-6," + cell_size / 1.5 + ")")
      .attr("class", function (d,i) { return "rowLabel mono r"+i;} ); 
      //.on("mouseover", function(d) {d3.select(this).classed("text-hover",true);})
      //.on("mouseout" , function(d) {d3.select(this).classed("text-hover",false);})
      //.on("click", function(d,i) {rowSortOrder=!rowSortOrder; sortbylabel("r",i,rowSortOrder);d3.select("#order").property("selectedIndex", 4).node().focus();;})
      //;

    var colLabels = svg.append("g")
      .selectAll(".colLabelg")
      .data(clabels)
      .enter()
      .append("text")
      .style('fill', function(d){ 
            if (grps)
                return '#1F77B4';//grpcolors(grps[0].indexOf(grps[1][d])); 
            else
                return 'black';
                })
      .style('font-weight', 'bold')
      .style('stroke', 'black')
      .style('stroke-width', '0.3px')
      //.text(function (d, i) { return d; })
      .text(function (d, i) { 
            //if ((grps !== null) && (d.length > 10))
            //    return d.slice(0, 13) + '...'
            //else
            if (d.length > 20)
                return d.substr(0,20) + '...';
            else
          return d; 
        })
      .attr("x", 0)
      .attr("y", function (d, i) { return col_ind.indexOf(i+1) * cell_size + 2; })
      .style("text-anchor", "left")
      .attr("transform", "translate("+cell_size/2 + ",-6) rotate (-90)")
      .attr("class",  function (d,i) { return "colLabel mono c"+i;} );
      //.on("mouseover", function(d) {d3.select(this).classed("text-hover",true);})
      //.on("mouseout" , function(d) {d3.select(this).classed("text-hover",false);})
      //.on("click", function(d,i) {colSortOrder=!colSortOrder;  sortbylabel("c",i,colSortOrder);d3.select("#order").property("selectedIndex", 4).node().focus();;})
      //;

    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .html(function(d) {
            return d.tip;
            //return 'Condensation: ' + d.ratio;
            //return 'GS0: ' + d.gs_name0 + '<br />GS1: ' + d.gs_name1;
    });

    svg.call(tip);

    var tipvis = false;

    // Get min/max data values
    var mmdat = [];
    for (var i = 0; i < data.length; i++) 
        mmdat.push(data[i][2]);
        //mmdat.push(data[i]['ratio']);

    //var mmin = +parseFloat(d3.min(mmdat)).toFixed(1);
    var mmin = d3.min(mmdat);//+parseFloat(d3.min(mmdat)).toFixed(1);
    var mmax = d3.max(mmdat);
	console.log('min:' + mmin);
	console.log('max:' + mmax);

    var cscale = d3.scale.linear()
        .domain([mmin, mmax])
        //.domain([0.6, 1.0])
        //.range([0.0, 1.0]);
        .range([0.0, 1.0]);

    //// A background so that missing values are filled with a certain color.
    svg.append('rect')
        //.attr("y", function(d) { return 0; })
        //.attr("x", function(d) { return 0; })
        .attr("x", function(d) { 
            if (center)
                return in_width / 3; 
            else
                return 0;
        })
        .attr("y", function(d) { 
            if (center)
                return (in_height / 2); 
            else
                return 0;
        })
        .attr("width", function() { return clabels.length * cell_size; })
        .attr("height", function() { return rlabels.length * cell_size; })
        .style("fill", '#aaaaaa')
        .attr('transform', function() {
            if (center)
                return 'translate(' + -margin.left + ', ' + -margin.top + ')'; 
            else
                return '';
        })
        ;

    var the_heat = svg.append('g')//.attr('class', 'g3')
        //.selectAll('.cellg')
        .selectAll('rect')
        // commenting this out for some reason shows more data points on the map
        .data(data)//, function(d){return d.ratio;})
        .enter()
        .append("rect")
        //.attr("y", function(d) { return rlabels.indexOf(d.gs_name0) * cell_size; })
        //.attr("y", function(d) { return rlabels.indexOf(d[0]) * cell_size; })
        //.attr("x", function(d) { return clabels.indexOf(d.gs_name1) * cell_size; })
        //.attr("x", function(d) { return clabels.indexOf(d[1]) * cell_size; })
        .attr("x", function(d) { 
            if (center)
                return (clabels.indexOf(d[1]) * cell_size) + (in_width / 3); 
            else
                return clabels.indexOf(d[1]) * cell_size; 
        })
        .attr("y", function(d) { 
            if (center)
                return (rlabels.indexOf(d[0]) * cell_size) + (in_height / 2); 
            else
                return rlabels.indexOf(d[0]) * cell_size; 
        })
        //.attr("x", function(d) { return row_ind.indexOf(d.col) * cellSize; })
        //.attr("y", function(d) { return col_ind.indexOf(d.row) * cellSize; })
        //.attr("class", function(d){return "cell cell-border cr"+(d.row-1)+" cc"+(d.col-1);})
        //.attr("class", function(d){return "cell cell-border cr"+(rlabels.indexOf(d.gs_name0)-1)+" cc"+(clabels.indexOf(d.gs_name1)-1);})
        .attr("class", function(d){return "cell cell-border cr"+(rlabels.indexOf(d[0])-1)+" cc"+(clabels.indexOf(d[1])-1);})
        .attr("width", cell_size)
        .attr("height", cell_size)
        .attr('transform', function() {
            if (center)
                return 'translate(' + -margin.left + ', ' + -margin.top + ')'; 
            else
                return '';
        })
        //.on('mouseover', tip.show)
        //.on('mouseout', tip.hide)
        //.on('click', tip.show)
        .on('click', function(d) {

            if (tipvis) {

                tipvis = false;
                tip.hide(d);
            } else {

                tipvis = true;
                tip.show(d);
            }
        })
        .style("fill", function(d) { 
            if (isNaN(d[2]))
                return colorScale(cscale(0));
            else
                return colorScale(cscale(d[2])); 
        })//;
        /* .on("click", function(d) {
               var rowtext=d3.select(".r"+(d.row-1));
               if(rowtext.classed("text-selected")==false){
                   rowtext.classed("text-selected",true);
               }else{
                   rowtext.classed("text-selected",false);
               }
        })*/
        .on("mouseover", function(d){
               //highlight text
               d3.select(this).classed("cell-hover",true);
               //d3.selectAll(".rowLabel").classed("text-highlight",function(r,ri){ return ri==(d.row-1);});
               //d3.selectAll(".colLabel").classed("text-highlight",function(c,ci){ return ci==(d.col-1);});
               //d3.selectAll(".rowLabel").classed("text-highlight",function(r,ri){ return ri==(rlabels.indexOf(d.gs_name0)/*-1*/);});
               //d3.selectAll(".colLabel").classed("text-highlight",function(c,ci){ return ci==(clabels.indexOf(d.gs_name1)/*-1*/);});
               d3.selectAll(".rowLabel").classed("text-highlight",function(r,ri){ return ri==(rlabels.indexOf(d[0])/*-1*/);});
               d3.selectAll(".colLabel").classed("text-highlight",function(c,ci){ return ci==(clabels.indexOf(d[1])/*-1*/);});
        
               //Update the tooltip position and value
               //d3.select("#tooltip")
               //  .style("left", (d3.event.pageX+10) + "px")
               //  .style("top", (d3.event.pageY-10) + "px")
               //  .select("#value")
               //  .text("lables:"+rowLabel[d.row-1]+","+colLabel[d.col-1]+"\ndata:"+d.value+"\nrow-col-idx:"+d.col+","+d.row+"\ncell-xy "+this.x.baseVal.value+", "+this.y.baseVal.value);  
               ////Show the tooltip
               //d3.select("#tooltip").classed("hidden", false);
        })
        .on("mouseout", function(d){
               d3.select(this).classed("cell-hover",false);
               d3.selectAll(".rowLabel").classed("text-highlight",false);
               d3.selectAll(".colLabel").classed("text-highlight",false);
               //d3.select("#tooltip").classed("hidden", true);
        });

        var grad = svg.append('linearGradient')
            .attr('id', 'pretty_gradient')
            .attr('x1', '0%')
            .attr('y1', '50%')
            .attr('x2', '100%')
            .attr('y2', '50%')
            .attr('spreadMethod', 'pad');
        
        grad.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', function() {
                    if (opts.rg === undefined)
                        //return '#0767F8';
                        return '#EDF3FE';
                    else
                        return '#0767F8';
                        //return '#EDF3FE';
            })
            .attr('stop-opacity', 1);
        grad.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', function() {
                    if (opts.rg === undefined)
                        //return '#EDF3FE';
                        return '#0767F8';
                    else
                        return '#EDF3FE';
                        //return '#0767F8';
            })
            .attr('stop-opacity', 1);

        svg.append('rect')
            //.attr('x', 0)
            //.attr('y', height + 10)
            .attr('x', function() {
                if (longbar)
                    return 20;
                    //return in_width / 3;
                else
                    return 0;
            })
            .attr('y', function() {
                if (longbar)
                    return in_height - 120;
                else
                    return height + 10;
            })
            .attr('height', 25)
            //.attr('width', width)
            .attr('width', function() {
                if (longbar)
                    return in_width / 2;
                else
                    return width;
                //return in_width / 2;
            })
            .attr('transform', function() {
                if (longbar)
                    return 'translate(' + -margin.left + ', ' + -margin.top + ')'; 
                else
                    return '';
            })
            .style('stroke-width', '0.5px')
            .style('stroke', 'black')
            .style('fill', 'url(#pretty_gradient)');

        svg.append("text")
            //.text('0.0')
            .text('' + mmin.toFixed(4))
            .attr("x", 10)
            //.attr("y", height + 60)
            .attr("y", function() {
                if (longbar)
                    return in_height - 80;
                else
                    return height + 60;
            })
            .style("text-anchor", "left")
            //.attr("transform", "translate("+cell_size/2 + ",-6) rotate (-90)")
            .attr('transform', function() {
                if (longbar)
                    return 'translate(' + -margin.left + ', ' + -margin.top + ')'; 
                else
                    return '';
            })
            .attr("class",  function (d,i) { return 'mono'; });
            //.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
        
        svg.append("text")
            .text('1.0')
            //.attr("x", width - margin.right - 10)
            .attr("x", function() {
                if (longbar)
                    return (in_width / 2) + 10;
                else
                    return width - margin.right - 10
            })
            //.attr("y", height + 60)
            .attr("y", function() {
                if (longbar)
                    return in_height - 80;
                else
                    return height + 60;
            })
            .attr('transform', function() {
                if (longbar)
                    return 'translate(' + -margin.left + ', ' + -margin.top + ')'; 
                else
                    return '';
            })
            .style("text-anchor", "right")
            //.attr("transform", "translate("+cell_size/2 + ",-6) rotate (-90)")
            .attr("class",  function (d,i) { return 'mono'; });
            //.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
        
        svg.append("text")
            //.text('Condensation Values')
            .text(function() {
                if (opts.keyt === undefined)
                    return 'Condensation Values';
                else
                    return opts.keyt;
            })
            //.attr("x", width / 2)
            //.attr("y", height + 60)
            .attr("x", function() {
                if (longbar)
                    return (in_width / 3) - 20;
                else
                    return width / 2;
            })
            //.attr("y", height + 60)
            .attr("y", function() {
                if (longbar)
                    return in_height - 80;
                else
                    return height + 60;
            })
            .attr('transform', function() {
                if (longbar)
                    return 'translate(' + -margin.left + ', ' + -margin.top + ')'; 
                else
                    return '';
            })
            .style("text-anchor", "middle")
            //.attr("transform", "translate("+cell_size/2 + ",-6) rotate (-90)")
            .attr("class",  function (d,i) { return 'mono'; });
            //.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
};
