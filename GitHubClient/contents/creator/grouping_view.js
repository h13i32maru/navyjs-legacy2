/**
 * @class GroupingView
 */
Navy.Class('GroupingView', {
  _views: null,
  _box: null,

  initialize: function(views) {
    this._views = views || [];
    this._createBox();
  },

  _createBox: function() {
    var doc = document.implementation.createHTMLDocument('');
    doc.body.innerHTML = document.getElementById('box_template').textContent;
    this._box = doc.body.firstElementChild;
    document.body.appendChild(this._box);
    this._box.__groupingView__ = this;

    this.updateBoxGeometry();
  },

  updateBoxGeometry: function() {
    var box = this._box;
    var size = this.getSize();
    var pos = this.getPos();
    box.style.width = size.width + 'px';
    box.style.height = size.height + 'px';
    box.style.left = pos.x + 'px';
    box.style.top = pos.y + 'px';
  },

  selected: function() {
    this._box.style.opacity = '1';
  },

  unselected: function() {
    this._box.style.opacity = '0';
  },

  showResizer: function() {
    var elms = this._box.querySelectorAll('.resizer');
    for (var i = 0; i < elms.length; i++) {
      elms[i].style.display = '';
    }
  },

  hideResizer: function() {
    var elms = this._box.querySelectorAll('.resizer');
    for (var i = 0; i < elms.length; i++) {
      elms[i].style.display = 'none';
    }
  },

  releaseAllViews: function() {
    document.body.removeChild(this._box);

    var names = Object.getOwnPropertyNames(this);
    for (var i = 0; i < names.length; i++) {
      this[names[i]] = null;
    }
  },

  destroy: function() {
    for (var i = 0; i < this._views.length; i++) {
      var view = this._views[0];
      view.destroy();
    }

    document.body.removeChild(this._box);

    var names = Object.getOwnPropertyNames(this);
    for (var i = 0; i < names.length; i++) {
      this[names[i]] = null;
    }
  },

  addView: function(view) {
    this._views.push(view);

    this.updateBoxGeometry();
  },

  getAllViews: function() {
    return [].concat(this._views);
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
    }

    this.updateBoxGeometry();
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
  },

  setSize: function(size) {
    for (var i = 0; i < this._views.length; i++) {
      var view = this._views[0];
      view.setSizePolicy({width: 'fixed', height: 'fixed'});
      view.setSize(size);
    }

    this.updateBoxGeometry();
  }
});
