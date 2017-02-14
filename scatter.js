
var rand = function(min, max) { 
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var randNeg = function(max) { 
    return Math.floor(Math.random() * (max * 2)) - max;
}

var mean = function(arr) {
    return _.reduce(arr, function(m,n){return m + n;}, 0) / arr.length;
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
    var width = in_width + 60;
    var radius = (opts.radius === undefined) ? 5 : opts.radius;
    //var in_height = 500;
    //var in_width = 700;
    var xpad = 55;
    var ypad = 30;

    var svg = d3.select('body')
        .append('svg')
        .attr('height', height)
        .attr('width', width);

    var svg_key = d3.select('body').append('svg').attr('width', 450).attr('height', 320);

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
        //.domain([0, d3.max(ys)]) // use y values array
        //.domain([d3.min(ys), d3.max(ys)]) // 9/14/2014 changed to this to try and get a prettier graph
        .domain([d3.min(ys), d3.max(ys) + 0.04]) // 9/14/2014 changed to this to try and get a prettier graph
        .range([in_height, 0]);
    var yaxis = d3.svg.axis()
        .scale(yscale)
        .orient('left')
        .ticks(10);
    var xscale = d3.scale.linear()
        //.domain([0, d3.max(xs)]) // use x values array
        //.domain([d3.min(xs), d3.max(xs)]) // 9/14/2014 changed to this to try and get a prettier graph
        .domain([d3.min(xs) - 0.05, d3.max(xs)]) // 9/14/2014 changed to this to try and get a prettier graph
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

    // Tool-tip shit, added 9/25/14
    // currently only for ratio data. when I'm not being a lazy piece of shit,
    // I'll update it for everything else.
    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .html(function(d) {
            return 'GS0: ' + d.gs_name0 + '<br />GS1: ' + d.gs_name1;
        });

    // added 10/06/14, really need to rewrite this shit
    if (opts['tip'] !== undefined) {
        tip = d3.tip()
            .attr('class', 'd3-tip')
            .html(function(d) {
                return d.tip;
        });
    }

    svg.call(tip);

    // color mapping used when each data point has two groups that need color
    var cmap = {};

    console.log(grps);
    svg.append('g')
        .attr('id', 'circs')
        .attr('clip-path', 'url(#chart-area)')
        .selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('class', 'circ')
        .attr('r', radius)
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)
        .attr('fill', function(d, i) {

            if (opts.color)
                return opts.color;

            if (grps.length === 1) {
                return colors(single);
            }

            if (d['grp'] !== undefined) {
                // this is an ugly groups implementation and it fucking disgusts me,
                // reminder to write a better way of doing this
                for (var i = 0; i < grps.length; i++) {
                    if (d['grp'] == grps[i]) {
                        return colors(i);
                    }
                }
            }

            // For two groups, we're gonna color half of the circle with each
            // groups color
            if (d['grp0'] !== undefined) {
                
                var c0 = null;
                var c1 = null;

                //console.log('d0: ' + d['grp0']);
                //console.log('d1: ' + d['grp1']);
                if (cmap[d['grp0']] !== undefined) {
                    if (cmap[d['grp0']][d['grp1']] !== undefined) {
                        return cmap[d['grp0']][d['grp1']];
                    }
                }

                for (var i = 0; i < grps.length; i++) {

                    if (d['grp0'] == grps[i]) {
                        c0 = colors(i);
                    }
                    if (d['grp1'] == grps[i]) {
                        c1 = colors(i);
                    }
                    if ((c0 !== null) && (c1 !== null)) 
                        break;
                }
                if (cmap[d['grp0']] === undefined) {
                    cmap[d['grp0']] = {};
                }
                if (cmap[d['grp1']] === undefined) {
                    cmap[d['grp1']] = {};
                }
                if (cmap[d['grp0']][d['grp1']] === undefined) {

                    var gid = '' + c0.slice(1) + c1.slice(1);

                    cmap[d['grp0']][d['grp1']] = 'url(#' + gid + ')';

                    var grad = svg.append("defs").append("linearGradient").attr("id", gid)
                        .attr("x1", "0%").attr("x2", "0%").attr("y1", "100%").attr("y2", "0%");
                    grad.append("stop").attr("offset", "50%").style("stop-color", c0);
                    grad.append("stop").attr("offset", "50%").style("stop-color", c1);
                }
                if (cmap[d['grp1']][d['grp0']] === undefined) {
                    cmap[d['grp1']][d['grp0']] = 'url(#' + c0.slice(1) + c1.slice(1) + ')';
                }
                return cmap[d['grp0']][d['grp1']];
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

    // Append all the grouping colored key shit if necessary
    if (grps.length > 1) {

        svg_key.append('text')
            .attr({
                'text-anchor': 'middle',
                'font-family': 'sans-serif',
                'font-size': '15px',
                'y': '15',
                'x': (450 / 3)
            })
            .text('Group Legend');
                
        var key = svg_key.selectAll('g')
            .data(grps)
            .enter()
            .append('g')
            .attr('class', 'legend');

        key.append('circle')
            .attr('cx', 10)
            .attr('cy', function(d, i){ return (i * 20) + 30; })
            .attr('r', 6)
            .attr('fill', function(d, i){
                return colors(i);
            });
        key.append('text')
            .attr('x', 30)
            .attr('y', function(d, i){ return (i * 20) + 35; })
            .attr('font-family', 'sans-serif')
            .attr('font-size', '12px')
            .text(function(d, i){ return d; });
    }
}
