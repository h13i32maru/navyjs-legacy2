Navy.Class('CreatorPage', Navy.Page, {
  _selectedGroupingViews: null,
  _viewIdToGroupingViewMap: null,
  _groupingIdToGroupingViewMap: null,

  onCreate: function($super, ev) {
    $super(ev);

    Include.Tidy.initialize(this);
    Include.Grouping.initialize(this);
    Include.NativeBridge.initialize(this);
    Include.Move.initialize(this);

    // 雑多な設定
    document.body.style.background = '#666';
    window.CreatorPageInstance = this;
    window.getContentLayout = this._getContentLayout.bind(this);
    this._selectedGroupingViews = [];
    this._viewIdToGroupingViewMap = {};
    this._groupingIdToGroupingViewMap = {};
    // --

    Navy.Resource.loadLayout(this._layout.extra.contentLayoutFile, function(layout){
      Native.setViewsFromJS(JSON.stringify(layout));
    });
  },

  onResumeAfter: function($super, ev) {
    $super(ev);
    for (var viewId in this._views) {
      var view = this._views[viewId];
      this._setupGroupingView(view);
    }
  },

  _getContentLayout: function() {
    var order = this._getOrderedViews();
    return JSON.stringify(order, null, 2);
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

    var _class = Navy.Resource.getClass(viewClass);
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

  _setScreen: function(sceneId, pageId) {
    if (sceneId && Navy.Config.scene[sceneId]) {
      var sceneLayout = JSON.parse(JSON.stringify(Navy.Config.scene[sceneId]));
    }

    if (pageId && Navy.Config.page[pageId]) {
      var pageLayout = JSON.parse(JSON.stringify(Navy.Config.page[pageId]));
    }

    if (sceneLayout && pageLayout) {
      var scene = this.getScene();

      //FIXME: 本来はレイアウトの設定でIDが変わらないようにNavyを修正すべき
      sceneLayout.id = scene.getId();

      //レイアウトを再設定するのでPage以外のviewを削除しておく
      var views = scene.getAllViews();
      for (var viewId in views) {
        var view = views[viewId];
        if (view !== this) {
          scene.removeView(view);
        }
      }
      scene.setLayout(sceneLayout);

      this.setBackgroundColor(pageLayout.backgroundColor);
    } else if (sceneLayout) {
      var scene = this.getScene();
      scene.setBackgroundColor(sceneLayout.backgroundColor);
    }
  },

  _setScreenEnable: function(enable) {
    var scene = this.getScene();
    var views = scene.getAllViews();
    for (var viewId in views) {
      var view = views[viewId];
      if (view !== this) {
        view.setVisible(enable);
      }
    }

    /*
     * 無効にする場合は背景も合わせて透明にしておく.
     * 有効にする場合、Creator側で再度setScreenToJSを発行してもらうため元の背景色を復元させなくてもよい.
     */
    if (!enable) {
      this.setBackgroundColor('transparent');
      scene.setBackgroundColor('transparent');
    }
  },

  _updateViewsOrder: function(viewIds) {
    for (var i = 0; i < viewIds.length; i++) {
      var id = viewIds[i];
      var view = this._views[id];
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
