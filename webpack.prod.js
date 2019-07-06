
const config = require('./webpack.config.js');
const merge = require('webpack-merge');
const path = require('path');

const prodConfig = { 

    mode: 'production',
    output: {
        path: path.resolve(__dirname, 'dist/release'),
        filename: '[name].min.js'
    }
};

module.exports = config.map(c => merge(prodConfig, c));
