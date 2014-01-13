/**
 * @typedef {Object} Include.Grouping
 */
Navy.Class.instance('Include.Grouping', Include.Include, {

  _setupGroupingView: function(view) {
    var groupingId = this._getGroupingId(view);

    if (groupingId !== null) {
      if (this._groupingIdToGroupingViewMap[groupingId]) {
        var groupingView = this._groupingIdToGroupingViewMap[groupingId];
        groupingView.addView(view);
        this._viewIdToGroupingViewMap[view.getId()] = groupingView;
      } else {
        var groupingView = new GroupingView([view]);
        this._viewIdToGroupingViewMap[view.getId()] = groupingView;
        this._groupingIdToGroupingViewMap[groupingId] = groupingView;
      }
    } else {
      groupingId = this._getGroupingUniqueId();
      view._layout.__creator__ = {groupingIds: [groupingId]};
      var groupingView = new GroupingView([view]);
      this._viewIdToGroupingViewMap[view.getId()] = groupingView;
      this._groupingIdToGroupingViewMap[groupingId] = groupingView;
    }
  },

  _initGroupingUniqueId: function() {
    var max = 0;
    var views = this._views;
    for (var viewId in views) {
      var view = views[viewId];
      var groupingIds = this._getGroupingIds(view);
      if (groupingIds.length > 0) {
        max = Math.max.apply(Math, [max].concat(groupingIds));
      }
    }

    this._groupingUniqueId = max + 1;
  },

  _getGroupingUniqueId: function() {
    return this._groupingUniqueId++;
  },

  _getGroupingIds: function(view) {
    var layout = view._layout;
    if (layout.__creator__ && layout.__creator__.groupingIds && layout.__creator__.groupingIds.length > 0) {
      return [].concat(layout.__creator__.groupingIds);
    } else {
      return [];
    }
  },

  _getGroupingId: function(view) {
    var groupingIds = this._getGroupingIds(view);
    if (groupingIds.length > 0) {
      return groupingIds[0];
    } else {
      return null;
    }
  },

  _execGroupingViews: function() {
    var groupingViews = this._selectedGroupingViews;
    if (groupingViews.length <= 1) {
      return;
    }

    var newGroupingId = this._getGroupingUniqueId();
    var views = [];

    this._unselectAllGroupingViews();

    for (var i = 0; i < groupingViews.length; i++) {
      var groupingView = groupingViews[i];
      var allViews = groupingView.getAllViews();
      var groupingId = this._getGroupingId(allViews[0]);

      this._groupingIdToGroupingViewMap[groupingId] = null;
      delete this._groupingIdToGroupingViewMap[groupingId];
      views = views.concat(allViews);
      groupingView.releaseAllViews();
    }

    var newGroupingView = new GroupingView(views);
    this._groupingIdToGroupingViewMap[newGroupingId] = newGroupingView;

    for (var i = 0; i < views.length; i++) {
      var view = views[i];
      view._layout.__creator__.groupingIds.unshift(newGroupingId);
      this._viewIdToGroupingViewMap[view.getId()] = newGroupingView;
    }

    this._selectGroupingView(newGroupingView);
    Native.changedLayoutContentFromJS();
  },

  _execUngroupingViews: function() {
    var groupingViews = this._selectedGroupingViews;

    // 複数のGroupingViewが選択されている場合は処理を行わない.
    // つまり1つのGroupingViewしか分解しない.
    if (groupingViews.length !== 1) {
      return;
    }

    // GroupingViewに含まれるViewが1つの場合はこれ以上分解できないので処理を行わい.
    if (groupingViews[0].getAllViews().length === 1) {
      return;
    }

    /*
     * 現在のGroupingViewを削除する.
     */
    var groupingView = groupingViews[0];
    var views = groupingView.getAllViews();
    var groupingId = this._getGroupingId(views[0]);

    this._groupingIdToGroupingViewMap[groupingId] = null;
    delete this._groupingIdToGroupingViewMap[groupingId];

    this._unselectAllGroupingViews();
    groupingView.releaseAllViews();

    /*
     * 一つ前のGroupingViewに戻す.
     */
    for (var i = 0; i < views.length; i++) {
      var view = views[i];
      view._layout.__creator__.groupingIds.shift();
      var groupingId = this._getGroupingId(view);
      var groupingView = this._groupingIdToGroupingViewMap[groupingId] || new GroupingView();
      groupingView.addView(view);
      this._groupingIdToGroupingViewMap[groupingId] = groupingView;
      this._viewIdToGroupingViewMap[view.getId()] = groupingView;
      this._selectGroupingView(groupingView);
    }

    Native.changedLayoutContentFromJS();
  }
});
