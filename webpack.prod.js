
const merge = require('webpack-merge');
const config = require('./webpack.config.js');

const prodConfig = { 

    mode: 'production',
    output: {
        filename: '[name].min.js'
    }
};

module.exports = config.map(c => merge(prodConfig, c));
