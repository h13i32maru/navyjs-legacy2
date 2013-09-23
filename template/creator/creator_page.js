var CreatorPage = Navy.Class(Navy.Page, {
  CLASSNAME: 'CreatorPage',

  _zoom: null,

  _selectedBox: null,
  _selectedView: null,

  _mouseDx: null,
  _mouseDy: null,

  onCreate: function($super) {
    $super();

    document.body.style.background = '#666';
    window.CreatorPageInstance = this;
    window.getContentLayout = this._getContentLayout.bind(this);
    this._zoom = parseFloat(document.body.style.zoom);

    this._mouseMove = this._mouseMove.bind(this);
    document.body.addEventListener('mouseup', this._mouseUp.bind(this));

    this._selectedBox = document.createElement('div');
    this._selectedBox.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; border:solid 1px red; background-color: rgba(0,0,0,0.3)';

    for (var viewId in this._views) {
      var view = this._views[viewId];
      var elm = view.getElement();
      elm.addEventListener('mousedown', this._mouseDown.bind(this, view));
    }

    Navy.Resource.loadLayout(this._layout.extra.contentLayoutFile, function(layout){
      Native.setViewsFromJS(JSON.stringify(layout));
    });

    Native.changedViewsOrderToJS.connect(this._updateViewsOrder.bind(this));
    Native.changedSelectedViewToJS.connect(this._selectView.bind(this));
    Native.changedViewPropertyToJS.connect(this._updateSelectedViewLayout.bind(this));
    Native.addViewToJS.connect(this._addView.bind(this));
    Native.deleteViewToJS.connect(this._deleteView.bind(this));
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
    console.log(size);
    this._selectedBox.style.width = size.width + 'px';
    this._selectedBox.style.height = size.height + 'px';
  },

  _selectView: function(viewId) {
    var parentNode = this._selectedBox.parentNode;
    if (parentNode) {
      parentNode.removeChild(this._selectedBox);
    }

    var view = this._views[viewId];
    var size = view.getSize();
    this._selectedBox.style.width = size.width + 'px';
    this._selectedBox.style.height = size.height + 'px';
    var elm = view.getElement();
    elm.appendChild(this._selectedBox);

    this._selectedView = view;

    Native.setCurrentViewFromJS(JSON.stringify(view._layout));
  },

  _mouseDown: function(view, ev) {
    this._selectView(view.getId());

    var pos = this._selectedView.getPos();
    this._mouseDx = ev.clientX/this._zoom - pos.x;
    this._mouseDy = ev.clientY/this._zoom - pos.y;
    document.body.addEventListener('mousemove', this._mouseMove);

    this._moving = true;
  },

  _mouseMove: function(ev) {
    if (!this._moving) {
      return;
    }

    var x = ev.clientX/this._zoom - this._mouseDx;
    var y = ev.clientY/this._zoom - this._mouseDy;
    this._selectedView.setPos({x: x, y: y});

    var pos = this._selectedView.getPos();
    Native.changedLayoutContent();
    Native.setCurrentViewPosFromJS(pos.x, pos.y);
  },

  _mouseUp: function(/* ev */) {
    document.body.removeEventListener('mousemove', this._mouseMove);
  }
});

/**
 * @typedef {{
 *   setViewsFromJS: function,
 *   setCurrentViewFromJS: function,
 *   setCurrentViewPosFromJS: function,
 *   changedViewsOrderToJS: {connect: function},
 *   changedSelectedViewToJS: {connect: function},
 *   changedViewPropertyToJS: {connect: function}
 * }}
 */
Native;
