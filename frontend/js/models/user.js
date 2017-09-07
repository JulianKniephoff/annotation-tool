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
 * A module representing the user model
 * @module models-user
 * @requires jQuery
 * @requires underscore
 * @requires ROLES
 * @requires ACCESS
 * @requires backbone
 * @requires models/resource
 * @requires email-addresses
 */
define(["jquery",
        "underscore",
        "roles",
        "access",
        "backbone",
        "models/resource",
        "email-addresses"],

    function ($, _, ROLES, ACCESS, Backbone, Resource, emailAddresses) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#Model}
         * @augments module:Backbone.Model
         * @memberOf module:models-user
         * @alias module:models-user.User
         */
        var User = Resource.extend({

            /**
             * Default models value
             * @alias module:models-scalevalue.Scalevalue#defaults
             * @type {map}
             * @static
             */
            defaults: {
                role: ROLES.USER,
                access: ACCESS.PUBLIC
            },

            /**
             * Constructor
             * @alias module:models-user.User#initialize
             * @param {Object} attr Object literal containing the model initialion attributes.
             */
            initialize: function (attr) {
                if (_.isUndefined(attr.user_extid) || attr.user_extid === "" ||
                   _.isUndefined(attr.nickname) || attr.nickname === "") {
                    throw "'user_extid' and 'nickname' attributes are required";
                }

                Resource.prototype.initialize.apply(this, arguments);

                if (!attr.role && annotationsTool.getUserRole) {
                    attr.role = annotationsTool.getUserRole();

                    if (!attr.role) {
                        delete attr.role;
                    }
                }

                // Define that all post operation have to been done through PUT method
                // see in wiki
                this.noPOST = true;
            },

            /**
             * Validate the attribute list passed to the model
             * @alias module:models-user.User#validate
             * @param  {Object} data Object literal containing the model attribute to validate.
             * @return {string}  If the validation failed, an error message will be returned.
             */
            validate: function (attr) {
                var invalidResource = Resource.prototype.validate.call(this, attr);
                if (invalidResource) return invalidResource;

                if (_.isUndefined(attr.user_extid) || (!_.isString(attr.user_extid) && !_.isNumber(attr.user_extid))) {
                    return {attribute: "user_extid", message: "'user_extid' must be a valid string or number."};
                }

                if (_.isUndefined(attr.nickname) || !_.isString(attr.nickname)) {
                    return {attribute: "nickname", message: "'nickname' must be a valid string!"};
                }

                if (attr.email && !User.validateEmail(attr.email)) {
                    return {attribute: "email", message: "Given email is not valid!"};
                }
            }
        },
        // Class properties and functions
        {
            /**
             * Check if the email address has a valid structure
             * @static
             * @alias module:models-user.User.validateEmail
             * @param {String} email the email address to check
             * @return {Boolean} true if the address is valid
             */
            validateEmail: function (email) {
                return !!emailAddresses.parseOneAddress(email);
            }
        });
        return User;
    }
);