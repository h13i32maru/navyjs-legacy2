/**
 * @typedef {Object} Include.NativeBridge
 */
Navy.Class.instance('Include.NativeBridge', Include.Include, {
  initialize: function($super, targetObject) {
    $super(targetObject);

    (function(){
      Native.changedViewsOrderToJS.connect(this._updateViewsOrderFromNative.bind(this));
      Native.changedSelectedViewToJS.connect(this._selectViewsFromNative.bind(this));
      Native.changedViewPropertyToJS.connect(this._updateSelectedViewLayoutFromNative.bind(this));
      Native.changedViewIdToJS.connect(this._updateSelectedViewIdFromNative.bind(this));
      Native.addViewToJS.connect(this._addViewFromNative.bind(this));
      Native.deleteSelectedViewsToJS.connect(this._deleteSelectedViewsFromNative.bind(this));
      Native.setScreenToJS.connect(this._setScreenFromNative.bind(this));
      Native.unselectAllViewsToJS.connect(this._unselectAllViewsFromNative.bind(this));
      Native.alignSelectedViewsToJS.connect(this._alignSelectedViewsFromNative.bind(this));
      Native.arrangeSelectedViewsToJS.connect(this._arrangeSelectedViewsFromNative.bind(this));
      Native.groupingViewsToJS.connect(this._execGroupingViewsFromNative.bind(this));
      Native.ungroupingViewsToJS.connect(this._execUngroupingViewsFromNative.bind(this));
    }).apply(targetObject);
  },

  _addViewFromNative: function(viewId, viewClass, layout) {
    this._createNewView(viewId, viewClass, layout);
  },

  _deleteSelectedViewsFromNative: function() {
    this._deleteSelectedGroupingViews();
  },

  _setScreenFromNative: function(sceneId, pageId, enable) {
    this._setScreen(sceneId, pageId, enable);
  },

  _updateViewsOrderFromNative: function(viewIds) {
    var views = [];
    for (var i = 0; i < viewIds.length; i++) {
      var id = viewIds[i];
      var view = this._views[id];
      views.push(view);
    }

    this._updateViewsOrder(views);
  },

  _updateSelectedViewLayoutFromNative: function(layout) {
    this._updateSelectedViewLayout(layout);
  },

  _updateSelectedViewIdFromNative: function(oldId, newId) {
    this._updateSelectedViewId(oldId, newId);
  },

  _execGroupingViewsFromNative: function() {
    this._execGroupingViews();
  },

  _execUngroupingViewsFromNative: function() {
    this._execUngroupingViews();
  },

  _selectViewsFromNative: function(viewIds) {
    for (var i = 0; i < viewIds.length; i++) {
      var groupingView = this._viewIdToGroupingViewMap[viewIds[i]];
      this._selectGroupingView(groupingView);
    }
  },

  _unselectAllViewsFromNative: function() {
    this._unselectAllGroupingViews();
  }
});
