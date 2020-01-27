
const config = require('./webpack.config.js');
const merge = require('webpack-merge');
const path = require('path');

const devConfig = {

    devtool: 'inline-source-map',
    mode: 'development',
    output: {
        //path: path.resolve(__dirname, 'dist/development'),
        path: path.resolve(__dirname, path.join('dist', 'development')),
        filename: '[name].js'
    }
};

module.exports = config.map(c => merge(devConfig, c));

