
heatmap.js
==========

Draws heatmaps.

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
        values: [

            {x: 'A', y: 'B', value: 0.2},
            {x: 'A', y: 'C', value: 0.4},
            {x: 'B', y: 'C', value: 0.8, altValue: 0.05}
        ],

        /**
          * An array of objects where each object represents clustering data associated
          * with the given values array. A dendrogram is rendered using this clustering 
          * data. Each cluster object must contain two properties: axis and hierarchy.
          * The axis property specifies the side on which the dendrogram is drawn and
          * should be one of the Alignment values. The hierarchy property is a
          * d3.hierarchy object.
        clusters: [

            {axis: Align.LEFT, hierarchy: valueHierarchy}
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

heatmap.\ \ **altCellStroke**\ ([*color*])

If *color* is specified, sets the stroke color used for drawing heatmap cells
with alternative values.
If *color* is not specified, returns the current stroke color which defaults to
``#000000``.
*color* can be any color type (string, RGB object, etc.) supported by D3.


heatmap.\ **altCellStrokeWidth**\ ([*width*])

If *width* is specified, this sets the size of the stroke used when drawing 
heatmap cells with alternative values.
If *width* is not specified, returns the current stroke width which defaults
to 1.


heatmap.\ **altThresholdComparator**\ ([*func*])

If *func* is specified, sets the alternative value comparator to the given
comparison function.
The comparator is used to filter out cells with alt. values that don't meet a given
threshold.
The default function is greater than (>).
The function returns the current comparator if no argument is given.


heatmap.\ **altValueDomain**\ ([*domain*])

If the useAltValues is true, sets the alternative value input domain to the given array.
If no domain is provided, one is automatically constructed using d3.extent. 
The function returns the current comparator if no argument is given.


heatmap.\ **altValueThreshold**\ ([*threshold*])

Sets the threshold to use when filtering out cells with alt. values. 
A quantized scale is used to convert values into appropriate color bins.
The default threshold is 1.0.
The function returns the current value if no argument is given.


heatmap.\ **altValueRange**\ ([*range*])

Sets the range of sizes to use when drawing cells with alt. values. 
The default range is [x, m], where *m* is based on the maximum width and height of
a single heatmap cell.
The function returns the current value if no argument is given.


heatmap.\ **cellAlignHorizontal**\ ([*alignment*])

Sets the horizontal position for the first cell of the heatmap.
The default, ``Align.LEFT``, causes the first cell to be drawn on the left side of the
plot.
The function returns the current value if no argument is given.


heatmap.\ **cellAlignVertical**\ ([*alignment*])

Sets the vertical position for the first cell of the heatmap.
The default, ``Align.BOTTOM``, causes the first cell to be drawn on the bottom side of the
plot.
The function returns the current value if no argument is given.


heatmap.\ **cellStroke**\ ([*stroke*])

Sets the stroke color used when drawing heatmap cells.
The color passed into this function can be any color type (string, RGB object, etc.)
supported by D3.
The default stroke color is #000000.
The function returns the current stroke color if no argument is given.


heatmap.\ **cellStrokeWidth**\ ([*width*])

Sets the size of the stroke used when drawing heatmap cells.
The default width is 1.
The function returns the current value if no argument is given.


heatmap.\ **colorDomain**\ ([*domain*])

Sets the value domain used when coloring heatmap cells.
If no domain is provided then d3.extent is used to create the domain from the values
array found in the input data.
The function returns the current value if no argument is given.


heatmap.\ **numColors**\ ([*number*])

Sets the number of colors to use when coloring heatmap cells.
A quantized scale is used to convert values into appropriate color bins.
The default number of colors used is 5.
The function returns the current value if no argument is given.


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


heatmap.\ **invertAltValueScale**\ ([*bool*])

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

..code:: javascript

    Align.RIGHT
    Align.LEFT

By default, this option is set to ``Align.RIGHT``.
The function returns the current value if no argument is given.


heatmap.\ **xAxisAlign**\ ([*alignment*])

Specifies the position of the x-axis.
Valid x-axis positions are on either the bottom or top of the heatmap:

..code:: javascript

    Align.BOTTOM
    Align.TOP

By default, this option is set to ``Align.BOTTOM``.
The function returns the current value if no argument is given.


heatmap.\ **xDomain**\ ([*domain*])

Specifies the input domain for the x-axis scale.
The domain should be a set of discrete categories or labels. 
By default, this option is uses the set of x labels given in input dataset.
The function returns the current value if no argument is given.


heatmap.\ **xLabel**\ ([*domain*])

Text label for the x-axis
By default, this option is ``null``.
The function returns the current value if no argument is given.


heatmap.\ **xLabelPad**\ ([*domain*])

Padding, in pixels, for the x-axis label.
By default, this option is ``50``.
The function returns the current value if no argument is given.


heatmap.\ **yDomain**\ ([*domain*])

Specifies the input domain for the y-ayis scale.
The domain should be a set of discrete categories or labels. 
By default, this option is uses the set of y labels given in input dataset.
The function returns the current value if no argument is given.


heatmap.\ **yLabel**\ ([*domain*])

Teyt label for the y-ayis
By default, this option is ``null``.
The function returns the current value if no argument is given.


heatmap.\ **yLabelPad**\ ([*domain*])

Padding, in piyels, for the y-ayis label.
By default, this option is ``50``.
The function returns the current value if no argument is given.


heatmap.\ **width**\ ([*domain*])

SVG width in pixels.
By default, this option is ``600``.
The function returns the current value if no argument is given.

