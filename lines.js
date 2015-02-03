//// opts {
//      xdom : [a, b]
//      ydom : [a, b]
//      dimensions : [height, width]
//      nbins : number of bins (histogram only)
//      title : title string
//      color : a color string, either a name (e.g. red) or hex (e.g. #ff0000)
//   }
//

//// data [{
//      x : [str]   // array of dates
//      y : [num]   // array of values
//      grp : str   // some group id that will be shown
//  }]
//// data is an array of objects with two keys x and y (the values for the 
//// x/y axes). Each key is an array (either dates as strings, of values) and 
//// both arrays should be the same length.
//
function makeLineTS(data, opts) {

    var margin = {top: 8, right: 10, bottom: 2, left: 10};
    var height = (opts.dimensions === undefined) ? 70 : opts.dimensions[0];
    var width = (opts.dimensions === undefined) ? 800 : opts.dimensions[1];
    width -= margin.left - margin.right;
    height -= margin.top - margin.bottom;

    var parseDate = d3.time.format("%Y-%m").parse;
    var xscale = d3.time.scale().range([0, width]);
    var yscale = d3.scale.linear().range([height, 0]);
    var area = d3.svg.area()
        .x(function(d){ return xscale(d.x); })
        .y0(height)
        .y1(function(d){ return yscale(d.y); });

    var line = d3.svg.line()
        .x(function(d, i){ return xscale(d.x); })
        .y(function(d, i){ return yscale(d.y); });

    // Grouping
    var symbols = d3.nest()
        .key(function(d){ return d.grp; })
        .entries(data);

    symbols.forEach(function(s) {
        s.maxadd = d3.max(s.values[0]['y']);
        s.maxx = d3.max(s.values[0]['x']);
        s.minx = d3.min(s.values[0]['x']);
    });

    //xscale.domain([
    //    d3.min(symbols, function(s){ return s.values[0]['x'][0]; }),
    //    d3.max(symbols, function(s){ return s.values[0]['x'][(s.values[0]['x'].length - 1)]; })
    //]);

    var toPts = function(x, y) {
        var pts = [];

        for (var i = 0; i < x.length; i++) {
            pts.push({'x': x[i], 'y': y[i]});
        }

        return pts;
    }

    var svg = d3.select('body').selectAll('svg')
        .data(symbols)
        .enter().append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append('path')
        .attr('class', 'area')
        .attr('d', function(d, i){ xscale.domain([d.minx, d.maxx]); yscale.domain([0, d.maxadd]); return area(toPts(d.values[0]['x'], d.values[0]['y'])); });

    svg.append('path')
        .attr('class', 'line')
        //.attr('d', function(d, i){ yscale.domain([0, d.maxadd]); console.log(d.values); return line({'x':d.values[0].x[i], 'y':d.values[0].y[i]});});//return line(d.values[0]['y']); });
        .attr('d', function(d, i){ xscale.domain([d.minx, d.maxx]); yscale.domain([0, d.maxadd]); console.log(d.values); return line(toPts(d.values[0]['x'], d.values[0]['y'])); });

    svg.append('text')
      .attr("x", width - 6)
      .attr("y", height - 6)
      .style("text-anchor", "end")
      .text(function(d) { return d.key; });
}

