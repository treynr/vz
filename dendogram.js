
function validateOptions(opts) {

	//var opacity = (opts.opacity === undefined) ? 0.55 : opts.opacity;
	var height = (opts.height === undefined) ? 500 : opts.height;
	var width = (opts.width === undefined) ? 500 : opts.width;
	var stroke = (opts.stroke === undefined) ? '#000000' : opts.stroke;
	var nodeColor = (opts.nodeColor === undefined) ? '#000' : opts.nodeColor;
	// Radius of each node in the tree
	var radius = (opts.radius === undefined) ? 5 : opts.radius;

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
		radius : radius
	};
}

function translateMargin(margin) {

	return 'translate(' + margin.left + ',' + margin.top + ')';
}


function elbow(d, i) {
  return "M" + d.source.y + "," + d.source.x
      + "V" + d.target.x + "H" + d.target.y;
}
// The function expects data to be a hierarchy of objects (essentially objects
// of objects of objects of...). Each node in the tree is an object. The only
// required keys for each node are 'name' and 'children'. Children should be an
// array of objects which comprise the node's children and are the same format
// as each node. 
//
function makeTree(data, opts={}) {

	opts = validateOptions(opts);

	var margin = {top: 10, right: 30, bottom: 30, left: 50};
	var height = opts.height - margin.top - margin.bottom;
	var width = opts.width - margin.left - margin.right;
	
	//var tree = d3.layout.tree()
	//	.size([height, width]);

	var tree = d3.layout.cluster()
		.size([height, width - 200]);

	// A diagonal generator. Projection converts some point {x, y} to a two
	// element array of numbers. 
	//var diagonal = d3.svg.diagonal()
	//	.projection(function(d) { return [d.y, d.x]; });

	var svg = d3.select('body')
		.append('svg')
		.attr('width', opts.width)
		.attr('height', opts.height)
		.append('g')
		.attr('transform', translateMargin(margin));

	// d3 will automagically parse out the tree structure if it's in the 
	// format specified above
	var nodes = tree.nodes(data);
	var edges = tree.links(nodes);

	var edge = svg.selectAll('path.edge')
		.data(edges)
		.enter().append('path')
		.attr('class', 'edge')
		.attr('d', elbow);

	var node = svg.selectAll('g.node')
		.data(nodes)
		.enter().append('g')
		.attr('class', 'node')
		.attr('transform', function(d) { 
			return 'translate(' + d.y + ',' + d.x + ')'; 
		});
	
	node.append('circle')
		.attr('r', opts.radius);

	node.append('text')
		.attr('dx', function(d) { return d.children ? -8 : 8; })
		.attr('dy', function(d) { return d.children ? -5 : 3; })
		//.attr('dy', 3)
		.attr('text-anchor', function(d) { 
			return d.children ? 'end' : 'start'; 
		})
		.text(function(d) { return d.name; });

}
