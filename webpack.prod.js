
const merge = require('webpack-merge');
const config = require('./webpack.config.js');

const prodConfig = { mode: 'production' };

module.exports = config.map(c => merge(prodConfig, c));
