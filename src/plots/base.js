/*
 * file: base.js
 * desc: Base class with attributes and methods that the majority of plot types utilize.
 * auth: TR
 */

'use strict';

//export default function() {
//
//    let exports = {},
//        // HTML element or ID the SVG should be appended to
//        element = 'body',
//        // Font to use when displaying text
//        font = 'sans-serif',
//        // Font size in pixels
//        fontSize = 12,
//        // SVG height
//        height = 600,
//        // Margin object
//        margin = {top: 50, right: 50, bottom: 50, left: 50},
//        // SVG object for the plot
//        svg = null,
//        // SVG width
//        width = 600;
//
//    /** private **/
//
//    /**
//     * Returns the width and height of the SVG while taking into account the margins.
//     */
//    exports.getHeight = function() { return height - margin.bottom - margin.top; };
//    exports.getWidth = function() { return width - margin.left - margin.right; };
//
//    /** setters/getters **/
//
//    exports.svg = function() { return svg; };
//
//    exports.element = function(_) {
//        if (!arguments.length) return element;
//        element = _;
//        return exports;
//    };
//
//    exports.font = function(_) {
//        if (!arguments.length) return font;
//        font = _;
//        return exports;
//    };
//
//    exports.fontSize = function(_) {
//        if (!arguments.length) return fontSize;
//        fontSize = +_;
//        return exports;
//    };
//
//    exports.height = function(_) {
//        if (!arguments.length) return height;
//        height = +_;
//        return exports;
//    };
//
//    exports.margin = function(_) {
//        if (!arguments.length) return margin;
//        margin = _;
//        return exports;
//    };
//
//    exports.marginBottom = function(_) {
//        if (!arguments.length) return margin.bottom;
//        margin.bottom = +_;
//        return exports;
//    };
//
//    exports.marginLeft = function(_) {
//        if (!arguments.length) return margin.left;
//        margin.left = +_;
//        return exports;
//    };
//
//    exports.marginRight = function(_) {
//        if (!arguments.length) return margin.right;
//        margin.right = +_;
//        return exports;
//    };
//
//    exports.marginTop = function(_) {
//        if (!arguments.length) return margin.top;
//        margin.top = +_;
//        return exports;
//    };
//
//    exports.width = function(_) {
//        if (!arguments.length) return width;
//        width = +_;
//        return exports;
//    };
//
//    return exports;
//}

export default class Base {

    constructor() {

        // HTML element or ID the SVG should be appended to
        this._element = 'body';
        // Font to use when displaying text
        this._font = 'sans-serif';
        // Font size in pixels
        this._fontSize = 12;
        // SVG height
        this._height = 500;
        // Margin object
        this._margin = {top: 50, right: 50, bottom: 50, left: 50};
        // SVG object for the plot
        this._svg = null;
        // SVG width
        this._width = 500;
    }

    /**
     * Returns the width and height of the SVG while taking into account the margins.
     */
    getHeight() { return this._height - this._margin.bottom - this._margin.top; }
    getWidth() { return this._width - this._margin.left - this._margin.right; }

    /** setters/getters **/

    svg() { return this._svg; }

    element(_) {
        if (!arguments.length) return this._element;
        this._element = _;
        return this;
    }

    font(_) {
        if (!arguments.length) return this._font;
        this._font = _;
        return this;
    }

    fontSize(_) {
        if (!arguments.length) return this._fontSize;
        this._fontSize = +_;
        return this;
    }

    height(_) {
        if (!arguments.length) return this._height;
        this._height = _;
        return this;
    }

    margin(_) {
        if (!arguments.length) return this._margin;
        this._margin = _;
        return this;
    }

    marginBottom(_) {
        if (!arguments.length) return this._margin.bottom;
        this._margin.bottom = +_;
        return this;
    }

    marginLeft(_) {
        if (!arguments.length) return this._margin.left;
        this._margin.left = +_;
        return this;
    }

    marginRight(_) {
        if (!arguments.length) return this._margin.right;
        this._margin.right = +_;
        return this;
    }

    marginTop(_) {
        if (!arguments.length) return this._margin.top;
        this._margin.top = +_;
        return this;
    }

    width(_) {
        if (!arguments.length) return this._width;
        this._width = +_;
        return this;
    }

}
