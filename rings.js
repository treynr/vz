
//// opts {
//      domain : [a, b]
//      dimensions : [height, width]
//      title : title string
//      color : a color string, either a name (e.g. red) or hex (e.g. #ff0000)
//      nbins : number of bins (histogram only)
//      inner : inner radius (ring charts only)
//      msublabel : middle sub label/title
//   }
//
var ring = function(data, mlabel, title, opts) {

    //var in_height = (opts.dimensions === undefined) ? 500 : opts.dimensions[0];
    //var in_width = (opts.dimensions === undefined) ? 700 : opts.dimensions[1];
    var height = (opts.dimensions === undefined) ? 700 : opts.dimensions[0];
    var width = (opts.dimensions === undefined) ? 700 : opts.dimensions[1];
    var inner = (opts.inner === undefined) ? 120 : opts.inner
    //var height = in_height + 100;
    //var width = in_width + 50;
    var margin = {top: 10, right: 30, bottom: 30, left: 30};
    //var in_height = 500;
    //var in_width = 700;
    var xpad = 50;
    var ypad = 30;

    height = height - margin.top - margin.bottom;
    width = width - margin.left - margin.right;

	// Sort by greatest values, decreasing order
	data.sort(function(la, lb) {

		return lb[1] - la[1];
	});

    var ring = d3.layout.pie()
        .value(function(d, i) {return d[1];});

    var color = d3.scale.category10();

    // Used for percentages
    var total = 0;
    for (var i = 0; i < data.length; i++)
        total += data[i][1];

    //var color = d3.scale.ordinal()
        //.range(['#438ab2', '#28536a', '#193849', '#f4d765', '#a9544d']);
        //.range(["#d0743c","#a05d56","#98abc5", "#8a89a6", "#7b6888", "#6b486b",  "#ff8c00"]);
        //.range(['#208BAC', '#7BD5Ee', '#F6E6AC', '#BD3162','#41B4EE']);

    var svg = d3.select('body')
        .append('svg')
        .attr('height', height)
        .attr('width', width);
    var arc = d3.svg.arc()
        .innerRadius(inner)
        .outerRadius(width / 2);
    var arcs = svg.selectAll('g.arc')
        .data(ring(data))
        .enter()
        .append('g')
        .attr('class', 'arc')
        .attr('stroke', '#fff')
        .attr('transform', 'translate(' + (width/2)  + ',' + (width - 150) + ')');
    

    arcs.append('path')
        .attr('fill', function(d, i) {
            return color(i);
        })
        .attr('d', arc);

    //arcs.append('line')
    //    .attr("x1", function(d) {
    //        var c = arc.centroid(d), x = c[0], y = c[1], h = Math.sqrt(x*x + y*y);
    //        return (x/h * ((width / 2) + 10));
    //    })
    //    .attr("y1", function(d) {
    //        var c = arc.centroid(d), x = c[0], y = c[1], h = Math.sqrt(x*x + y*y);
    //        return (y/h * ((width / 2) + 10)); 
    //    })
    //    .attr("x2", function(d) {
    //        var c = arc.centroid(d), x = c[0], y = c[1], h = Math.sqrt(x*x + y*y);
    //        return (x/h * ((width / 2) + 40));
    //    })
    //    .attr("y2", function(d) {
    //        var c = arc.centroid(d), x = c[0], y = c[1], h = Math.sqrt(x*x + y*y);
    //        return (y/h * ((width / 2) + 40)); 
    //    })
    //arcs.append('text')
    //    .attr("transform", function(d) {
    //        var c = arc.centroid(d),
    //            x = c[0],
    //            y = c[1],
    //            // pythagorean theorem for hypotenuse
    //            h = Math.sqrt(x*x + y*y);
    //        return "translate(" + (x/h * ((width / 2) + 10)) +  ',' +
    //           (y/h * ((width / 2) + 10)) +  ")"; 
    //    })
    //    .attr("dy", ".35em")
    //    .attr("text-anchor", function(d) {
    //        // are we past the center?
    //        return (d.endAngle + d.startAngle)/2 > Math.PI ?
    //            "end" : "start";
    //    })
    //    .attr('text-anchor', 'middle')
    //    .text('blah');

    var center = svg.append('g')
        .attr('transform', 'translate(' + (width / 2) + ',' + (10) + ')');

    center.append('text')
        .attr('dy', '.35em')
        .attr('text-anchor', 'middle')
        .attr('font-size', '17px')
        .attr('font-family', 'sans-serif')
        .attr('font-weight', 'normal')
        .text(mlabel);
    if (opts.msublabel !== undefined) {
        center.append('text')
            .attr('dy', '2em')
            .attr('text-anchor', 'middle')
            .attr('font-size', '16px')
            .attr('font-family', 'sans-serif')
            .attr('font-weight', 'normal')
            .text(opts.msublabel);
    }

    var key = d3.select('body').append('svg')
        .attr('width', 350)
        .attr('height', 200)
        .selectAll('g')
        .data(data)
        .enter().append('g')
        .attr("transform", function(d, i) { return "translate(40," + i * 20 + ")"; });
    key.append('rect')
        .attr('width', 18)
        .attr('height', 18)
        .style('fill', function(d, i) {return color(i);});
    key.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .attr('font-size', '12px')
        .text(function(d) { 
            
            return d[0] + ' (' + round(d[1] / total)  + '% - ' + d[1] + ')'; 
        });
}

