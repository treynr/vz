
var path = require('path');

module.exports = {

    mode: 'development',
    entry: {
        bioviz: './src/index.js',
        bar: './src/entries/bar.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        library: '[name]',
        libraryExport: 'default',
    }
};
