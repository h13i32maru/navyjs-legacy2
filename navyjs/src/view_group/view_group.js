Navy.Class('Navy.ViewGroup.ViewGroup', Navy.View.View, {
  _views: null,
  _initCallback: null,

  /**
   * @param $super
   * @param {ViewGroupLayout} layout
   * @param callback
   */
  initialize: function($super, layout, callback) {
    this._views = {};

    $super(layout, callback);
  },

  _loadExtraResource: function($super, layout, callback) {
    if (layout && layout.extra.contentLayoutFile) {
      this._layout.extra.contentLayoutFile = layout.extra.contentLayoutFile;
      this._initCallback = function() {
        $super(layout, callback);
      };
      Navy.Resource.loadLayout(layout.extra.contentLayoutFile, this._onLoadContentLayout.bind(this));
    } else {
      // rootは_layoutがnull
      this._layout && (this._layout.extra.contentLayoutFile = null);
      $super(layout, callback);
    }
  },

  _onLoadContentLayout: function(contentLayouts) {
    var notify = new Navy.Notify(contentLayouts.length, this._initCallback);
    var pass = notify.pass.bind(notify);

    for (var i = 0; i < contentLayouts.length; i++) {
      var contentLayout = contentLayouts[i];
      var _class = Navy.Resource.getClass(contentLayout.class);
      var view = new _class(contentLayout, pass);
      this.addView(view);
    }
  },

  destroy: function($super) {
    for (var viewId in this._views) {
      var view = this._views[viewId];
      view.destroy();
    }

    $super();
  },

  setPage: function($super, page) {
    $super(page);

    var views = this._views;
    for  (var viewId in views) {
      var view = views[viewId];
      view.setPage(page);
    }
  },

  setScene: function($super, scene) {
    $super(scene);

    var views = this._views;
    for  (var viewId in views) {
      var view = views[viewId];
      view.setScene(scene);
    }
  },

  findViewById: function(id) {
    var ids = id.split('.');

    var view = this._views[ids[0]] || null;

    if (view) {
      if (ids.length === 1) {
        return view;
      } else {
        ids.shift();
        return view.findViewById(ids.join("."));
      }
    }

    var views = this._views;
    for (var viewId in views) {
      var view = views[viewId];
      if (view.findViewById) {
        var result = view.findViewById(id);
        if (result) {
          return result;
        }
      }
    }

    return null;
  },

  findViewByElement: function(element) {
    var views = this._views;
    for (var viewId in views) {
      var view = views[viewId];
      if (view.getElement() === element) {
        return view;
      }

      if (view.findViewByElement) {
        var result = view.findViewByElement(element);
        if (result) {
          return result;
        }
      }
    }

    return null;
  },

  getAllViews: function() {
    var result = {};
    for (var viewId in this._views) {
      result[viewId] = this._views[viewId];
    }
    return result;
  },

  addView: function(view) {
    var element = view.getElement();
    this._element.appendChild(element);
    this._views[view.getId()] = view;
    view.setParent(this);
    view.setPage(this.getPage());
    view.setScene(this.getScene());
  },

  removeView: function(view) {
    var element = view.getElement();
    this._element.removeChild(element);
    this._views[view.getId()] = null;
    delete this._views[view.getId()];
    view.setParent(null);
  },

  removeAllViews: function() {
    var views = this._views;
    var viewIds = Object.keys(views);

    // removeViewを行うとviewsの要素数が変わるのでid配列に対してのループにしている
    for (var i = 0; i < viewIds.length; i++) {
      var viewId = viewIds[i];
      var view = views[viewId];
      this.removeView(view);
    }
  }
});
