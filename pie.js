/**
 * file:    pie.js
 * desc:    d3js 4.0 implementation of pie and ring charts.
 * vers:    0.2.0
 * auth:    TR
 */

/**
 * Validates the visualization options with sensible defaults when required.
 * The option struct has the following fields:
 *      height: an int representing the height of the SVG in pixels
 *      width: an int representing the width of the SVG in pixels
 *      radius: an int representing the radius of the pie chart in pixels
 *      inRadius: an int representing the inner radius of the donut in pixels
 *      title: a string for the chart's title
 */

var validateOptions = function(opts) {

    opts.height = opts.height || 500;
    opts.width = opts.width || 800;
    opts.radius = opts.radius || 200;
    //opts.inRadius = opts.inRadius || 100;
    opts.inRadius = opts.inRadius || 0;
    opts.title = opts.title || '';
    opts.padding = opts.padding || 0.05;
    opts.margin = (opts.margin == undefined) ? {} : opts.margin;

    opts.margin.top = opts.margin.top || 10;
    opts.margin.bottom = opts.margin.bottom || 30;
    opts.margin.right = opts.margin.right || 30;
    opts.margin.left = opts.margin.left || 30;

    return opts;
};

/**
 * Draws a donut chart using d3js. 
 *
 * arguments
 *      data: a list of objects where each object contains a name and key field
 *      opts: the options structure
 *
 */
var donutChart = function(data, opts) {

    opts = validateOptions(opts);

    var width = opts.width - opts.margin.left - opts.margin.right;
    var height = opts.height - opts.margin.top - opts.margin.bottom;

    var colors = [
  "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
  "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
];

    var svg = d3.select('body')
        .append('svg')
        .attr('height', opts.height)
        .attr('width', opts.width);

    var arc = d3.arc()
        .outerRadius(opts.radius)
        .innerRadius(opts.inRadius)
        .padAngle(opts.padding);

    var pie = d3.pie().value(function(d) { return d.value; });

    var arcs = svg.selectAll('g.arc')
        .data(pie(data))
        .enter()
        .append('g')
        .attr('shape-rendering', 'auto')
        .attr('stroke', '#000')
        .attr('stroke-width', '1px')
        .attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')');

    arcs.append('path')
        .attr('fill', function(d, i) {
            return colors[i];
        })
        .attr('d', arc);
};

