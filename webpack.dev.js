
const merge = require('webpack-merge');
const config = require('./webpack.config.js');

const devConfig = {
    mode: 'development',
    devtool: 'inline-source-map'
};

module.exports = config.map(c => merge(devConfig, c));
