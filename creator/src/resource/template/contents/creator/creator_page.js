Navy.Class('CreatorPage', Navy.Page, {
  _selectedGroupingViews: null,
  _viewIdToGroupingViewMap: null,
  _contentLayoutMeta: null,

  onCreate: function($super, ev) {
    $super(ev);

    document.body.style.background = '#666';
    window.CreatorPageInstance = this;
    this._selectedGroupingViews = [];
    this._viewIdToGroupingViewMap = {};

    Include.Tidy.initialize(this);
    Include.Grouping.initialize(this);
    Include.Move.initialize(this);
    Include.Screen.initialize(this);
    Include.NativeBridge.initialize(this);

    Navy.Asset.loadLayout(this._layout.extra.contentLayoutFile, this._onLoadLayout.bind(this));
  },

  onResumeAfter: function($super, ev) {
    $super(ev);
    for (var viewId in this._views) {
      var view = this._views[viewId];
      this._setupGroupingView(view);
    }
  },

  _onLoadLayout: function(contentLayout) {
    if (contentLayout.meta) {
      this._contentLayoutMeta = contentLayout.meta;
      var creator = contentLayout.meta.__creator__;
      if (creator.screenEnable) {
        this._setScreen(creator.screenSceneId, creator.screenPageId, creator.screenEnable);
      }
      Native.setMetaFromJS(JSON.stringify(creator));
    } else {
      this._contentLayoutMeta = {__creator__: {}};
    }

    Native.setViewsFromJS(JSON.stringify(contentLayout.layouts));
  },

  getContentLayout: function() {
    var order = this._getOrderedViews();
    var contentLayout = {
      layouts: order,
      meta: this._contentLayoutMeta
    };
    return JSON.stringify(contentLayout, null, 2);
  },

  _getOrderedViews: function() {
    var elm = this._element;
    var len = elm.childElementCount;
    var order = [];
    for (var i = 0; i < len; i++)  {
      var childElm = elm.children[i];
      var view = this.findViewByElement(childElm);
      order.push(view);
    }

    return order;
  },

  _createNewView: function(viewId, viewClass, layout) {
    layout.id = viewId;
    layout.class = viewClass;

    var _class = Navy.Asset.getClass(viewClass);
    var view = new _class(layout, function(){
      this.addView(view);
      Native.changedLayoutContentFromJS();
      this._setupGroupingView(view);

      var groupingView = this._viewIdToGroupingViewMap[view.getId()];
      this._unselectAllGroupingViews();
      this._selectGroupingView(groupingView);
    }.bind(this));
  },

  _deleteSelectedGroupingViews: function() {
    for (var i = 0; i < this._selectedGroupingViews.length; i++) {
      var groupingView = this._selectedGroupingViews[i];
      groupingView.destroy();
    }
    Native.changedLayoutContentFromJS();
    this._selectedGroupingViews = [];
  },

  _updateViewsOrder: function(views) {
    for (var i = 0; i < views.length; i++) {
      var view = views[i];
      this.removeView(view);
      this.addView(view);
    }
    Native.changedLayoutContentFromJS();
  },

  _updateSelectedViewLayout: function(layout) {
    /*
     * 選択されているviewが一つの場合のみレイアウトの設定を反映する.
     * 2つ以上選択されているとどのviewにレイアウトを設定したら良いのかが判断できないため.
     */

    if (this._selectedGroupingViews.length !== 1) {
      return;
    }

    var views = this._selectedGroupingViews[0].getAllViews();
    if (views.length !== 1) {
      return;
    }

    var view = views[0];
    view.setLayout(layout, function(){
      var groupingView = this._viewIdToGroupingViewMap[view.getId()];
      groupingView.updateBoxGeometry();
      Native.changedLayoutContentFromJS();
    }.bind(this));
  },

  _updateSelectedViewId: function(oldId, newId) {
    var groupingView = this._viewIdToGroupingViewMap[oldId];
    this._viewIdToGroupingViewMap[newId] = groupingView;
    delete this._viewIdToGroupingViewMap[oldId];
  },

  _convertGroupingViewsToViews: function(groupingViews) {
    var views = [];
    for (var i = 0; i < groupingViews.length; i++) {
      views = views.concat(groupingViews[i].getAllViews());
    }
    return views;
  },

  _selectGroupingView: function(groupingView) {
    if (this._selectedGroupingViews.indexOf(groupingView) >= 0) {
      return;
    }

    this._selectedGroupingViews.push(groupingView);
    groupingView.selected();

    var views = this._convertGroupingViewsToViews(this._selectedGroupingViews);
    if (views.length === 1) {
      this._selectedGroupingViews[0].showResizer();
    } else {
      for (var i = 0; i < this._selectedGroupingViews.length; i++) {
        this._selectedGroupingViews[i].hideResizer();
      }
    }

    Native.setSelectedViewsFromJS(JSON.stringify(views));

  },

  _unselectGroupingView: function(groupingView) {
    var index = this._selectedGroupingViews.indexOf(groupingView);
    if (index === -1) {
      return;
    }

    groupingView.unselected();
    this._selectedGroupingViews.splice(index, 1);

    var views = this._convertGroupingViewsToViews(this._selectedGroupingViews);
    Native.setSelectedViewsFromJS(JSON.stringify(views));
  },

  _unselectAllGroupingViews: function() {
    for (var i = 0; i < this._selectedGroupingViews.length; i++) {
      this._selectedGroupingViews[i].unselected();
    }

    this._selectedGroupingViews = [];

    Native.setSelectedViewsFromJS(JSON.stringify([]));
  },

  _isSelectedGroupingView: function(groupingView) {
    var index = this._selectedGroupingViews.indexOf(groupingView);
    return index !== -1;
  }
});
