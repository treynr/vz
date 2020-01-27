/**
  * file: boxplot-test.js
  * desc: Unit tests for the boxplot visualization.
  * auth: TR
  */

const violin = require('../dist/development/violin');
const tape = require('tape');
const d3 = require('d3');
const jsdom = require('jsdom');

const randomRange = function(low, high) { return Math.random() * (high - low) + low; };
const randomUniform = function(n, delta=2.0) { return randomRange(n - delta, n + delta); };
const metropolis = function(p, n, prop=randomUniform) {

    let x = 1;
    let distribution = [];

    for (let i = 0; i < n; i++) {

        const trial = prop(x);
        const accept = p(trial) / p(x);

        if (Math.random() < accept)
            x = trial;

        distribution.push(x);
    }

    return distribution;
};
const sinDistribution = (x) => { return Math.pow(Math.sin(x) / x, 2); };

let data = [
    {
        label: 'One',
        values: metropolis(x => sinDistribution(x), 1000)
    },
    {
        label: 'Two',
        values: metropolis(x => sinDistribution(x), 1000)
    },
];

tape('makeScales() sets the proper x-scale', t => {

    let b = violin().data(data);

    b.makeScales();
    t.equal(b.xScale().domain()[0], 'One');
    t.equal(b.xScale().domain()[1], 'Two');
    t.end();
});

tape('makeScales() sets the default y-scale', t => {

    let scale0 = d3.scaleLinear()
        .domain(d3.extent(data[0].values))
        .range([-6, 6]);
    let scale1 = d3.scaleLinear()
        .domain(d3.extent(data[1].values))
        .range([-6, 6]);

    data[0].values = data[0].values.map(d => scale0(d));
    data[1].values = data[1].values.map(d => scale1(d));

    let b = violin().data(data);

    b.makeScales();
    t.equal(b.yScale().domain()[0], -6);
    t.equal(b.yScale().domain()[1], 6);
    t.end();
});

tape('makeScales() returns correct values for user defined domains', t => {

    let b = violin().data(data).yDomain([-10, 10]);

    b.makeScales();
    t.equal(b.yScale().domain()[0], -10);
    t.equal(b.yScale().domain()[1], 10);
    t.end();
});

tape('makeAxes() returns correct ticks for default data sets', t => {

    let scale0 = d3.scaleLinear()
        .domain(d3.extent(data[0].values))
        .range([-10, 10]);
    let scale1 = d3.scaleLinear()
        .domain(d3.extent(data[1].values))
        .range([-10, 10]);

    data[0].values = data[0].values.map(d => scale0(d));
    data[1].values = data[1].values.map(d => scale1(d));

    let b = violin().data(data);

    b.makeScales();
    b.makeAxes();
    t.deepEqual(b.yAxis().scale().ticks(b.yTicks()), [-10,-8,-6,-4,-2,0,2,4,6,8,10]);
    t.end();
});

tape('makeAxes() returns correct ticks for user-defined tick counts', t => {

    let scale0 = d3.scaleLinear()
        .domain(d3.extent(data[0].values))
        .range([-10, 10]);
    let scale1 = d3.scaleLinear()
        .domain(d3.extent(data[1].values))
        .range([-10, 10]);

    data[0].values = data[0].values.map(d => scale0(d));
    data[1].values = data[1].values.map(d => scale1(d));

    let b = violin().data(data).yTicks(5);

    b.makeScales();
    b.makeAxes();
    t.deepEqual(b.yAxis().scale().ticks(b.yTicks()), [-10,-5,0,5,10]);
    t.end();
});

tape('makeAxes() returns correct ticks for user defined domains', t => {

    let b = violin().data(data).yDomain([-6, 6]);

    b.makeScales();
    b.makeAxes();
    t.deepEqual(b.yAxis().scale().ticks(b.yTicks()), [-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6]);
    t.end();
});

tape('renderAxes() renders default axes', t => {

    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let b = violin().data(data).svg(svg).yDomain([-5, 5]);

    b.makeScales();
    b.makeAxes();
    b.renderAxes();
    t.notOk(d3.select('.x-axis').empty());
    t.notOk(d3.select('.y-axis').empty());
    t.ok(d3.select('.x-axis-label').text() == '');
    t.ok(d3.select('.y-axis-label').text() == '');
    t.end();
});

tape('renderAxes() renders custom labels', t => {

    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let b = violin().data(data).svg(svg).yDomain([-5, 5]).xLabel('lulx').yLabel('luly');

    b.makeScales();
    b.makeAxes();
    b.renderAxes();
    t.ok(d3.select('.x-axis-label').text() == 'lulx');
    t.ok(d3.select('.y-axis-label').text() == 'luly');
    t.end();
});

tape('renderDistributions() renders some distributions', t => {

    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let b = violin().data(data).svg(svg);

    b.makeScales();
    b.makeAxes();
    b.makeViolinContainers();
    b.renderDistributions();
    t.ok(d3.selectAll('.violin').size() == 2);
    t.end();
});

tape('renderDistributions() renders distributions with default formatting', t => {

    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let b = violin().data(data).svg(svg);

    b.makeScales();
    b.makeAxes();
    b.makeViolinContainers();
    b.renderDistributions();
    let violins = svg.selectAll('.violin');

    t.ok(violins.filter((_, i) => i == 0).selectAll('g > .right-area').attr('fill') === d3.schemeCategory10[0]);
    t.ok(violins.filter((_, i) => i == 0).selectAll('g > .left-area').attr('fill') === d3.schemeCategory10[0]);
    t.ok(violins.filter((_, i) => i == 1).selectAll('g > .right-area').attr('fill') === d3.schemeCategory10[1]);
    t.ok(violins.filter((_, i) => i == 1).selectAll('g > .left-area').attr('fill') === d3.schemeCategory10[1]);
    t.end();
});

/*
tape('renderNodes() renders nodes with custom formatting', t => {

    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let b = boxplot().svg(svg).data(data).boxFill('#CCC').boxStroke('#000').boxStrokeWidth(3);

    b.makeScales();
    b.renderBoxSVG();
    b.renderBoxes();
    t.plan(9);
    d3.selectAll('.box').each(function(d) {

        t.ok(d3.select(this).attr('fill') === '#CCC');
        t.ok(d3.select(this).attr('stroke') === '#000');
        t.ok(d3.select(this).attr('stroke-width') == 3);
    });
    t.end();
});

tape('renderWhiskers() renders whiskers', t => {

    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let b = boxplot().svg(svg).data(data);

    b.makeScales();
    b.renderBoxSVG();
    b.renderBoxes();
    b.renderWhiskers();

    t.ok(d3.selectAll('.q1-whisker').size() == 3);
    t.ok(d3.selectAll('.q3-whisker').size() == 3);
    t.ok(d3.selectAll('.q1-whisker-line').size() == 3);
    t.ok(d3.selectAll('.q3-whisker-line').size() == 3);
    t.end();
});

/* Outlier rendering is broken in tape idk why
tape('renderOutliers() renders outliers', t => {

    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let b = boxplot().svg(svg).data(data);

    b.makeScales();
    b.renderBoxSVG();
    b.renderBoxes();
    b.renderOutliers();

    t.ok(d3.selectAll('.outlier').size() == 2);
    t.end();
});
*/

