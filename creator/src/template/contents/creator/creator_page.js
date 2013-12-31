Navy.Class('CreatorPage', Navy.Page, {
  _bodyPos: null,
  _zoom: null,

  _selectedGroupingViews: null,
  _resizeType: null,

  _groupingUniqueId: null,

  _viewIdToGroupingViewMap: null,
  _groupingIdToGroupingViewMap: null,

  onCreate: function($super) {
    $super();

    // 雑多な設定
    document.body.style.background = '#666';
    window.CreatorPageInstance = this;
    window.getContentLayout = this._getContentLayout.bind(this);
    this._bodyPos = {x: parseFloat(document.body.style.left), y: parseFloat(document.body.style.top)};
    this._zoom = parseFloat(document.body.style.zoom);
    this._selectedGroupingViews = [];
    this._viewIdToGroupingViewMap = {};
    this._groupingIdToGroupingViewMap = {};
    this._initGroupingUniqueId();
    // --

    // 要素を移動させるためのマウス操作の追跡
    document.body.addEventListener('mouseup', this._mouseUp.bind(this));
    document.body.addEventListener('mousedown', this._mouseDown.bind(this));
    document.body.addEventListener('click', this._click.bind(this));
    this._mouseMoveForMoveView = this._mouseMoveForMoveView.bind(this);
    this._mouseMoveForResizeView = this._mouseMoveForResizeView.bind(this);
    // --

    Navy.Resource.loadLayout(this._layout.extra.contentLayoutFile, function(layout){
      Native.setViewsFromJS(JSON.stringify(layout));
    });

    Native.changedViewsOrderToJS.connect(this._updateViewsOrderFromNative.bind(this));
    Native.changedSelectedViewToJS.connect(this._selectViewsFromNative.bind(this));
    Native.changedViewPropertyToJS.connect(this._updateSelectedViewLayoutFromNative.bind(this));
    Native.addViewToJS.connect(this._addViewFromNative.bind(this));
    Native.deleteSelectedViewsToJS.connect(this._deleteSelectedViewsFromNative.bind(this));
    Native.setScreenToJS.connect(this._setScreenFromNative.bind(this));
    Native.setScreenEnableToJS.connect(this._setScreenEnableFromNative.bind(this));
    Native.unselectAllViewsToJS.connect(this._unselectAllViewsFromNative.bind(this));
    Native.alignSelectedViewsToJS.connect(this._alignSelectedViewsFromNative.bind(this));
    Native.arrangeSelectedViewsToJS.connect(this._arrangeSelectedViewsFromNative.bind(this));
    Native.groupingViewsToJS.connect(this._execGroupingViewsFromNative.bind(this));
    Native.ungroupingViewsToJS.connect(this._execUngroupingViewsFromNative.bind(this));
  },

  onResumeAfter: function($super) {
    $super();
    for (var viewId in this._views) {
      var view = this._views[viewId];
      this._setupGroupingView(view);
    }
  },

  _setupGroupingView: function(view) {
    var groupingId = this._getGroupingId(view);

    if (groupingId !== null) {
      var groupingView = this._groupingIdToGroupingViewMap[groupingId];
      groupingView.addView(view);
      return;
    }

    groupingId = this._getGroupingUniqueId();
    view._layout.__creator__ = {groupingIds: [groupingId]};
    var groupingView = new GroupingView([view]);
    this._viewIdToGroupingViewMap[view.getId()] = groupingView;
    this._groupingIdToGroupingViewMap[groupingId] = groupingView;
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

  _addViewFromNative: function(viewId, viewClass, layout) {
    layout.id = viewId;
    layout.class = viewClass;

    var _class = Navy.Resource.getClass(viewClass);
    var view = new _class(layout, function(){
      this.addView(view);
      Native.changedLayoutContentFromJS();
      this._setupGroupingView(view);
      this._unselectAllGroupingViews();
      this._selectView(view);
    }.bind(this));
  },

  _deleteSelectedViewsFromNative: function() {
    this._deleteSelectedGroupingViews();
  },

  _deleteSelectedGroupingViews: function() {
    for (var i = 0; i < this._selectedGroupingViews.length; i++) {
      var groupingView = this._selectedGroupingViews[i];
      groupingView.destroy();
    }
    Native.changedLayoutContentFromJS();
    this._selectedGroupingViews = [];
  },

  _setScreenFromNative: function(sceneId, pageId) {
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

  _setScreenEnableFromNative: function(enable) {
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

  _updateViewsOrderFromNative: function(viewIds) {
    for (var i = 0; i < viewIds.length; i++) {
      var id = viewIds[i];
      var view = this._views[id];
      this.removeView(view);
      this.addView(view);
    }
    Native.changedLayoutContentFromJS();
  },

  _updateSelectedViewLayoutFromNative: function(layout) {
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
      var size = view.getSize();
      var pos = view.getPos();
      groupingView.setSize(size);
      groupingView.setPos(pos);
      Native.changedLayoutContentFromJS();
    }.bind(this));
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

  _execGroupingViewsFromNative: function() {
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

  _execUngroupingViewsFromNative: function() {
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
  },

  _convertGroupingViewsToViews: function(groupingViews) {
    var views = [];
    for (var i = 0; i < groupingViews.length; i++) {
      views = views.concat(groupingViews[i].getAllViews());
    }
    return views;
  },

  _selectViewsFromNative: function(viewIds) {
    for (var i = 0; i < viewIds.length; i++) {
      var groupingView = this._viewIdToGroupingViewMap[viewIds[i]];
      this._selectGroupingView(groupingView);
    }
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

  _unselectAllViewsFromNative: function() {
    this._unselectAllGroupingViews();
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
  },

  _updateSelectedGroupingViewMouseDistance: function(ev) {
    var clientX = ev.clientX/this._zoom;
    var clientY = ev.clientY/this._zoom;
    for (var i = 0; i < this._selectedGroupingViews.length; i++) {
      var groupingView = this._selectedGroupingViews[i];
      var pos = groupingView.getPos();
      groupingView.__mouseDx__ = clientX - pos.x;
      groupingView.__mouseDy__ = clientY - pos.y;
    }
  },

  _click: function(ev) {
    if (this._ignoreClick) {
      return;
    }

    this._unselectAllGroupingViews();

    var groupingView = ev.target.__groupingView__;
    if (groupingView) {
      this._selectGroupingView(groupingView);
    }
  },

  _isBox: function(elm) {
    return !!elm.__groupingView__;
  },

  _isResizer: function(elm) {
    return !!elm.parentElement.__groupingView__;
  },

  _mouseDown: function(ev) {
    if (this._isBox(ev.target)) {
      var groupingView = ev.target.__groupingView__;
      this._mouseDownForMoveView(groupingView, ev);
    } else if (this._isResizer(ev.target)) {
      var groupingView = ev.target.parentElement.__groupingView__;
      this._mouseDownForResizeView(groupingView, ev);
    } else {
      this._unselectAllGroupingViews();
    }
  },

  _mouseDownForMoveView: function(groupingView, ev){
    this._ignoreClick = true;
    var isSelected = this._isSelectedGroupingView(groupingView);

    if (ev.ctrlKey && isSelected) {
      /*
       * 既に選択されているViewを解除しようとしている
       */
      this._unselectGroupingView(groupingView);
    } else if (ev.ctrlKey && !isSelected) {
      /*
       * 別のViewを追加で選択しようとしている.
       */
      this._selectGroupingView(groupingView);
      this._updateSelectedGroupingViewMouseDistance(ev);
    } else if (!ev.ctrlKey && isSelected) {
      /*
       * 選択しているViewを移動させようとしている.
       */
      this._ignoreClick = false; // この時点ではclickを無視して良いのか判断が使いの. mouseUp時に判断する.
      this._updateSelectedGroupingViewMouseDistance(ev);
    } else if (!ev.ctrlKey && !isSelected) {
      /*
       * 現在選択されているviewをすべてリセットして新たにviewを選択しようとしている.
       */
      this._unselectAllGroupingViews();
      this._selectGroupingView(groupingView);
      this._updateSelectedGroupingViewMouseDistance(ev);
    }

    // 左ボタンの場合はマウスの移動にviewを追従させる
    if (ev.button === 0) {
      document.body.addEventListener('mousemove', this._mouseMoveForMoveView);
    }
  },

  _mouseMoveForMoveView: function(ev) {
    this._ignoreClick = true;
    var clientX = ev.clientX / this._zoom;
    var clientY = ev.clientY / this._zoom;
    var selectedGroupingViews = this._selectedGroupingViews;

    for (var i = 0; i < selectedGroupingViews.length; i++) {
      var groupingView = selectedGroupingViews[i];
      var x = clientX - groupingView.__mouseDx__;
      var y = clientY - groupingView.__mouseDy__;

      groupingView.setPos({x: x, y: y});
    }

    Native.changedLayoutContentFromJS();

    // 移動したViewが1つの場合だけ座標を通知する.
    if (selectedGroupingViews.length === 1 && selectedGroupingViews[0].getAllViews().length === 1) {
      Native.setCurrentViewPosFromJS(x, y);
    }
  },

  _mouseDownForResizeView: function(groupingView, ev) {
    this._unselectAllGroupingViews();
    this._selectGroupingView(groupingView);
    this._resizeType = ev.target.dataset['resizeType'];
    document.body.addEventListener('mousemove', this._mouseMoveForResizeView);
  },

  _mouseMoveForResizeView: function(ev) {
    /*
     * リサイズのアルゴリズムはマウスの座標、viewの座標、viewのサイズからリサイズ後のサイズと位置を計算するだけ.
     * 基本的には[マウスの座標 - viewの座標]がviewのサイズになる.
     * あとはこれをリサイズ方向で計算方法を調整すればよい.
     * ただし、viewの座標が変更されるリサイズについては微妙にviewの位置が定まらずプルプルしてしまう.(TODO)
     */

    var clientX = Math.round(ev.clientX / this._zoom - this._bodyPos.x);
    var clientY = Math.round(ev.clientY / this._zoom - this._bodyPos.y);

    var groupingView = this._selectedGroupingViews[0];
    var pos = groupingView.getPos();
    var size = groupingView.getSize();
    var newSize;
    var newPos = pos;

    switch(this._resizeType) {
    case 'left.top':
      newSize = {width: (pos.x + size.width) - clientX, height: (pos.y + size.height) - clientY};
      newPos = {x: clientX, y: clientY};
      break;
    case 'h_center.top':
      newSize = {width: size.width, height: (pos.y + size.height) - clientY};
      newPos = {x: pos.x, y: clientY};
      break;
    case 'right.top':
      newSize = {width: clientX - pos.x, height: (pos.y + size.height) - clientY};
      newPos = {x: pos.x, y: clientY};
      break;
    case 'left.v_center':
      newSize = {width: (pos.x + size.width) - clientX, height: size.height};
      newPos = {x: clientX, y: pos.y};
      break;
    case 'left.bottom':
      newSize = {width: (pos.x + size.width) - clientX, height: clientY - pos.y};
      newPos = {x: clientX, y: pos.y};
      break;
    case 'right.v_center':
      newSize = {width: clientX - pos.x, height: size.height};
      break;
    case 'h_center.bottom':
      newSize = {width: size.width, height: clientY - pos.y};
      break;
    case 'right.bottom':
      newSize = {width: clientX - pos.x, height: clientY - pos.y};
      break;
    }

    groupingView.setSize(newSize);
    groupingView.setPos(newPos);

    Native.changedLayoutContentFromJS();
    Native.setCurrentViewSizeFromJS(newSize.width, newSize.height);
    Native.setCurrentViewPosFromJS(newPos.x, newPos.y);
  },

  _mouseUp: function(/* ev */) {
    document.body.removeEventListener('mousemove', this._mouseMoveForMoveView);
    document.body.removeEventListener('mousemove', this._mouseMoveForResizeView);
  },

  _alignSelectedViewsFromNative: function(type) {
    /*
     * 位置揃えのアルゴリズムは一番目のviewの起点(anchor)から各viewがどれだけ移動すればよいかを求めれば良い.
     *
     * 例えば下揃えの場合:
     * 起点は一番目のviewの下辺座標(= 上辺座標 + 高さ * 1)となる.
     * そして各viewはこの起点から自身の高さだけずれることになる.
     *
     * 同じように中央揃えの場合:
     * 起点は[上辺座標 + 高さ * 0.5]となり、各viewはこの起点から自身の高さ * 0.5だけずれる.
     */

    var groupingViews = this._selectedGroupingViews;

    if (type.indexOf('ROOT_') === 0) {
      // Rootを起点とする場合はanchorViewを選択されたものじゃなくてRoot固定にして、typeをちょっといじる.
      var anchorView = Navy.Root;
      type = type.substr(5);
    } else {
      var anchorView = groupingViews[0];
    }

    if (type === 'TOP' || type === 'V_CENTER' || type === 'BOTTOM') {
      switch(type) {
      case 'TOP':
        var delta = 0;
        break;
      case 'V_CENTER':
        var delta = 0.5;
        break;
      case 'BOTTOM':
        var delta = 1;
        break;
      }

      var anchor = anchorView.getPos().y + parseInt(anchorView.getSize().height * delta, 10);
      for (var i = 0; i < groupingViews.length; i++) {
        var view = groupingViews[i];
        if (view === anchorView) {
          continue;
        }
        var pos = view.getPos();
        var size = view.getSize();
        var y = anchor - parseInt(size.height * delta, 10);
        view.setPos({x: pos.x, y: y});
      }
    }

    if (type === 'LEFT' || type === 'H_CENTER' || type === 'RIGHT') {
      switch(type) {
      case 'LEFT':
        var delta = 0;
        break;
      case 'H_CENTER':
        var delta = 0.5;
        break;
      case 'RIGHT':
        var delta = 1;
        break;
      }

      var anchor = anchorView.getPos().x + parseInt(anchorView.getSize().width * delta, 10);
      for (var i = 0; i < groupingViews.length; i++) {
        var view = groupingViews[i];
        if (view === anchorView) {
          continue;
        }
        var pos = view.getPos();
        var size = view.getSize();
        var x = anchor - parseInt(size.width * delta, 10);
        view.setPos({x: x, y: pos.y});
      }
    }

    Native.changedLayoutContentFromJS();
  },

  _arrangeSelectedViewsFromNative: function(type) {
    var groupingViews = this._selectedGroupingViews;

    if (groupingViews.length <= 1) {
      return;
    }

    if (type === 'H_CLOSELY') {
      this._sortViewsByX(groupingViews);
      var x = groupingViews[0].getPos().x + groupingViews[0].getSize().width;
      for (var i = 1; i < groupingViews.length; i++) {
        var view = groupingViews[i];
        var pos = view.getPos();
        var size = view.getSize();
        view.setPos({x: x, y: pos.y});
        x = x + size.width;
      }
    }

    if (type === 'V_CLOSELY') {
      this._sortViewsByY(groupingViews);
      var y = groupingViews[0].getPos().y + groupingViews[0].getSize().height;
      for (var i = 1; i < groupingViews.length; i++) {
        var view = groupingViews[i];
        var pos = view.getPos();
        var size = view.getSize();
        view.setPos({x: pos.x, y: y});
        y = y + size.height;
      }
    }

    if (type === 'H_EVEN') {
      this._sortViewsByX(groupingViews);
      var startView = groupingViews[0];
      var endView = groupingViews[groupingViews.length - 1];
      var totalSpace = (endView.getPos().x + endView.getSize().width) - startView.getPos().x;
      for (var i = 0; i < groupingViews.length; i++) {
        totalSpace -= groupingViews[i].getSize().width;
      }

      if (totalSpace <= 0) {
        return;
      }

      var space = totalSpace / (groupingViews.length - 1);

      var x = groupingViews[0].getPos().x + groupingViews[0].getSize().width + space;
      for (var i = 1; i < groupingViews.length; i++) {
        var view = groupingViews[i];
        var pos = view.getPos();
        var size = view.getSize();
        view.setPos({x: x, y: pos.y});
        x = x + size.width + space;
      }
    }

    if (type === 'V_EVEN') {
      this._sortViewsByY(groupingViews);
      var startView = groupingViews[0];
      var endView = groupingViews[groupingViews.length - 1];
      var totalSpace = (endView.getPos().y + endView.getSize().height) - startView.getPos().y;
      for (var i = 0; i < groupingViews.length; i++) {
        totalSpace -= groupingViews[i].getSize().height;
      }

      if (totalSpace <= 0) {
        return;
      }

      var space = totalSpace / (groupingViews.length - 1);

      var y = groupingViews[0].getPos().y + groupingViews[0].getSize().height + space;
      for (var i = 1; i < groupingViews.length; i++) {
        var view = groupingViews[i];
        var pos = view.getPos();
        var size = view.getSize();
        view.setPos({x: pos.x, y: y});
        y = y + size.height + space;
      }
    }

    Native.changedLayoutContentFromJS();
  },

  _sortViewsByX: function(views) {
    views.sort(function(view1, view2){
      return view1.getPos().x - view2.getPos().x;
    });
  },

  _sortViewsByY: function(views) {
    views.sort(function(view1, view2){
      return view1.getPos().y - view2.getPos().y;
    });
  }
});
