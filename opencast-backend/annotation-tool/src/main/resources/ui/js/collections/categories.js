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
 * A module representing a categories collection
 * @module collections-categories
 * @requires jQuery
 * @requires models-category
 * @requires backbone
 * @requires localstorage
 */
define(["jquery",
        "models/category",
        "backbone",
        "localstorage"],

    function ($, Category, Backbone) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Collection}
         * @augments module:Backbone.Collection
         * @memberOf module:collections-categories
         * @alias module:collections-categories.Categories
         */
        var Categories = Backbone.Collection.extend({

            /**
             * Model of the instances contained in this collection
             * @alias module:collections-categories.Categories#initialize
             */
            model       : Category,

            /**
             * Localstorage container for the collection
             * @alias module:collections-categories.Categories#localStorage
             * @type {Backbone.LocalStorgage}
             */
            localStorage: new Backbone.LocalStorage("Categories"),

            /**
             * constructor
             * @alias module:collections-categories.Categories#initialize
             */
            initialize: function (models, video) {
                _.bindAll(this, "setUrl",
                                "addCopyFromTemplate",
                                "toExportJSON");

                this.setUrl(video);
            },

            /**
             * Parse the given data
             * @alias module:collections-categories.Categories#parse
             * @param  {object} data Object or array containing the data to parse.
             * @return {object}      the part of the given data related to the categories
             */
            parse: function (data) {
                if (data.categories && _.isArray(data.categories)) {
                    return data.categories;
                } else if (_.isArray(data)) {
                    return data;
                } else {
                    return null;
                }
            },

            /**
             * Define the url from the collection with the given video
             * @alias module:collections-categories.Categories#setUrl
             * @param {Video} Video containing the categories
             */
            setUrl: function (video) {
                if (!video || !video.collection) { // If a template
                    this.url = window.annotationsTool.restEndpointsUrl + "/categories";
                    this.isTemplate = true;
                } else {  // If not a template, we add video url
                    this.url = video.url() + "/categories";
                    this.isTemplate = false;
                }

                if (annotationsTool && annotationsTool.localStorage) {
                    this.localStorage = new Backbone.LocalStorage(this.url);
                }

                this.each(function (category) {
                    category.setUrl();
                });
            },

            /**
             * Get the categories created by the current user
             * @alias module:collections-categories.Categories#getMine
             * @return {array} Array containing the list of categories created by the current user
             */
            getMine: function () {
                return this.where({isMine: true});
            },

            /**
             * Get the categories visible by everyone
             * @alias module:collections-categories.Categories#getPublic
             * @return {array} Array containing the list of categories visible by everyone
             */
            getPublic: function () {
                return this.where({isPublic: true});
            },

            /**
             * Get the collection as array with the model in JSON, ready to be exported
             * @alias module:collections-categories.Categories#toExportJSON
             * @param {boolean} withScales Define if the scales have to be included
             * @return {array} Array of json models
             */
            toExportJSON: function (withScales) {
                var categoriesForExport = [];

                this.each(function (category) {
                    categoriesForExport.push(category.toExportJSON(withScales));
                });

                return categoriesForExport;
            },

            /**
             * Add a copy from the given template to this collection
             * @alias module:collections-categories.Categories#addCopyFromTemplate
             * @param {Category} element template to copy
             * @return {Category} A copy of the given category
             */
            addCopyFromTemplate: function (element) {
                // Test if the given category is really a template
                if (!this.isTemplate && !_.isArray(element) && element.id) {
                    // Copy the element and remove useless parameters
                    var copyJSON = element.toJSON();
                    delete copyJSON.id;
                    delete copyJSON.created_at;
                    delete copyJSON.created_by;
                    delete copyJSON.updated_at;
                    delete copyJSON.updated_by;
                    delete copyJSON.deleted_by;
                    delete copyJSON.deleted_at;
                    delete copyJSON.labels;
                    // add the copy url parameter for the backend
                    copyJSON.copyUrl = "?category_id=" + element.id;

                    if (annotationsTool.localStorage) {
                        return this.create(copyJSON);
                    } else {
                        return this.create(copyJSON, {wait: true});
                    }
                }
                return null;
            }
        });
        return Categories;
    }
);