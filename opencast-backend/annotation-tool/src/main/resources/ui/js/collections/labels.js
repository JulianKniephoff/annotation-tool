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
 * A module representing a labels collection
 * @module collections-labels
 * @requires jQuery
 * @requires models-label
 * @requires backbone
 * @requires localstorage
 */
define(["jquery",
        "models/label",
        "backbone",
        "localstorage"],

    function ($, Label, Backbone) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Collection}
         * @augments module:Backbone.Collection
         * @memberOf module:collections-labels
         * @alias module:collections-labels.Labels
         */
        var Labels = Backbone.Collection.extend({

            /**
             * Model of the instances contained in this collection
             * @alias module:collections-labels.Labels#initialize
             */
            model: Label,

            /**
             * Localstorage container for the collection
             * @alias module:collections-labels.Labels#localStorage
             * @type {Backbone.LocalStorgage}
             */
            localStorage: new Backbone.LocalStorage("Labels"),

            /**
             * constructor
             * @alias module:collections-labels.Labels#initialize
             */
            initialize: function (models, category) {
                _.bindAll(this,
                        "setUrl",
                        "toExportJSON");
                this.setUrl(category);
            },

            /**
             * Parse the given data
             * @alias module:collections-labels.Labels#parse
             * @param  {object} data Object or array containing the data to parse.
             * @return {object}      the part of the given data related to the labels
             */
            parse: function (resp) {
                if (resp.labels && _.isArray(resp.labels)) {
                    return resp.labels;
                } else if (_.isArray(resp)) {
                    return resp;
                } else {
                    return null;
                }
            },

            /**
             * Get the collection as array with the model in JSON, ready to be exported
             * @alias module:collections-labels.Labels#toExportJSON
             * @return {array} Array of json models
             */
            toExportJSON: function () {
                var labelsForExport = [];

                this.each(function (label) {
                    labelsForExport.push(label.toExportJSON());
                });
                return labelsForExport;
            },

            /**
             * Define the url from the collection with the given video
             * @alias module:collections-labels.Labels#setUrl
             * @param {Category} Category containing the labels
             */
            setUrl: function (category) {
                if (!category) {
                    throw "The parent category of the labels must be given!";
                } else if (category.collection) {
                    this.url = category.url() + "/labels";
                }

                if (window.annotationsTool && annotationsTool.localStorage) {
                    this.localStorage = new Backbone.LocalStorage(this.url);
                }
            }
        });

        return Labels;
    }
);