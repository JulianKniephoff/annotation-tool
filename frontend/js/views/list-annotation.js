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
 * A module representing the view for an item of the annotations list
 * @module views-list-annotation
 * @requires jquery
 * @requires underscore
 * @requires player-adapter
 * @requires models-annotation
 * @requires models-user
 * @requires views-comments-container
 * @requires templates/list-annotation.tmpl
 * @requires backbone
 * @requires handlebars
 */
define(["jquery",
        "underscore",
        "prototypes/player_adapter",
        "models/annotation",
        "models/user",
        "views/comments-container",
        "templates/list-annotation",
        "templates/list-annotation-expanded",
        "templates/list-annotation-edit",
        "templates/list-annotation-print",
        "backbone",
        "handlebarsHelpers"],

    function ($, _, PlayerAdapter, Annotation, User, CommentsContainer, TmplCollapsed, TmplExpanded, TmplEdit, TmplPrint, Backbone) {

        "use strict";

        /**
        * @constructor
        * @see {@link http://www.backbonejs.org/#View}
        * @augments module:Backbone.View
        * @memberOf module:views-list-annotation
        * @alias module:views-list-annotation.ListAnnotation
        */
        var ListAnnotation = Backbone.View.extend({

            /**
             * Tag name from the view element
             * @alias module:views-list-annotation.ListAnnotation#tagName
             * @type {string}
             */
            tagName: "div",

            className: "annotation",

            /**
             * Define if the view has been or not deleted
             * @alias module:views-list-annotation.ListAnnotation#deleted
             * @type {boolean}
             */
            deleted: false,

            /**
             * Define if the comments container is currently visible
             * @alias module:views-list-annotation.ListAnnotation#commentsVisible
             * @type {Boolean}
             */
            commentsVisible: false,

            /** Events to handle
             * @alias module:views-list-annotation.ListAnnotation#events
             * @type {object}
             */
            events: undefined,

            /**
             * The current view {@link ListAnnotation.STATES} of the annotation view
             * @alias module:views-list-annotation.ListAnnotation#currentStates
             * @type {ListAnnotation.STATES}
             */
            currentState: undefined,

            /**
             * constructor
             * @alias module:views-list-annotation.ListAnnotation#initialize
             */
            initialize: function (attr) {
                var category,
                    self = this;

                if (!attr.annotation) {
                    throw "The annotations have to be given to the annotate view.";
                }

                // Bind function to the good context
                _.bindAll(this, "render",
                                "deleteFull",
                                "deleteView",
                                "onSelect",
                                "startEdit",
                                "saveStart",
                                "saveEnd",
                                "saveFreeText",
                                "saveScaling",
                                "stopPropagation",
                                "toggleEditState",
                                "toggleCollapsedState",
                                "toggleExpandedState",
                                "setCommentState",
                                "toggleCommentsState",
                                "setCurrentTimeAsStart",
                                "setCurrentTimeAsEnd",
                                "setState",
                                "getState",
                                "handleEsc");

                _.extend(this, Backbone.Events);

                this.model = attr.annotation;

                this.id = this.model.get("id");

                this.isEditEnable = false;

                this.commentContainer = new CommentsContainer({
                    id       : this.id,
                    comments : this.model.get("comments")
                });
                this.commentContainer.on({
                    cancel: function () {
                        self.trigger("cancel", self);
                        self.toggleCommentsState();
                    },
                    edit: function () {
                        self.trigger("edit", self);
                        self.setState(ListAnnotation.STATES.COMMENTS, ListAnnotation.STATES.EXPANDED);
                        self.render();
                    }
                });

                this.model.fetchComments();

                if (this.model.get("label")) {
                    category = this.model.get("label").category;

                    if (!category) {
                        category = this.model.get("label").get("category");
                    }

                    this.scale = annotationsTool.video.get("scales").get(category.scale_id);
                }

                if (this.scale) {
                    this.scaleValues = this.scale.get("scaleValues");
                }

                // Add backbone events to the model
                _.extend(this.model, Backbone.Events);

                this.listenTo(this.model, "change", this.render);
                this.listenTo(this.model.get("comments"), "change", this.render);
                this.listenTo(this.model.get("comments"), "remove", this.render);
                this.listenTo(this.model, "destroy", this.deleteView);
                this.listenTo(this.model, "remove", this.deleteView);

                // Type use for delete operation
                this.typeForDelete = annotationsTool.deleteOperation.targetTypes.ANNOTATION;

                if (attr.track) {
                    this.track = attr.track;
                } else {
                    this.track = annotationsTool.selectedTrack;
                }

                this.currentState = ListAnnotation.STATES.COLLAPSED;

                return this.render();
            },

            /**
             * Set the state to the given newState or the fallbackState if newState is already set
             * @alias module:views-list-annotation.ListAnnotation#setState
             * @param {State} newState The new state to set if not already activated
             * @param {State} fallbackState The fallback state if the new state is already set
             */
            setState: function (newState, fallbackState) {
                var fallback = false;
                if (!_.isUndefined(fallbackState) && this.getState() === newState) {
                    this.currentState = fallbackState;
                    fallback = true;
                } else {
                    this.currentState = newState;
                }
                this.trigger("change:state", this, { fallback: fallback });
            },

            /**
             * Returns the state of the list annotation view
             * @alias module:views-list-annotation.ListAnnotation#setState
             * @return {State} The current state of the list annotation view
             */
            getState: function () {
                return this.currentState;
            },

            /**
             * Delete completely the annotation
             * @alias module:views-list-annotation.ListAnnotation#deleteFull
             * @param {event} event Event object
             */
            deleteFull: function (event) {
                if (event) {
                    event.stopImmediatePropagation();
                }
                annotationsTool.deleteOperation.start(this.model, this.typeForDelete);
            },

            /**
             * Delete only this annotation view
             * @alias module:views-list-annotation.ListAnnotation#deleteView
             */
            deleteView: function () {
                this.remove();
                this.undelegateEvents();
                this.deleted = true;
            },

            /**
             * Move the video current time to this annotation
             * @alias module:views-list-annotation.ListAnnotation#jumpTo
             */
            jumpTo: function () {
                annotationsTool.setSelection([this.model], true);
            },

            /**
             * Enter in edit modus
             * @alias module:views-list-annotation.ListAnnotation#startEdit
             * @param  {event} event Event object
             */
            startEdit: function (event) {
                var $target = $(event.currentTarget).find("input");

                if (event.stopImmediatePropagation) {
                    event.stopImmediatePropagation();
                }

                if (!this.model.get("isMine")) {
                    return;
                }

                // Hack for Firefox, add an button over it
                if ($target.length === 0 && event.currentTarget.className.match(/-btn$/)) {
                    $target = $(event.currentTarget).parent().find(".input");
                    $(event.currentTarget).parent().find(".text-container span").hide();
                }

                if ($target.attr("disabled")) {
                    $target.removeAttr("disabled");
                    $target.focus();
                }
            },

            /**
             * Save the modification done in the free text field
             * @alias module:views-list-annotation.ListAnnotation#saveFreeText
             * @param  {event} event Event object
             */
            saveFreeText: function (event) {
                var newValue = this.$el.find(".freetext textarea").val();

                // If keydown event but not enter, value must not be saved
                if (event.type === "keydown" && !(event.keyCode === 13 && !event.shiftKey)) {
                    return;
                }

                this.model.set({text: newValue});
                this.model.save();

                if (event.type === "keydown") {
                    $(event.currentTarget).blur();
                }

                this.toggleEditState(event);
            },

            /**
             * Save the scaling value
             * @alias module:views-list-annotation.ListAnnotation#saveScaling
             * @param  {event} event Event object
             */
            saveScaling: function (event) {
                var newValue = _.escape(this.$el.find(".scaling select").val());

                // If keydown event but not enter, value must not be saved
                if (event.type === "keydown" && event.keyCode !== 13) {
                    return;
                }

                if (newValue === "OFF") {
                    this.model.unset("scalevalue");
                } else {
                    this.model.set({scalevalue: this.scaleValues.get(newValue).toJSON()});
                    this.$el.find(".scaling span").html(this.scaleValues.get(newValue).get("name"));
                }

                this.model.save();
            },

            /**
             * Save the end time
             * @alias module:views-list-annotation.ListAnnotation#saveEnd
             * @param  {event} event Event object
             */
            saveEnd: function (event) {
                var $target = $(event.currentTarget),
                    value = $target.val(),
                    radix = 10, // Radix is 10 for decimal
                    values,
                    seconds;

                // If keydown event but not enter, value must not be saved
                if (event.type === "keydown" && event.keyCode !== 13) {
                    return;
                }

                $target.removeClass("error");

                if (!value.match(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/)) {
                    $target.addClass("error");
                    return;
                } else {
                    values = value.split(":");

                    if (values.length === 3) {
                        seconds = parseInt(values[0], radix) * 3600 + parseInt(values[1], radix) * 60 + parseInt(values[2], radix);
                    } else if (values.length === 2) {
                        seconds = parseInt(values[0], radix) * 60 + parseInt(values[1], radix);
                    } else {
                        seconds = parseInt(values[0], radix);
                    }

                    if (annotationsTool.playerAdapter.getDuration() < seconds || this.model.get("start") > seconds) {
                        $target.addClass("error");
                        return;
                    }

                    $target.parent().parent().find("tr.text-container span").show();
                    this.model.set("duration", Math.round(seconds - this.model.get("start")));
                    this.model.save({silent: true});
                }
            },

            /**
             * Save the start time
             * @alias module:views-list-annotation.ListAnnotation#saveStart
             * @param  {event} event Event object
             */
            saveStart: function (event) {
                var $target = $(event.currentTarget),
                    value = $target.val(),
                    radix = 10, // Radix is 10 for decimal
                    values,
                    duration,
                    seconds;

                // If keydown event but not enter, value must not be saved
                if (event.type === "keydown" && event.keyCode !== 13) {
                    return;
                }

                duration = this.model.get("duration");

                $target.removeClass("error");

                if (!value.match(/^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/)) {
                    $target.addClass("error");
                    return;
                } else {
                    values = value.split(":");

                    if (values.length === 3) {
                        seconds = parseInt(values[0], radix) * 3600 + parseInt(values[1], radix) * 60 + parseInt(values[2], radix);
                    } else if (values.length === 2) {
                        seconds = parseInt(values[0], radix) * 60 + parseInt(values[1], radix);
                    } else {
                        seconds = parseInt(values[0], radix);
                    }

                    if (duration > 0 && (duration + this.model.get("start")) < seconds) {
                        $target.addClass("error");
                        return;
                    }

                    $target.parent().find("span").show();
                    this.model.set({
                        start   : seconds,
                        duration: Math.round(this.model.get("duration") + this.model.get("start") - seconds)
                    });
                    this.model.save({silent: true});
                }
            },

            /**
             * Save the current playhead time as start time
             * @alias module:views-list-annotation.ListAnnotation#setCurrentTimeAsStart
             * @param  {event} event Event object
             */
            setCurrentTimeAsStart: function (event) {
                var currentTime = Math.round(annotationsTool.playerAdapter.getCurrentTime()),
                    end = this.model.get("start") + this.model.get("duration");

                event.stopImmediatePropagation();

                if (currentTime < end) {
                    this.model.set({start: currentTime, duration: this.model.get("duration") + this.model.get("start") - currentTime});
                    this.model.save();
                }
            },

            /**
             * Save the current playhead time as end time
             * @alias module:views-list-annotation.ListAnnotation#setCurrentTimeAsEd
             * @param  {event} event Event object
             */
            setCurrentTimeAsEnd: function (event) {
                var currentTime = Math.round(annotationsTool.playerAdapter.getCurrentTime());
                event.stopImmediatePropagation();
                if (currentTime > this.model.get("start")) {
                    this.model.set({duration: currentTime - this.model.get("start")});
                    this.model.save();
                }
            },

            /**
             * Render this view
             * @alias module:views-list-annotation.ListAnnotation#render
             */
            render: function () {
                var modelJSON,
                    scaleValues,
                    category,
                    selectedScaleValue,
                    title;

                if (this.deleted) {
                    return "";
                }

                modelJSON              = this.model.toJSON();
                modelJSON.track        = this.track.get("name");
                modelJSON.textReadOnly = _.escape(modelJSON.text).replace(/\n/g, "<br/>");
                modelJSON.duration     = (modelJSON.duration || 0.0);
                modelJSON.textHeight   = $("span.freetext").height();

                if (modelJSON.isMine && this.scale && modelJSON.label.category.scale_id) {
                    category = annotationsTool.video.get("categories").get(this.model.get("label").category.id);

                    // Check if the category is still linked to the video to get the current version
                    if (category) {
                        modelJSON.hasScale = category.get("settings").hasScale;
                    } else {
                        // Othervise use the json copy
                        modelJSON.hasScale = this.model.get("label").category.settings.hasScale;
                    }

                    if (modelJSON.hasScale && this.scale) {
                        scaleValues = this.scaleValues.toJSON();
                        selectedScaleValue = _.where(scaleValues, {id: modelJSON.scale_value_id});

                        if (selectedScaleValue.length > 0) {
                            selectedScaleValue[0].isSelected = true;
                        }
                    }
                    modelJSON.scalevalues = scaleValues;
                }

                modelJSON.isEditEnable = this.isEditEnable;
                modelJSON.numberOfComments = this.model.get("comments").length;
                modelJSON.state = this.getState().id;

                this.$el.html($(this.currentState.render(modelJSON)));

                this.el = this.$el[0];
                this.$el.attr("id", this.id);

                if (!_.isUndefined(modelJSON.label) && !_.isNull(modelJSON.label)) {
                    title = modelJSON.label.abbreviation + " - " + modelJSON.label.value;
                    if (!_.isUndefined(modelJSON.label.category)) {
                        this.$el.css("background-color", modelJSON.label.category.settings.color);
                    }
                } else {
                    title = modelJSON.text;
                }

                if (this.isEditEnable) {
                    title += " edit-on";
                }

                if (this.getState() === ListAnnotation.STATES.COLLAPSED) {
                    this.$el.attr("title", title);
                } else {
                    this.$el.removeAttr("title");
                }


                // Hack for Firefox, add a button over it
                if ($.browser.mozilla) {
                    if (modelJSON.duration > 0) {
                        this.$el.find(".end").append("<span class=\"end-btn\" title=\"Double click to edit\">&nbsp;</span>");
                    }
                    this.$el.find(".start").append("<span class=\"start-btn\" title=\"Double click to edit\">&nbsp;</span>");
                }


                if (this.getState().withComments) {
                    if (!this.model.areCommentsLoaded()) {
                        this.model.fetchComments();
                    }

                    if (this.getState() === ListAnnotation.STATES.COMMENTS || this.model.get("comments").length > 0) {
                        this.$el.find("> div:last").after(this.commentContainer.render().$el);
                    }
                }

                this.delegateEvents(this.getState().events);

                return this;
            },

            /**
             * Listener for click on this annotation
             * @alias module:views-list-annotation.ListAnnotation#onSelect
             */
            onSelect: _.debounce(function (force) {
                // If annotation already selected
                if (annotationsTool.hasSelection() && annotationsTool.getSelection()[0].get("id") === this.model.get("id")) {
                    if (!_.isBoolean(force) || (_.isBoolean(force) && !force)) {
                        annotationsTool.setSelection();
                        this.isSelected = false;
                    }
                } else {
                    this.isSelected = true;
                    annotationsTool.setSelection([this.model], true, true);
                }
            }, 100),

            /**
             * Stop the propagation of the given event
             * @alias module:views-list-annotation.ListAnnotation#stopPropagation
             * @param  {event} event Event object
             */
            stopPropagation: function (event) {
                event.stopImmediatePropagation();
            },

            /**
             * Switch in/out edit modus
             * @alias module:views-list-annotation.ListAnnotation#toggleEditState
             * @param  {event} event Event object
             */
            toggleEditState: function (event) {
                if (!_.isUndefined(event)) {
                    event.stopImmediatePropagation();
                }

                this.isEditEnable = !this.isEditEnable;
                this.commentContainer.setState(CommentsContainer.STATES.READ);
                this.setState(ListAnnotation.STATES.EDIT, ListAnnotation.STATES.EXPANDED);

                if (this.isEditEnable) {
                    this.trigger("edit", this);
                    this.onSelect(true);
                }

                this.render();
            },

            /**
             * Toggle the visibility of the text container
             * @alias module:views-list-annotation.ListAnnotation#toggleCollapsedState
             * @param  {event} event Event object
             * @param  {boolean} force Force to collapse state
             */
            toggleCollapsedState: function (event, force) {
                if (!_.isUndefined(event) && !force) {
                    event.stopImmediatePropagation();
                }

                this.commentContainer.setState(CommentsContainer.STATES.READ);
                if (force) {
                    this.setState(ListAnnotation.STATES.COLLAPSED);
                } else {
                    this.setState(ListAnnotation.STATES.COLLAPSED, ListAnnotation.STATES.EXPANDED);
                }
                this.render();
            },

            /**
             * Toggle the visibility of the text container
             * @alias module:views-list-annotation.ListAnnotation#toggleExpandedState
             * @param  {event} event Event object
             * @param  {boolean} force Force to expand state 
             */
            toggleExpandedState: function (event, force) {
                if (!_.isUndefined(event) && !force) {
                    event.stopImmediatePropagation();
                }

                this.commentContainer.setState(CommentsContainer.STATES.READ);
                if (force) {
                    this.setState(ListAnnotation.STATES.EXPANDED);
                } else {
                    this.setState(ListAnnotation.STATES.EXPANDED, ListAnnotation.STATES.COLLAPSED);
                }
                this.render();
            },

            /**
             * Bring the view into a state where a new comment can be entered.
             * This does not cancel editing of the annotation or any of its comments, though,
             * in order to avoid losing any data.
             * @alias module:views-list-annotation.ListAnnotation#setCommentState
             */
            setCommentState: function () {
                if (
                       this.currentState !== ListAnnotation.STATES.EDIT
                    && this.commentContainer.currentState !== CommentsContainer.STATES.EDIT
                ) {
                    this.setState(ListAnnotation.STATES.COMMENTS);
                    this.commentContainer.setState(CommentsContainer.STATES.ADD);
                    this.render();
                    this.commentContainer.$("textarea").focus();
                }
            },

            /**
             * Toggle the comments state
             * @alias module:views-list-annotation.ListAnnotation#toggleCommentsState
             * @param  {event} event Event object
             */
            toggleCommentsState: function (event) {
                if (!_.isUndefined(event)) {
                    event.stopImmediatePropagation();
                }

                if (this.getState() !== ListAnnotation.STATES.COMMENTS) {
                    this.commentContainer.setState(CommentsContainer.STATES.ADD);
                    this.trigger("edit", this);
                } else {
                    this.commentContainer.setState(CommentsContainer.STATES.READ);
                }

                this.setState(ListAnnotation.STATES.COMMENTS, ListAnnotation.STATES.EXPANDED);
                this.render();
            },

            /**
             * Proxy function for leaving edit mode through 'esc' keypress
             * @alias module:views-list-annotation.ListAnnotation#handleEsc
             * @param {event} event Event object
             */
            handleEsc: function (event) {
                // If enter is pressed and shit not, we insert a new annotation
                if (event.keyCode === 27 && !event.shiftKey && this.getState() === ListAnnotation.STATES.EDIT) {
                    this.toggleExpandedState(event, true);
                }
            }
        }, {

            /** List of the different states existing for the annotation view in the list */
            STATES: {
                COLLAPSED: {
                    render: TmplCollapsed,
                    withComments: false,
                    id: "collapsed",
                    events: {
                        "click"                      : "onSelect",
                        "click .proxy-anchor "       : "stopPropagation",
                        "click a.collapse"           : "toggleCollapsedState",
                        "click i.icon-comment-amount": "toggleCommentsState",
                        "click i.icon-comment"       : "toggleCommentsState"
                        //"dblclick"                   : "toggleEditState"
                    }
                },
                EXPANDED: {
                    render: TmplExpanded,
                    withComments: true,
                    id: "expanded",
                    events: {
                        "click"                      : "onSelect",
                        "click .proxy-anchor "       : "stopPropagation",
                        "click a.collapse"           : "toggleCollapsedState",
                        "click i.icon-comment-amount": "toggleCommentsState",
                        "click i.icon-comment"       : "toggleCommentsState",
                        "click .toggle-edit"         : "toggleEditState",
                        "click i.delete"             : "deleteFull"
                        //"dblclick span.text"         : "toggleEditState",
                        //"dblclick span.start"        : "toggleEditState",
                        //"dblclick span.end"          : "toggleEditState",
                        //"dblclick span.category"     : "toggleEditState"
                    }
                },
                EDIT: {
                    render: TmplEdit,
                    withComments: true,
                    id: "edit-annotation",
                    events: {
                        "click"                      : "onSelect",
                        "click .proxy-anchor "       : "stopPropagation",
                        "click a.collapse"           : "toggleCollapsedState",
                        "click i.icon-comment-amount": "toggleCommentsState",
                        "click i.icon-comment"       : "toggleCommentsState",
                        "click .toggle-edit"         : "toggleEditState",
                        "click .freetext textarea"   : "stopPropagation",
                        "click .scaling select"      : "stopPropagation",
                        "click .end-value"           : "stopPropagation",
                        "click .start-value"         : "stopPropagation",
                        "click i.delete"             : "deleteFull",
                        "click button.in"            : "setCurrentTimeAsStart",
                        "click button.out"           : "setCurrentTimeAsEnd",
                        "keydown .start-value"       : "saveStart",
                        "keydown .end-value"         : "saveEnd",
                        "keydown .freetext textarea" : "saveFreeText",
                        "focusout .start-value"      : "saveStart",
                        "focusout .end-value"        : "saveEnd",
                        "click button[type=submit]"  : "saveFreeText",
                        "click button[type=button]"  : "toggleEditState",
                        "focusout .freetext textarea": "saveFreeText",
                        "change .scaling select"     : "saveScaling",
                        "keyup"                      : "handleEsc"
                    }
                },
                COMMENTS: {
                    render: TmplExpanded,
                    withComments: true,
                    id: "add-comment",
                    events: {
                        "click"                      : "onSelect",
                        "click .proxy-anchor "       : "stopPropagation",
                        "click a.collapse"           : "toggleCollapsedState",
                        "click i.icon-comment-amount": "toggleCommentsState",
                        "click i.icon-comment"       : "toggleCommentsState",
                        "click .toggle-edit"         : "toggleEditState",
                        "dblclick span.text"         : "toggleEditState",
                        "dblclick span.category"     : "toggleEditState"
                    }
                },
                PRINT: {
                    render: TmplPrint,
                    withComments: true,
                    id: "print",
                    events: {}
                }
            }
        });
    return ListAnnotation;
});