var rings = function(data, mlabel, title, opts) {

    var height = (opts.dimensions === undefined) ? 500 : opts.dimensions[0];
    var width = (opts.dimensions === undefined) ? 700 : opts.dimensions[1];
    var inner = (opts.inner === undefined) ? 120 : opts.inner
    var margin = {top: 10, right: 30, bottom: 30, left: 30};
    var xpad = 50;
    var ypad = 30;

    height = height - margin.top - margin.bottom;
    width = width - margin.left - margin.right;

    for (var i = 0; i < data.length; i++) {

        var ring = d3.layout.pie()
            .value(function(d, i) {return d[1];});

        var color = d3.scale.category10();

        // Used for percentages
        var total = 0;
        for (var i = 0; i < data[i].length; i++)
            total += data[i][i][1];

        var key = d3.select('body').append('svg')
            .attr('width', 250)
            .attr('height', 200)
            .selectAll('g')
            .data(data[i])
            .enter().append('g')
            .attr("transform", function(d, i) { return "translate(40," + i * 20 + ")"; });
        key.append('rect')
            .attr('width', 18)
            .attr('height', 18)
            .style('fill', function(d, i) {return color(i);});
        key.append("text")
            .attr("x", 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .attr('font-size', '12px')
            .text(function(d) { 
                
                return d[0] + ' (' + round(d[1] / total)  + '% - ' + d[1] + ')'; 
            });
        //var color = d3.scale.ordinal()
            //.range(['#438ab2', '#28536a', '#193849', '#f4d765', '#a9544d']);
            //.range(["#d0743c","#a05d56","#98abc5", "#8a89a6", "#7b6888", "#6b486b",  "#ff8c00"]);
            //.range(['#208BAC', '#7BD5Ee', '#F6E6AC', '#BD3162','#41B4EE']);

        var svg = d3.select('body')
            .append('svg')
            .attr('height', height)
            .attr('width', width);
        var arc = d3.svg.arc()
            .innerRadius(inner)
            .outerRadius(width / 2);
        var arcs = svg.selectAll('g.arc')
            .data(ring(data[i]))
            .enter()
            .append('g')
            .attr('class', 'arc')
            .attr('stroke', '#fff')
            .attr('transform', 'translate(' + (width/2)  + ',' + (width - 100) + ')');
        

        arcs.append('path')
            .attr('fill', function(d, i) {
                return color(i);
            })
            .attr('d', arc);

        //arcs.append('line')
        //    .attr("x1", function(d) {
        //        var c = arc.centroid(d), x = c[0], y = c[1], h = Math.sqrt(x*x + y*y);
        //        return (x/h * ((width / 2) + 10));
        //    })
        //    .attr("y1", function(d) {
        //        var c = arc.centroid(d), x = c[0], y = c[1], h = Math.sqrt(x*x + y*y);
        //        return (y/h * ((width / 2) + 10)); 
        //    })
        //    .attr("x2", function(d) {
        //        var c = arc.centroid(d), x = c[0], y = c[1], h = Math.sqrt(x*x + y*y);
        //        return (x/h * ((width / 2) + 40));
        //    })
        //    .attr("y2", function(d) {
        //        var c = arc.centroid(d), x = c[0], y = c[1], h = Math.sqrt(x*x + y*y);
        //        return (y/h * ((width / 2) + 40)); 
        //    })
        //arcs.append('text')
        //    .attr("transform", function(d) {
        //        var c = arc.centroid(d),
        //            x = c[0],
        //            y = c[1],
        //            // pythagorean theorem for hypotenuse
        //            h = Math.sqrt(x*x + y*y);
        //        return "translate(" + (x/h * ((width / 2) + 10)) +  ',' +
        //           (y/h * ((width / 2) + 10)) +  ")"; 
        //    })
        //    .attr("dy", ".35em")
        //    .attr("text-anchor", function(d) {
        //        // are we past the center?
        //        return (d.endAngle + d.startAngle)/2 > Math.PI ?
        //            "end" : "start";
        //    })
        //    .attr('text-anchor', 'middle')
        //    .text('blah');

        var center = svg.append('g')
            .attr('transform', 'translate(' + (width / 2) + ',' + (height / 2) + ')');

        center.append('text')
            .attr('dy', '.35em')
            .attr('text-anchor', 'middle')
            .attr('font-size', '30px')
            .attr('font-family', 'sans-serif')
            .attr('font-weight', 'normal')
            .text(mlabel[i]);
    }
}
var round = function(n) {
    n *= 100;
    //if (n < .01)
    //    return 0.01;
    return (Math.round(n * 100) / 100);
}
