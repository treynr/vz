/**
 * file:    pie.js
 * desc:    d3js 4.0 implementation of pie and donut charts.
 * vers:    0.2.0
 * auth:    TR
 */

/**
 * Validates the visualization options with sensible defaults when required.
 * The option struct has the following fields:
 *      height: int, the height of the SVG in pixels
 *      width: int, the width of the SVG in pixels
 *      radius: int, the radius of the pie chart in pixels
 *      inRadius: int, the inner radius of the donut in pixels.
 *          If 0, a pie chart is generated, otherwise a it's a donut.
 *      title: string, the chart's title
 *      padding: float, padding between pie sections
 *      colors: an array of color strings, ensure this is the same size as the
 *          number of data points.
 *      margin: an object of margin values
 *      opacity: float, the opacity of the fill colors
 *      stroke: string, color used to outline the visualization
 *      strokeWidth: string, size in pixels of the stroke outline
 */
var validateOptions = function(opts) {

    opts.height = opts.height || 500;
    opts.width = opts.width || 800;
    opts.radius = opts.radius || 200;
    opts.inRadius = opts.inRadius || 0;
    opts.title = opts.title || '';
    opts.padding = opts.padding || 0.05;

    opts.margin = (opts.margin === undefined) ? {} : opts.margin;
    opts.margin.top = opts.margin.top || 10;
    opts.margin.bottom = opts.margin.bottom || 30;
    opts.margin.right = opts.margin.right || 30;
    opts.margin.left = opts.margin.left || 30;

    // These are all the visualization styling options and heavily dependent on
    // the visualization type
    opts.colors = (opts.colors === undefined) ? d3.schemeSet3 : opts.colors;
    opts.opacity = opts.opacity || 1.0;
    opts.stroke = opts.stroke || '#000';
    opts.strokeWidth = opts.strokeWidth || '1px';

    return opts;
};

/**
 *      height: int, the height of the SVG in pixels
 *      width: int, the width of the SVG in pixels
 *      keyHeight: int, the height of the color box in pixels
 *      keyWidth: int, the width of the color box in pixels
 *      keyPadding: int, padding between color boxes
 *      title: string, legend title
 *      colors: an array of color strings, ensure this is the same size as the
 *          number of data points.
 *      margin: an object of margin values
 *      opacity: float, the opacity of the fill colors
 *      stroke: string, color used to outline the visualization
 *      strokeWidth: string, size in pixels of the stroke outline
 *      font: string, font to use for the legend text
 *      fontSize: string, font size in pixels
 *      fontWeight: string, font weight
 *      textX: int, x coordinate position of each key/color box text
 *      textY: int, y coordinate position of each key/color box text
 */
var validateLegendOptions = function(opts) {

    opts.height = opts.height || 500;
    opts.width = opts.width || 800;
    opts.keyHeight = opts.keyHeight || 20;
    opts.keyWidth = opts.keyWidth || 20;
    opts.keyPadding = opts.keyPadding || 30;
    opts.title = opts.title || '';
    opts.margin = (opts.margin === undefined) ? {} : opts.margin;

    opts.margin.top = opts.margin.top || 10;
    opts.margin.bottom = opts.margin.bottom || 30;
    opts.margin.right = opts.margin.right || 30;
    opts.margin.left = opts.margin.left || 30;

    // These are all the visualization styling options and heavily dependent on
    // the visualization type
    opts.colors = (opts.colors === undefined) ? d3.schemeSet3 : opts.colors;
    opts.opacity = opts.opacity || 1.0;
    opts.stroke = (opts.stroke === undefined) ? '#000' : opts.stroke;
    opts.strokeWidth = (opts.strokeWidth === undefined) ? '1px' : 
                       opts.strokeWidth;
    opts.font = opts.font || 'sans-serif';
    opts.fontSize = opts.fontSize || '15px';
    opts.fontWeight = opts.fontWeight || 'normal';
    opts.textX = opts.textX || (opts.keyWidth + 2);
    opts.textY = opts.textY || (opts.keyHeight / 2 - 2);

    return opts;
};

/**
 * Draws a donut chart using d3js. 
 *
 * arguments
 *      data: a list of objects where each object contains the following fields
 *          name: a string identifier for a particular data point
 *          value: the numeric value of this data point
 *          color: a string representing a custom color for this data point
 *      opts: the options structure
 *
 */
var pieChart = function(data, opts) {

    opts = validateOptions(opts);

    var width = opts.width - opts.margin.left - opts.margin.right;
    var height = opts.height - opts.margin.top - opts.margin.bottom;

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
        .attr('stroke', opts.stroke)
        .attr('stroke-width', opts.strokeWidth)
        .attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')');

    arcs.append('path')
        .style('fill-opacity', opts.opacity)
        .attr('fill', function(d, i) {
            if (d.color === undefined)
                return opts.colors[i];

            return d.color;
        })
        .attr('d', arc);
};

var legend = function(data, opts) {

    opts = validateLegendOptions(opts);

    var legend = d3.select('body').append('svg')
        .attr('width', opts.width)
        .attr('height', opts.height)
        .selectAll('g')
        .data(data)
        .enter().append('g')
        .attr("transform", function(d, i) { 
            return "translate(40," + (i + 1) * opts.keyPadding + ")"; 
        });

    legend.append('rect')
        .attr('width', opts.keyWidth)
        .attr('height', opts.keyHeight)
		.attr('stroke', opts.stroke)
		.attr('stroke-width', opts.strokeWidth)
        .attr('shape-rendering', 'crispEdges')
        .style('fill-opacity', opts.opacity)
        .style('fill', function(d, i) {
            if (d.color === undefined)
                return opts.colors[i];

            return d.color;
        });

    legend.append("text")
        .attr("x", opts.textX)
        .attr("y", opts.textY)
        .attr("dy", ".35em")
        .attr('font-family', opts.font)
        .attr('font-size', opts.fontSize)
        .attr('font-weight', opts.fontWeight)
        .text(function(d) { 
			return d.name;
        });
};

