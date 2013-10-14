/**
 * @typedef {{
 *   setViewsFromJS: function,
 *   setCurrentViewFromJS: function,
 *   setCurrentViewPosFromJS: function,
 *   changedViewsOrderToJS: {connect: function},
 *   changedSelectedViewToJS: {connect: function},
 *   changedViewPropertyToJS: {connect: function},
 *   addViewToJS: {connect: function},
 *   deleteViewToJS: {connect: function},
 *   setScreenToJS: {connect: function},
 *   setScreenEnableToJS: {connect: function},
 *   changedLayoutContentFromJS: function
 * }}
 */
Native;

var CreatorPage = Navy.Class(Navy.Page, {
  CLASSNAME: 'CreatorPage',

  _zoom: null,

  _selectedViews: null,

  onCreate: function($super) {
    $super();

    // 雑多な設定
    document.body.style.background = '#666';
    window.CreatorPageInstance = this;
    window.getContentLayout = this._getContentLayout.bind(this);
    this._zoom = parseFloat(document.body.style.zoom);
    // --

    this._selectedViews = [];

    // 要素を移動させるためのマウス操作の追跡
    document.body.addEventListener('mouseup', this._mouseUp.bind(this));
    this._mouseMove = this._mouseMove.bind(this);
    // --

    Navy.Resource.loadLayout(this._layout.extra.contentLayoutFile, function(layout){
      Native.setViewsFromJS(JSON.stringify(layout));
    });

    Native.changedViewsOrderToJS.connect(this._updateViewsOrder.bind(this));
    Native.changedSelectedViewToJS.connect(this._selectView.bind(this));
    Native.changedViewPropertyToJS.connect(this._updateSelectedViewLayout.bind(this));
    Native.addViewToJS.connect(this._addView.bind(this));
    Native.deleteViewToJS.connect(this._deleteView.bind(this));
    Native.setScreenToJS.connect(this._setScreen.bind(this));
    Native.setScreenEnableToJS.connect(this._setScreenEnable.bind(this));
  },

  onResumeAfter: function($super) {
    $super();
    /**
     * FIXME: Sceneのレジュームされるまでviewの大きさがわからないので無理やりやっている.
     * Sceneにイベントを登録できるようにするか、pageのレジュームの呼び出しタイミングを修正する必要あり.
     */
    this.getScene().onResumeAfter = function(){
      for (var viewId in this._views) {
        var view = this._views[viewId];
        var size = view.getSize();
        var pos = view.getPos();
        var box  = document.createElement('div');
        box.className = 'creator_selected_box';
        box.style.cssText = 'opacity:0; position:absolute; border:solid 1px red; background-color: rgba(0,0,0,0.3)';
        box.style.width = size.width + 'px';
        box.style.height = size.height + 'px';
        box.style.left = pos.x + 'px';
        box.style.top = pos.y + 'px';
        document.body.appendChild(box);
        box.addEventListener('mousedown', this._mouseDown.bind(this, view));
        box.addEventListener('click', this._click.bind(this, view));
        box.__view__ = view;
        view.__box__ = box;
      }
    }.bind(this);

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

  _addView: function(viewId, viewClass) {
    var layout = {
      id: viewId,
      class: viewClass,
      pos: {x: 0, y: 0},
      sizePolicy: 'wrapContent',
      extra: {}
    };

    switch (viewClass) {
    case 'Navy.View.Text':
      layout.extra.text = 'text';
      break;
    case 'Navy.View.Image':
      layout.extra.src = null;
      break;
    case 'Navy.ViewGroup.ViewGroup':
      layout.extra.contentLayoutFile = null;
    }

    var _class = Navy.Resource.getClass(viewClass);
    var view = new _class(layout, function(){
      this.addView(view);
      Native.changedLayoutContentFromJS();

      // FIXME: ここリファクタする.
      var size = view.getSize();
      var pos = view.getPos();
      var box  = document.createElement('div');
      box.className = 'creator_selected_box';
      box.style.cssText = 'opacity:0; position:absolute; border:solid 1px red; background-color: rgba(0,0,0,0.3)';
      box.style.width = size.width + 'px';
      box.style.height = size.height + 'px';
      box.style.left = pos.x + 'px';
      box.style.top = pos.y + 'px';
      document.body.appendChild(box);
      box.addEventListener('mousedown', this._mouseDown.bind(this, view));
      box.addEventListener('click', this._click.bind(this, view));
      box.__view__ = view;
      view.__box__ = box;

      this._unselectAllView();
      this._selectView(view.getId());
    }.bind(this));
  },

  _deleteView: function(viewId) {
    //FIXME: view groupにfindViewByIdメソッド作ってそれを使うようにする
    var view = this._views[viewId];
    this.removeView(view);
    Native.changedLayoutContentFromJS();
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
    var funcName = enable ? 'show' : 'hide';
    var scene = this.getScene();
    var views = scene.getAllViews();
    for (var viewId in views) {
      var view = views[viewId];
      if (view !== this) {
        view[funcName]();
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
    if (this._selectedViews.length === 0) {
      return;
    }

    var view = this._selectedViews[this._selectedViews.length - 1];
    view.setLayout(layout, function(){
      var size = view.getSize();
      var pos = view.getPos();
      var box = view.__box__;
      box.style.width = size.width + 'px';
      box.style.height = size.height + 'px';
      box.style.left = pos.x + 'px';
      box.style.top = pos.y + 'px';
    }.bind(this));

    Native.changedLayoutContentFromJS();
  },

  _selectView: function(viewId) {
    var view = this._views[viewId];
    var box = view.__box__;
    box.style.opacity = '1';
    this._selectedViews.push(view);

    Native.setCurrentViewFromJS(JSON.stringify(view._layout));
  },

  _unselectView: function(viewId) {
    //FIXME: findViewByIdを実装する
    var view = this._views[viewId];
    var box = view.__box__;
    box.style.opacity = '0';
    var index = this._selectedViews.indexOf(view);
    this._selectedViews.splice(index, 1);
  },

  _unselectAllView: function() {
    for (var i = 0; i < this._selectedViews.length; i++) {
      var box = this._selectedViews[i].__box__;
      box.style.opacity = '0';
    }
    this._selectedViews = [];
  },

  _isSelectedView: function(viewId) {
    var view = this._views[viewId];
    var index = this._selectedViews.indexOf(view);
    return index !== -1;
  },

  _updateSelectedViewMouseDistance: function(ev) {
    var clientX = ev.clientX/this._zoom;
    var clientY = ev.clientY/this._zoom;
    for (var i = 0; i < this._selectedViews.length; i++) {
      var pos = this._selectedViews[i].getPos();
      var box = this._selectedViews[i].__box__;
      box.__mouseDx__ = clientX - pos.x;
      box.__mouseDy__ = clientY - pos.y;
    }
  },

  _click: function(view, ev) {
    if (!this._unselectAllViewForClick) {
      return;
    }

    if (this._movingSelectedView) {
      return;
    }

    this._unselectAllView();
    this._selectView(view.getId());
  },

  _mouseDown: function(view, ev) {
    var viewId = view.getId();

    // クリックイベントで選択要素をすべてリセットして、対象の要素だけを選択状態にするかどうか
    this._unselectAllViewForClick = false;
    this._movingSelectedView = false;

    if (ev.ctrlKey) {
      if (this._isSelectedView(viewId)) {
        this._unselectView(viewId);
      } else {
        // viewを選択状態にする
        this._selectView(viewId);
        this._updateSelectedViewMouseDistance(ev);
      }
    } else {
      if (this._isSelectedView(viewId)) {
        // viewを移動させようとしているので選択されているすべてのviewのdx,dyを更新する
        this._updateSelectedViewMouseDistance(ev);
        this._unselectAllViewForClick = true;
      } else {
        // 現在選択されているviewをすべてリセットして新たにviewを選択する
        this._unselectAllView();
        this._selectView(viewId);
        this._updateSelectedViewMouseDistance(ev);
      }
    }
    document.body.addEventListener('mousemove', this._mouseMove);
  },

  _mouseMove: function(ev) {
    this._movingSelectedView = true;

    var clientX = ev.clientX / this._zoom;
    var clientY = ev.clientY / this._zoom;
    var selectedViews = this._selectedViews;

    for (var i = 0; i < selectedViews.length; i++) {
      var view = selectedViews[i];
      var box = view.__box__;
      var x = clientX - box.__mouseDx__;
      var y = clientY - box.__mouseDy__;

      view.setPos({x: x, y: y});
      var pos = view.getPos();

      box.style.left = pos.x + 'px';
      box.style.top = pos.y + 'px';
    }

    Native.changedLayoutContentFromJS();
    Native.setCurrentViewPosFromJS(pos.x, pos.y);
  },

  _mouseUp: function(/* ev */) {
    document.body.removeEventListener('mousemove', this._mouseMove);
  }
});
