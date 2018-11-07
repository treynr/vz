/**
  * file: heatmap.js
  * desc: Unit tests for the heatmap visualization.
  * auth: TR
  */

const heatmap = require('../dist/heatmap');
const tape = require('tape');
const d3 = require('d3');
const jsdom = require('jsdom');
//const _ = require('lodash');

const mirroredData = {

    values: [
        {x: 1, y: 1, value: 1.0},
        {x: 2, y: 1, value: 0.7},
        {x: 3, y: 1, value: 0.4},

        {x: 1, y: 2, value: 0.7},
        {x: 2, y: 2, value: 1.0},
        {x: 3, y: 2, value: 0.1},

        {x: 1, y: 3, value: 0.4},
        {x: 2, y: 3, value: 0.1},
        {x: 3, y: 3, value: 1.0}
    ]
};

const missingMirroredData = {

    values: [
        {x: 1, y: 1, value: 1.0},
        {x: 2, y: 1, value: 0.7},
        {x: 3, y: 1, value: 0.4},

        {x: 2, y: 2, value: 1.0},
        {x: 3, y: 2, value: 0.1},

        {x: 3, y: 3, value: 1.0}
    ]
};

const data = {

    values: [
        {x: 1, y: 'a', value: 0.5},
        {x: 1, y: 'b', value: 0.7},

        {x: 2, y: 'a', value: 0.1},
        {x: 2, y: 'b', value: 0.9},

        {x: 3, y: 'a', value: 0.0},
        {x: 3, y: 'b', value: 0.3}
    ]
};

const missingData = {

    values: [
        {x: 1, y: 'a', value: 0.5},

        {x: 2, y: 'a', value: 0.1},
        {x: 2, y: 'b', value: 0.9},

        {x: 3, y: 'b', value: 0.3}
    ]
};

let toMatrix = function(a) {

    return a.reduce((ac, d) => {

		ac[d.y] = ac[d.y] || {};
		ac[d.y][d.x] = ac[d.y][d.x] || d.value;

		return ac;
	}, {});
};

tape('completeMatrix fills in missing data', t => {

    let h = heatmap().data(missingMirroredData);

    h.completeMatrix(mirror=true);

    t.deepEqual(toMatrix(h.data().values), toMatrix(mirroredData.values));
    t.end()
});

tape('completeMatrix fills in missing data', t => {

    let h = heatmap().data(missingData);

    h.completeMatrix(mirror=false);

    let matrix = toMatrix(h.data().values);

    t.equal(matrix['b'][1], 0.0);
    t.equal(matrix['a'][3], 0.0);
    t.end()
});

tape('completeMatrix does not alter a complete matrix', t => {

    let h = heatmap().data(mirroredData);

    h.completeMatrix(mirror=true);

    t.deepEqual(toMatrix(h.data().values), toMatrix(mirroredData.values));
    t.end()
});

tape('completeMatrix does not alter a complete matrix', t => {

    let h = heatmap().data(data);

    h.completeMatrix(mirror=false);

    t.deepEqual(toMatrix(h.data().values), toMatrix(data.values));
    t.end()
});

tape('makeScales() sets the default x-scale', t => {

    let h = heatmap().mirrorAxes(false).data(data);
    let hm = heatmap().data(mirroredData);

    h.stringifyCategories();
    hm.stringifyCategories();
    h.makeScales();
    hm.makeScales();

    t.deepEqual(h.xScale().domain(), ['1', '2', '3']);
    t.deepEqual(hm.xScale().domain(), ['1', '2', '3']);
    t.end();
});

tape('makeScales() sets the default y-scale', t => {

    let h = heatmap().mirrorAxes(false).data(data);
    let hm = heatmap().data(mirroredData);

    h.stringifyCategories();
    hm.stringifyCategories();
    h.makeScales();
    hm.makeScales();

    t.deepEqual(h.yScale().domain(), ['a', 'b']);
    t.deepEqual(hm.yScale().domain(), ['1', '2', '3']);
    t.end();
});

tape('renderAxes() renders default axes', t => {

    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let h = heatmap().data(mirroredData).svg(svg);

    h.makeScales();
    h.renderAxes();
    t.notOk(d3.select('.x-axis').empty());
    t.notOk(d3.select('.y-axis').empty());
    t.ok(d3.select('.x-axis-label').text() == '');
    t.ok(d3.select('.y-axis-label').text() == '');
    t.end();
});

tape('renderAxes() renders custom labels', t => {

    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let h = heatmap().data(mirroredData).svg(svg).xLabel('lul').yLabel('lul');

    h.makeScales();
    h.renderAxes();
    t.ok(d3.select('.x-axis-label').text() == 'lul');
    t.ok(d3.select('.y-axis-label').text() == 'lul');
    t.end();
});

tape('renderCells() renders default cells', t => {


    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let h = heatmap().data(data).svg(svg);

    h.makeScales();
    h.renderAxes();
    h.renderCells();

    t.notOk(d3.select('.cells').empty());
    t.notOk(d3.select('.cell').empty());
    t.ok(d3.selectAll('.cell').size() == 9);
    console.log(d3.selectAll('.cell').size());
    t.end();
});

/*
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
*/
