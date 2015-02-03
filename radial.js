
function makeRadialChart(d, opts) {

    var height = (opts.dimensions === undefined) ? 600 : opts.dimensions[0];
    var width = (opts.dimensions === undefined) ? 600 : opts.dimensions[1];
    var margin = (opts.marg === undefined) ? 
                 {top: 10, right: 30, bottom: 30, left: 50} : opts.marg;
    var levels = (opts.levels === undefined) ? 3 : opts.levels;
    var fact = (opts.fact === undefined) ? 1 : opts.fact;
    var radians = (opts.radians === undefined) ? (2 * Math.PI) : opts.radians;
    var ToRight = (opts.ToRight === undefined) ? 5 : opts.ToRight;
    var maxValue = (opts.maxValue === undefined) ? 0.6 : opts.maxValue;
    var extraX = (opts.extraX === undefined) ? 100 : opts.extraX;
    var extraY = (opts.extraY === undefined) ? 100 : opts.extraY;
    var transX = (opts.transX === undefined) ? 80 : opts.transX;
    var transY = (opts.transY === undefined) ? 30 : opts.transY;
    var factLegend = (opts.factLegend === undefined) ? 0.85 : opts.factLegend;
    var opacityArea = (opts.opacityArea === undefined) ? 0.5 : opts.opacityArea;

    var radius = fact * Math.min(height / 2, width / 2);
    var Format = d3.format('1.4f');

    var svg = d3.select('body')
        .append('svg')
        .attr('height', height + extraX)
        .attr('width', width + extraY)
        .append('g')
        .attr("transform", "translate(" + transX + "," + transY + ")")
        ;

    if (opts.title !== undefined) {

        svg.append('text')
            .attr('class', 'label')
            .style('text-anchor', 'middle')
            .style("font-family", "sans-serif")
            .style("font-size", "10px")
            .attr('x', width + 30)
            .attr('y', -10)
            .text(opts.title);
    }
    //height = height - margin.top - margin.bottom,
    //width = width - margin.left - margin.right;

    // retrieve axis labels
    var allAxis = (d[0].map(function(i, j){return i.axis}));
    var total = allAxis.length;

    // Circular levels
    for (var j = 0; j < (levels - 0); j++) {

        var levelFact = fact * radius * ((j + 1) / levels);

        svg.selectAll('.levels')
            .data(allAxis)
            .enter()
            .append('svg:line')
            .attr("x1", function(d, i){return levelFact*(1-fact*Math.sin(i*radians/total));})
            .attr("y1", function(d, i){return levelFact*(1-fact*Math.cos(i*radians/total));})
            .attr("x2", function(d, i){return levelFact*(1-fact*Math.sin((i+1)*radians/total));})
            .attr("y2", function(d, i){return levelFact*(1-fact*Math.cos((i+1)*radians/total));})
            .attr("class", "line")
            .style("stroke", "grey")
            .style("stroke-opacity", '1.0')
            .style("stroke-width", "0.5px")
            .attr("transform", "translate(" + (width/2-levelFact) + ", " + (height/2-levelFact) + ")");
    }

    // Level text for values
    for (var j = 0; j < levels; j++) {

        var levelFact = fact * radius * ((j + 1) / levels);

        svg.selectAll(".levels")
            .data([1]) //dummy data
            .enter()
            .append("svg:text")
            .attr("x", function(d){return levelFact*(1-fact*Math.sin(0));})
            .attr("y", function(d){return levelFact*(1-fact*Math.cos(0));})
            .attr("class", "legend")
            .style("font-family", "sans-serif")
            .style("font-size", "10px")
            .attr("transform", "translate(" + (width/2-levelFact + ToRight) + ", " + (height/2-levelFact) + ")")
            .attr("fill", "#737373")
            .text(Format((j+1)*maxValue/levels));
    }

    var axis = svg.selectAll(".axis")
        .data(allAxis)
        .enter()
        .append("g")
        .attr("class", "axis");

    axis.append("line")
        .attr("x1", width/2)
        .attr("y1", height/2)
        .attr("x2", function(d, i){return width/2*(1-fact*Math.sin(i*radians/total));})
        .attr("y2", function(d, i){return height/2*(1-fact*Math.cos(i*radians/total));})
        .attr("class", "line")
        .style("stroke", "grey")
        .style("stroke-width", "1px");

    axis.append("text")
        .attr("class", "legend")
        .text(function(d){return d})
        .style("font-family", "sans-serif")
        .style("font-size", "11px")
        .attr("text-anchor", "middle")
        .attr("dy", "1.5em")
        .attr("transform", function(d, i){return "translate(0, -10)"})
        .attr("x", function(d, i){return width/2*(1-factLegend*Math.sin(i*radians/total))-60*Math.sin(i*radians/total);})
        .attr("y", function(d, i){return height/2*(1-Math.cos(i*radians/total))-20*Math.cos(i*radians/total);});

    var series = 0;
    var color = d3.scale.category10();

    d.forEach(function(y, x){

        dataValues = [];
      
        svg.selectAll(".nodes")
            .data(y, function(j, i){
                dataValues.push([
                    width/2*(1-(parseFloat(Math.max(j.value, 0))/maxValue)*fact*Math.sin(i*radians/total)), 
                    height/2*(1-(parseFloat(Math.max(j.value, 0))/maxValue)*fact*Math.cos(i*radians/total))
                ]);
            });

        dataValues.push(dataValues[0]);

        svg.selectAll(".area")
            .data([dataValues])
            .enter()
            .append("polygon")
            .attr("class", "radar-chart-serie"+series)
            .style("stroke-width", "2px")
            .style("stroke", function() {
                if (opts.color !== undefined)
                    return opts.color;
                else 
                    return color(series);
            })
            .attr("points",function(d) {
                var str="";
                for(var pti=0;pti<d.length;pti++){
                    str=str+d[pti][0]+","+d[pti][1]+" ";
                }
                return str;
            })
            .style("fill", function(j, i){
                if (opts.color !== undefined)
                    return opts.color;
                else 
                    return color(series);
            })
                //    return color(series)})
            .style("fill-opacity", opacityArea)
            .on('mouseover', function (d){
                z = "polygon."+d3.select(this).attr("class");
                svg.selectAll("polygon")
                 .transition(200)
                 .style("fill-opacity", 0.1); 
                svg.selectAll(z)
                 .transition(200)
                 .style("fill-opacity", .7);
              })
            .on('mouseout', function(){
                svg.selectAll("polygon")
                 .transition(200)
                 .style("fill-opacity", opacityArea);
            })
            ;
      series++;
    });
}
