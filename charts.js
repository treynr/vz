
//// opts {
//      domain : [a, b]
//      dimensions : [height, width]
//      nbins : number of bins (histogram only)
//      title : title string
//      xlabel : x axis label
//      ylabel : y axis label
//      color : a color string, either a name (e.g. red) or hex (e.g. #ff0000)
//   }
//
function makeHistogram(data, opts) {

    var height = (opts.dimensions === undefined) ? 400 : opts.dimensions[0];
    var width = (opts.dimensions === undefined) ? 400 : opts.dimensions[1];
    var color = (opts.color === undefined) ? '#02d272' : opts.color;
    var bpad = (opts.padding === undefined) ? -1 : opts.padding;

    var formatCount = d3.format(",.0f");

    width = 500;
    height = 500;

    var svg = d3.select("body").append("svg")
        //.attr("width", width + margin.left + margin.right)
        //.attr("height", height + margin.top + margin.bottom)
        //.attr("width", width + 50)
        //.attr("height", height + 100)
        .attr("width", width)
        .attr("height", height)
        .append("g");

	if (opts.domain === undefined) {

		var dmax = d3.max(data);
		var dmin = d3.min(data);

		opts.domain = [dmax, dmin];
	}

    var margin = {top: 10, right: 30, bottom: 30, left: 50};
    height = height - margin.top - margin.bottom;
    width = width - margin.left - margin.right;

    var x = d3.scale.linear()
        .domain(opts.domain)
        //.range([0, width]);
        .range([margin.left, width]);

    // Generate a histogram using twenty uniformly-spaced bins.
    var data = d3.layout.histogram()
        .bins(x.ticks(50))
        //.bins(x.ticks(opts.nbins))
        (data);

    var y = d3.scale.linear()
        //.domain([0, d3.max(data, function(d) { return d.y; })])
        .domain([0, d3.max(data, function(d) { return d.y; })])
        //.range([height, 20]);
        .range([height, margin.bottom]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .tickFormat(d3.format('s'))
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        //.tickFormat(d3.format(','))
        .tickFormat(d3.format('s'))
        .orient("left");

        //.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var bar = svg.selectAll(".bar")
        .data(data)
        .enter().append("g")
        //.attr("class", "bar")
        .attr('shape-rendering', 'crispEdges')
        .attr('stroke', 'black')
        .attr('stroke-width', '1px')
        .attr('fill', '#02d272')
        //.attr('fill', '#f00')
        .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

    var tc = xAxis.ticks()[0];
    var ein = x(x.ticks(tc)[0]);
    var two = x(x.ticks(tc)[1]);
    var cw = Math.floor(two - ein) - 30;

    bar.append("rect")
        //.attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });
        .attr("width", function(d) {//x(data[0].dx) - 1)
			return (width / opts.nbins) + 10;//- 1;
            //if (opts.domain[0] === 0)
            //    return x(data[0].dx) - 1;
            //else if (opts.nbins)
            //    return (width / opts.nbins) + bpad;//- 1;
            //    //return (width / (x.ticks(opts.nbins).length - 1)) - 2;
            //    //return cw;
            //else
            //    return width / 10;
        })
        .attr("height", function(d) { return height - y(d.y); });

    //bar.append("text")
    //    .attr("dy", ".75em")
    //    .attr("y", 6)
    //    .attr("x", x(data[0].dx) / 2)
    //    .attr("text-anchor", "middle")
    //    .text(function(d) { return formatCount(d.y); });

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + margin.left + ",0)")
        .call(yAxis);
        //.call(customAxis);

    if (opts.xlabel !== undefined) {

        svg.append('text')
            .attr('class', 'label')
            .style('font-size', '18px')
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

//// opts {
//      domain : [a, b]
//      dimensions : [height, width]
//      nbins : number of bins (histogram only)
//      title : title string
//      xlabel : x axis label
//      ylabel : y axis label
//      color : a color string, either a name (e.g. red) or hex (e.g. #ff0000)
//   }
//
function makeBar(data, opts) {

    var height = (opts.dimensions === undefined) ? 400 : opts.dimensions[0];
    var width = (opts.dimensions === undefined) ? 400 : opts.dimensions[1];
    var color = (opts.color === undefined) ? '#002d72' : opts.color;
    var bpad = (opts.padding === undefined) ? -1 : opts.padding;
    var ytext = (opts.ytext === undefined) ? '' : opts.ytext;
    var ydom = (opts.ydom === undefined) ? [] : opts.ydom;
    var tickVals = (opts.tickVals === undefined) ? null : opts.tickVals;

    var formatCount = d3.format(",.0f");
    var margin = {top: 50, right: 30, bottom: 160, left: 50};

    height = height - margin.top - margin.bottom;
    width = width - margin.left - margin.right;
	var fullHeight = height + margin.top + margin.bottom;
	var fullWidth = width + margin.left + margin.right;

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    //var x = d3.scale.ordinal()
    //    .domain(opts.domain)
    //    .range([margin.left, width]);
    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], 0.3);

    //var y = d3.scale.linear()
    //    .domain([0, d3.max(data, function(d) { return d.y; })])
    //    .range([height, margin.bottom]);
    var y = d3.scale.linear()
        //.domain([0, d3.max(data, function(d) { return +d.freq; })])
        .domain([0, 4000])
        //.range([height, margin.bottom]);
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
		.outerTickSize(0)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        //.tickFormat(d3.format('s'))
        //.ticks(10)
		//.outerTickSize(0)
		.tickValues(y.ticks(8).concat(y.domain()))
        .orient("left");

    var names = [];

    for (var i = 0; i < data.length; i++) {
        names.push(data[i].name);
    }

    x.domain(names);

	//if (!opts.ydom)
	//	y.domain([0, d3.max(data, function(d) { return +d.freq; })]);
	//else
	//	y.domain(opts.ydom);

    svg.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'rgb(180, 180, 180)');

    //ticks = x.ticks(10);

    //for (var i = 0; i < ticks.length; i++) {

    //    if (ticks[i] == 0)
    //        continue;
    //    svg.append('line')
    //        //.attr('x1', xscale(ticks[i]) + xpad)
    //        //.attr('y1', ypad + 1)
    //        //.attr('x2', xscale(ticks[i]) + xpad)
    //        //.attr('y2', ypad + in_height - 1)
    //        .attr('x1', x(ticks[i]))
    //        .attr('y1', 0)
    //        .attr('x2', x(ticks[i]))
    //        .attr('y2', height - 1)
    //        .attr('class', 'xline');
    //}
	var defs = svg.append("defs");

  var filter = defs.append("filter")
      .attr("id", "dropshadow")

  filter.append("feGaussianBlur")
      .attr("in", "SourceAlpha")
      .attr("stdDeviation", 4)
      .attr("result", "blur");
  filter.append("feOffset")
      .attr("in", "blur")
      .attr("dx", 2)
      .attr("dy", 0)
      .attr("result", "offsetBlur");

  var feMerge = filter.append("feMerge");

  feMerge.append("feMergeNode")
      .attr("in", "offsetBlur")
  feMerge.append("feMergeNode")
      .attr("in", "SourceGraphic");

    ticks = y.ticks(8);
    // Draw white X axis lines, these are based on tick values
    for (var i = 0; i < ticks.length; i++) {

        if (ticks[i] == 0)
            continue;

        //var div = in_width / (data.length + 1);
        var div = width / (data.length + 1);
        svg.append('line')
            .attr('x1', 0)
            .attr('y1', y(ticks[i]))
            .attr('x2', width )
            .attr('y2', y(ticks[i]))
            .attr('class', 'xline');
    }

    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        //.attr('fill', color)
        .attr('fill', '#0085ca')
        .attr('stroke-width', '1px')
        .attr('stroke', 'black')
		//.attr('filter', 'url(#dropshadow)')
        //.attr('stroke', '#0085ca')
        .attr("x", function(d) { return x(d.name); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y(d.freq); })
        .attr("height", function(d) { return height - y(d.freq); });

    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        //.attr("transform", "rotate(-90)")
        .call(xAxis)
        .selectAll('text')
        .attr('shape-rendering', 'crispEdges')
		.style('font-size', '22px')
        .style("text-anchor", "end")
            .attr("dx", "-.18em")
            .attr("dy", ".85em")
            .attr("transform", function(d) {
                return "rotate(-35)" 
            });

    svg.append('g')
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .attr('shape-rendering', 'crispEdges')
        .style("text-anchor", "end")
        .text(ytext);



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
            .attr('x', (width )/ 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('text-decoration', 'underline')
            .text(opts.title);
    }
}
