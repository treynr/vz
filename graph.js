
function initialize_layout(nodes) {
        var nextdepths = [0];
        var previous = [-1];
        for (i = 0; i < nodes.length; i++) {
            while (nodes[i].depth > nextdepths.length - 1) {
                nextdepths.push(0);
                previous.push(-1);
            }
            if (previous[nodes[i].depth] >= 0) {
                prevNode = getNodeByID(nodes, previous[nodes[i].depth]);
                prevNode.below = nodes[i].id;
                nodes[i].above = prevNode.id;
            }
            previous[nodes[i].depth] = nodes[i].id;
            nodes[i].x = nodes[i].depth * 100 + 100;
            nodes[i].y = nextdepths[nodes[i].depth] * 20 + 100;
            nextdepths[nodes[i].depth]++;
        }
}

function initTreeLayout(nodes) {
        var nextdepths = [0];
        var previous = [-1];
        for (i = 0; i < nodes.length; i++) {
            while (nodes[i].depth > nextdepths.length - 1) {
                nextdepths.push(0);
                previous.push(-1);
            }
            if (previous[nodes[i].depth] >= 0) {
                prevNode = getNodeByID(nodes, previous[nodes[i].depth]);
                prevNode.below = nodes[i].id;
                nodes[i].above = prevNode.id;
            }
            previous[nodes[i].depth] = nodes[i].id;
            nodes[i].y = nodes[i].depth * 100 + 100;
            nodes[i].x = nextdepths[nodes[i].depth] * 20 + 100;
            nextdepths[nodes[i].depth]++;
        }
}


//// Generates a unique gradient for a given SVG.
//
//// :type svg: string
//// :type gid: string
//// :type type: string
//// :type c0: string
//// :type c0: string
//
var makeGradient = function(svg, gid, type, c0, c1) {

    gid = (gid === undefined) ? 'gradient' : gid;
    type = (type === undefined) ? 'linearGradient' : type;
    c0 = (c0 === undefined) ? '#FFFFFF' : c0;
    c1 = (c1 === undefined) ? '#DD0000' : c1;

	var gradient = svg.append(type)
		.attr('id', gid)
		.attr('x1', '0%')
		.attr('y1', '0%')
		.attr('x2', '100%')
		.attr('y2', '100%')
		.attr('spreadMethod', 'pad')
		;

	gradient.append('stop')
		.attr('offset', '0%')
		.attr('stop-color', c0)
		.attr('stop-opacity', 1);

	gradient.append('stop')
		.attr('offset', '100%')
		.attr('stop-color', c1)
		.attr('stop-opacity', 1);
}

// key is a list of objects containing a title and color.
// if gradients are used then each object in key contains a single unique
// string with no spaces which specifies the color class it belongs to.
var makeLegend = function(key, opts) {

    var height = (opts.dimensions === undefined) ? 500 : opts.dimensions[0];
    var width = (opts.dimensions === undefined) ? 400 : opts.dimensions[1];
    var gradient = (opts.gradient === undefined) ? false : opts.gradient;

    var svg = d3.select('body').append('svg')
		.style('font-weight', 'bold')
		.style('border', '2px solid #222')
        .attr('width', width)
        .attr('height', height);

	//svg.append('text')
	//	.attr({
	//		'text-anchor': 'middle',
	//		'font-family': 'sans-serif',
	//		'font-size': '15px',
	//		'y': '15',
	//		'x': (width / 2)
	//	})
	//	.text('Legend');

	if (gradient) {

		var gradients = {};

		for (var i = 0; i < key.length; i++) {
			gradients[key[i]['class']] = key[i]['color'];
		}

		for (var gc in gradients)
			makeGradient(svg, gc, 'radialGradient', '#eee', gradients[gc]);
	}
			
	var key = svg.selectAll('g')
		.data(key)
		.enter()
		.append('g')
		.attr('class', 'legend');

	key.append('circle')
		.attr('cx', 10)
		//.attr('cy', function(d, i){ return (i * 20) + 30; })
		.attr('cy', function(d, i){ return (i * 20) + 15; })
		.attr('r', 6)
		.attr('stroke', '#333')
		.attr('stroke-width', '1px')
		.attr('fill', function(d, i){
			if (gradient)
				return 'url(#' + d.class + ')';
			else
				return d.color;
			//return colors(keymap[d]);
			//return colors(d.old_index);
		});

	key.append('text')
		.attr('x', 30)
		//.attr('y', function(d, i){ return (i * 20) + 34; })
		.attr('y', function(d, i){ return (i * 20) + 18; })
		.attr('font-family', 'sans-serif')
		.attr('font-size', '12px')
		//.text(function(d){ return d.name });
		.text(function(d){ return d.title; });
}

