/**
 * file: contour-test.js
 * desc: Unit tests for the contour visualization.
 * auth: TR
 */

//import {default as base} from '../src/plots/base';
//const base = require('../src/plots/base');
const contour = require('../dist/development/contour');
const tape = require('tape');
const _ = require('lodash')
//const d3 = require('d3');
//const jsdom = require('jsdom');

let seed = 0;

const randRange = (min, max) => {
    seed = (seed * 9301 + 49297) % 233280;
    return min + (seed / 233280) * (max - min);
};

const smallData = {values: [[0.2, 0.2], [0.0, 0.9], [0.22, 0.23], [0.2, 0,25]]};

const bigData = {values: _.zip([
    [...Array(300)].keys().map(() => randRange(0.0, 1.0)),
    [...Array(300)].keys().map(() => randRange(0.0, 1.0))
])};

tape('makeScales() sets the default x-scale', t => {

    let b = contour().data(smallData);
    b.makeScales();

    t.equal(b.xScale().domain()[0], 0.0);
    t.equal(b.xScale().domain()[1], 0.22);
    t.end();
});

tape('makeScales() sets the default y-scale', t => {

    let b = contour().data(smallData);
    b.makeScales();

    t.equal(b.yScale().domain()[0], 0.2);
    t.equal(b.yScale().domain()[1], 0.9);
    t.end();
});

tape('makeAxes() returns correct ticks for default data sets', t => {

    let b = contour().data(smallData);

    b.makeScales();
    b.makeAxes();
    t.deepEqual(b.yAxis().scale().ticks(b.yTicks()), [0.0,0.2,0.4,0.6,0.8,1.0]);
    t.end();
});

/*
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

*/

