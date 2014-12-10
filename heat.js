
// opts.rg = reverse the gradient coloring
var heatmap = function(data, rlabels, clabels, title, grps, opts) {

    var margin = { top: 300, right: 10, bottom: 50, left: 300 };
    var in_height = (opts.dimensions === undefined) ? 500 : opts.dimensions[0];
    var in_width = (opts.dimensions === undefined) ? 700 : opts.dimensions[1];
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
            .text(function(d){ return d.name; });

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
    var colorScale = d3.interpolateRgb('#0767F8', '#EDF3FE');
    //var colorScale = d3.scale.linear()
    //    .domain(opts.domain)
    //    .range(d3.range

    var grpcolors = d3.scale.category20();

    if (grps) {

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
                    'x': 85//(width / 2)
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
                    return grpcolors(grps[0].indexOf(d));
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
      .text(function (d, i) { return d; })
      .style('fill', function(d){ 
            if (grps)
                return grpcolors(grps[0].indexOf(grps[1][d])); 
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
                return grpcolors(grps[0].indexOf(grps[1][d])); 
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
        mmdat.push(data[i]['ratio']);

    var mmin = +parseFloat(d3.min(mmdat)).toFixed(1);
    var mmax = d3.max(mmdat);

    var cscale = d3.scale.linear()
        .domain([mmin, mmax])
        //.domain([0.6, 1.0])
        .range([0.0, 1.0]);

    var the_heat = svg.append('g')//.attr('class', 'g3')
        //.selectAll('.cellg')
        .selectAll('rect')
        // commenting this out for some reason shows more data points on the map
        .data(data)//, function(d){return d.ratio;})
        .enter()
        .append("rect")
        .attr("y", function(d) { return rlabels.indexOf(d.gs_name0) * cell_size; })
        .attr("x", function(d) { return clabels.indexOf(d.gs_name1) * cell_size; })
        //.attr("x", function(d) { return row_ind.indexOf(d.col) * cellSize; })
        //.attr("y", function(d) { return col_ind.indexOf(d.row) * cellSize; })
        //.attr("class", function(d){return "cell cell-border cr"+(d.row-1)+" cc"+(d.col-1);})
        .attr("class", function(d){return "cell cell-border cr"+(rlabels.indexOf(d.gs_name0)-1)+" cc"+(clabels.indexOf(d.gs_name1)-1);})
        .attr("width", cell_size)
        .attr("height", cell_size)
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
        .style("fill", function(d) { return colorScale(cscale(d.ratio)); })//;
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
               d3.selectAll(".rowLabel").classed("text-highlight",function(r,ri){ return ri==(rlabels.indexOf(d.gs_name0)/*-1*/);});
               d3.selectAll(".colLabel").classed("text-highlight",function(c,ci){ return ci==(clabels.indexOf(d.gs_name1)/*-1*/);});
        
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
                        return '#0767F8';
                    else
                        return '#EDF3FE';
            })
            .attr('stop-opacity', 1);
        grad.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', function() {
                    if (opts.rg === undefined)
                        return '#EDF3FE';
                    else
                        return '#0767F8';
            })
            .attr('stop-opacity', 1);

        svg.append('rect')
            .attr('x', 0)
            .attr('y', height + 10)
            .attr('height', 35)
            .attr('width', width)
            .style('stroke-width', '0.5px')
            .style('stroke', 'black')
            .style('fill', 'url(#pretty_gradient)');

        svg.append("text")
            //.text('0.0')
            .text('' + mmin)
            .attr("x", 0)
            .attr("y", height + 60)
            .style("text-anchor", "left")
            //.attr("transform", "translate("+cell_size/2 + ",-6) rotate (-90)")
            .attr("class",  function (d,i) { return 'mono'; });
            //.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
        
        svg.append("text")
            .text('1.0')
            .attr("x", width - margin.right - 10)
            .attr("y", height + 60)
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
            .attr("x", width / 2)
            .attr("y", height + 60)
            .style("text-anchor", "middle")
            //.attr("transform", "translate("+cell_size/2 + ",-6) rotate (-90)")
            .attr("class",  function (d,i) { return 'mono'; });
            //.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
};
