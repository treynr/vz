
let hyphenRegex = /(.+)(-)(.+)/;

let hyphenReplacer = (_, p1, p2, p3, __, s) => {

    return p1 + p3.charAt(0).toUpperCase() + p3.slice(1);
};

const plots = [
    //'bar',
    'boxplot',
    'force-graph',
    'heatmap',
    //'histogram',
    'legend',
    //'line',
    'scatter',
    //'semantic-substrate'
];

let entries = plots.map(d => {

    return {
        entry: {[d]: `./src/entries/${d}.js`},
        output: {
            globalObject: 'this',
            library: d.replace(hyphenRegex, hyphenReplacer),
            libraryExport: 'default',
            libraryTarget: 'umd'
        }
    };
});

module.exports = entries;

