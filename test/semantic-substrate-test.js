/**
  * file: semantic-substrate-test.js
  * desc: Unit tests for the semantic substrate visualization.
  * auth: TR
  */

const substrate = require('../dist/semantic-substrate');
const tape = require('tape');

tape('makeScales() sets the default x-scale', t => {

    let data = [{x:2}, {x:3}, {x:4}];
    let s = substrate().data(data);

    s.makeScales();
    t.equal(s.xScale().domain()[0], 2);
    t.equal(s.xScale().domain()[1], 4);
    t.end();
});

tape('makeScales() sets the default y-scale', t => {

    let data = [{y:30}, {y:20}, {y:10}];
    let s = substrate().data(data);

    s.makeScales();
    t.equal(s.yScale().domain()[0], 10);
    t.equal(s.yScale().domain()[1], 30);
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

