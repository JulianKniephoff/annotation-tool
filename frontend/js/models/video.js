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
 * A module representing the video model
 * @module models-video
 * @requires jquery
 * @requires underscore
 * @requires collections-categories
 * @requires collections-scales
 * @requires ACCESS
 * @requires backbone
 * @requires models/resource
 */
define(["jquery",
        "underscore",
        "collections/tracks",
        "collections/categories",
        "collections/scales",
        "access",
        "backbone",
        "models/resource"],

    function ($, _, Tracks, Categories, Scales, ACCESS, Backbone, Resource) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Model}
         * @augments module:Backbone.Model
         * @memberOf module:models-video
         * @alias module:models-video.Video
         */
        var Video = Resource.extend({

            /**
             * Default models value
             * @alias module:models-video.Video#defaults
             */
            defaults: {
                access: ACCESS.PUBLIC
            },

            /**
             * Constructor
             * @alias module:models-video.Video#initialize
             * @param {object} attr Object literal containing the model initialion attribute.
             */
            initialize: function (attr) {

                _.bindAll(this,
                        "getTrack",
                        "getAnnotation",
                        "loadTracks");

                Resource.prototype.initialize.apply(this, arguments);

                // Check if tracks are given
                if (attr.tracks && _.isArray(attr.tracks)) {
                    this.set({tracks: new Tracks(attr.tracks, this)});
                }  else {
                    this.set({tracks: new Tracks([], this)});
                }

                // Check if supported categories are given
                if (attr.categories && _.isArray(attr.categories)) {
                    this.set({categories: new Categories(attr.categories, this)});
                } else {
                    this.set({categories: new Categories([], this)});
                }

                // Check if the possible video scales are given
                if (attr.scales && _.isArray(attr.scales)) {
                    this.set({scales: new Scales(attr.scales, this)});
                } else {
                    this.set({scales: new Scales([], this)});
                }

                if (attr.tags) {
                    this.set({tags: this.parseJSONString(attr.tags)});
                }

                if (attr.id) {
                    this.get("categories").fetch({async: false});
                    this.get("tracks").fetch({async: false});
                    this.get("scales").fetch({async: false});
                }

                // Add backbone events to the model
                _.extend(this, Backbone.Events);

                // Define that all post operation have to been done through PUT method
                this.noPOST = true;
            },

            /**
             * Parse the attribute list passed to the model
             * @alias module:models-video.Video#parse
             * @param  {object} data Object literal containing the model attribute to parse.
             * @return {object}  The object literal with the list of parsed model attribute.
             */
            parse: function (data) {
                var attr = data.attributes ? data.attributes : data;

                attr.created_at = attr.created_at !== null ? Date.parse(attr.created_at): null;
                attr.updated_at = attr.updated_at !== null ? Date.parse(attr.updated_at): null;
                attr.deleted_at = attr.deleted_at !== null ? Date.parse(attr.deleted_at): null;
                attr.settings   = this.parseJSONString(attr.settings);

                // Parse tags if present
                if (attr.tags) {
                    attr.tags = this.parseJSONString(attr.tags);
                }

                if (data.attributes) {
                    data.attributes = attr;
                } else {
                    data = attr;
                }

                return data;
            },

            /**
             * Validate the attribute list passed to the model
             * @alias module:models-video.Video#validate
             * @param  {object} data Object literal containing the model attribute to validate.
             * @return {string}  If the validation failed, an error message will be returned.
             */
            validate: function (attr) {
                var categories,
                    scales,
                    self = this;

                var invalidResource = Resource.prototype.validate.call(this, attr, {
                    onIdChange: function () {
                        this.setUrl();

                        categories = this.attributes.categories;
                        scales     = this.attributes.scales;

                        this.loadTracks();

                        if (scales && (scales.length) === 0) {
                            scales.fetch({
                                async: false,
                                success: function () {
                                    self.scalesReady = true;
                                    if (categories && (categories.length) === 0) {
                                        categories.fetch({
                                            async: false,
                                            success: function () {
                                                self.categoriesReady = true;
                                                if (self.tracksReady && self.categoriesReady && self.scalesReady) {
                                                    self.trigger("ready");
                                                    self.attributes.ready = true;
                                                }
                                            }
                                        });
                                    } else if (self.tracksReady && self.categoriesReady && self.scalesReady) {
                                        self.trigger("ready");
                                        self.attributes.ready = true;
                                    }
                                }
                            });
                        }
                    }
                });
                if (invalidResource) return invalidResource;

                if (attr.tracks && !(attr.tracks instanceof Tracks)) {
                    return "'tracks' attribute must be an instance of 'Tracks'";
                }
            },

            loadTracks: function () {
                var tracks = this.attributes.tracks,
                    self = this;

                if (tracks && (tracks.length) === 0) {
                    tracks.fetch({
                        async  : false,
                        success: function () {
                            self.tracksReady = true;

                            if (self.tracksReady && self.categoriesReady && self.scalesReady) {
                                self.trigger("ready");
                                self.attributes.ready = true;
                            }
                        }
                    });
                }
            },

            /**
             * Modify the current url for the tracks collection
             * @alias module:models-video.Video#setUrl
             */
            setUrl: function () {
                if (this.attributes.tracks) {
                    this.attributes.tracks.setUrl(this);
                }

                if (this.attributes.categories) {
                    this.attributes.categories.setUrl(this);
                }

                if (this.attributes.scales) {
                    this.attributes.scales.setUrl(this);
                }
            },

            /**
             * Get the track with the given id
             * @alias module:models-video.Video#getTrack
             * @param  {integer} trackId The id from the wanted track
             * @return {Track}           The track with the given id
             */
            getTrack: function (trackId) {
                if (_.isUndefined(this.tracks)) {
                    this.tracks = this.get("tracks");
                }

                return this.tracks.get(trackId);
            },

            /**
             * Get the annotation with the given id on the given track
             * @alias module:models-video.Video#getAnnotation
             * @param  {integer} annotationId The id from the wanted annotation
             * @param  {integer} trackId      The id from the track containing the annotation
             * @return {Track}                The annotation with the given id
             */
            getAnnotation: function (annotationId, trackId) {
                var track = this.getTrack(trackId),
                    tmpAnnotation;

                if (track) {
                    return track.getAnnotation(annotationId);
                } else {
                    this.get("tracks").each(function (trackItem) {
                        tmpAnnotation = trackItem.getAnnotation(annotationId);
                        if (!_.isUndefined(tmpAnnotation)) {
                            return tmpAnnotation;
                        }
                    }, this);
                    return tmpAnnotation;
                }
            },

            /**
             * Override the default toJSON function to ensure complete JSONing.
             * @alias module:models-video.Video#toJSON
             * @return {JSON} JSON representation of the instane
             */
            toJSON: function () {
                var json = $.proxy(Backbone.Model.prototype.toJSON, this)();
                if (json.tags) {
                    json.tags = JSON.stringify(json.tags);
                }
                delete json.tracks;
                delete json.categories;
                delete json.scales;

                return json;
            }
        });
        return Video;
    }
);