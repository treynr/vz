
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
    var color = (opts.color === undefined) ? 'steelblue' : opts.color;
    var bpad = (opts.padding === undefined) ? -1 : opts.padding;

    var formatCount = d3.format(",.0f");

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
        //.bins(x.ticks(50))
        .bins(x.ticks(opts.nbins))
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
        .attr('fill', color)
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
    var color = (opts.color === undefined) ? 'steelblue' : opts.color;
    var bpad = (opts.padding === undefined) ? -1 : opts.padding;
    var ytext = (opts.ytext === undefined) ? 'tf-idf' : opts.ytext;
    var ydom = (opts.ydom === undefined) ? [] : opts.ydom;

    var formatCount = d3.format(",.0f");
    var margin = {top: 50, right: 30, bottom: 140, left: 50};

    height = height - margin.top - margin.bottom;
    width = width - margin.left - margin.right;

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    //var x = d3.scale.ordinal()
    //    .domain(opts.domain)
    //    .range([margin.left, width]);
    var x = d3.scale.ordinal()
        .rangeRoundBands([0, width], 0.1);

    //var y = d3.scale.linear()
    //    .domain([0, d3.max(data, function(d) { return d.y; })])
    //    .range([height, margin.bottom]);
    //var y = d3.scale.linear()
    //    //.domain([0, d3.max(data, function(d) { return +d.freq; })])
    //    //.range([height, margin.bottom]);
    //    .range([height, 0]);

	if (!opts.ydom) {
		console.log('wut');
		console.log(opts.ydom);

		var y = d3.scale.linear()
			//.domain([0, d3.max(data, function(d) { return +d.freq; })])
			//.range([height, margin.bottom]);
			.range([height, 0]);

	} else {

		console.log('wut2');
		var y = d3.scale.linear()
			.domain([0,1.0])
			//.range([height, margin.bottom]);
			.range([height, 0]);

	}

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        //.tickFormat(d3.format('s'))
        .ticks(10)
        .orient("left");

    var names = [];

    for (var i = 0; i < data.length; i++) {
        names.push(data[i].name);
    }

    x.domain(names);

	if (!opts.ydom)
		y.domain([0, d3.max(data, function(d) { return +d.freq; })]);
	else
		y.domain(opts.ydom);

    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + height + ')')
        //.attr("transform", "rotate(-90)")
        .call(xAxis)
        .selectAll('text')
        .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", function(d) {
                return "rotate(-65)" 
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

    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.name); })
        .attr("width", x.rangeBand())
        .attr("y", function(d) { return y(d.freq); })
        .attr("height", function(d) { return height - y(d.freq); });

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
