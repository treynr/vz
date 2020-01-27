
const path = require('path');
const hyphenRegex = /(.+)(-)(.+)/;

let hyphenReplacer = (_, p1, p2, p3, __, s) => {

    return p1 + p3.charAt(0).toUpperCase() + p3.slice(1);
};

const plots = [
    'bar',
    'boxplot',
    'contour',
    'force-graph',
    'heatmap',
    'histogram',
    'legend',
    'line',
    'scatter',
    'semantic-substrate',
    'sidebar',
    'transit',
    'violin'
];

let entries = plots.map(d => {

    return {
        entry: {[d]: path.join(__dirname, 'src', 'entries', `${d}.js`)},
        output: {
            globalObject: 'this',
            library: d.replace(hyphenRegex, hyphenReplacer),
            libraryExport: 'default',
            libraryTarget: 'umd'
        }
    };
});

module.exports = entries;

