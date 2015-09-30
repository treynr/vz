
//// data = [[values], [more values], ...]
//
//// opts :
////    dimensions : [int, int]; height and width of the SVG 
////    names : [string]; list of strings associating names to boxplots
////    lmin : local min
////    lmax : local max
////    gmin : global min
////    gmax : global max
//
function makeBoxPlot(data, opts) {

    var height = (opts.dimensions === undefined) ? 500 : opts.dimensions[0];
    var width = (opts.dimensions === undefined) ? 110 : opts.dimensions[1];
    var margin = {top: 10, right: 30, bottom: 30, left: 50};

    height = height - margin.top - margin.bottom;
    width = width - margin.left - margin.right;

    var tmm = []; // min/max for all boxplots

    for (var i = 0; i < data.length; i++) {

        // sort is where javascript shows how pants on head retarded it can be
        // srsly, go look up its behavior
        var dat = data[i].sort(function(a, b) { return a - b; });
        //var dmin = dat[0];
        //var dmax = dat[dat.length - 1];
        var dmin = (opts.lmin === undefined) ? dat[0] : opts.lmin;
        var dmax = (opts.lmax === undefined) ? dat[dat.length - 1] : opts.lmax;
        var quartiles = makeQuartiles(dat);
        //var whiskers = iqr(dat).map(function(i) { return dat[i]; });
        var whiskers = iqr(dat);

        tmm.push(dmin);
        tmm.push(dmax);

        var svg = d3.select('body')
            .append('svg')
            .attr('class', 'box')
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append('g')
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            ;

        var x1 = d3.scale.linear()
            .domain([dmin, dmax])
            .range([height, 0]);

        //var x0 = d3.scale.linear()
        //    .domain([0, Infinity])
        //    .range(x1.range());


        var center = svg.selectAll("line.center")
            .data([whiskers])
            ;

        center.enter().insert("line", "rect")
            .attr("class", "center")
            .attr("x1", width / 2)
            .attr("y1", function(d) { return x1(d[0]); })
            .attr("x2", width / 2)
            .attr("y2", function(d) { return x1(d[1]); })
            .style("opacity", 1)
            ;

      var box = svg.selectAll("rect.box")
        .data([quartiles])
        ;

      box.enter().append("rect")
        .attr("class", "box")
        .attr("x", 0)
        .attr("y", function(d) { return x1(d[2]); })
        .attr("width", width)
        .attr("height", function(d) { return x1(d[0]) - x1(d[2]); })
        ;

      var medianLine = svg.selectAll("line.median")
          .data([quartiles[1]]);

      medianLine.enter().append("line")
          .attr("class", "median")
          .style('stroke', '#FF0000')
          .style('fill', '#FF0000')
          .attr("x1", 1)
          .attr("y1", x1)
          .attr("x2", width - 1)
          .attr("y2", x1)
          ;

        //// Update whiskers.
        var whisker = svg.selectAll("line.whisker")
            .data(whiskers)
            ;

        whisker.enter().insert("line", "circle, text")
            .attr("class", "whisker")
            .attr("x1", 0)
            .attr("y1", x1)
            .attr("x2", width)
            .attr("y2", x1)
            .style("opacity", 1)
            ;

        if (opts.names !== undefined) {

            var name = svg.append('text')
                //.attr('x', (width / 3))
                .attr('x', 0 - 10)
                .attr('y', height + margin.top)
                .attr('dy', '1em')
                .text(opts.names[i]);
        }
    }

    var axis_svg = d3.select('body')
        .append('svg')
        .attr('class', 'axis')
        //.attr("width", width + margin.left + margin.right)
        .attr("width", margin.left + 10)
        .attr("height", height + margin.top + margin.bottom)
        .append('g')
        .attr("transform", "translate(" + 10 + "," + margin.top + ")")
        ;

    console.log(tmm);
    var yscale = d3.scale.linear()
        .domain([d3.min(tmm), d3.max(tmm)])
        .range([height, 0]);

    // Single axis for all the plots
    var yaxis = d3.svg.axis()
        .scale(yscale)
        .orient('right')
        .ticks(10);

    axis_svg//.append('g')
        //.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .call(yaxis);

}

// Various utility functions for constructing the boxplots. Might move 
// these outside of this function later.

//// makeQuartiles
//
var makeQuartiles = function(arr) {
    return [d3.quantile(arr, 0.25),
            d3.quantile(arr, 0.50),
            d3.quantile(arr, 0.75)];
}

//// iqr
//
//// Calculates interquartile range
//
var iqr = function(arr) {

    var qs = makeQuartiles(arr);
    var q1 = qs[0];
    var q3 = qs[2];
    //var iqr = (q3 - q1) * 1.5;
    var iqr = (q3 - q1);
    var i = -1;
    var j = arr.length;

    while (arr[++i] < q1 - (1.5 * iqr));
    while (arr[--j] > q3 + (1.5 * iqr));

    return [arr[i], arr[j]];
}
