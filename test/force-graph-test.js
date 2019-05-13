/**
  * file: semantic-substrate-test.js
  * desc: Unit tests for the semantic substrate visualization.
  * auth: TR
  */

const forceGraph = require('../dist/force-graph');
const tape = require('tape');
const d3 = require('d3');
const jsdom = require('jsdom');

const data = {
    nodes: [
        {id: 'a'},
        {id: 'b'},
        {id: 'c', stroke: '#000000', strokeWidth: 2},
        {id: 'd', fill: '#000000'},
        {id: 'e', radius: 10}
    ],
    edges: [
        {source: 'a', target: 'b'},
        {source: 'a', target: 'c'},
        {source: 'b', target: 'c'},
        {source: 'b', target: 'd'},
        {source: 'c', target: 'd'},
        {source: 'd', target: 'e', opacity: 0.8, stroke: '#000000', strokeWidth: 4}
    ]
};

tape('renderNodes() renders default nodes', t => {

    global.document = (new jsdom.JSDOM('...')).window.document;
    let svg = d3.select('body').append('svg');
    let s = forceGraph().svg(svg).data(data);

    s.renderNodes();
    t.notOk(d3.select('.nodes').empty());
    t.notOk(d3.select('.node').empty());
    t.ok(d3.selectAll('.node').size() == 5);
    t.end();
});

tape('renderNodes() renders nodes with default formatting', t => {

    global.document = (new jsdom.JSDOM('...')).window.document;
    let svg = d3.select('body').append('svg');
    let s = forceGraph().svg(svg).data(data);

    s.renderNodes();
    t.plan(8);
    d3.selectAll('.node').each(function(d) {

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

    global.document = (new jsdom.JSDOM('...')).window.document;
    let svg = d3.select('body').append('svg');
    let s = forceGraph().svg(svg).data(data);

    s.renderNodes();
    t.plan(4);
    d3.selectAll('.node').each(function(d) {

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

    global.document = (new jsdom.JSDOM('...')).window.document;
    let svg = d3.select('body').append('svg');
    let s = forceGraph().svg(svg).data(data);

    s.renderNodes();
    s.renderEdges();
    t.notOk(d3.select('.edges').empty());
    t.notOk(d3.select('.edge').empty());
    t.ok(d3.selectAll('.edge').size() == 6);
    t.end();
});

tape('renderEdges() renders edges with default formatting', t => {

    global.document = (new jsdom.JSDOM('...')).window.document;
    let svg = d3.select('body').append('svg');
    let s = forceGraph().svg(svg).data(data);

    s.renderNodes();
    s.renderEdges();
    t.plan(15);
    d3.selectAll('.edge').each(function(d) {

        if (d.opacity === undefined) {

            t.ok(d3.select(this).attr('opacity') === s.edgeOpacity());
            t.ok(d3.select(this).attr('stroke') === s.edgeStroke());
            t.ok(d3.select(this).attr('stroke-width') == s.edgeStrokeWidth());
        }
    });
    t.end();
});

tape('renderNodes() renders nodes with custom formatting', t => {

    global.document = (new jsdom.JSDOM('...')).window.document;
    let svg = d3.select('body').append('svg');
    let s = forceGraph().svg(svg).data(data);

    s.renderNodes();
    s.renderEdges();
    t.plan(3);
    d3.selectAll('.edge').each(function(d) {

        if (d.opacity !== undefined) {

            t.ok(d3.select(this).attr('opacity') === 0.8);
            t.ok(d3.select(this).attr('stroke') === '#000000');
            t.ok(d3.select(this).attr('stroke-width') == 4);
        }
    });
    t.end();
});

tape('createSimulation() creates default force simulations', t => {

    global.document = (new jsdom.JSDOM('...')).window.document;
    let svg = d3.select('body').append('svg');
    let s = forceGraph().svg(svg).data(data);

    s.renderNodes();
    s.renderEdges();
    s.createSimulation();

    t.ok(s.simulation() !== null);
    t.ok(s.simulation().force('collide') == null);
    t.ok(s.simulation().force('center') !== null);
    t.ok(s.simulation().force('charge') !== null);
    t.ok(s.simulation().force('charge').strength()() == -30);
    t.ok(s.simulation().force('link') !== null);
    t.ok(s.simulation().force('link').distance()() == 30);
    t.end();
});
