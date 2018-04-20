
var download = function() {

    var exports = {},
        svg = null,
        svgId = '',
        fileName = 'plot.svg',
        text = '';

    exports.create = function() {

        const serializer = new window.XMLSerializer;
        const string = serializer.serializeToString(svg.node().parentNode);
        let bb = new Blob([string], {type: 'image/svg+xml'});
        let url = URL.createObjectURL(bb);

        let dlb = d3.select('body')
            .append('input')
            .style('display', 'block')
            .attr('type', 'submit')
            .attr('value', 'Download')
            .on('click', function() {
                
                var link = d3.select('body')
                    .append('a')
                    .style('visibility', 'hidden')
                    .attr('href', url)
                    .attr('download', fileName);

                link.node().click();
                link.remove()
            });
    };

    exports.svg = function(_) {
        if (!arguments.length) return svg;
        svg = _;
        return exports;
    };

    exports.text = function(_) {
        if (!arguments.length) return text;
        text = _;
        return exports;
    };

    exports.svgId = function(_) {
        if (!arguments.length) return svgId;
        svgId = _;
        return exports;
    };

    exports.fileName = function(_) {
        if (!arguments.length) return fileName;
        fileName = _;
        return exports;
    };

    return exports;
};

