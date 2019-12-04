/**
 *  Copyright 2012, ELAN e.V., Germany
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
 */

/**
 * A module representing the track header in the timeline view.
 * @see module:views-timeline
 * @requires templates/timeline-group
 */
define(["templates/timeline-group"], function (template) { "use strict";

/**
 * @constructor
 * @see {@link http://www.backbonejs.org/#View}
 * @augments module:Backbone.View
 * @memberOf module:views-timeline
 * @alias module:views-timeline.TimelineView
 */
var TimelineGroup = Backbone.View.extend({

    template: template,

    events: {
        "click a.content-overlay": function () {
        }
    },

    initialize: function (timeline, track) {
        this.timeline = timeline;
        this.track = track;
        this.render();
    },

    render: function () {
        this.$el.html(this.template(this.attributes));
        return this;
    }
});

return TimelineGroup;

});