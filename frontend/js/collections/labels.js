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
 */
define(["underscore",
        "collections/base",
        "models/label"],

    function (_, Base, Label) {

        "use strict";

        /**
         * @constructor
         * @augments module:collections-base.Base
         * @memberOf module:collections-labels
         * @alias module:collections-labels.Labels
         */
        var Labels = Base.extend({
            name: "labels",
            parent: "category",
            model: Label
        });

        return Labels;
    }
);
