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
 * Module containing the tool configuration
 * @module annotations-tool-configuration
 */
define(["jquery",
        "underscore",
        "roles",
        "player_adapter_HTML5"
        // Add here the files (PlayerAdapter, ...) required for your configuration
        ],

    function ($, _, ROLES, HTML5PlayerAdapter, LoopView) {

        "use strict";

        /**
         * Annotations tool configuration object
         * @alias module:annotations-tool-configuration.Configuration
         * @enum
         */
        var Configuration =  {

            /**
             * List of possible layout configuration
             * @alias module:annotations-tool-configuration.Configuration.LAYOUT_CONFIGURATION
             * @memberOf module:annotations-tool-configuration.Configuration
             * @type {Object}
             */
            LAYOUT_CONFIGURATION: {
                /** default configuration */
                DEFAULT: {
                    timeline : true,
                    list     : true,
                    annotate : true,
                    loop     : false
                }
            },


            /**
             * The default tracks at startup
             * @type {{@link this.TRACKS}}
             */
            getDefaultTracks: function () {
                return {
                    name: "mine",
                    filter: function (track) {
                        return track.get("isMine");
                    }
                };
            },

            /**
             * The maximal number of tracks visible in the timeline at the same time
             * @type {Number}
             */
            MAX_VISIBLE_TRACKS: 0,

            /**
             * The minmal duration used for annotation representation on timeline
             * @alias module:annotations-tool-configuration.Configuration.MINIMAL_DURATION
             * @memberOf module:annotations-tool-configuration.Configuration
             * @type {Object}
             */
            MINIMAL_DURATION: 5,

            /**
             * Define the number of categories pro tab in the annotate box. Bigger is number, thinner will be the columns for the categories.
             * @alias module:annotations-tool-configuration.Configuration.CATEGORIES_PER_TAB
             * @memberOf module:annotations-tool-configuration.Configuration
             * @type {Number}
             */
            CATEGORIES_PER_TAB: 7,

            /**
             * Define if the localStorage should be used or not
             * @alias module:annotations-tool-configuration.Configuration.localStorage
             * @type {boolean}
             * @readOnly
             */
            localStorage: true,


            /**
             * List of plugins to load,
             * the bootstrap function of each plugin is called once the tool is ready
             * @type {Object}
             * @readOnly
             */
            plugins: {
                Loop: function () {
                        require(["views/loop"], function (Loop) {
                            annotationsTool.loopView = new Loop();
                        });
                    }
            },

            /**
             * Url from the annotations Rest Endpoints
             * @alias module:annotations-tool-configuration.Configuration.restEndpointsUrl
             * @type {string}
             * @readOnly
             */
            restEndpointsUrl: "../../extended-annotations",

            /**
             * Url for redirect after the logout
             * @alias module:annotations-tool-configuration.Configuration.logoutUrl
             * @type {string}
             * @readOnly
             */
            logoutUrl: undefined,

            /**
             * Url from the export function for statistics usage
             * @alias module:annotations-tool-configuration.Configuration.exportUrl
             * @type {string}
             * @readOnly
             */
            exportUrl: "",

            /**
             * Player adapter implementation to use for the annotations tool
             * @alias module:annotations-tool-configuration.Configuration.playerAdapter
             * @type {module:player-adapter.PlayerAdapter}
             */
            playerAdapter: undefined,

            /**
             * Array of tracks to import by default
             * @type {module:player-adapter.tracksToImport}
             */
            tracksToImport: undefined,

            /**
             * Get the tool layout configuration
             * @return {object} The tool layout configuration
             */
            getLayoutConfiguration: function () {
                return this.LAYOUT_CONFIGURATION.DEFAULT;
            },

            /**
             * Define if the structured annotations are or not enabled
             * @alias module:annotations-tool-configuration.Configuration.isStructuredAnnotationEnabled
             * @return {boolean} True if this feature is enabled
             */
            isStructuredAnnotationEnabled: function () {
                return true;
            },

            /**
             * Define if the private-only mode is enabled
             * @alias module:annotations-tool-configuration.Configuration.isPrivateOnly
             * @return {boolean} True if this mode is enabled
             */
            isPrivateOnly: function () {
                return false;
            },

            /**
             * Define if the free text annotations are or not enabled
             * @alias module:annotations-tool-configuration.Configuration.isFreeTextEnabled
             * @return {boolean} True if this feature is enabled
             */
            isFreeTextEnabled: function () {
                return true;
            },

            /**
             * Get the current video id (video_extid)
             * @alias module:annotations-tool-configuration.Configuration.getVideoExtId
             * @return {string} video external id
             */
            getVideoExtId: function () {
                return $("video")[0].id;
            },

            /**
             * Returns the time interval between each timeupdate event to take into account.
             * It can improve a bit the performance if the amount of annotations is important. 
             * @alias module:annotations-tool-configuration.Configuration.getTimeupdateIntervalForTimeline
             * @return {number} The interval
             */
            getTimeupdateIntervalForTimeline: function () {
                // TODO Check if this function should be linear
                return Math.max(500, annotationsTool.getAnnotations().length * 3);

            },

            /**
             * Sets the behavior of the timeline. Enable it to follow the playhead.
             * @alias module:annotations-tool-configuration.Configuration.timelineFollowPlayhead
             * @type {Boolean}
             */
            timelineFollowPlayhead: true,

            /**
             * Get the external parameters related to video. The supported parameters are now the following:
             *     - video_extid: Required! Same as the value returned by getVideoExtId
             *     - title: The title of the video
             *     - src_owner: The owner of the video in the system
             *     - src_creation_date: The date of the course, when the video itself was created.
             * @alias module:annotations-tool-configuration.Configuration.getVideoExtId
             * @example
             * {
             *     video_extid: 123, // Same as the value returned by getVideoExtId
             *     title: "Math lesson 4", // The title of the video
             *     src_owner: "Professor X", // The owner of the video in the system
             *     src_creation_date: "12-12-1023" // The date of the course, when the video itself was created.
             * }
             * @return {Object} The literal object containing all the parameters described in the example.
             */
            getVideoParameters: function () {
                return {
                    video_extid: this.getVideoExtId(),
                    title: $("video")[0].currentSrc.split("/").pop().split(".")[0],
                    src_owner: $("video").first().attr("data-owner"),
                    src_creation_date:  $("video").first().attr("data-date")
                };
            },

            /**
             * Get the user id from the current context (user_extid)
             * @alias module:annotations-tool-configuration.Configuration.getUserExtId
             * @return {string} user_extid
             */
            getUserExtId: function (email) {
                return email;
            },

            /**
             * Get the role of the current user
             * @alias module:annotations-tool-configuration.Configuration.getUserRole
             * @return {ROLE} The current user role
             */
            getUserRole: function () {
                return ROLES.USER;
            },

            /**
             * Get the name of the admin role
             * @alias module:annotations-tool-configuration.Configuration.getAdminRoleName
             * @return {ROLE} The name of the admin role
             */
            getAdminRoleName: function () {
                return ROLES.ADMINISTRATOR;
            },

            /**
             * Get the user authentification token if existing
             * @alias module:annotations-tool-configuration.Configuration.getUserAuthToken
             * @return {string} Current user token
             */
            getUserAuthToken: function () {
                return undefined;
            },

            /**
             * Function to load the video
             * @alias module:annotations-tool-configuration.Configuration.loadVideo
             */
            loadVideo: function () {
                annotationsTool.playerAdapter = new HTML5PlayerAdapter($("video")[0]);
            }
        };

        return Configuration;
    }
);