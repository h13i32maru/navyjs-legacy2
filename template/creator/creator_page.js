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
 *  changedLayoutContent: function
 * }}
 */
Native;

var CreatorPage = Navy.Class(Navy.Page, {
  CLASSNAME: 'CreatorPage',

  _zoom: null,

  _selectedBox: null,
  _selectedView: null,

  _mouseDx: null,
  _mouseDy: null,

  onCreate: function($super) {
    $super();

    // 雑多な設定
    document.body.style.background = '#666';
    window.CreatorPageInstance = this;
    window.getContentLayout = this._getContentLayout.bind(this);
    this._zoom = parseFloat(document.body.style.zoom);
    // --

    // 要素選択時のboxの初期化
    this._selectedBox = document.createElement('div');
    this._selectedBox.id = 'creator_selected_box';
    this._selectedBox.style.cssText = 'position:absolute; top:0; left:0; width:0; height:0; border:solid 1px red; background-color: rgba(0,0,0,0.3)';
    document.body.appendChild(this._selectedBox);
    // --

    // 要素を移動させるためのマウス操作の追跡
    document.body.addEventListener('mouseup', this._mouseUp.bind(this));

    this._selectedBox.addEventListener('mousedown', function(ev){
      this._mouseDown(this._selectedView, ev);
    }.bind(this));

    this._mouseMove = this._mouseMove.bind(this);
    for (var viewId in this._views) {
      var view = this._views[viewId];
      var elm = view.getElement();
      elm.addEventListener('mousedown', this._mouseDown.bind(this, view));
    }
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
      Native.changedLayoutContent();

      view.getElement().addEventListener('mousedown', this._mouseDown.bind(this, view));

      this._selectView(view.getId());
    }.bind(this));
  },

  _deleteView: function(viewId) {
    //FIXME: view groupにfindViewByIdメソッド作ってそれを使うようにする
    var view = this._views[viewId];
    this.removeView(view);
    Native.changedLayoutContent();
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
    Native.changedLayoutContent();
  },

  _updateSelectedViewLayout: function(layout) {
    if (!this._selectedView) {
      return;
    }

    Native.changedLayoutContent();
    this._selectedView.setLayout(layout);

    var size = this._selectedView.getSize();
    this._selectedBox.style.width = size.width + 'px';
    this._selectedBox.style.height = size.height + 'px';
  },

  _selectView: function(viewId) {
    var view = this._views[viewId];
    var size = view.getSize();
    var pos = view.getPos();
    this._selectedBox.style.width = size.width + 'px';
    this._selectedBox.style.height = size.height + 'px';
    this._selectedBox.style.left = pos.x + 'px';
    this._selectedBox.style.top = pos.y + 'px';

    this._selectedView = view;

    Native.setCurrentViewFromJS(JSON.stringify(view._layout));
  },

  _mouseDown: function(view, ev) {
    this._selectView(view.getId());

    var pos = this._selectedView.getPos();
    this._mouseDx = ev.clientX/this._zoom - pos.x;
    this._mouseDy = ev.clientY/this._zoom - pos.y;
    document.body.addEventListener('mousemove', this._mouseMove);
  },

  _mouseMove: function(ev) {
    var x = ev.clientX/this._zoom - this._mouseDx;
    var y = ev.clientY/this._zoom - this._mouseDy;
    this._selectedView.setPos({x: x, y: y});

    var pos = this._selectedView.getPos();

    this._selectedBox.style.left = pos.x + 'px';
    this._selectedBox.style.top = pos.y + 'px';

    Native.changedLayoutContent();
    Native.setCurrentViewPosFromJS(pos.x, pos.y);
  },

  _mouseUp: function(/* ev */) {
    document.body.removeEventListener('mousemove', this._mouseMove);
  }
});
