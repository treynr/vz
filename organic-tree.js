
function validateOptions(opts) {

	if (opts === undefined)
		opts = {};

	//var opacity = (opts.opacity === undefined) ? 0.55 : opts.opacity;
	var height = (opts.height === undefined) ? 500 : opts.height;
	var width = (opts.width === undefined) ? 500 : opts.width;
	var stroke = (opts.stroke === undefined) ? '#000000' : opts.stroke;
	var nodeColor = (opts.nodeColor === undefined) ? '#000' : opts.nodeColor;
	// Radius of each node in the tree
	var radius = (opts.radius === undefined) ? 5 : opts.radius;
	var image = (opts.image === undefined) ? false : opts.image;
	var elem = (opts.elem === undefined) ? 'body' : opts.elem;
	var straight = (opts.straight === undefined) ? false : opts.straight;
	var linkhide = (opts.linkhide === undefined) ? false : opts.linkhide;

	//if (opts.colors === undefined || opts.colors.length < sets.length)
	//	var colors = d3.scale.category20();
	//else
	//	var colors = opts.colors;

	return {
		//colors : colors,
		//opacity : opacity,
		height : height,
		width : width,
		stroke : stroke,
		radius : radius,
		image : image,
		elem : elem,
		straight : straight,
		linkhide : linkhide
	};
}

function translateMargin(margin) {

	return 'translate(' + margin.left + ',' + margin.top + ')';
}

// The function expects data to be a hierarchy of objects (essentially objects
// of objects of objects of...). Each node in the tree is an object. The only
// required keys for each node are 'name' and 'children'. Children should be an
// array of objects which comprise the node's children and are the same format
// as each node. 
//
//function makeTree(data, opts={}) {
function makeTree(data, opts) {

	opts = validateOptions(opts);

	var margin = {top: 10, right: 30, bottom: 30, left: 50};
	var height = opts.height - margin.top - margin.bottom;
	var width = opts.width - margin.left - margin.right;

	
	var tree = d3.layout.tree()
		.size([height, width - 200]);

	// A diagonal generator. Projection converts some point {x, y} to a two
	// element array of numbers. 
	var diagonal = d3.svg.diagonal()
		.projection(function(d) { return [d.y, d.x]; });

	var svg = d3.select('body')
	//var svg = d3.select(opts.elem)
		.append('svg')
		.attr("version", 1.1)
		.attr("xmlns", "http://www.w3.org/2000/svg")
		.attr('width', opts.width)
		.attr('height', opts.height)
		.append('g')
		.attr('transform', translateMargin(margin));

	// d3 will automagically parse out the tree structure if it's in the 
	// format specified above
	var nodes = tree.nodes(data);
	var edges = tree.links(nodes);

	if (!opts.linkhide) {
		if (!opts.straight) {
			var edge = svg.selectAll('path.edge')
				.data(edges)
				.enter().append('path')
				.style('stroke', function(d) { 
					return d.target.linkcolor ? d.target.linkcolor : 'steelblue';
				})
				.attr('class', 'edge')
				.attr('d', diagonal);
		} else {
			var edge = svg.selectAll('path.edge')
				.data(edges)
				.enter().append('line')
				.style('stroke', function(d) { 
					return d.target.linkcolor ? d.target.linkcolor : 'steelblue';
				})
				.attr('class', 'edge')
				.attr("x1", function(d) { return d.source.y; })
				.attr("y1", function(d) { return d.source.x; })
				.attr("x2", function(d) { return d.target.y; })
				.attr("y2", function(d) { return d.target.x; });

		}
	}

	var node = svg.selectAll('g.node')
		.data(nodes)
		.enter().append('g')
		.attr('class', 'node')
		.style('fill', function(d) { 
			return d.nodecolor ? d.nodecolor : 'blue'; })
		.attr('transform', function(d) { 
			return 'translate(' + d.y + ',' + d.x + ')'; 
	});
	

	if (opts.image) {

		node.append('image')
			.attr('xlink:href', function(d) { return d.icon; })
			//.attr('x', '-12px')
			.attr('x', function(d) { return d.children ? '-44px' : '-12px' })
			.attr('y', function(d) { return d.children ? '-34px' : '-42px' })
			//.attr('y', '-42px')
			.attr('width', function(d) { 
				return d.icon == 'gw.png' ? '64px' : '84px' 
			})
			.attr('height', function(d) { 
				return d.icon == 'gw.png' ? '64px' : '84px' 
			})
			;
			//.attr('width', '84px')
			//.attr('height', '84px');

	} else {

		node.append('circle')
			.attr('fill', function(d) { return d.nodecolor ? d.nodecolor : 'red'; })
			.attr('r', opts.radius);

		node.append('text')
			.attr('dx', function(d) { return d.children ? 13 : 10; })
			.attr('dy', function(d) { return d.children ? -10 : 5; })
			//.attr('dy', 3)
			.attr('text-anchor', function(d) { 
				return d.children ? 'end' : 'start'; 
			})
			.text(function(d) { return d.name; });
	}

}
