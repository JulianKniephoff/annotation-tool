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
 * A module representing a tracks collection
 * @module collections-tracks
 */
define(["underscore",
        "models/track",
        "backbone"],

    function (_, Track, Backbone) {

        "use strict";

        var EVENTS = {
            VISIBILITY : "visiblity",
            SELECTED   : "selected_track"
        },

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Collection}
         * @augments module:Backbone.Collection
         * @memberOf module:collections-tracks
         * @alias module:collections-tracks.Tracks
         */
        Tracks = Backbone.Collection.extend({

            /**
             * Model of the instances contained in this collection
             * @alias module:collections-tracks.Tracks#initialize
             */
            model: Track,

            /**
             * List of visible tracks
             * @type {Array}
             */
            visibleTracks: [],

            /**
             * constructor
             * @alias module:collections-tracks.Tracks#initialize
             */
            initialize: function (models, options) {
                _.bindAll(this, "showTracks",
                                "showTracksById",
                                "hideTracks",
                                "isTrackVisible",
                                "getTracksForLocalStorage",
                                "getAllCreators",
                                "showTracksByCreators");

                this.video = options.video;

                this.on("add", function (track) {
                    // Show the new track
                    this.showTracks(track, true);

                    // Select the new track
                    annotationTool.selectedTrack = track;
                });
            },

            /**
             * Parse the given data
             * @alias module:collections-tracks.Tracks#parse
             * @param  {object} data Object or array containing the data to parse.
             * @return {object}      the part of the given data related to the tracks
             */
            parse: function (data) {
                if (data.tracks && _.isArray(data.tracks)) {
                    return data.tracks;
                } else if (_.isArray(data)) {
                    return data;
                } else {
                    return null;
                }
            },

            /**
             * Get the tracks created by the current user
             * @alias module:collections-tracks.Tracks#getMine
             * @return {array} Array containing the list of tracks created by the current user
             */
            getMine: function () {
                return this.where({isMine: true});
            },

            /**
             * Simulate access to limited track for localStorage prototype.
             * @alias module:collections-tracks.Tracks#getVisibleTracks
             * @return {array} Array containing the list of the visible tracks
             */
            getTracksForLocalStorage: function () {
                return this.remove(this.where({isMine: false, access: 0}));
            },

            /**
             * Get the tracks currently visible in the tool's views
             * @return {array} an array containing the visible tracks
             */
            getVisibleTracks: function () {
                return this.visibleTracks;
            },

            /**
             * Get all the different public tracks creators 
             * @alias module:collections-tracks.Tracks#getAllCreators
             * @return {Array} the array containing a list of creator with their nickname and id as properties.
             * @example
             * {
             *     id       : "c12",
             *     nickname : "Didi"
             * }
             */
            getAllCreators: function () {
                var creatorsSets = this.groupBy(function (track) {
                                            return track.get(Track.FIELDS.CREATED_BY);
                                        }),
                    creators = [];

                _.each(creatorsSets, function (tracks) {
                    var visible = true;

                    _.each(tracks, function (track) {
                        if (!track.get(Track.FIELDS.VISIBLE)) {
                            visible = false;
                        }
                    }, this);

                    creators.push({
                        "id"       : tracks[0].get(Track.FIELDS.CREATED_BY),
                        "nickname" : tracks[0].get(Track.FIELDS.CREATED_BY_NICKNAME),
                        "visible"  : visible
                    });
                }, this);

                return creators;
            },

            showTracksByCreators: function (usersIds) {
                var creatorsSets = this.groupBy(function (track) {
                                            return track.get("created_by");
                                        }),
                    tracksIds = [];

                _.each(creatorsSets, function (tracks, index) {
                    if (_.contains(usersIds, index)) {
                        _.each(tracks, function (track) {
                            tracksIds.push(track.get("id"));
                        }, this);
                    }
                }, this);

                this.showTracksById(tracksIds);
            },

            /**
             * Displays the tracks  with the given Ids and hide the current displayed tracks.
             * @param  {array} tracks an array containing the tracks ids to display
             */
            showTracksById: function (ids) {
                var tracks = [];

                _.each(ids, function (id) {
                    tracks.push(this.get(id));
                }, this);

                this.showTracks(tracks);
            },

            /**
             * Displays the given tracks and hide the current displayed tracks.
             * @param  {array} tracks an array containing the tracks to display
             * @param  {boolean} keepPrevious define if the previous visible tracks should be kept if enough place
             */
            showTracks: function (tracks, keepPrevious) {
                var max = annotationTool.MAX_VISIBLE_TRACKS || Number.MAX_VALUE,
                    self = this,
                    selectedTrack = annotationTool.selectedTrack,
                    showTrack = function (track) {
                        track.set(Track.FIELDS.VISIBLE, true);
                        self.visibleTracks.push(track);
                    },
                    tracksToHide = this.visibleTracks,
                    i;

                if (_.isUndefined(tracks)) {
                    return;
                } else if (!_.isArray(tracks)) {
                    tracks = [tracks];
                }

                if (tracks.length > max) {
                    console.warn("The list of tracks to show is higher than the maximum number of visible tracks. \
                                    Only the first " + max + " will be displayed.");

                    for (i = tracks.length - 1; i >= max; i--) {
                        tracks.splice(i, 1);
                    }
                }

                if (keepPrevious && tracks.length < max) {
                    tracksToHide = [];
                    for (i = 0; i < ((this.visibleTracks.length - max) + tracks.length); i++) {
                        tracksToHide.push(this.visibleTracks[i]);
                    }
                }

                // Remove the current visible track
                this.hideTracks(tracksToHide);

                _.each(tracks, function (track) {
                    if (!track.get("annotationsLoaded")) {
                        track.fetchAnnotations();
                    }
                    showTrack(track);
                }, this);

                if (_.isUndefined(selectedTrack) || (!_.isUndefined(selectedTrack) && !selectedTrack.get(Track.FIELDS.VISIBLE))) {
                    selectedTrack = _.find(this.visibleTracks, function (track) {
                                        return track.get("isMine");
                                    }, this);
                    annotationTool.selectTrack(selectedTrack);
                }

                annotationTool.selectTrack(selectedTrack);

                this.trigger(EVENTS.VISIBILITY, this.visibleTracks);
            },

            isTrackVisible: function (id) {
                return !_.isUndefined(_.find(this.visibleTracks, function (track) {
                    return track.id === id;
                }, this));
            },

            /**
             * Hides the tracks with the given ids.
             * @param  {array} tracks an array containing the tracks ids to hide.
             */
            hideTracksById: function (ids) {
                var tracks = [];

                _.each(ids, function (id) {
                    tracks.push(this.get(id));
                }, this);

                this.hideTracks(tracks);
            },


            /**
             * Hides the given tracks.
             * @param  {array} tracks an array containing the tracks to hide.
             */
            hideTracks: function (tracks) {
                var newVisibleTracks = [],
                    idsToRemove = [];

                // Check if the given tracks are valid
                if (_.isUndefined(tracks)) {
                    return;
                } else if (!_.isArray(tracks)) {
                    tracks = [tracks];
                }

                // Create a list of tracks id to remove
                _.each(tracks, function (track) {
                    idsToRemove.push(track.id);
                }, this);

                // Go through the list of tracks to see which one has to be removed
                _.each(this.visibleTracks, function (track) {
                    if (_.contains(idsToRemove, track.id)) {
                        track.set(Track.FIELDS.VISIBLE, false);
                    } else {
                        newVisibleTracks.push(track);
                    }
                }, this);


                this.visibleTracks = newVisibleTracks;
            },

            /**
             * Get the url for this collection
             * @alias module:collections-tracks.Tracks#url
             * @return {String} The url of this collection
             */
            url: function () {
                return _.result(this.video, "url") + "/tracks";
            }
        }, {
            EVENTS: EVENTS
        });

        return Tracks;
    }
);
