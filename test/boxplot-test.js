/**
  * file: boxplot-test.js
  * desc: Unit tests for the boxplot visualization.
  * auth: TR
  */

const boxplot = require('../dist/boxplot');
const tape = require('tape');
const d3 = require('d3');
const jsdom = require('jsdom');

let randRange = (min, max) => Math.random() * (max - min) + min;

const data = [
    {label: 'One', values: [...Array(100).keys()].map(() => randRange(5, 10))},
    {label: 'Two', values: [...Array(100).keys()].map(() => randRange(10, 15))},
    {label: '3', values: [...Array(100).keys()].map(() => randRange(15, 20))},
];

// outliers
data[0].values.push(13);
data[2].values.push(8);

tape('makeScales() sets the proper x-scale', t => {

    let b = boxplot().data(data);

    b.makeScales();
    t.equal(b.xScale().domain()[0], 'One');
    t.equal(b.xScale().domain()[1], 'Two');
    t.equal(b.xScale().domain()[2], '3');
    t.end();
});

tape('makeScales() sets the default y-scale', t => {

    let b = boxplot().data(data);

    b.makeScales();
    t.equal(b.yScale().domain()[0], 4);
    t.equal(b.yScale().domain()[1], 20);
    t.end();
});

tape('makeScales() returns correct values for user defined domains', t => {

    let b = boxplot().xDomain(['a', 'b', 'c']).yDomain([5, 50]);

    b.makeScales();
    t.equal(b.xScale().domain()[0], 'a');
    t.equal(b.xScale().domain()[1], 'b');
    t.equal(b.xScale().domain()[2], 'c');
    t.equal(b.yScale().domain()[0], 5);
    t.equal(b.yScale().domain()[1], 50);
    t.end();
});

tape('makeAxes() returns correct ticks for default data sets', t => {

    let b = boxplot().data(data);

    b.makeScales();
    b.makeAxes();
    t.deepEqual(b.yAxis().scale().ticks(b.yTicks()), [4,6,8,10,12,14,16,18,20]);
    t.end();
});

tape('makeAxes() returns correct ticks for user defined domains', t => {

    let b = boxplot().xDomain([1, 2]).yDomain([1, 10]);

    b.makeScales();
    b.makeAxes();
    t.deepEqual(b.yAxis().scale().ticks(b.yTicks()), [1,2,3,4,5,6,7,8,9,10]);
    t.end();
});

tape('renderAxes() renders default axes', t => {

    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let b = boxplot().svg(svg).xDomain(['a', 'b']).yDomain([1, 10]);

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
    let b = boxplot().svg(svg).xDomain([1, 10]).yDomain([1, 10]).xLabel('lul').yLabel('lul');

    b.makeScales();
    b.makeAxes();
    b.renderAxes();
    t.ok(d3.select('.x-axis-label').text() == 'lul');
    t.ok(d3.select('.y-axis-label').text() == 'lul');
    t.end();
});

tape('renderBoxes() renders some boxes', t => {

    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let b = boxplot().svg(svg).data(data);

    b.makeScales();
    b.renderBoxSVG();
    b.renderBoxes();
    t.notOk(d3.select('.box').empty());
    t.ok(d3.selectAll('.box').size() == 3);
    t.end();
});

tape('renderBoxes() renders boxplots with default formatting', t => {

    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let b = boxplot().svg(svg).data(data);

    b.makeScales();
    b.renderBoxSVG();
    b.renderBoxes();
    t.plan(9);
    svg.selectAll('.box').each(function(d) {

        t.ok(d3.select(this).attr('fill') === b.boxFill());
        t.ok(d3.select(this).attr('stroke') === b.boxStroke());
        t.ok(d3.select(this).attr('stroke-width') == b.boxStrokeWidth());
    });
    t.end();
});

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

