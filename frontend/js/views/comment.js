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
 * A module representing the view for a comments container
 * @module views-comment
 * @requires jQuery
 * @requires underscore
 * @requires util
 * @requires templates/comment.tmpl
 * @requires templates/edit-comment.tmpl
 * @requires handlebars
 * @requires backbone
 */
define(["jquery",
        "underscore",
        "util",
        "templates/comment",
        "templates/edit-comment",
        "handlebars",
        "backbone",
        "handlebarsHelpers"],

    function ($, _, util, Template, EditTemplate, Handlebars, Backbone) {

        "use strict";

        /**
         * @constructor
         * @see {@link http://www.backbonejs.org/#View}
         * @augments module:Backbone.View
         * @memberOf module:views-comment
         * @alias module:views-comment.Comment
         */
        var CommentView = Backbone.View.extend({

            /**
             * Tag name from the view element
             * @alias module:views-comment.Comment#tagName
             * @type {string}
             */
            tagName: "div",

            /**
             * View template for read-only modus
             * @alias module:views-comment.Comment#template
             * @type {HandlebarsTemplate}
             */
            template: Template,

            /**
             * View template for edit modus
             * @alias module:views-comment.Comment#template
             * @type {HandlebarsTemplate}
             */
            editTemplate: EditTemplate,

            /**
             * Events to handle
             * @alias module:views-comment.Comment#events
             * @type {object}
             */
            events: {
                "click"                     : "stopPropagation",
                "click i.delete-comment"    : "onDeleteComment",
                "dblclick span.comment"     : "onEditComment",
                "click i.edit-comment"      : "onEditComment",
                "keyup textarea"            : "keyupInsertProxy",
                "click button[type=submit]" : "onSubmit",
                "click button[type=button]" : "onCancel"
            },

            /**
             * constructor
             * @alias module:views-comment.Comment#initialize
             * @param {PlainObject} attr Object literal containing the view initialization attributes.
             */
            initialize: function (attr) {
                this.model          = attr.model;
                this.commentId      = attr.model.get("id");
                this.id             = "comment" + this.commentId;
                this.el.id          = this.id;

                // Bind function to the good context
                _.bindAll(this,
                          "cancel",
                          "deleteView",
                          "onDeleteComment",
                          "onEditComment",
                          "onSubmit",
                          "onCancel",
                          "stopPropagation",
                          "render");

                _.extend(this, Backbone.Events);

                // Type use for delete operation
                this.typeForDelete = annotationsTool.deleteOperation.targetTypes.COMMENT;

                return this;
            },

            /**
             * Stop the propagation of the given event
             * @alias module:views-comment.Comment#stopPropagation
             * @param  {event} event Event object
             */
            stopPropagation: function (event) {
                event.stopImmediatePropagation();
            },

            /**
             * Delete only this comment
             * @alias module:views-comment.Comment#deleteView
             */
            deleteView: function () {
                this.remove();
                this.undelegateEvents();
                this.deleted = true;
            },

            /**
             * Delete the comment related to this view
             * @alias module:views-comment.Comment#onDeleteComment
             */
            onDeleteComment: function (event) {
                if (!_.isUndefined(event)) {
                    event.stopImmediatePropagation();
                }

                annotationsTool.deleteOperation.start(this.model, this.typeForDelete);
            },

            /**
             * Switch in edit modus
             * @alias module:views-comment.Comment#onEditComment
             */
            onEditComment: function (event) {
                if (!_.isUndefined(event)) {
                    event.stopImmediatePropagation();
                }

                this.trigger("edit");

                this.$el.html(this.editTemplate({text: this.model.get("text")}));
                this.delegateEvents(this.events);
                this.isEditEnable = true;
            },

            /**
             * Submit the modifications on the comment
             * @alias module:views-comment.Comment#onSubmit
             */
            onSubmit: function (event) {
                if (!_.isUndefined(event)) {
                    event.stopImmediatePropagation();
                }

                var textValue = this.$el.find("textarea").val();

                if (textValue === "") {
                    return;
                }

                this.model.set({
                    "text"       : textValue,
                    "updated_at" : new Date()
                });
                this.model.save();

                this.cancel();
            },

            /**
             * Proxy to insert comments by pressing the "return" key
             * @alias module:views-comments-container.Comment#keyupInsertProxy
             * @param  {event} event Event object
             */
            keyupInsertProxy: function (event) {
                  // If enter is pressed and shit not, we insert a new annotation
                if (event.keyCode === 13 && !event.shiftKey) {
                    this.onSubmit();
                }
            },

            /**
             * Listener for the click on the cancel button
             * @alias module:views-comment.Comment#onCancel
             */
            onCancel: function (event) {
                event.stopImmediatePropagation();
                this.cancel();
            },

            /**
             * Cancel the modifications
             * @alias module:views-comment.Comment#cancel
             */
            cancel: function () {
                this.isEditEnable = false;
                this.render();
                this.trigger("cancel");
            },

            /**
             * Render this view
             * @alias module:views-comment.Comment#render
             */
            render: function () {
                var data = {
                        creator     : this.model.get("created_by_nickname"),
                        creationdate: this.model.get("created_at"),
                        text        : _.escape(this.model.get("text")).replace(/\n/g, "<br/>"),
                        canEdit     : this.model.get("isMine")
                    },
                    updatedAt = this.model.get("updated_at");

                if (updatedAt && !util.datesEqual(updatedAt, data.creationdate)) {
                    data.updator = this.model.get("updated_by_nickname");
                    data.updateddate = updatedAt;
                }
                this.$el.html(this.template(data));
                this.delegateEvents(this.events);
                return this;
            }
        });
        return CommentView;
    }
);