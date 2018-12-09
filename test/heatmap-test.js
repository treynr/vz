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

const mirroredDataAlt = {

    values: [
		{x: 1, y: 1, value: 1.0, altValue: 2.0},
		{x: 2, y: 1, value: 0.7, altValue: 0.001},
		{x: 3, y: 1, value: 0.4, altValue: 0.01},

		{x: 1, y: 2, value: 0.7, altValue: 0.001},
		{x: 2, y: 2, value: 1.0, altValue: 2.0},
		{x: 3, y: 2, value: 0.1, altValue: 0.006},

		{x: 1, y: 3, value: 0.4, altValue: 0.01},
		{x: 2, y: 3, value: 0.1, altValue: 0.006},
		{x: 3, y: 3, value: 1.0, altValue: 2.0}
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
    t.ok(d3.selectAll('.cell').size() == 6);
    t.end();
});

tape('renderCells() renders default cells', t => {


    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let h = heatmap().data(mirroredData).svg(svg);

    h.makeScales();
    h.renderAxes();
    h.renderCells();

    t.notOk(d3.select('.cells').empty());
    t.notOk(d3.select('.cell').empty());
    t.ok(d3.selectAll('.cell').size() == 9);
    t.end();
});

tape('renderCells() renders default cells for mirrored data', t => {


    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let h = heatmap().data(mirroredData).mirrorAxes(true).svg(svg);

    h.makeScales();
    h.renderAxes();
    h.renderCells();

    t.notOk(d3.select('.cells').empty());
    t.notOk(d3.select('.cell').empty());
    t.ok(d3.selectAll('.cell').size() == 6);
    t.end();
});

tape('renderAltCells() renders default cells with extra alt data', t => {


    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let h = heatmap().data(mirroredDataAlt).useAltValues(true).mirrorAxes(true).svg(svg);

    h.stringifyCategories();
    h.makeScales();
    h.renderAxes();
    h.renderCells();
    h.renderAltCells();

    t.notOk(d3.select('.cells').empty());
    t.notOk(d3.select('.alt-cells').empty());
    t.notOk(d3.select('.cell').empty());
    t.notOk(d3.select('.alt-cell').empty());
    t.ok(d3.selectAll('.alt-cell').size() == 3);
    t.ok(d3.selectAll('.cell').size() == 6);
    t.end();
});

tape('renderAltCells() properly uses a different threshold comparator', t => {


    global.document = (new jsdom.JSDOM(`...`)).window.document;
    let svg = d3.select('body').append('svg');
    let h = heatmap()
        .data(mirroredDataAlt)
        .useAltValues(true)
        .altThresholdComparator(heatmap().Threshold.LT)
        .mirrorAxes(true)
        .svg(svg);

    h.stringifyCategories();
    h.makeScales();
    h.renderAxes();
    h.renderCells();
    h.renderAltCells();

    t.notOk(d3.select('.cells').empty());
    t.notOk(d3.select('.alt-cells').empty());
    t.notOk(d3.select('.cell').empty());
    t.notOk(d3.select('.alt-cell').empty());
    t.ok(d3.selectAll('.alt-cell').size() == 3);
    t.ok(d3.selectAll('.cell').size() == 6);
    t.end();
});

