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
 */
define(["util",
        "underscore",
        "models/category",
        "collections/base"],

    function (util, _, Category, Base) {
        "use strict";

        /**
         * @constructor
         * @augments module:collections-base.Base
         * @memberOf module:collections-categories
         * @alias module:collections-categories.Categories
         */
        var Categories = Base.extend({
            name: "categories",
            parent: "video",
            model: Category,

            /**
             * Get the categories created by the current user
             * @alias module:collections-categories.Categories#getMine
             * @return {array} Array containing the list of categories created by the current user
             */
            getMine: function () {
                return this.filter(util.caller("isMine"));
            }
        });

        return Categories;
    }
);
