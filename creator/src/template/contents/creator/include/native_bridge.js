/**
 * @typedef {Object} Include.NativeBridge
 */
Navy.Class.instance('Include.NativeBridge', {
  _addViewFromNative: function(viewId, viewClass, layout) {
    this._createNewView(viewId, viewClass, layout);
  },

  _deleteSelectedViewsFromNative: function() {
    this._deleteSelectedGroupingViews();
  },

  _setScreenFromNative: function(sceneId, pageId) {
    this._setScreen(sceneId, pageId);
  },

  _setScreenEnableFromNative: function(enable) {
    this._setScreenEnable(enable);
  },

  _updateViewsOrderFromNative: function(viewIds) {
    this._updateViewsOrder(viewIds);
  },

  _updateSelectedViewLayoutFromNative: function(layout) {
    this._updateSelectedViewLayout(layout);
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

Include.NativeBridge.initialize();
