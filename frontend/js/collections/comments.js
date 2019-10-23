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
 * A module representing a comments collection
 * @module collections-comments
 */
define(["underscore",
        "models/comment",
        "collections/base"],

    function (_, Comment, Base) {

        "use strict";

        /**
         * @constructor
         * @augments module:collections-base.Base
         * @memberOf module:collections-comments
         * @alias module:collections-comments.Comments
         */
        var Comments = Base.extend({
            name: "comments",
            parent: "annotation",
            model: Comment,

            /**
             * constructor
             * @alias module:collections-comments.Comments#initialize
             */
            initialize: function (models, options) {
                Base.prototype.initialize.apply(this, arguments);
                this.replyTo = options.replyTo;
            },

            /**
             * Get the url for this collection
             * @alias module:collections-comments.Comments#url
             * @return {String} The url of this collection
             */
            url: function () {
                return this.replyTo
                    ? _.result(this.replyTo, "url") + "/replies"
                    : _.result(this.annotation, "url") + "/comments";
            },

            /**
             * Count the number of comments in this collection together with all of their replies.
             * @alias module:collections-comments.Comments#countCommentsAndReplies
             * @return {number} recursive sum of the number of comments and all their replies
             */
            countCommentsAndReplies: function () {
                return this.chain()
                    .map("replies")
                    .invoke("countCommentsAndReplies")
                    .reduce(function (sum, summand) {
                        return sum + summand;
                    }, this.length)
                    .value();
            }
        });
        return Comments;
    }
);
