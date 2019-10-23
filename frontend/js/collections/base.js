/**
 *  Copyright 2019, ELAN e.V., Germany
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
 * A module representing the basis for all collections
 * in this application
 * @module collections-base
 */
define([
    "underscore",
    "backbone"
], function (
    _,
    Backbone
) {
    "use strict";

    /**
     * @constructor
     * @see {@link http://www.backbonejs.org/#Collection}
     * @augments module:Backbone.Collection
     * @memberOf module:collections-annotations
     * @alias module:collections-base.Base
     */
    var Base = Backbone.Collection.extend({
        initialize: function (models, options) {
            Backbone.Collection.prototype.initialize.apply(this, arguments);
            var parent = this.parent;
            if (parent) {
                this[parent] = options[parent];
            }
        },

        /**
         * Backbone.Model#urlBase customization point for collections
         * @return {string} The base of the URL for this collection
         * @see #url
         */
        urlRoot: function () {
            var parent = this[this.parent];
            return parent ? _.result(parent, "url") : "";
        },

        /**
         * @override
         */
        url: function () {
            return _.result(this, "urlRoot") + "/" + this.name;
        },

        /**
         * @override
         */
        parse: function (data) {
            if (_.isArray(data)) {
                return data;
            } else {
                return data[this.name];
            }
        }
    });

    return Base;
});
