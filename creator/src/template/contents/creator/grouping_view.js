/**
 * @class GroupingView
 */
Navy.Class('GroupingView', {
  _views: null,

  initialize: function(views) {
    this._views = views || [];
  },

  addView: function(view) {
    this._views.push(view);
  },

  getPos: function() {
    var x = Number.POSITIVE_INFINITY;
    var y = Number.POSITIVE_INFINITY;
    var views = this._views;

    for (var i = 0; i < views.length; i++) {
      var view = views[i];
      var pos = view.getPos();
      x = Math.min(x, pos.x);
      y = Math.min(y, pos.y);
    }

    return {x: x, y: y};
  },

  setPos: function(pos) {
    var currentPos = this.getPos();
    var dx = pos.x - currentPos.x;
    var dy = pos.y - currentPos.y;

    var views = this._views;
    for (var i = 0; i < views.length; i++) {
      var view = views[i];
      var pos = view.getPos();
      var x = pos.x + dx;
      var y = pos.y + dy;
      view.setPos({x: x, y: y});

      var box = view.__box__;
      box.style.left = x + 'px';
      box.style.top = y + 'px';
    }
  },

  getSize: function() {
    var left = Number.POSITIVE_INFINITY;
    var top = Number.POSITIVE_INFINITY;
    var right = Number.NEGATIVE_INFINITY;
    var bottom = Number.NEGATIVE_INFINITY;

    var views = this._views;
    for (var i = 0; i < views.length; i++) {
      var view = views[i];
      var pos = view.getPos();
      var size = view.getSize();
      left = Math.min(left, pos.x);
      top = Math.min(top, pos.y);
      right = Math.max(right, pos.x + size.width);
      bottom = Math.max(bottom, pos.y + size.height);
    }

    return {width: right - left, height: bottom - top};
  }
});
