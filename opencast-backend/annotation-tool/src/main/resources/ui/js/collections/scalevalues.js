/**
 *  Copyright 2012, Entwine GmbH, Switzerland
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
 *
 */

/**
 * A module representing a scale values collection
 * @module collections-scalevalues
 * @requires jQuery
 * @requires models-scalevalue
 * @requires backbone
 * @requires localstorage
 */
define(["jquery",
        "models/scalevalue",
        "backbone",
        "localstorage"],


    function ($, ScaleValue, Backbone) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Collection}
         * @augments module:Backbone.Collection
         * @memberOf module:collections-scalevalues
         * @alias module:collections-scalevalues.ScaleValues
         */
        var ScaleValues = Backbone.Collection.extend({

            /**
             * Model of the instances contained in this collection
             * @alias module:collections-scalevalues.ScaleValues#initialize
             */
            model: ScaleValue,

            /**
             * Localstorage container for the collection
             * @alias module:collections-scalevalues.ScaleValues#localStorage
             * @type {Backbone.LocalStorgage}
             */
            localStorage: new Backbone.LocalStorage("ScaleValue"),

            /**
             * constructor
             * @alias module:collections-scalevalues.ScaleValues#initialize
             */
            initialize: function (models, scale) {
                _.bindAll(this, "setUrl", "toExportJSON");
                this.scale = scale;
                this.setUrl(scale);
            },

            /**
             * Parse the given data
             * @alias module:collections-scalevalues.ScaleValues#parse
             * @param  {object} data Object or array containing the data to parse.
             * @return {object}      the part of the given data related to the scalevalues
             */
            parse: function (data) {
                if (data.scaleValues && _.isArray(data.scaleValues)) {
                    return data.scaleValues;
                } else if (_.isArray(data)) {
                    return data;
                } else {
                    return null;
                }
            },


            comparator: function (scaleValue) {
                return scaleValue.get("order");
            },

            /**
             * Get the collection as array with the model in JSON, ready to be exported
             * @alias module:collections-scalevalues.ScaleValues#toExportJSON
             * @return {array} Array of json models
             */
            toExportJSON: function () {
                var valueForExport = [];

                this.each(function (value) {
                    valueForExport.push(value.toExportJSON());
                });

                return valueForExport;
            },

            /**
             * Define the url from the collection with the given scale
             * @alias module:collections-scalevalues.ScaleValues#setUrl
             * @param {Scale} Scale containing the scalevalues
             */
            setUrl: function (scale) {
                if (!scale && !this.scale) {
                    throw "The parent scale of the scale value must be given!";
                } else if (scale && scale.collection) {
                    this.url = scale.url() + "/scalevalues";
                } else if (this.scale.collection) {
                    this.url = this.scale.url() + "/scalevalues";
                }

                if (annotationsTool.localStorage) {
                    this.localStorage = new Backbone.LocalStorage(this.url);
                }
            }
        });
        return ScaleValues;
    }
);