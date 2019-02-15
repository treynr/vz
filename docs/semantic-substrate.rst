
semantic-substrate.js
=====================

Renders graphs as a 2D semantic substrate. 
See [Shneiderman2006]_ for a formal description of semantic substrates.

Input data
----------

The JSON object used as input should be in the following format.

.. code:: javascript

    let data = {

        /**
          * An array of objects, each of which represents a cell of the heatmap. Each
          * value object must contain three properties: x, y, and value. The x and y
          * properties correspond to column and row labels respectively, and the value
          * property specifies a numeric value used to color the heatmap cell.
          * Each object can contain an optional property, altValue, which the heatmap
          * will rendere if the useAltValues option is set to true.
          */
        nodes: [

            {x: 1, y: 1, id: 'a'},
            {x: 2, y: 3, id: 'b'},
            {x: 4, y: 2, id: 'c'},
            {x: 4, y: 5, id: 'd'}
        ],

        edges: [

            {source: 'a', target: 'b'},
            {source: 'a', target: 'c'},
            {source: 'b', target: 'c'},
            {source: 'b', target: 'd'},
            {source: 'c', target: 'd'}
        ]
    };

.. code:: javascript

        /**
          * Each value object (in the values array) can have zero or more of the 
          * following optional items which affect heatmap rendering options and will 
          * override any of the API options below.
          */
          let value = {

             // Fill color for the given cell, not recommended since this will override
             // the value scale colors.
             fill: '#000000',

             // Causes the viz to render a pop-up text when the user hovers over a cell
             text: 'some text label',
          };


API
---

heatmap.\ \ **altAxisLabels**\ ([*boolean*])

If *boolean* is ``true``, positions axis labels within the plot instead of outside.
The default value is ``false``.
The function returns the current value if no argument is given.


heatmap.\ \ **backgroundColor**\ ([*color*])

If a background is drawn, this will set the background color to the given ``color``.
The default color is ``#cecece``.
The function returns the current value if no argument is given.


heatmap.\ \ **collisionForce**\ ([*radius*])

If the ``useForce`` option is set to ``true``, this will set the collision force radius
to the given **radius**.
The default **radius** is ``5``.
The function returns the current value if no argument is given.


heatmap.\ \ **collisionForce**\ ([*radius*])

If the ``useForce`` option is set to ``true``, this will set the collision force radius
to the given **radius**.
The default **radius** is ``5``.
The function returns the current value if no argument is given.


heatmap.\ \ **edgeOpacity**\ ([*opacity*])

Sets the opacity of the graph edges to the given value.
The **opacity** value should be in the range [0, 1].
The default **opacity** is ``0.6``.
The function returns the current value if no argument is given.


heatmap.\ \ **edgeStroke**\ ([*stroke*])

Sets the edge color to the given value.
The default **stroke** is ``#999999``.
The function returns the current value if no argument is given.


heatmap.\ \ **edgeWidth**\ ([*width*])

Sets the width of the graph's edges to the given **width**.
The default **width** is ``2``.
The function returns the current value if no argument is given.

// Transparency for rendered edges
edgeOpacity = 0.6,
// Edge color
edgeStroke = '#999999',
// Edge width
edgeStrokeWidth = 2,
// HTML element or ID the SVG should be appended to
element = 'body',
// Font to use when displaying text
font = 'sans-serif',
// Font size in pixels
fontSize = 12,
// SVG height
height = 600,
margin = {top: 50, right: 50, bottom: 50, left: 50},
// Color used to fill in nodes
nodeFill = '#d62333',
// Radius of rendered nodes in the graph
nodeRadius = 4,
// Color used when drawing strokes around the nodes
nodeStroke = '#ffffff',
// Width of the stroke around nodes
nodeStrokeWidth = 2,
// Remove nodes that don't have edges to other nodes
removeLoners = true,
manyBodyForce = null,

heatmap.\ **data**\ ([*data*])

Sets the current data object used to draw the plot.
The function returns the current value if no argument is given.


heatmap.\ **dendrogramSize**\ ([*size*])

Sets the height (or width if positioned across left/right axes) of the dendrogram
if clustering data is provided to the heatmap.
The default size is the margin size of the axis the dendrogram is rendered along.
The function returns the current value if no argument is given.


heatmap.\ **dendrogramPadding**\ ([*padding*])

Extra padding (in pixels) for the dendrogram position.
The default padding is 0.
The function returns the current value if no argument is given.


heatmap.\ **dendrogramStroke**\ ([*stroke*])

Stroke color for dendrogram lines.
The default stroke color is ``#222222``.
The function returns the current value if no argument is given.


heatmap.\ **dendrogramStrokeWidth**\ ([*width*])

