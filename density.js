
var minwrap = function(arr) { return d3.min(arr); };
var maxwrap = function(arr) { return d3.max(arr); };

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
//// data should be an array of arrays, each inner array containing the set of
//// points to be plotted.
//
var density = function(data, opts) {

    //// Default configuration options
    var height = (opts.dimensions === undefined) ? 400 : opts.dimensions[0];
    var width = (opts.dimensions === undefined) ? 500 : opts.dimensions[1];
    var xmin = (opts.xdom === undefined) ? 0 : opts.xdom[0];
    var xmax = (opts.xdom === undefined) ? 0 : opts.xdom[1];
    var ymin = (opts.ydom === undefined) ? 0 : opts.ydom[0];
    var ymax = (opts.ydom === undefined) ? 1 : opts.ydom[1];
    var xlabel = (opts.xlabel === undefined) ? '' : opts.xlabel;
    var scale = (opts.scale === undefined) ? 1 : opts.scale;

    var margin = {top: 20, right: 30, bottom: 30, left: 40};
    height = height - margin.top - margin.bottom;
    width = width - margin.left - margin.right;

    // Normally we'd use the d3js color scale, but I want to pick pretty colors
    // Might add more later, but I don't think I'll need more than this. 
    var colors = ['#1f77b4', '#2ca02c', '#d62728', '#9467bd', '#ff7f0e'];

    if (opts.xdom === undefined) {

        xmin = d3.min(data.map(minwrap));
        xmax = d3.max(data.map(maxwrap));
    }

    var x = d3.scale.linear()
        //.domain([30, 110])
        //.domain([d3.min(xmin), d3.max(xmax)])
        //.domain([dmin, dmax])
        .domain([xmin, xmax])
        .range([0, width]);

    var y = d3.scale.linear()
        //.domain([0, .9])
        .domain([ymin, ymax])
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        //.tickFormat(d3.format("%"))
        ;

    var line = d3.svg.line()
        .x(function(d) { return x(d[0]); })
        .y(function(d) { return y(d[1]); });

    var area = d3.svg.area()
        .x(function(d) { return x(d[0]); })
        .y0(height)
        .y1(function(d) { return y(d[1]); })
        ;

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text(xlabel)
        ;

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    //var data = histogram(faithful);
    //var kde = kernelDensityEstimator(epanechnikovKernel(7), x.ticks(100));
    //var kde = kernelDensityEstimator(epanechnikovKernel(0.5), x.ticks(50));
    
    //var kde = kernelDensityEstimator(triweightKernel(0.5), x.ticks(50));
    //var kde = kernelDensityEstimator(triweightKernel(2), x.ticks(50));
    var kde = kernelDensityEstimator(triweightKernel(scale), x.ticks(50));

    //var kde = kernelDensityEstimator(uniformKernel(0.5), x.ticks(50));
    //var kde = kernelDensityEstimator(quarticKernel(0.4), x.ticks(50));
    //var kde = kernelDensityEstimator(gaussianKernel(0.5), x.ticks(50));

  //svg.selectAll(".bar")
  //    .data(data)
  //  .enter().insert("rect", ".axis")
  //    .attr("class", "bar")
  //    .attr("x", function(d) { return x(d.x) + 1; })
  //    .attr("y", function(d) { return y(d.y); })
  //    .attr("width", x(data[0].dx + data[0].x) - x(data[0].x) - 1)
  //    .attr("height", function(d) { return height - y(d.y); });

    for (var i = 0; i < data.length; i++) {

        svg.append("path")
            //.datum(kde(faithful))
            //.datum(kde(data[0]))
            .datum(kde(data[i]))
            .attr("class", "area")
            //.style('fill', 'steelblue')
            .style('fill', function() { return colors[i]; })
            .style('opacity', 0.5)
            .attr("d", area)
            ;
        svg.append("path")
            //.datum(kde(faithful))
            //.datum(kde(data[0]))
            .datum(kde(data[i]))
            .attr("class", "line")
            .attr("d", line)
            ;
    }

    function kernelDensityEstimator(kernel, x) {
      return function(sample) {
        return x.map(function(x) {
          return [x, d3.mean(sample, function(v) { return kernel(x - v); })];
        });
      };
    }

    function epanechnikovKernel(scale) {
      return function(u) {
        return Math.abs(u /= scale) <= 1 ? .75 * (1 - u * u) / scale : 0;
      };
    }

    function triweightKernel(scale) {
      return function(u) {
        return Math.abs(u /= scale) <= 1 ? (35/32) * Math.pow((1 - u * u), 3) / scale : 0;
      };
    }

    function triangularKernel(scale) {
      return function(u) {
        return Math.abs(u /= scale) <= 1 ? Math.abs(1 - u) / scale : 0;
      };
    }

    function uniformKernel(scale) {
      return function(u) {
        return Math.abs(u /= scale) <= 1 ? (1/2) / scale : 0;
      };
    }

    function quarticKernel(scale) {
      return function(u) {
        return Math.abs(u /= scale) <= 1 ? (15/16) * Math.pow((1 - u * u), 2) / scale : 0;
      };
    }

    function gaussianKernel(scale) {
      return function(u) {
        return Math.abs(u /= scale) <= 1 ? (1 / Math.sqrt(2 * Math.PI)) * Math.pow(Math.E, (-1/2) * (u * u)) / scale : 0;
        //return (1 / Math.sqrt(2 * Math.PI)) * Math.pow(Math.E, (-1/2) * (u * u));
      };
    }
}





