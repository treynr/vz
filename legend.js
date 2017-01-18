/**
 * file: legend.js
 * desc: d3js 4.0 drawing of simple legends/keys.
 * vers: 0.1.0
 * auth: TR
 */

/*
 * The data object is a list of objects containing key types and information.
 * Each key object has the following structure:
 *  key {
 *      text:       [required] text to display for the key
 *      symbol:     [required] symbol used to represent the key
 *      color:      [req//opt] key color, required if gradient is not used
 *      gradient:   [req//opt] key gradient color, required if color is not used
 *      size:       [optional] size of the drawn key
 *      tx:         [optional] x-axis offset for text placement
 *      ty:         [optional] y-axis offset for text placement
 * }
 *
 */
var legend = function() {

    var exports = {},
        legend = null,
        data = null,
        //
        width = 300,
        height = 300,
        font = 'sans-serif',
        fontSize = '12px',
        fontWeight = 'normal',
        tx = null,
        ty = null,
        keySize = 80,
        // Vertical padding in-between key objects
        keyPad = 30,
        stroke = '#000000',
        strokeWidth = '1px'
        ;

    var makeGradient = function(svg, gid, type, c0, c1) {

        gid = (gid === undefined) ? 'gradient' : gid;
        type = (type === undefined) ? 'linearGradient' : type;
        c0 = (c0 === undefined) ? '#FFFFFF' : c0;
        c1 = (c1 === undefined) ? '#DD0000' : c1;

        var gradient = svg.append(type)
            .attr('id', gid)
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '100%')
            .attr('spreadMethod', 'pad');

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', c0)
            .attr('stop-opacity', 1);

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', c1)
            .attr('stop-opacity', 1);
    }

    exports.draw = function() {

        var legend = d3.select('body')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .selectAll('g')
            .data(data)
            .enter()
            .append('g')
            .attr('transform', function(d, i) { 
                return 'translate(40,' + (i + 1) * keyPad + ')'; 
            });

        legend.append('path')
            .attr('d', d3.symbol()
                .type(function(d) { return d.symbol; })
                .size(function(d) {
                    if (d.size === undefined)
                        return keySize;

                    return d.size;
                }))
            .attr('stroke', stroke)
            .attr('stroke-width', strokeWidth)
            .attr('shape-rendering', 'auto')
            //.style('fill-opacity', opts.opacity)
            .style('fill', function(d, i) {

                if (d.gradient) {

                    makeGradient(
                        legend, 
                        d.text + '-grad', 'radialGradient', 
                        d.gradient[0], 
                        d.gradient[1]
                    );

                    return 'url(#' + (d.text + '-grad') + ')';
                }

                if (d.color === undefined)
                    return '#000000';

                return d.color;
            });

        legend.append("text")
            .attr('dx', function(d) { return d.tx ? d.tx : tx; })
            .attr('dy', function(d) { return d.ty ? d.ty : ty; })
            .attr('font-family', font)
            .attr('font-size', fontSize)
            .attr('font-weight', fontWeight)
            .text(function(d) { return d.text; });
    };

    exports.data = function(_) {
        if (!arguments.length) return data;
        data = _;
        return exports;
    };

    exports.width = function(_) {
        if (!arguments.length) return width;
        width = +_;
        return exports;
    };

    exports.height = function(_) {
        if (!arguments.length) return height;
        height = +_;
        return exports;
    };

    exports.font = function(_) {
        if (!arguments.length) return font;
        font = _;
        return exports;
    };

    exports.fontSize = function(_) {
        if (!arguments.length) return fontSize;
        fontSize = _;
        return exports;
    };

    exports.fontWeight = function(_) {
        if (!arguments.length) return fontWeight;
        fontWeight = _;
        return exports;
    };

    exports.keySize = function(_) {
        if (!arguments.length) return keySize;
        keySize = _;
        return exports;
    };

    exports.stroke = function(_) {
        if (!arguments.length) return stroke;
        stroke = _;
        return exports;
    };

    exports.strokeWidth = function(_) {
        if (!arguments.length) return strokeWidth;
        strokeWidth = _;
        return exports;
    };

    exports.tx = function(_) {
        if (!arguments.length) return tx;
        tx = +_;
        return exports;
    };

    exports.ty = function(_) {
        if (!arguments.length) return ty;
        ty = +_;
        return exports;
    };

    //exports.font = function(_) {
    //    if (!arguments.length) return font;
    //    font = _;
    //    return exports;
    //};

    return exports;
}
