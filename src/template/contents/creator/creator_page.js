/**
 * @typedef {{
 *   setViewsFromJS: function,
 *   setCurrentViewFromJS: function,
 *   setCurrentViewPosFromJS: function,
 *   setCurrentViewSizeFromJS: function,
 *   changedViewsOrderToJS: {connect: function},
 *   changedSelectedViewToJS: {connect: function},
 *   changedViewPropertyToJS: {connect: function},
 *   addViewToJS: {connect: function},
 *   deleteViewToJS: {connect: function},
 *   setScreenToJS: {connect: function},
 *   setScreenEnableToJS: {connect: function},
 *   changedLayoutContentFromJS: function,
 *   unselectAllViewsToJS: {connect: function},
 *   alignSelectedViewsToJS: {connect: function},
 *   arrangeSelectedViewsToJS: {connect: function},
 * }}
 */
Native;

Navy.Class('CreatorPage', Navy.Page, {
  _bodyPos: null,
  _zoom: null,

  _selectedViews: null,
  _resizeType: null,

  onCreate: function($super) {
    $super();

    // 雑多な設定
    document.body.style.background = '#666';
    window.CreatorPageInstance = this;
    window.getContentLayout = this._getContentLayout.bind(this);
    this._bodyPos = {x: parseFloat(document.body.style.left), y: parseFloat(document.body.style.top)};
    this._zoom = parseFloat(document.body.style.zoom);
    // --

    this._selectedViews = [];

    // 要素を移動させるためのマウス操作の追跡
    document.body.addEventListener('mouseup', this._mouseUp.bind(this));
    document.body.addEventListener('mousedown', function(ev){
      if (ev.target === this.getElement()) {
        this._unselectAllView();
      }
    }.bind(this));
    this._mouseMove = this._mouseMove.bind(this);
    this._mouseMoveForResizeView = this._mouseMoveForResizeView.bind(this);
    // --

    Navy.Resource.loadLayout(this._layout.extra.contentLayoutFile, function(layout){
      Native.setViewsFromJS(JSON.stringify(layout));
    });

    Native.changedViewsOrderToJS.connect(this._updateViewsOrder.bind(this));
    Native.changedSelectedViewToJS.connect(this._selectViews.bind(this));
    Native.changedViewPropertyToJS.connect(this._updateSelectedViewLayout.bind(this));
    Native.addViewToJS.connect(this._addView.bind(this));
    Native.deleteViewToJS.connect(this._deleteView.bind(this));
    Native.setScreenToJS.connect(this._setScreen.bind(this));
    Native.setScreenEnableToJS.connect(this._setScreenEnable.bind(this));
    Native.unselectAllViewsToJS.connect(this._unselectAllView.bind(this));
    Native.alignSelectedViewsToJS.connect(this._alignSelectedViews.bind(this));
    Native.arrangeSelectedViewsToJS.connect(this._arrangeSelectedViews.bind(this));
  },

  onResumeAfter: function($super) {
    $super();
    /**
     * FIXME: Sceneのレジュームされるまでviewの大きさがわからないので無理やりやっている.
     * Sceneにイベントを登録できるようにするか、pageのレジュームの呼び出しタイミングを修正する必要あり.
     */
    this.getScene().onResumeAfter = function(){
      var doc = document.implementation.createHTMLDocument('');
      for (var viewId in this._views) {
        var view = this._views[viewId];
        var size = view.getSize();
        var pos = view.getPos();
        doc.body.innerHTML = document.getElementById('box_template').textContent;
        var box = doc.body.firstElementChild;
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
      visible: true,
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

    Native.setCurrentViewFromJS(JSON.stringify(this._selectedViews));
  },

  _selectViews: function(viewIds) {
    for (var i = 0; i < viewIds.length; i++) {
      this._selectView(viewIds[i]);
    }
  },

  _unselectView: function(viewId) {
    //FIXME: findViewByIdを実装する
    var view = this._views[viewId];
    var box = view.__box__;
    box.style.opacity = '0';
    var index = this._selectedViews.indexOf(view);
    this._selectedViews.splice(index, 1);

    Native.setCurrentViewFromJS(JSON.stringify(this._selectedViews));
  },

  _unselectAllView: function() {
    for (var i = 0; i < this._selectedViews.length; i++) {
      var box = this._selectedViews[i].__box__;
      box.style.opacity = '0';
    }
    this._selectedViews = [];

    Native.setCurrentViewFromJS(JSON.stringify(this._selectedViews));
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

  _click: function(view /* , ev */) {
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
    if (ev.target.classList.contains('creator_selected_box')) {
      this._mouseDownForMoveView(view, ev);
    } else {
      this._mouseDownForResizeView(view, ev);
    }
  },

  _mouseDownForMoveView: function(view, ev){
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

        // マウスを動かさずにクリックイベントが発火した場合、すべてのviewを非選択にするためのフラグを立てる.
        this._unselectAllViewForClick = true;
      } else {
        // 現在選択されているviewをすべてリセットして新たにviewを選択する
        this._unselectAllView();
        this._selectView(viewId);
        this._updateSelectedViewMouseDistance(ev);
      }
    }

    if (ev.button === 0) {
      // 左ボタンの場合はマウスの移動にviewを追従させる
      document.body.addEventListener('mousemove', this._mouseMove);
    }
  },

  _mouseMove: function(ev) {
    // クリックイベント発火時にマウスが移動したかどうかを判定してviewの選択状態を変えているのでそれに使用するフラグを立てる.
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

  _mouseDownForResizeView: function(view, ev) {
    var viewId = view.getId();
    this._unselectAllView();
    this._selectView(viewId);
    this._resizeType = ev.target.dataset.resizeType;
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

    var view = this._selectedViews[0];
    var box = view.__box__;
    var pos = view.getPos();
    var size = view.getSize();
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

    view.setSizePolicy('fixed');
    view.setSize(newSize);
    view.setPos(newPos);
    box.style.width = newSize.width + 'px';
    box.style.height = newSize.height + 'px';
    box.style.left = newPos.x + 'px';
    box.style.top = newPos.y + 'px';

    Native.changedLayoutContentFromJS();
    Native.setCurrentViewSizeFromJS(newSize.width, newSize.height);
    Native.setCurrentViewPosFromJS(newPos.x, newPos.y);
  },

  _mouseUp: function(/* ev */) {
    document.body.removeEventListener('mousemove', this._mouseMove);
    document.body.removeEventListener('mousemove', this._mouseMoveForResizeView);
  },

  _alignSelectedViews: function(type) {
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

    var views = this._selectedViews;
    var view = views[0];

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

      var anchor = view.getPos().y + parseInt(view.getSize().height * delta, 10);
      for (var i = 1; i < views.length; i++) {
        var view = views[i];
        var box = view.__box__;
        var pos = view.getPos();
        var size = view.getSize();
        var y = anchor - parseInt(size.height * delta, 10);
        view.setPos({x: pos.x, y: y});
        box.style.top = y + 'px';
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

      var anchor = view.getPos().x + parseInt(view.getSize().width * delta, 10);
      for (var i = 1; i < views.length; i++) {
        var view = views[i];
        var box = view.__box__;
        var pos = view.getPos();
        var size = view.getSize();
        var x = anchor - parseInt(size.width * delta, 10);
        view.setPos({x: x, y: pos.y});
        box.style.left = x + 'px';
      }
    }

    Native.changedLayoutContentFromJS();
  },

  _arrangeSelectedViews: function(type) {
    var views = this._selectedViews;

    if (views.length <= 1) {
      return;
    }

    if (type === 'H_CLOSELY') {
      this._sortViewsByX(views);
      var x = views[0].getPos().x + views[0].getSize().width;
      for (var i = 1; i < views.length; i++) {
        var view = views[i];
        var pos = view.getPos();
        var size = view.getSize();
        var box = view.__box__;
        view.setPos({x: x, y: pos.y});
        box.style.left = x + 'px';
        x = x + size.width;
      }
    }

    if (type === 'V_CLOSELY') {
      this._sortViewsByY(views);
      var y = views[0].getPos().y + views[0].getSize().height;
      for (var i = 1; i < views.length; i++) {
        var view = views[i];
        var pos = view.getPos();
        var size = view.getSize();
        var box = view.__box__;
        view.setPos({x: pos.x, y: y});
        box.style.top = y + 'px';
        y = y + size.height;
      }
    }

    if (type === 'H_EVEN') {
      this._sortViewsByX(views);
      var startView = views[0];
      var endView = views[views.length - 1];
      var totalSpace = (endView.getPos().x + endView.getSize().width) - startView.getPos().x;
      for (var i = 0; i < views.length; i++) {
        totalSpace -= views[i].getSize().width;
      }

      if (totalSpace <= 0) {
        return;
      }

      var space = totalSpace / (views.length - 1);

      var x = views[0].getPos().x + views[0].getSize().width + space;
      for (var i = 1; i < views.length; i++) {
        var view = views[i];
        var pos = view.getPos();
        var size = view.getSize();
        var box = view.__box__;
        view.setPos({x: x, y: pos.y});
        box.style.left = x + 'px';
        x = x + size.width + space;
      }
    }

    if (type === 'V_EVEN') {
      this._sortViewsByY(views);
      var startView = views[0];
      var endView = views[views.length - 1];
      var totalSpace = (endView.getPos().y + endView.getSize().height) - startView.getPos().y;
      for (var i = 0; i < views.length; i++) {
        totalSpace -= views[i].getSize().height;
      }

      if (totalSpace <= 0) {
        return;
      }

      var space = totalSpace / (views.length - 1);

      var y = views[0].getPos().y + views[0].getSize().height + space;
      for (var i = 1; i < views.length; i++) {
        var view = views[i];
        var pos = view.getPos();
        var size = view.getSize();
        var box = view.__box__;
        view.setPos({x: pos.x, y: y});
        box.style.top = y + 'px';
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