//// opts {
//      xdom : [a, b]
//      ydom : [a, b]
//      dimensions : [height, width]
//      title : title string
//      xlabel : x axis label
//      ylabel : y axis label
//      color : a color string, either a name (e.g. red) or hex (e.g. #ff0000)
//   }
//
function makeLineDist(data, opts) {

    var height = (opts.dimensions === undefined) ? 400 : opts.dimensions[0];
    var width = (opts.dimensions === undefined) ? 400 : opts.dimensions[1];
    var color = (opts.color === undefined) ? 'steelblue' : opts.color;
    var xdom = (opts.xdom === undefined) ? [d3.min(data), d3.max(data)] : opts.xdom;
    var ydom = [1, data.length];

    //var formatCount = d3.format(",.0f");

    var svg = d3.select('body')
        .append('svg')
        .attr('height', height)
        .attr('width', width);

    var margin = {top: 10, right: 30, bottom: 30, left: 30};
    height = height - margin.top - margin.bottom,
    width = width - margin.left - margin.right;

    var xscale = d3.scale.linear()
        .domain(opts.xdom)
        .range([margin.left, width]);

    var xaxis = d3.svg.axis()
        .scale(xscale)
        .orient('bottom')
        .ticks(20)
        .outerTickSize(0);

    var yscale = d3.scale.linear()
        .domain(opts.ydom)
        .range([height, 0]);

    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xaxis);

    var line = d3.svg.line()
        .interpolate('basis')
        .x(function(d, i){return xscale(d[0]);})
        .y(function(d, i){return yscale(d[1]);});

    svg.append('path')
        .datum(data)
        .attr('d', line)
        .attr('class', 'line');
    // Generate a histogram using twenty uniformly-spaced bins.
    //var data = d3.layout.histogram()
    //    //.bins(x.ticks(50))
    //    .bins(x.ticks(opts.nbins))
    //    (data);

    //var y = d3.scale.linear()
    //    .domain([0, d3.max(data, function(d) { return d.y; })])
    //    .range([height, 0]);

    //var xAxis = d3.svg.axis()
    //    .scale(x)
    //    .orient("bottom");

    //var svg = d3.select("body").append("svg")
    //    .attr("width", width + margin.left + margin.right)
    //    .attr("height", height + margin.top + margin.bottom)
    //    .append("g")
    //    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //var bar = svg.selectAll(".bar")
    //    .data(data)
    //    .enter().append("g")
    //    //.attr("class", "bar")
    //    .attr('shape-rendering', 'crispEdges')
    //    .attr('fill', color)
    //    //.attr('fill', '#f00')
    //    .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

    //bar.append("rect")
    //    .attr("x", 1)
    //    .attr("width", x(data[0].dx) - 1)
    //    .attr("height", function(d) { return height - y(d.y); });

    ////bar.append("text")
    ////    .attr("dy", ".75em")
    ////    .attr("y", 6)
    ////    .attr("x", x(data[0].dx) / 2)
    ////    .attr("text-anchor", "middle")
    ////    .text(function(d) { return formatCount(d.y); });

    //svg.append("g")
    //    .attr("class", "x axis")
    //    .attr("transform", "translate(0," + height + ")")
    //    .call(xAxis);

    //if (opts.title !== undefined) {

    //    svg.append('text')
    //        .attr('x', width / 2)
    //        .attr('y', 0)
    //        .attr('text-anchor', 'middle')
    //        .style('font-size', '14px')
    //        .style('text-decoration', 'underline')
    //        .text(opts.title);
    //}
}

//// opts {
//      xdom : [a, b]
//      dimensions : [height, width]
//      title : title string
//      xlabel : x axis label
//      ylabel : y axis label
//      color : a color string, either a name (e.g. red) or hex (e.g. #ff0000)
//   }
//
function lineGraphSingle(data, opts) {

    var height = (opts.dimensions === undefined) ? 400 : opts.dimensions[0];
    var width = (opts.dimensions === undefined) ? 400 : opts.dimensions[1];
    var color = (opts.color === undefined) ? 'steelblue' : opts.color;
    var xdom = [1, data.length];
    var ydom = (opts.ydom === undefined) ? [d3.min(data), d3.max(data)] : opts.ydom;
    var margin = (opts.marg === undefined) ? 
                 {top: 10, right: 30, bottom: 30, left: 50} : opts.marg;

    var svg = d3.select('body')
        .append('svg')
        .attr('height', height)
        .attr('width', width);

    height = height - margin.top - margin.bottom,
    width = width - margin.left - margin.right;

    var xscale = d3.scale.linear()
        .domain(xdom)
        .range([margin.left, width]);
    var xaxis = d3.svg.axis()
        .scale(xscale)
        .orient('bottom')
        .ticks(10);

    var yscale = d3.scale.linear()
        .domain(ydom)
        .range([height, margin.bottom]);
    var yaxis = d3.svg.axis()
        .scale(yscale)
        .orient('left')
        .ticks(20);

    var line = d3.svg.line()
        //.interpolate('basis')
        .interpolate('basis')
        .x(function(d, i){return xscale(i);})
        .y(function(d, i){return yscale(d);});

    svg.append('path')
        .datum(data)
        .attr('d', line)
        .attr('stroke', '#666')
        .attr('stroke-width', '3px')
        .attr('class', 'line');

    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(0,' + (height) + ')')
        .call(xaxis);
    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(' + (margin.left) + ',0)')
        .call(yaxis);

    if (opts.xlabel !== undefined) {

        svg.append('text')
            .attr('class', 'label')
            .style('text-anchor', 'middle')
            .attr('x', (margin.right + width) / 2)
            .attr('y', height + margin.bottom)
            .text(opts.xlabel);
    }

    if (opts.ylabel !== undefined) {

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('class', 'label')
            .attr('text-anchor', 'middle')
            .attr('x', 0 - (height / 2) - 0)
            .attr('y', 0)
            .attr('dy', '1em')
            .text(opts.ylabel);
    }

    if (opts.title !== undefined) {

        svg.append('text')
            .attr('x', (width + margin.right)/ 2)
            .attr('y', margin.top)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('text-decoration', 'underline')
            .text(opts.title);
    }
}

