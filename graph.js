
//// graph = {nodes: [...], edges: [...]}
//
//// opts :
////    dimensions : [int, int]; height and width of the SVG 
////    weights : boolean; indicates edges have weights
////    size : boolean; indicates nodes have sizes
////    cut : float; if edges have weights, all edges whose weight is below
////        the value given by cut will not be drawn
////    ntext : 
////    ckey : 
////    cmin : 
////    cmax : 
////    
//
var makeGraph = function(graph, opts) {

    var height = (opts.dimensions === undefined) ? 600 : opts.dimensions[0];
    var width = (opts.dimensions === undefined) ? 600 : opts.dimensions[1];
    var linkdist = (opts.linkdist === undefined) ? 20 : opts.linkdist;
    var charge = (opts.charge === undefined) ? -30 : opts.charge;
    var use_cut = ((opts.cut !== undefined) && (opts.weights !== undefined));
    if (opts.cmin !== undefined && opts.cmax !== undefined)
        var colors = d3.scale.linear().domain([opts.cmin, opts.cmax]).range(['#FF0000', '#330000']);
    //var colors = d3.scale.category20();
    //var colors = d3.scale.linear().domain([opts.min, opts.max]).range(['#000080', '#F10800']);

    // If a cut off is specified, remove all edges that fall below the cutoff
    if (use_cut) {

        var survivors = [];

        for (var i = 0; i < graph.edges.length; i++)
            if (graph.edges[i]['weight'] > opts.cut)
                survivors.push(graph.edges[i]);

        graph.edges = survivors;

        var hasedge = {};

        // Remove nodes that have no edges--well mark them so they aren't drawn later
        for (var i = 0; i < graph.edges.length; i++) {

            hasedge[graph.edges[i]['source']] = true;
            hasedge[graph.edges[i]['target']] = true;
        }
    }

    // Nodes have a 'size' field; we can scale their radius based on this.
    if (opts.size === true) {

        var ns = [];

        for (var i = 0; i < graph.nodes.length; i++)
            ns.push(graph.nodes[i]['size']);

        var size = d3.scale.linear()
            .domain([d3.min(ns), d3.max(ns)])
            .range([8, 17]);
    }

    var svg = d3.select('#dsvg').append('svg')
        .attr('width', width)
        .attr('height', height);
    
    var force = d3.layout.force()
        .nodes(graph.nodes)
        .links(graph.edges)
        .size([width, height])
        .linkDistance(linkdist)
        .charge(charge)
        .distance(80)
        .start();

    if (opts.grps === true) {

        var uniq = function (a) {
            var seen = {};
            return a.filter(function(item) {
                return seen.hasOwnProperty(item) ? false : (seen[item] = true);
            });
        };

        var keysvg = d3.select('#dsvg').append('svg')
            .style('font-weight', 'bold')
            .attr('width', 300)//width)
            .attr('height', 250);//height);

        // Find all possible groups
        var grps = [];

        for (var i = 0; i < graph['nodes'].length; i++) {
            grps.push(graph['nodes'][i]['grp'])
        }

        grps = uniq(grps).sort();
        console.log(grps);

        keysvg.append('text')
            .attr({
                'text-anchor': 'middle',
                'font-family': 'sans-serif',
                'font-size': '15px',
                'y': '15',
                'x': 85//(width / 2)
            })
            .text('Geneset Group Legend');
                
        var key = keysvg.selectAll('g')
            //.data(json.nodes)
            //.data(keynodes)
            .data(grps)
            .enter()
            .append('g')
            .attr('class', 'legend');

        key.append('circle')
            .attr('cx', 10)
            .attr('cy', function(d, i){ return (i * 20) + 30; })
            .attr('r', 6)
            .attr('fill', function(d, i){
                return colors(grps.indexOf(d));
                //return colors(keymap[d]);
                //return colors(d.old_index);
            });
        key.append('text')
            .attr('x', 30)
            .attr('y', function(d, i){ return (i * 20) + 35; })
            .attr('font-family', 'sans-serif')
            .attr('font-size', '12px')
            //.text(function(d){ return d.name });
            .text(function(d){ return d; });
    }

    // If the meights option is true, then we draw edge thickness based on
    // normalized weight values
    if (opts.weights === true) {

        var wts = [];

        for (var i = 0; i < graph['edges'].length; i++)
            wts.push(parseFloat(graph['edges'][i]['weight']));

        var ethick = d3.scale.linear()
            .domain([d3.min(wts), d3.max(wts)])
            .range([1, 8]);

    } else {

        // not really a scale
        var ethick = d3.scale.linear()
            .domain([0, 1])
            .range([4, 4]);
    }

    force.on('tick', function() {

        edges.attr('x1', function(d) {return d.source.x;})
            .attr('y1', function(d) {return d.source.y;})
            .attr('x2', function(d) {return d.target.x;})
            .attr('y2', function(d) {return d.target.y;});

        nodes.attr('cx', function(d) {return d.x;})
            .attr('cy', function(d) {return d.y;});
    });

    var edgeOn = function(d, i) {

        var xpos = parseFloat(d3.select(this).attr('x1'));
        var ypos = parseFloat(d3.select(this).attr('y1'));

        d3.select('#edgetip')
            .style('left', (xpos + 30) + 'px')
            .style('top', (ypos + 30) + 'px')
            .select('#cond')
            .text(d.weight);

        d3.select('#edgetip').classed('hidden', false);
    }

    var edgeOut = function(d, i) {

        d3.select('#edgetip').classed('hidden', true);
    }

    var edges = svg.selectAll('line')
        .data(graph.edges)
        .enter()
        .append('line')
        .style('stroke', '#ccc')
        .on('mouseover', edgeOn)
        .on('mouseout', edgeOut)
        .style('stroke-width', function(d) {
            return ethick(d.weight);
        });

    var onBox = function(d, i) {

        var xpos = parseFloat(d3.select(this).attr('cx'));
        var ypos = parseFloat(d3.select(this).attr('cy'));

        d3.select('#tooltip')
            .style('left', (xpos + 30) + 'px')
            .style('top', (ypos + 30) + 'px')
            .select('#name')
            .text(d.name);

        d3.select('#tooltip')
            .select('#group')
            .text(d.group);

        d3.select('#tooltip')
            .select('#gsid')
            .text(d.id);

        d3.select('#tooltip').classed('hidden', false);
    }

    var outBox = function(d, i) {

        d3.select('#tooltip').classed('hidden', true);
    }

    var drag = force.drag().on('dragstart', dragstart);

    function dragstart(d) {
        d3.select(this).classed('fixed', d.fixed = true);
    }

    function dblclick(d) {
        d3.select(this).classed('fixed', d.fixed = false);
    }
        
    var nodes = svg.selectAll('circle')
        .data(graph.nodes)
        .enter()
        .append('circle')
        .attr('class', 'node')
        .attr('r', function(d, i){ 

            if (use_cut && (hasedge[i] === undefined))
                return 0;
            if (opts.size === true)
                return size(d.size);
            else
                return 9;
        })
        .attr('fill', function(d, i) { 
            if (opts.ckey !== undefined)
                return colors(d[opts.ckey]);
            //return colors(i);
            if (d.depth == 2)
                return '#FFCCCC';
            if (d.depth == 3)
                return '#FF0000';
            if (d.depth == 4)
                return '#8B0000';
            if (d.depth == 5)
                return '#330000';

            return '#8B7D7B';
        })
        .on('mouseover', onBox)
        .on('mouseout', outBox)
        .on('dblclick', dblclick)
        .call(drag);

    if (opts.grps)
        return [svg, keysvg];
    else
        return svg
}
