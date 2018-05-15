/**
 *  Copyright 2018, ELAN e.V., Germany
 *  Licensed under the Educational Community License, Version 2.0
 *  (the "License"); you may not use this file except in compliance
 *  with the License. You may obtain a copy of the License at
 *
 *  http://www.osedu.org/licenses/ECL-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an "AS IS"
 *  BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 *  or implied. See the License for the specific language governing
 *  permissions and limitations under the License.
 */

define([
    "underscore",
    "moment"
], function (
    _,
    moment
) { "use strict";

// TODO Put (some of) these in `_` using `_.mixin`?

// TODO I don't like that this is here;
//   I want it on top of the file.
//   But then I would have to call this variable `exports`
/**
 * A module containing helper functions needed in many different places
 * @exports util
 */
var util = {
    /**
     * Check whether two closed intervals overlap.
     * Nothe that the <code>start</code> and <code>end</code> properties of the given objects
     * all have to be comparable with one another.
     * @param {Object} interval1 An object representing the first interval.
     * @param {Number} interval1.start The start of the interval
     * @param {Number} interval1.end The end of the interval
     * @param {Object} interval2 The second interval; see <code>interval1</code>
     * @return {Boolean} <code>true</code> if the two closed intervals overlap,
     *     i.e. also when they just touch; otherwise <code>false</code>
    */
    overlaps: function (interval1, interval2) {
        return interval1.start <= interval2.end && interval2.start <= interval1.end;
    },

    /**
     * Tries to parse many different things to a date.
     * @param value A thing hopefully representing a date
     * @return {Date|undefined} <code>value</code> interpreted as a <code>Date</code>
     *     or <code>undefined</code> if that failed
     */
    parseDate: function (value) {
        var date = new Date(value);
        return _.isNaN(date.getTime()) ? undefined : date;
    },

    /**
     * Formats the given date
     * @param {Date} date The date to format
     * @return {String} A textual representation of the given date
     */
    formatDate: function (date) {
        return moment(date).format("L");
    },

    /**
     * Test whether two values represent the same date.
     * The values are converted to dates using {@link parseDate}
     * before comparing their respective timestamps.
     * @param value1 The first value
     * @param value2 The second value
     * @return {Boolean} <code>true</code> if the values represent the same date,
     *     <code>false</code> otherwise
     */
    datesEqual: function (value1, value2) {
        return util.parseDate(value1).getTime() === util.parseDate(value2).getTime();
    },

    /**
     * Parse the given parameter to JSON if given as String
     * @alias module:models-resource.Resource.parseJSONString
     * @param  parameter the parameter as String
     * @return {Object} parameter as JSON object
     */
    parseJSONString: function (parameter) {
        if (parameter && _.isString(parameter)) {
            try {
                parameter = JSON.parse(parameter);
            } catch (e) {
                console.warn("Can not parse parameter \"" + parameter + "\": " + e);
                return undefined;
            }
        } else if (!_.isObject(parameter) || _.isFunction(parameter)) {
            return undefined;
        }

        return parameter;
    },

    /**
     * A callback to compare two values
     * @callback comparator
     * @param a The first object
     * @param b The second object
     * @return {Number} A negative number if <code>a</code> is less than <code>b</code>,
     *     a positive number if <code>a</code> is larger than <code>b</code>,
     *     and zero if they are euqal.
     */

    /**
     * Compose an array of comparators into one,
     * comparing inputs lexicographically based on the given functions.
     * @param {comparator[]} comparators The base comparators to compose
     * @return {comparator} The lexicographic composition of the given comparators
     */
    lexicographic: function (comparators) {
        return function (a, b) {
            for (var i = 0; i < comparators.length; ++i) {
                var d = comparators[i](a, b);
                if (d) return d;
            }
            return 0;
        };
    },

    /**
     * Create a comparator based on whether a given predicate applies to a function or not
     * @param {predicate} predicate The predicate to test
     * @return {comparator} A comparator that sorts the first value before the second
     *     if the predicate is true for it, and vice versa.
     */
    firstWith: function (predicate) {
        return function (a, b) {
            if (predicate(a)) return -1;
            if (predicate(b)) return 1;
            return 0;
        };
    },

    /**
     * Coerce anything as an array
     * @param object Any object that is to be coerced to an array
     * @return {Array} If the argument is already an array it is returned as is;
     *     otherwise a singleton array containing it is returned.
     */
    array: function (object) {
        if (Array.isArray(object)) {
            return object;
        } else {
            return [object];
        }
    },

    /**
     * Map of the current URLs query parameters
     * @type {Object}
     */
    queryParameters: _.chain(window.location.search.slice(1).split("&"))
        .map(function (keyValuePair) { return keyValuePair.split("="); })
        .object()
        .mapObject(decodeURIComponent)
        .value(),

    // TODO Ugh this name
    /**
     * A combinator calling the given method on its argument.
     * @param {String} name The name of the method to call on the argument of the returned function
     */
    caller: function (name) {
        return function (o) {
            return o[name].apply(o, arguments);
        };
    },

    /**
     * A function mapping names to values
     * @callback stringMap
     * @param {String} a The name to return the value for
     * @return The value belonging to the given key
     */

    // TODO This name is shitty
    /**
     * Dynamically extend a given object with definitions for certain keys
     * @param {Object} object The object to extend
     * @param {String[]} properties The properties to add to the object
     * @param {stringMap} definition A function mapping a property name to its definition
     * @return {Object} The extended object
     */
    extend: function (object, properties, definition) {
        return _.extend(object, _.object(_.map(properties, function (property) {
            return [property, definition(property)];
        })));
    }
};

// TODO What else belongs here?
util.extend(util, [
    // TODO Is it worth creating reducing redundancy in the creation
    //   when you get it back in the docs?!
    //   But you will have to write it this way anyway.
    //   Because you can't define these methods in the exports.
    //   The only thing you would save is `@static`, right?
    /**
     * Event handler to prevent the browser's default behavior
     * @function preventDefault
     * @static
     * @param {Event} event The event to handle
     */
    "preventDefault",
    /**
     * Event handler to stop events from propagating further up/down the chain
     * @function stopPropagation
     * @static
     * @param {Event} event The event to handle
     */
    "stopPropagation",
    /**
     * Event handler to stop the processing of an event completely
     * @function stopImmediatePropagation
     * @static
     * @param {Event} event The event to handle
     */
    "stopImmediatePropagation"
], util.caller);

return util;

});
