/**
  * file: semantic-substrate-test.js
  * desc: Unit tests for the semantic substrate visualization.
  * auth: TR
  */

const substrate = require('../dist/semantic-substrate');
const tape = require('tape');
const d3 = require('d3');
const jsdom = require('jsdom');

const data = {
    nodes: [
        {x: 1, y: 1, value: 0, id: 'a'},
        {x: 2, y: 3, value: 0, id: 'b'},
        {x: 4, y: 2, value: 0, id: 'c', stroke: '#000000', strokeWidth: 2},
        {x: 4, y: 5, value: 0, id: 'd', fill: '#000000'},
        {x: 5, y: 5, value: 0, id: 'e', radius: 10}
    ],
    edges: [
        {source: 'a', target: 'b'},
        {source: 'a', target: 'c'},
        {source: 'b', target: 'c'},
        {source: 'b', target: 'd'},
        {source: 'c', target: 'd'},
        {source: 'd', target: 'e', opacity: 0.8, stroke: '#000000', strokeWidth: 4}
    ]
}

tape('makeScales() sets the default x-scale', t => {

    //let data = [{x:2}, {x:3}, {x:4}];
    let s = substrate().data(data);

    s.makeScales();
    t.equal(s.xScale().domain()[0], 1);
    t.equal(s.xScale().domain()[1], 5);
    t.end();
});

tape('makeScales() sets the default y-scale', t => {

    //let data = [{y:30}, {y:20}, {y:10}];
    let s = substrate().data(data);

    s.makeScales();
    t.equal(s.yScale().domain()[0], 1);
    t.equal(s.yScale().domain()[1], 5);
    t.end();
});

tape('makeScales() returns correct values for user defined domains', t => {

    let s = substrate().xDomain([10, 100]).yDomain([5, 50]);

    s.makeScales();
    t.equal(s.xScale().domain()[0], 10);
    t.equal(s.xScale().domain()[1], 100);
    t.equal(s.yScale().domain()[0], 5);
    t.equal(s.yScale().domain()[1], 50);
    t.end();
});

tape('makeAxes() returns correct ticks for default data sets', t => {

    //let s = substrate().data([{x:1, y:1}, {x:5, y:5}]);
    let s = substrate().data(data);

    s.makeScales();
    s.makeAxes();
    t.deepEqual(s.xAxis().scale().ticks(s.xTicks()), [1, 2, 3, 4, 5]);
    t.deepEqual(s.yAxis().scale().ticks(s.yTicks()), [1, 2, 3, 4, 5]);
    t.end();
});

tape('makeAxes() returns correct ticks for user defined domains', t => {

    let s = substrate().xDomain([1, 10]).yDomain([1, 10]);

    s.makeScales();
    s.makeAxes();
    t.deepEqual(s.xAxis().scale().ticks(s.xTicks()), [2, 4, 6, 8, 10]);
    t.deepEqual(s.yAxis().scale().ticks(s.yTicks()), [2, 4, 6, 8, 10]);
    t.end();
});

tape('renderAxes() renders default axes', t => {

    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let s = substrate().svg(svg).xDomain([1, 10]).yDomain([1, 10]);

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
    let s = substrate().svg(svg).xDomain([1, 10]).yDomain([1, 10]).xLabel('lul').yLabel('lul');

    s.makeScales();
    s.makeAxes();
    s.renderAxes();
    t.ok(d3.select('.x-axis-label').text() == 'lul');
    t.ok(d3.select('.y-axis-label').text() == 'lul');
    t.end();
});

tape('renderNodes() renders default nodes', t => {

    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let s = substrate().svg(svg).data(data);

    s.makeScales();
    s.renderNodes();
    t.notOk(d3.select('.nodes').empty());
    t.notOk(d3.select('.node').empty());
    t.ok(d3.selectAll('.node').size() == 5);
    t.end();
});

tape('renderNodes() renders nodes with default formatting', t => {

    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let s = substrate().svg(svg).data(data);

    s.makeScales();
    s.renderNodes();
    t.plan(8);
    d3.selectAll('.node > circle').each(function(d) {

        if (d.id == 'a' || d.id == 'b') {

            t.ok(d3.select(this).attr('fill') === s.nodeFill());
            t.ok(d3.select(this).attr('r') == s.nodeRadius());
            t.ok(d3.select(this).attr('stroke') === s.nodeStroke());
            t.ok(d3.select(this).attr('stroke-width') == s.nodeStrokeWidth());
        }
    });
    t.end();
});

tape('renderNodes() renders nodes with custom formatting', t => {

    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let s = substrate().svg(svg).data(data);
        //{x: 1, y: 1, value: 0, id: 'a'},
        //{x: 2, y: 3, value: 0, id: 'b'},
        //{x: 4, y: 2, value: 0, id: 'c', stroke: '#00000', strokeWidth: 2},
        //{x: 4, y: 5, value: 0, id: 'd', fill: '#000000'},
        //{x: 5, y: 5, value: 0, id: 'e', radius: 10}

    s.makeScales();
    s.renderNodes();
    t.plan(4);
    d3.selectAll('.node > circle').each(function(d) {

        if (d.id === 'c') {

            t.ok(d3.select(this).attr('stroke') === '#000000');
            t.ok(d3.select(this).attr('stroke-width') == 2);
        }

        if (d.id === 'd')
            t.ok(d3.select(this).attr('fill') === '#000000');

        if (d.id === 'e')
            t.ok(d3.select(this).attr('r') == 10);
    });
    t.end();
});

tape('renderEdges() renders default edges', t => {

    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let s = substrate().svg(svg).data(data);

    s.makeScales();
    s.renderNodes();
    s.renderEdges();
    t.notOk(d3.select('.edges').empty());
    t.notOk(d3.select('.edge').empty());
    t.ok(d3.selectAll('.edge').size() == 6);
    t.end();
});

tape('renderEdges() renders edges with default formatting', t => {

    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let s = substrate().svg(svg).data(data);

    s.makeScales();
    s.renderNodes();
    s.renderEdges();
    t.plan(15);
    d3.selectAll('.edge > line').each(function(d) {

        if (d.opacity === undefined) {

            t.ok(d3.select(this).attr('opacity') == s.edgeOpacity())
            t.ok(d3.select(this).attr('stroke') === s.edgeStroke());
            t.ok(d3.select(this).attr('stroke-width') == s.edgeStrokeWidth());
        }
    });
    t.end();
});

tape('renderNodes() renders nodes with custom formatting', t => {

    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let s = substrate().svg(svg).data(data);

    s.makeScales();
    s.renderNodes();
    s.renderEdges();
    t.plan(3);
    d3.selectAll('.edge > line').each(function(d) {

        if (d.opacity !== undefined) {

            t.ok(d3.select(this).attr('opacity') == 0.8)
            t.ok(d3.select(this).attr('stroke') === '#000000')
            t.ok(d3.select(this).attr('stroke-width') == 4)
        }
    });
    t.end();
});
