/**
  * file: semantic-substrate-test.js
  * desc: Unit tests for the semantic substrate visualization.
  * auth: TR
  */

const scatter = require('../dist/scatter');
const tape = require('tape');
const d3 = require('d3');
const jsdom = require('jsdom');

let seed = 0;

const randRange = (min, max) => {
    seed = (seed * 9301 + 49297) % 233280;
    return min + (seed / 233280) * (max - min);
};

//const values = Array.from(Array(150)).map(randRange(5, 20));

const data = {
    label: 'Plot 1',
    values: Array(150).fill().map(() => ({x: randRange(5, 20), y: randRange(5, 20)}))
};

tape('makeScales() sets the default x-scale', t => {

    let s = scatter().data(data);

    s.makeScales();
    t.equal(s.xScale().domain()[0], 4);
    t.equal(s.xScale().domain()[1], 20);
    t.end();
});

tape('makeScales() sets the default y-scale', t => {

    let s = scatter().data(data);

    s.makeScales();
    t.equal(s.yScale().domain()[0], 4);
    t.equal(s.yScale().domain()[1], 20);
    t.end();
});

tape('makeScales() sets the default x-scale w/out nice()', t => {

    let s = scatter().data(data).xNice(false);

    s.makeScales();
    t.equal(Math.floor(s.xScale().domain()[0]), 5);
    t.equal(Math.ceil(s.xScale().domain()[1]), 20);
    t.end();
});

tape('makeScales() sets the default y-scale w/out nice()', t => {

    let s = scatter().data(data).yNice(false);

    s.makeScales();
    t.equal(Math.floor(s.yScale().domain()[0]), 5);
    t.equal(Math.ceil(s.yScale().domain()[1]), 20);
    t.end();
});

tape('makeAxes() returns correct ticks for default data sets', t => {

    let s = scatter().data(data);

    s.makeScales();
    s.makeAxes();
    t.deepEqual(s.xAxis().scale().ticks(s.xTicks()), [4,6,8,10,12,14,16,18,20]);
    t.deepEqual(s.yAxis().scale().ticks(s.yTicks()), [4,6,8,10,12,14,16,18,20]);
    t.end();
});

tape('renderAxes() renders default axes', t => {

    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let s = scatter().svg(svg).xDomain([1, 10]).yDomain([1, 10]);

    s.makeScales();
    s.makeAxes();
    s.renderAxes();
    t.notOk(d3.select('.x-axis').empty());
    t.notOk(d3.select('.y-axis').empty());
    t.ok(d3.select('.x-axis-label').text() == '');
    t.ok(d3.select('.y-axis-label').text() == '');
    t.end();
});

tape('renderAxes() renders custom labels', t => {

    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let s = scatter().svg(svg).xDomain([1, 10]).yDomain([1, 10])
        .xLabel('lul').yLabel('lul');

    s.makeScales();
    s.makeAxes();
    s.renderAxes();
    t.ok(d3.select('.x-axis-label').text() == 'lul');
    t.ok(d3.select('.y-axis-label').text() == 'lul');
    t.end();
});

tape('renderPoints() renders default data points', t => {

    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let s = scatter().svg(svg).data(data);

    s.makeScales();
    s.renderPoints();
    t.notOk(d3.select('.points').empty());
    t.notOk(d3.select('.point').empty());
    t.ok(d3.selectAll('.point').size() == 150);
    t.end();
});

tape('renderPoints() renders points with default formatting', t => {

    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let s = scatter().svg(svg).data(data);

    s.makeScales();
    s.renderPoints();
    let pt = d3.select('.point > circle');

    t.ok(pt.attr('fill') === s.pointFill());
    t.ok(pt.attr('r') == s.pointRadius());
    t.ok(pt.attr('stroke') === s.pointStroke());
    t.ok(pt.attr('stroke-width') == s.pointStrokeWidth());
    t.end();
});

tape('renderPoints() renders points with custom formatting', t => {

    data.values[0].id = 'a';
    data.values[0].stroke = '#eee';
    data.values[0].strokeWidth = 3;
    data.values[1].id = 'b';
    data.values[1].fill = '#ff0000';
    data.values[2].id = 'c';
    data.values[2].radius = 2;

    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let s = scatter().svg(svg).data(data);
    s.makeScales();
    s.renderPoints();
    t.plan(4);
    d3.selectAll('.point > circle').each(function(d) {

        if (d.id === 'a') {

            t.ok(d3.select(this).attr('stroke') === '#eee');
            t.ok(d3.select(this).attr('stroke-width') == 3);
        }

        if (d.id === 'b')
            t.ok(d3.select(this).attr('fill') === '#ff0000');

        if (d.id === 'c')
            t.ok(d3.select(this).attr('r') == 2);
    });
    t.end();
});

