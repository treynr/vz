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
 *      color:      [req//opt] key color, required if gradient is not used
 *      gradient:   [req//opt] key gradient color, required if color is not used
 *      symbol:     [optional] symbol used to represent the key
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
        tx = 15,
        ty = 5,
        keySize = 150,
        // Vertical padding in-between key objects
        keyPad = 30,
        stroke = '#000000',
        strokeWidth = 1,
        useRect = false,
        useLine = false,
        rectWidth = 30,
        rectHeight = 30,
        fillOpacity = 1.0,
        // Use a d3 symbol for colored keys
        symbol = null,
        textures = null
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

    var makeSplitColor = function(svg, gid, c0, c1) {

        gid = (gid === undefined) ? 'gradient' : gid;
        c0 = (c0 === undefined) ? '#FFFFFF' : c0;
        c1 = (c1 === undefined) ? '#DD0000' : c1;

        var gradient = svg.append('linearGradient')
            .attr('id', gid)
            .attr('x1', '0%')
            //.attr('y1', '0%')
            .attr('y1', '100%')
            .attr('x2', '100%')
            //.attr('y2', '100%')
            .attr('y2', '0%')
            .attr('spreadMethod', 'pad');

        gradient.append('stop')
            .attr('offset', '50%')
            .attr('stop-color', c0)
            .attr('stop-opacity', 1);

        gradient.append('stop')
            .attr('offset', '50%')
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

        if (textures)
            for (var i = 0; i < textures.length; i++)
                legend.call(textures[i]);

        if (useRect) {

            var legendKey = legend.append('rect')
                .attr('width', rectWidth)
                .attr('height', rectHeight);

        } else if (useLine) {

            var legendKey = legend.append('path')
                .attr('d', 'M0,0 L35,0');

        } else { 

            var legendKey = legend.append('path')
                .attr('d', d3.symbol()
                    .type(function(d) { 
                        if (d.symbol)
                            return d.symbol;
                        if (symbol)
                            return symbol;

                        return d3.symbolSquare;
                    })
                    .size(function(d) {
                        if (d.size === undefined)
                            return keySize;

                        return d.size;
                    })
                );
        }

        legendKey
            .attr('stroke', function(d) {
                if (useLine)
                    return d.color;

                return stroke;
            })
            .attr('stroke-width', strokeWidth)
            .attr('shape-rendering', 'auto')
            .style('fill-opacity', fillOpacity)
            .style('fill', function(d, i) {

                if (textures && d.texture)
                    return d.texture.url();

                if (d.gradient) {

                    makeGradient(
                        legend, 
                        d.text + '-grad', 'radialGradient', 
                        d.gradient[0], 
                        d.gradient[1]
                    );

                    return 'url(#' + (d.text + '-grad') + ')';
                }

                if (d.colors && d.colors.length >= 2) {

                    makeSplitColor(
                        legend, 
                        d.text + '-grad',
                        d.colors[0], 
                        d.colors[1]
                    );

                    return 'url(#' + (d.text + '-grad') + ')';
                }

                if (d.color === undefined)
                    return '#000000';

                return d.color;
            });

        legend.append("text")
            .attr('dx', function(d) { 
                if (useRect && d.tx)
                    return rectWidth + 5 + d.tx;

                if (useRect)
                    return rectWidth + 5;

                return d.tx ? d.tx : tx; 
            })
            .attr('dy', function(d) { 
                if (useRect && d.ty)
                    return (rectHeight / 2) + d.ty;

                if (useRect)
                    return rectHeight / 2;

                return d.ty ? d.ty : ty; 
            })
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
        strokeWidth = +_;
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

    exports.useRect = function(_) {
        if (!arguments.length) return useRect;
        useRect = _;
        return exports;
    };

    exports.useLine = function(_) {
        if (!arguments.length) return useLine;
        useLine = _;
        return exports;
    };

    exports.rectWidth = function(_) {
        if (!arguments.length) return rectWidth;
        rectWidth = _;
        return exports;
    };

    exports.rectHeight = function(_) {
        if (!arguments.length) return rectHeight;
        rectHeight = _;
        return exports;
    };

    exports.keyPad = function(_) {
        if (!arguments.length) return keyPad;
        keyPad = +_;
        return exports;
    };

    exports.symbol = function(_) {
        if (!arguments.length) return symbol;
        symbol = _;
        return exports;
    };

    exports.fillOpacity = function(_) {
        if (!arguments.length) return fillOpacity;
        fillOpacity = _;
        return exports;
    };

    exports.textures = function(_) {
        if (!arguments.length) return textures;
        textures = _;
        return exports;
    };

    return exports;
}
