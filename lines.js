//// opts {
//      xdom : [a, b]
//      ydom : [a, b]
//      dimensions : [height, width]
//      nbins : number of bins (histogram only)
//      title : title string
//      color : a color string, either a name (e.g. red) or hex (e.g. #ff0000)
//   }
//
function makeLineDist(data, opts) {

    var height = (opts.dimensions === undefined) ? 400 : opts.dimensions[0];
    var width = (opts.dimensions === undefined) ? 400 : opts.dimensions[1];
    var color = (opts.color === undefined) ? 'steelblue' : opts.color;

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

