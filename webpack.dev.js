
const merge = require('webpack-merge');
const config = require('./webpack.config.js');

const devConfig = {

    devtool: 'inline-source-map',
    mode: 'development',
    output: {
        filename: '[name].js'
    }
};

module.exports = config.map(c => merge(devConfig, c));
