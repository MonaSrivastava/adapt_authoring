/*
* ContextMenu
* License - https://github.com/adaptlearning/adapt_framework/blob/master/LICENSE
* Maintainers - Kevin Corry <kevinc@learningpool.com>
*/
define(function(require) {

  var Backbone = require('backbone');
  var Origin = require('coreJS/app/origin');

  var ContextMenuView = Backbone.View.extend({

    className: 'context-menu',

    contextView : {},

    initialize: function() {
      this._isVisible = false;
      this.listenTo(Origin, 'contextMenu:open', function(view, e) {
        this.contextView = view;
        var type = view.model.get('_type');
        this.toggleContextMenu(type, e);
      });
      this.listenTo(Origin, 'contextMenu:triggerCustomView', this.openCustomView);
      this.listenTo(Origin, 'contextMenu:closeContextMenu', this.onCloseContextMenu);
      this.listenTo(Origin, 'remove', this.onCloseContextMenu);
      this.render();
    },

    events: {
      'click .context-menu-back': 'onBackButtonClicked',
      'click .context-menu-close':'onCloseContextMenu'
    },

    render: function() {
      var template = Handlebars.templates['contextMenu'];
      $(this.el).html(template).appendTo('body');
      return this;
    },

    openCustomView: function(view, hasBackButton) {
      // Set whether back button should display
      this._hasBackButton = hasBackButton;
      this._isCustomViewVisible = true;
      Origin.trigger('contextMenu:empty');
      this.showContextMenu();
      this.$('.context-menu-holder').html(view);
    },

    onBackButtonClicked: function(event) {
      event.preventDefault();
      this.showContextMenu(true, event);
    },

    onCloseContextMenu: function(event) {
      if (event) {
        event.preventDefault();
      }
      this._isVisible = false;
      this.hideContextMenu();
    },

    toggleContextMenu: function(type, e) {
      this.type = type;
      if (this._isVisible && this._isCustomViewVisible === false) {
        this._isVisible = false;
        this.hideContextMenu();
      } else {
        this._isVisible = true;
        this.showContextMenu(true, e);
      }
    },

    showContextMenu: function(emptyContextMenu, e) {
      var contextMenuWidth = this.$el.width();
      if (emptyContextMenu) {
        this._isCustomViewVisible = false;
        this.emptyContextMenu();
        this.renderItems();
        Origin.trigger('contextMenu:openedItemView');
      } else {
        Origin.trigger('contextMenu:openedCustomView');
      }
      _.defer(_.bind(function() {
        this.$el.css({position: 'absolute',
          left: $(e.currentTarget).offset().left + $(e.currentTarget).width() + 10,
          top: $(e.currentTarget).offset().top})
        .removeClass('display-none');
      
        this.addBodyEvent();
        Origin.trigger('contextMenu:opened');
      }, this));
    },

    emptyContextMenu: function() {
      this.$('.context-menu-holder').empty();
    },

    renderItems: function() {
      Origin.trigger('contextMenu:empty');
      this.emptyContextMenu();
      var contextView = this.contextView;
      var filtered = this.collection.where({type:this.type});
      _.each(filtered, function(item) {
        item.set('contextView', contextView);
        new ContextMenuItemView({model: item});
      });
    },

    hideContextMenu: function() {
      Origin.trigger('popup:closed');
      this.$el.addClass('display-none');
      this._isCustomViewVisible = false;
      this.removeBodyEvent();
      Origin.trigger('contextMenu:closed');
    },

    addBodyEvent: function() {
      $('.page, .menu').one('click', _.bind(function() {
        this.onCloseContextMenu();
      }, this));
    },

    removeBodyEvent: function() {
      $('.page, .menu').off('click');
    }

  });

  var ContextMenuItemView = Backbone.View.extend({

    className: 'context-menu-item',

    initialize: function() {
      this.listenTo(Origin, 'contextMenu:empty', this.remove);
      this.render();
    },

    events: {
      'click .context-menu-item-open': 'onContextMenuItemClicked'
    },

    render: function() {
      var data = this.model.toJSON();
      var template = Handlebars.templates['contextMenuItem'];
      $(this.el).html(template(data)).appendTo('.context-menu-holder');
      return this;
    },

    onContextMenuItemClicked: function(event) {
      event.preventDefault();
      var callbackEvent = this.model.get('callbackEvent');
      this.model.get('contextView').trigger('contextMenu:' + this.model.get('type') + ':' + callbackEvent);
    }

  });

  return ContextMenuView;

});
