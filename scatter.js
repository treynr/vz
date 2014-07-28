
var rand = function(min, max) { 
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var randNeg = function(max) { 
    return Math.floor(Math.random() * (max * 2)) - max;
}

var mean = function(arr) {
    return _.reduce(arr, function(m,n){return m + n;}, 0) / arr.length;
}

// For now, data is a list of objects. Each object contains two values (for 
// the x and y) and an identifier.
// Array format: [{id, x, y}...]
// Groups are a way of coloring data points on the scatter plot. The group
// labels should be in the data object array and the grps array. 
var scatter = function(data, xlabel, ylabel, title, grps, opts) {

    //var height = 800;
    //var width = 800;
    //var in_height = height - 300;
    //var in_width = width - 700;
    var in_height = (opts.dimensions === undefined) ? 500 : opts.dimensions[0];
    var in_width = (opts.dimensions === undefined) ? 700 : opts.dimensions[1];
    var height = in_height + 100;
    var width = in_width + 50;
    //var in_height = 500;
    //var in_width = 700;
    var xpad = 50;
    var ypad = 30;

    var svg = d3.select('body')
        .append('svg')
        .attr('height', height)
        .attr('width', width);

    svg.append('rect')
        .attr('x', xpad)
        .attr('y', ypad)
        .attr('width', in_width)
        .attr('height', in_height)
        .attr('class', 'inbox');

    svg.append('rect')
        .attr('x', xpad)
        .attr('y', ypad)
        .attr('width', in_width)
        .attr('height', in_height)
        .attr('class', 'outbox');

    // Prevents any data points (circles) from overlapping outside
    // the chart
    svg.append('clipPath')
        .attr('id', 'chart-area')
        .append('rect')
        .attr('x', xpad)
        .attr('y', ypad + 1)
        .attr('width', in_width)
        .attr('height', in_height - 2);

    // Put all the x values in a single array, same for the y values
    var xs = [];
    var ys = [];

    for (var i = 0; i < data.length; i++) {

        xs.push(data[i]['x']);
        ys.push(data[i]['y']);
    }

    // Create the scale and axes
    var yscale = d3.scale.linear()
        .domain([0, d3.max(ys)]) // use y values array
        .range([in_height, 0]);
    var yaxis = d3.svg.axis()
        .scale(yscale)
        .orient('left')
        .ticks(10);
    var xscale = d3.scale.linear()
        .domain([0, d3.max(xs)]) // use x values array
        .range([0, in_width]);
    var xaxis = d3.svg.axis()
        .scale(xscale)
        .orient('bottom')
        .ticks(10);

    var ticks = xscale.ticks(10);
    // Draw white vertical lines
    for (var i = 0; i < ticks.length; i++) {

        if (ticks[i] == 0)
            continue;
        svg.append('line')
            .attr('x1', xscale(ticks[i]) + xpad)
            .attr('y1', ypad + 1)
            .attr('x2', xscale(ticks[i]) + xpad)
            .attr('y2', ypad + in_height - 1)
            .attr('class', 'xline');
    }

    ticks = yscale.ticks(6);
    // Draw white X axis lines, these are based on tick values
    for (var i = 0; i < ticks.length; i++) {

        if (ticks[i] == 0)
            continue;

        var div = in_width / (data.length + 1);
        svg.append('line')
            .attr('x1', 1 + xpad)
            .attr('y1', yscale(ticks[i]) + ypad)
            .attr('x2', in_width + xpad - 1)
            .attr('y2', yscale(ticks[i]) + ypad)
            .attr('class', 'xline');
    }

    // the transform functions adjust the axes so they're not overlapping
    // the chart. in_height is added to the x-axis so the axis is at the
    // bottom of the chart.
    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(' + (xpad - 5) + ',' + ypad + ')')
        .call(yaxis);
    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(' + xpad + ',' + (in_height + ypad + 5) + ')')
        .call(xaxis);

    var div = (in_width / 2);
    var colors = d3.scale.category10();
    var single = rand(0, 9);

    // Use up the colors so they're available later on
    if (grps.length === 1)
        for (var i = 0; i <= single; i++)
            colors(i);

    svg.append('g')
        .attr('id', 'circs')
        .attr('clip-path', 'url(#chart-area)')
        .selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'circ')
        .attr('r', 5)
        .attr('fill', function(d, i) {

            if (grps.length === 1) {
                return colors(single);
            }

            for (var i = 0; i < grps.length; i++) {
                console.log(d['grp']);
                if (d['grp'] == grps[i]) {
                    return colors(i);
                }
            }

            return 'rgb(240,240,240)';
        })
        .attr('cx', function(d) {return xscale(d['x']) + xpad;})
        .attr('cy', function(d) {return yscale(d['y']) + ypad;});
    /*

    // The mean bar's tool tip
    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 30])
        .html(function() {
            //return 'The average is ' + Math.round(mean(json) * 1000) / 1000;
            return 'The average is ' + Math.round(mean(data) * 1000) / 1000;
        });

    svg.call(tip);

    // The mean bar
    svg.append('rect')
        .attr('x', div + 20 ) // plus 30 so it can line up evenly 
        //.attr('y', function(d) {return yscale(mean(json)) + pad - 5;})
        .attr('y', function(d) {return yscale(mean(data)) + ypad - 5;})
        .attr('height', 8)
        .attr('width', 60)
        .attr('fill', 'rgb(255, 0, 0)')
        .attr('fill-opacity', 0.5)
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

    */
    // Title
    svg.append('text')
        .attr('class', 'label')
        .style('text-anchor', 'middle')
        .attr('x', in_width / 2 + xpad)
        .attr('y', 15)
        .text(title);
    // X axis label
    svg.append('text')
        .attr('class', 'label')
        .style('text-anchor', 'middle')
        .attr('x', in_width / 2 + xpad)
        .attr('y', in_height + (ypad * 2.5))
        .text(xlabel);
    // Y axis label
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('class', 'label')
        .attr('text-anchor', 'middle')
        //.attr('x', in_width / 2)
        .attr('x', 0 - (in_height / 2) - ypad)//0 - in_height)
        .attr('y', 0)// - (in_width / 2))
        .attr('dy', '1em')
        .text(ylabel);
}
