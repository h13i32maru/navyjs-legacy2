/**
 * @typedef {Object} Include.Move
 */
Navy.Class.instance('Include.Move', Include.Include, {
  _bodyPos: null,
  _zoom: null,
  _resizeType: null,

  initialize: function($super, targetObject) {
    $super(targetObject);

    (function(){
      this._bodyPos = {x: parseFloat(document.body.style.left), y: parseFloat(document.body.style.top)};
      this._zoom = parseFloat(document.body.style.zoom);

      document.body.addEventListener('mouseup', this._mouseUp.bind(this));
      document.body.addEventListener('mousedown', this._mouseDown.bind(this));
      document.body.addEventListener('click', this._click.bind(this));
      this._mouseMoveForMoveView = this._mouseMoveForMoveView.bind(this);
      this._mouseMoveForResizeView = this._mouseMoveForResizeView.bind(this);
    }).apply(targetObject);
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
  }
});
