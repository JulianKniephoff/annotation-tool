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
 */

// TODO JSDoc comments for the internal functions?!
// TODO What to do when the video or the timeline is not visible?
// TODO Maybe this **should** use a model and a collection for the loops.
//   Especially if I am caching their boundaries anyway
//   and if the things in the timeline are Backbone views, too.
//   We could then use Backbone event handling techniques for control flow.
// TODO Maybe toggling the controller should just create/delete a whole new instance every time

/**
 * A module representing the loop modal
 * @module views-loop
 */
define([
    "util",
    "underscore",
    "jquery",
    "i18next",
    "alerts",
    "player-adapter",
    "backbone",
    "templates/loop-control",
    "slider",
    "handlebarsHelpers"
], function (
    util,
    _,
    $,
    i18next,
    alerts,
    PlayerAdapter,
    Backbone,
    loopTemplate
) { "use strict";

var DEFAULT_LOOP_COUNT = 10;

var MINIMAL_LOOP = 5;

/**
 * @constructor
 * @see {@link http://www.backbonejs.org/#View}
 * @augments module:Backbone.View
 * @memberOf module:views-loop
 * @alias Loop
 */
var LoopView = Backbone.View.extend({
    /**
     * Constructor
     * @alias module:views-loop.Loop#constructor
     */
    constructor: function (options) {

        var playerAdapter = options.playerAdapter;
        var duration = playerAdapter.getDuration();
        var timeline = options.timeline;
        // TODO Should we rather use events to communicate with the timeline?

        var enabled = false;
        var loopLength = Math.max(
            MINIMAL_LOOP,
            Math.floor(duration / DEFAULT_LOOP_COUNT)
        );
        var currentLoop = 0;

        var window;
        var lengthInput;
        var slider;
        var previousButton;
        var nextButton;

        /**
         * Constructor
         * @alias module:views-loop.Loop#initialize
         */
        this.initialize = function () {

            this.$el.html(loopTemplate({
                enabled: enabled,
                length: loopLength,
                atFirstLoop: currentLoop === 0,
                atLastLoop: currentLoop === numberOfLoops - 1
            }));
            window = this.$el.find("#loop");
            lengthInput = this.$el.find("#loop-length");
            previousButton = this.$el.find(".previous");
            nextButton = this.$el.find(".next");
            slider = this.$el.find("#slider");

            slider.slider({
                // TODO These values are bogus
                //   What if the video is too short?
                min: MINIMAL_LOOP,
                max: Math.floor(duration),
                step: 1,
                formater: function (value) {
                    // TODO More formatting possibilities for translators
                    return value + i18next.t("loop controller.seconds");
                }
            }).on("slideStop", function (event) {
                setLength(event.value);
            });
        };

        var numberOfLoops = calcNumberOfLoops();

        function setLength(newLength) {
            loopLength = newLength;
            numberOfLoops = calcNumberOfLoops();

            slider.slider("setValue", loopLength);
            lengthInput.val(loopLength);

            cleanupLoops();
            setupLoops();
        }

        function calcNumberOfLoops() {
            return Math.ceil(duration / loopLength);
        }

        function cleanupLoops() {
            // TODO Since we now know that the timeline also overrides items when we add,
            //   maybe we should not remove all of them?!
            timeline.items.remove(_.map(loops, "id"));
        }

        var loops;
        function setupLoops() {
            loops = Array(numberOfLoops);
            var start = 0;
            var end = loopLength;
            for (var loop = 0; loop < numberOfLoops; ++loop) {
                loops[loop] = {
                    id: "loop-" + loop,
                    start: util.dateFromSeconds(start),
                    end: util.dateFromSeconds(Math.min(end, duration)),
                    group: "loops",
                    type: "range",
                    selectable: false,
                    content: "",
                    className: "loop"
                };
                start += loopLength;
                end += loopLength;
            }
            timeline.items.add(loops);
            syncCurrentLoop();
        }

        function syncCurrentLoop() {
            currentLoop = findCurrentLoop();
            previousButton.prop("disabled", false);
            nextButton.prop("disabled", false);
            if (currentLoop === 0) {
                previousButton.prop("disabled", true);
            }
            if (currentLoop === numberOfLoops - 1) {
                nextButton.prop("disabled", true);
            }

            timeline.items.update({
                id: "loop-" + currentLoop,
                className: "loop current"
            });
        }

        function findCurrentLoop() {
            return Math.floor(playerAdapter.getCurrentTime() / loopLength);
        }

        var $playerAdapter = $(playerAdapter);
        $playerAdapter.on(PlayerAdapter.EVENTS.TIMEUPDATE + ".loop", function () {
            if (!enabled) return;
            var boundaries = loops[currentLoop];
            if (playerAdapter.getCurrentTime() >= util.secondsFromDate(boundaries.end)) {
                playerAdapter.setCurrentTime(util.secondsFromDate(boundaries.start));
            }
        });
        $playerAdapter.on(PlayerAdapter.EVENTS.ENDED + ".loop", function () {
            if (!enabled) return;
            playerAdapter.setCurrentTime(loops[currentLoop].start);
            playerAdapter.play();
        });
        // TODO We might have to change the semantics of the seeking event/state in the player adapter
        //   Why did I think that?
        $playerAdapter.on(PlayerAdapter.EVENTS.SEEKING + ".loop", function () {
            if (!enabled) return;
            // TODO Don't we want to do this always?
            //   That is, also when the player is just playing but we are disabled?
            resetCurrentLoop();
        });

        // TODO I guess the proper way would be to create a backbone view for this?!
        timeline.timeline.on("click", function (properties) {
            if ((
                properties.what !== "item"
            ) || (
                properties.group !== "loops"
            )) return;
            playerAdapter.setCurrentTime(util.secondsFromDate(
                timeline.items.get(properties.item).start
            ));
        });

        this.events = {
            "change #enable-loop": function () {
                toggle(!enabled);
            },
            // Note that we assume that these functions never get called
            // when the current loop is the first or last one.
            // This assumption is valid since we disable the corresponding buttons
            // in `setLoop` in these cases!
            "click .next": function () {
                jumpToLoop(currentLoop + 1);
            },
            "click .previous": function () {
                jumpToLoop(currentLoop - 1);
            },
            "change #loop-length": function (event) {
                var newLength = parseInt(event.target.value, 10);
                if (isNaN(newLength) || newLength <= 0 || newLength > duration) {
                    alerts.error(i18next.t("loop controller.invalid loop length"));
                    // TODO This is potentially too much work!
                    lengthInput.val(loopLength);
                    slider.slider("setValue", loopLength);
                    return;
                }
                setLength(newLength);
            },
            "change #constrain-annotations": function (event) {
                // TODO This should be done nicer ...
                // TODO Should these survive disabling the loops?
                //   What about removing the loop controller?
                if (event.target.checked) {
                    annotationTool.annotationConstraints = currentLoopConstraints();
                } else {
                    delete annotationTool.annotationConstraints;
                }
            }
        };

        function toggle(on) {
            enabled = on;
            window.toggleClass("disabled", !on);
            timeline.groups.update({
                id: "loops",
                content: "Loops",
                className: "loop-group",
                order: -1,
                visible: on
            });
            if (on) {
                setupLoops();
            } else {
                cleanupLoops();
            }
        }

        function jumpToLoop(loop) {
            playerAdapter.setCurrentTime(util.secondsFromDate(
                loops[loop].start
            ));
        }

        function resetCurrentLoop() {
            // TODO Can we not make it so that we can toggle the `current` class
            //   on the timeline items?
            //   That way we would not have to do this dance and redraw the whole thing at the end ...
            // TODO Avoid name clashes in the timeline items ...
            // TODO Note that we now depend on the fact that the timeline actually overrides items
            timeline.items.update({
                id: "loop-" + currentLoop,
                className: "loop"
            });
            syncCurrentLoop();
            if (annotationTool.annotationConstraints) {
                annotationTool.annotationConstraints = currentLoopConstraints();
            }
        }

        function currentLoopConstraints() {
            // TODO Cache current loop boundaries ...?
            var boundaries = loops[currentLoop];
            var start = util.secondsFromDate(boundaries.start);
            return {
                start: start,
                duration: util.secondsFromDate(boundaries.end) - start
            };
        }

        // TODO Use JSDoc override mechanisms?
        /**
         * Remove the loop controller from the screen
         * @alias module:views-loop.Loop#remove
         */
        this.remove = function () {
            $playerAdapter.off(".loop");
            timeline.$el.off(".loop");
            cleanupLoops();
            Backbone.View.prototype.remove.apply(this, arguments);
        };

        Backbone.View.apply(this, arguments);
    }
});
return LoopView;
});