var makeBipartiteGraph = function(graph, opts) {

    var height = (opts.height === undefined) ? 600 : opts.height;
    var width = (opts.width === undefined) ? 600 : opts.width;
    var linkdist = (opts.linkdist === undefined) ? 20 : opts.linkdist;
    var distance = (opts.distance === undefined) ? 80 : opts.distance;
    var charge = (opts.charge === undefined) ? -30 : opts.charge;
    var use_cut = ((opts.cut !== undefined) && (opts.weights !== undefined));
    var isTree = (opts.isTree === undefined) ? false : opts.isTree;
    var classColor = (opts.classColor === undefined) ? {} : opts.classColor;
    var nope = (opts.nope === undefined) ? false : opts.nope;
    if (opts.cmin !== undefined && opts.cmax !== undefined)
        var colors = d3.scale.linear().domain([opts.cmin, opts.cmax]).range(['#FF0000', '#330000']);

    // Nodes have a 'size' field; we can scale their radius based on this.
    if (opts.size === true) {

        var ns = [];
		var size = 0;

        for (var i = 0; i < graph.nodes.length; i++)
            ns.push(graph.nodes[i]['size']);

		if (d3.min(ns) === d3.max(ns))
			size = function(x) { return x; };
		else
			size = d3.scale.linear()
				.domain([d3.min(ns), d3.max(ns)])
				.range([8, 17]);
    }

	console.log(width);
	console.log(height);

    var svg = d3.select('body').append('svg')
        .attr('width', width)
        .attr('height', height);
    
    var force = d3.layout.force()
        .nodes(graph.nodes)
        .links(graph.edges)
        .size([width, height])
        .linkDistance(linkdist)
        .charge(charge)
        .distance(80)
        //.start();
		;


    // If the meights option is true, then we draw edge thickness based on
    // normalized weight values
    if (opts.weights === true) {

        var wts = [];
		var ethick = 0;

        for (var i = 0; i < graph['edges'].length; i++)
            wts.push(parseFloat(graph['edges'][i]['weight']));

		if (d3.min(wts) === d3.max(wts))
			ethick = function(x) { return x; };
		else
			ethick = d3.scale.linear()
				.domain([d3.min(wts), d3.max(wts)])
				.range([1, 8]);

    } else {

      // not really a scale
      var ethick = d3.scale.linear()
          .domain([0, 1])
          .range([4, 4]);
    }
	    function tick() {
    }

    force.on('tick', function() {

		if (!nope) {
        nodes.attr("transform", function (d) {
            //collide(d);
			if (isTree)
				d.y = d.depth * 50 + 100;
			else
				d.x = d.depth * 120 + 100;
            return ("translate(" + d.x + "," + d.y + ")");
        });
		} else {

        nodes.attr('cx', function(d) {return d.x;})
            .attr('cy', function(d) {return d.y;});
		}

        //redraw position of every link within the link set:
        edges.attr("x1", function (d) {
                    return d.source.x;
                })
                .attr("y1", function (d) {
                    return d.source.y;
                })
                .attr("x2", function (d) {
                    return d.target.x;
                })
                .attr("y2", function (d) {
                    return d.target.y;
                });
        //edges.attr('x1', function(d) {return d.source.x;})
        //    .attr('y1', function(d) {return d.source.y;})
        //    .attr('x2', function(d) {return d.target.x;})
        //    .attr('y2', function(d) {return d.target.y;});

        //nodes.attr('cx', function(d) {return d.x;})
        //    .attr('cy', function(d) {return d.y;});
    });

    //var edgeOn = function(d, i) {

    //    var xpos = parseFloat(d3.select(this).attr('x1'));
    //    var ypos = parseFloat(d3.select(this).attr('y1'));

    //    d3.select('#edgetip')
    //        .style('left', (xpos + 30) + 'px')
    //        .style('top', (ypos + 30) + 'px')
    //        .select('#cond')
    //        .text(d.weight);

    //    d3.select('#edgetip').classed('hidden', false);
    //}

    //var edgeOut = function(d, i) {

    //    d3.select('#edgetip').classed('hidden', true);
    //}

    var edges = svg.selectAll('line')
        .data(graph.edges)
        .enter()
        .append('line')
        .style('stroke', '#aaa')
        //.on('mouseover', edgeOn)
        //.on('mouseout', edgeOut)
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

	var gradients = {};

	for (var i = 0; i < graph.nodes.length; i++) {
		if (classColor) {
			for (cl in classColor) {
				gradients[cl] = classColor[cl];
			}
		} else {
			gradients[graph.nodes[i]['class']] = graph.nodes[i]['color'];
		}
	}

	for (var gc in gradients)
		makeGradient(svg, gc, 'radialGradient', '#eee', gradients[gc]);
        
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
		.attr('stroke', '#333')
		.attr('stroke-width', '1.5px')
        .attr('fill', function(d, i) { 
			return 'url(#' + d.class + ')';
            //if (opts.ckey !== undefined)
            //    return colors(d[opts.ckey]);
            ////return colors(i);
            //if (d.depth == 2)
            //    return '#FFCCCC';
            //if (d.depth == 3)
            //    return '#FF0000';
            //if (d.depth == 4)
            //    return '#8B0000';
            //if (d.depth == 5)
            //    return '#330000';

            //return '#8B7D7B';
        })
        //.on('mouseover', onBox)
        //.on('mouseout', outBox)
        .on('dblclick', dblclick)
        .call(drag);
	
	if (!nope) {
	if (isTree)
		initTreeLayout(nodes);
	else
		initialize_layout(nodes);
	}
	//initTreeLayout(nodes);
	force.start();

    if (opts.grps)
        return [svg, keysvg];
    else
        return svg
};

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
