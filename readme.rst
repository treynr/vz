
vz
==

``vz`` is a work-in-progress, reusable visualization and charting library built on
top of `D3.js`__.
The library currently supports 13 different chart types and exposes a
chaining-based API similar to the one used by D3.
Almost all stylistic aspects of each chart can be modified using chart API or
using D3 selections.

.. __: https://github.com/d3/d3

Usage
-----

See the examples directory for somewhat comprehensive examples.
To use one of the plots, include it at the top of an HTML page:

.. code:: html

    <script src="bar.js" type="text/javascript"></script>

Ensure the data to be visualized is in the correct format (varies by plot type):

.. code:: javascript

    let data = [
        {x: 'A', y: 10, se: 4},
        {x: 'B', y: 20, se: 2},
        {x: 'C', y: 30, se: 6},
        {x: 'D', y: 40, se: 2},
    ];

Then call the corresponding plot function, specify any custom options, and end
with a call to the draw function:

.. code:: javascript

    let plot = bar()
        .data(data)
        .width(350)
        .height(300)
        .yDomain([0, 45])
        .xLabel('X Axis Label')
        .yLabel('Y Axis Label')
        .fontSize(13)
        .noXLine(true)
        .draw();


Installation and development
----------------------------

Compiling and bundling requires the following dependencies.

- node__
- yarn__

Additionally, `D3.js`__, lodash__, and webpack__ are also required but yarn
should take care of installing these.

.. __: https://nodejs.org/en/
.. __: https://legacy.yarnpkg.com/lang/en/
.. __: https://d3js.org/
.. __: https://lodash.com/
.. __: https://webpack.js.org/

Start by cloning the github repo:

.. code:: text

    $ git clone https://github.com/treynr/vz.git
    $ cd vz

Install the required dependencies:

.. code:: text

    $ yarn install

To build development modules (unminified):

.. code:: text

    $ yarn run dev

Development modules are generated and compiled to the `dist/development`
directory.
To build for minified modules for production:

.. code:: text

    $ yarn run build

These are stored in `dist/release`.
