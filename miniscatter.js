
var rand = function(min, max) { 
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var randNeg = function(max) { 
    return Math.floor(Math.random() * (max * 2)) - max;
}

var mean = function(arr) {
    return _.reduce(arr, function(m,n){return m + n;}, 0) / arr.length;
}

// Data should just be an array of values
var miniScatter = function(data, xlabel, ylabel, title) {

    //var height = 800;
    //var width = 800;
    //var in_height = height - 300;
    //var in_width = width - 700;
    var height = 550;
    var width = 150;
    var in_height = 500;
    var in_width = 100;
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

    // Draws the white Y axis lines. This depends on the number of
    // data sets. 
    //for (var i = 0; i < data.length; i++) {   // uncomment to use several data sets in a single plot

        //var div = in_width / (data.length + 1);
        var div = in_width / 2;
        svg.append('line')
            //.attr('x1', (div * (i + 1)) + pad)
            .attr('x1', (div) + xpad)
            .attr('y1', ypad + 1)
            //.attr('x2', (div * (i + 1)) + pad)
            .attr('x2', (div) + xpad)
            .attr('y2', ypad + in_height - 1)
            .attr('class', 'xline');
    //}

    // Create the y scale -- this is the set of entropy values
    var yscale = d3.scale.linear()
        //.domain([0, d3.max(json)])
        .domain([0, d3.max(data)])
        .range([in_height, 0]);
    var yaxis = d3.svg.axis()
        .scale(yscale)
        .orient('left')
        .ticks(6);

    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(' + (xpad - 5) + ',' + ypad + ')')
        .call(yaxis);

    var ticks = yscale.ticks(6);
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

    var div = (in_width / 2);

    svg.append('g')
        .attr('id', 'circs')
        .attr('clip-path', 'url(#chart-area)')
        .selectAll('circle')
        //.data(json)
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'circ')
        .attr('r', 5)
        //.attr('fill', 'rgb(210, 210, 210)')
        //.attr('stroke', 'black')
        .attr('cx', function(d) {return randNeg(15) + ((div * 1) + xpad);})
        //.attr('cx', div + xpad)
        .attr('cy', function(d) {return yscale(d) + ypad;});

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

    // X axis label
    svg.append('text')
        .attr('class', 'label')
        .style('text-anchor', 'middle')
        .attr('x', in_width / 2 + xpad)
        .attr('y', in_height + (ypad * 1.5))
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
