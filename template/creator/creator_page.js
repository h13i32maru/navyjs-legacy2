var CreatorPage = Navy.Class(Navy.Page, {
  CLASSNAME: 'CreatorPage',

  _zoom: null,

  _selectedBox: null,
  _selectedView: null,

  _dragPrevX: null,
  _dragPrevY: null,

  onCreate: function($super) {
    document.body.style.background = '#666';
    window.CreatorPageInstance = this;

    this._mouseDown = this._mouseDown.bind(this);
    this._mouseUp = this._mouseUp.bind(this);
    this._mouseMove = this._mouseMove.bind(this);
    document.body.addEventListener('mouseup', this._mouseUp);

    this._zoom = parseFloat(document.body.style.zoom);

    $super();

    this._selectedBox = document.createElement('div');
    this._selectedBox.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; border:solid 1px red; background-color: rgba(0,0,0,0.3)';

    Navy.Resource.loadLayout(this._layout.extra.contentLayoutFile, function(layout){
      Native.setViewsFromJS(JSON.stringify(layout));
    });

    Native.changedViewsOrderToJS.connect(function(viewIds){
      for (var i = 0; i < viewIds.length; i++) {
        var id = viewIds[i];
        var view = this._views[id];
        this.removeView(view);
        this.addView(view);
      }
    }.bind(this));

    Native.changedSelectedViewToJS.connect(function(viewId){
      var parentNode = this._selectedBox.parentNode;
      if (parentNode) {
        parentNode.removeChild(this._selectedBox);
      }

      if (this._selectedView) {
        var elm = this._selectedView.getElement();
        elm.removeEventListener('mousedown', this._mouseDown);
        elm.removeEventListener('mousemove', this._mouseMove);
        elm.removeEventListener('mouseup', this._mouseUp);
      }

      var view = this._views[viewId];
      var elm = view.getElement();
      elm.appendChild(this._selectedBox);
      elm.addEventListener('mousedown', this._mouseDown);
      elm.addEventListener('mouseup', this._mouseUp);

      this._selectedView = view;

      Native.setCurrentViewFromJS(JSON.stringify(view._layout));
    }.bind(this));

    Native.changedViewPropertyToJS.connect(function(layout){
      if (!this._selectedView) {
        return;
      }

      this._selectedView.setLayout(layout);
    }.bind(this));
  },

  _mouseDown: function(ev) {
    this._dragPrevX = ev.clientX;
    this._dragPrevY = ev.clientY;
    this._selectedView.getElement().addEventListener('mousemove', this._mouseMove);
  },

  _mouseMove: function(ev) {
    var dx = ev.clientX - this._dragPrevX;
    var dy = ev.clientY - this._dragPrevY;
    this._dragPrevX = ev.clientX;
    this._dragPrevY = ev.clientY;
    var elm = this._selectedView.getElement();

    var currentX = parseInt(elm.style.left, 10);
    var currentY = parseInt(elm.style.top, 10);

    var x = parseInt(currentX + dx / this._zoom, 10);
    var y = parseInt(currentY + dy / this._zoom, 10);
    elm.style.left =  x + 'px';
    elm.style.top = y + 'px';

    Native.currentViewPosFromJS(x, y);
  },

  _mouseUp: function(/* ev */) {
    this._selectedView.getElement().removeEventListener('mousemove', this._mouseMove);
  }
});

/**
 * @typedef {{
 *   setViewsFromJS: function,
 *   setCurrentViewFromJS: function,
 *   changedViewsOrderToJS: {connect: function},
 *   changedSelectedViewToJS: {connect: function},
 *   changedViewPropertyToJS: {connect: function}
 * }}
 */
Native;
