
var path = require('path');

module.exports = {

    entry: {
        bioviz: './src/index.js',
        bar: './src/entries/bar.js',
        histogram: './src/entries/histogram.js',
        line: './src/entries/line.js',
        'semantic-substrate': './src/entries/semantic-substrate.js',
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        // bug fix for umd target
        globalObject: 'this',
        library: '[name]',
        libraryExport: 'default',
        libraryTarget: 'umd'
    }
};
