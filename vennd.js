
//// opts {
//      size_dom : [a, b]
//      jac_dom : [a, b]
//   }
//
function makeVenn(data, opts) {

    var circs = [data.ssize, data.msize];

    // size domain
    var sdom = d3.scale.linear()
        .domain(opts.size_dom)
        .range([3, 15]);

    // jaccard domain, probably isn't needed...
    var sdom = d3.scale.linear()
        .domain(opts.jac_dom)
        .range([0, 1]);

}