function maxx(arr) {
    var m = [];
    
    for (var i = 0; i < arr.length; i++)
        m.push(d3.max(arr[i]));

    return d3.max(m);
}

function minn(arr) {
    var m = [];
    
    for (var i = 0; i < arr.length; i++)
        m.push(d3.min(arr[i]));

    return d3.min(m);
}

// graph multiple lines, data is an array of arrays
function lineGraphMult(data, opts) {

    var height = (opts.dimensions === undefined) ? 400 : opts.dimensions[0];
    var width = (opts.dimensions === undefined) ? 400 : opts.dimensions[1];
    var color = (opts.color === undefined) ? 'steelblue' : opts.color;
    //var xdom = [1, data.length];
    var xdom = [1, data[0].length];
    //var ydom = (opts.ydom === undefined) ? [d3.min(data), d3.max(data)] : opts.ydom;
    var ydom = (opts.ydom === undefined) ? [minn(data), maxx(data)] : opts.ydom;

    var svg = d3.select('body')
        .append('svg')
        .attr('height', height)
        .attr('width', width);

    var margin = {top: 10, right: 30, bottom: 30, left: 50};
    height = height - margin.top - margin.bottom,
    width = width - margin.left - margin.right;

    var xscale = d3.scale.linear()
        .domain(xdom)
        .range([margin.left, width]);
    var xaxis = d3.svg.axis()
        .scale(xscale)
        .orient('bottom')
        .ticks(10);

    var yscale = d3.scale.linear()
        .domain(ydom)
        .range([height, margin.bottom]);
    var yaxis = d3.svg.axis()
        .scale(yscale)
        .orient('left')
        .ticks(20);

    var gs = svg.selectAll('aline')
        .data(data)
        .enter().append('g');

    var line = d3.svg.line()
        //.interpolate('basis')
        .interpolate('basis')
        .x(function(d, i){return xscale(i);})
        .y(function(d, i){return yscale(d);});

    var colors = d3.scale.category10();

    gs.each(function(d, i) {

        var e = d3.select(this);
        e.append('path')
            //.datum(data)
            //.attr('d', line)
            .attr('d', function(){ return line(d, i);})
            .attr('stroke', function(){ 
                console.log(i);
                if (i === 0) return '#666';
                else if (i === 1) return '#f00';
                else return '#00E';
            })
            //.attr('d', function(d, i){)
            .attr('class', 'line');
    });

    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(0,' + (height) + ')')
        .call(xaxis);
    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(' + (margin.left) + ',0)')
        .call(yaxis);

    if (opts.xlabel !== undefined) {

        svg.append('text')
            .attr('class', 'label')
            .style('text-anchor', 'middle')
            .attr('x', (margin.right + width) / 2)
            .attr('y', height + margin.bottom)
            .text(opts.xlabel);
    }

    if (opts.ylabel !== undefined) {

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('class', 'label')
            .attr('text-anchor', 'middle')
            //.attr('x', in_width / 2)
            .attr('x', 0 - (height / 2) - 0)//0 - in_height)
            .attr('y', 0)// - (in_width / 2))
            .attr('dy', '1em')
            .text(opts.ylabel);
    }

    if (opts.title !== undefined) {

        svg.append('text')
            .attr('x', (width + margin.right)/ 2)
            .attr('y', margin.top)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('text-decoration', 'underline')
            .text(opts.title);
    }
}