Stroke width for dendrogram lines.
The default width is ``1``.
The function returns the current value if no argument is given.


heatmap.\ **element**\ ([*element*])

Specifies what HTML element the SVG should be appended to.
The default element is ``body``.
The function returns the current value if no argument is given.


heatmap.\ **fontFamily**\ ([*font*])

Sets the font family to use when drawing text. 
The default font is ``sans-serif``.
The function returns the current value if no argument is given.


heatmap.\ **fontSize**\ ([*size*])

Sets the font size to use when drawing text. 
The default font size is 11.
The function returns the current value if no argument is given.


heatmap.\ **fontWeight**\ ([*weight*])

Sets the font weight to use when drawing text. 
The default font weight is 'normal'.
The function returns the current value if no argument is given.


heatmap.\ **height**\ ([*height*])

Sets the font weight to use when drawing text. 
The default font weight is 'normal'.
The function returns the current value if no argument is given.


heatmap.\ **invertAltValueScale**\ ([*boolean*])

If set to true, inverts the alt. value scale.
The default is false. 
The function returns the current value if no argument is given.


heatmap.\ **margin**\ ([*margin*])

Sets the margin object. 
The margin object is used to add spacing around the plot.
The default margin is:

.. code:: javascript

    {
        top: 90,
        right: 90,
        bottom: 90,
        left: 90
    }

The function returns the current value if no argument is given.


heatmap.\ **mirrorAxes**\ ([*boolean*])

If true, and row labels == column labels, the plot will remove the redundant half of the
heatmap. 
If set to true the diagonal portion of the heatmap is also removed.
The function returns the current value if no argument is given.
By default, this option is set to ``false``.


heatmap.\ **renderIdentities**\ ([*boolean*])

This option only has an effect if *mirrorAxes* is set to ``true``.
If this option is also set to ``true`` then the middle diagonal of the heatmap,
which contains identity values (row == column) will be rendered.
By default, this option is set to ``false``.
The function returns the current value if no argument is given.


heatmap.\ **rotateXLabels**\ ([*boolean*])

If ``true``, this will force x-axis labels to be rotated ~45 degrees, preventing long
labels from overlapping with one another.
By default, this option is set to ``false``.
The function returns the current value if no argument is given.


heatmap.\ **roundFactor**\ ([*rounding*])

If ``rounding`` is given, this round out any SVG ``<rect>`` objects using the ``rx`` 
and ``ry`` attributes.
By default, this option is set ``0``.
The function returns the current value if no argument is given.


heatmap.\ **useAltValues**\ ([*boolean*])

If ``true``, this option will force the heatmap to render any secondary values
supplied by the user.
By default, this option is set to ``false``.
The function returns the current value if no argument is given.


heatmap.\ **yAxisAlign**\ ([*alignment*])

Specifies the position of the y-axis.
Valid y-axis positions are on either the right or left side of the heatmap:

.. code:: javascript

    Align.RIGHT
    Align.LEFT

By default, this option is set to ``Align.RIGHT``.
The function returns the current value if no argument is given.


heatmap.\ **xAxisAlign**\ ([*alignment*])

Specifies the position of the x-axis.
Valid x-axis positions are on either the bottom or top of the heatmap:

.. code:: javascript

    Align.BOTTOM
    Align.TOP

By default, this option is set to ``Align.BOTTOM``.
The function returns the current value if no argument is given.


heatmap.\ **xDomain**\ ([*domain*])

Specifies the input domain for the x-axis scale.
The domain should be a set of discrete categories or labels. 
By default, this option is uses the set of x labels given in input dataset.
The function returns the current value if no argument is given.


heatmap.\ **xLabel**\ ([*label*])

Text label for the x-axis
By default, this option is ``null``.
The function returns the current value if no argument is given.


heatmap.\ **xLabelPad**\ ([*padding*])

Padding, in pixels, for the x-axis label.
By default, this option is ``50``.
The function returns the current value if no argument is given.


heatmap.\ **yDomain**\ ([*domain*])

Specifies the input domain for the y-ayis scale.
The domain should be a set of discrete categories or labels. 
By default, this option is uses the set of y labels given in input dataset.
The function returns the current value if no argument is given.


heatmap.\ **yLabel**\ ([*label*])

Text label for the y-ayis
By default, this option is ``null``.
The function returns the current value if no argument is given.


heatmap.\ **yLabelPad**\ ([*padding*])

Padding, in pixels, for the y-ayis label.
By default, this option is ``50``.
The function returns the current value if no argument is given.


heatmap.\ **width**\ ([*width*])

SVG width in pixels.
By default, this option is ``600``.
The function returns the current value if no argument is given.

