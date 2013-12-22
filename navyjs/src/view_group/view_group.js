/**
 * @class Navy.ViewGroup.ViewGroup
 */
Navy.Class('Navy.ViewGroup.ViewGroup', Navy.View.View, {
  _views: null,
  _viewsOrder: null,
  _initCallback: null,
  _contentLayouts: null,
  _wrapContentSizeView: null,

  /**
   * @param $super
   * @param {ViewGroupLayout} layout
   * @param callback
   */
  initialize: function($super, layout, callback) {
    this._views = {};
    this._viewsOrder = [];
    this._wrapContentSizeView = {widthView: null, heightView: null};

    $super(layout, callback);
  },

  _loadExtraResource: function($super, layout, callback) {
    if (layout && layout.extra.contentLayoutFile) {
      this._layout.extra.contentLayoutFile = layout.extra.contentLayoutFile;
      Navy.Resource.loadLayout(layout.extra.contentLayoutFile, function(contentLayouts){
        this._contentLayouts = contentLayouts;
        $super(layout, callback);
      }.bind(this));
    } else {
      // rootは_layoutがnull
      this._layout && (this._layout.extra.contentLayoutFile = null);
      $super(layout, callback);
    }
  },

  _applyExtraLayout: function($super, layout, callback) {
    if (!this._contentLayouts) {
      $super(layout, callback);
      return;
    }

    var contentLayouts = this._contentLayouts;
    var notify = new Navy.Notify(contentLayouts.length, function(){
      $super(layout, callback);
    });
    var pass = notify.pass.bind(notify);

    for (var i = 0; i < contentLayouts.length; i++) {
      var contentLayout = contentLayouts[i];
      var ViewClass = Navy.Resource.getClass(contentLayout.class);
      var view = new ViewClass(contentLayout, pass);
      this.addView(view);
    }
  },

  _onLoadContentLayout: function(contentLayouts) {
    var notify = new Navy.Notify(contentLayouts.length, this._initCallback);
    var pass = notify.pass.bind(notify);

    for (var i = 0; i < contentLayouts.length; i++) {
      var contentLayout = contentLayouts[i];
      var ViewClass = Navy.Resource.getClass(contentLayout.class);
      var view = new ViewClass(contentLayout, pass);
      this.addView(view);
    }
  },

  /**
   *
   * @param view
   * @param ev
   * @private
   */
  _resizeWrapContentByChangedView: function(view) {
    if (this._layout.sizePolicy.width !== this.SIZE_POLICY_WRAP_CONTENT && this._layout.sizePolicy.height !== this.SIZE_POLICY_WRAP_CONTENT) {
      return;
    }

    var sizePolicy = view.getSizePolicy();
    var currentSize, pos, size;

    if (sizePolicy.width !== this.SIZE_POLICY_MATCH_PARENT || sizePolicy.height !== this.SIZE_POLICY_MATCH_PARENT) {
      currentSize = this.getSize();
      pos = view.getPos();
      size = view.getSize();
    }

    if (this._layout.sizePolicy.width === this.SIZE_POLICY_WRAP_CONTENT) {
      if (sizePolicy.width !== this.SIZE_POLICY_MATCH_PARENT) {
        if (pos.x + size.width > currentSize.width) {
          this._wrapContentSizeView.widthView = view;
          this._element.style.width = (pos.x + size.width) + 'px';
        }
      }
    }

    if (this._layout.sizePolicy.height === this.SIZE_POLICY_WRAP_CONTENT) {
      if (sizePolicy.height !== this.SIZE_POLICY_MATCH_PARENT) {
        if (pos.y + size.height > currentSize.height) {
          this._wrapContentSizeView.heightView = view;
          this._element.style.height = (pos.y + size.height) + 'px';
        }
      }
    }
  },

  _resizeWrapContentByRemovedView: function(view) {
    if (this._layout.sizePolicy.width !== this.SIZE_POLICY_WRAP_CONTENT && this._layout.sizePolicy.height !== this.SIZE_POLICY_WRAP_CONTENT) {
      return;
    }

    if (this._wrapContentSizeView.widthView !== view && this._wrapContentSizeView.heightView !== view) {
      return;
    }

    var size = this._calcWrapContentSize();
    if (this._layout.sizePolicy.width === this.SIZE_POLICY_WRAP_CONTENT) {
      this._element.style.width = size.width + 'px';
    }

    if (this._layout.sizePolicy.height === this.SIZE_POLICY_WRAP_CONTENT) {
      this._element.style.height = size.height + 'px';
    }
  },

  _calcWrapContentSize: function() {
    var maxWidth = 0;
    var maxHeight = 0;
    var widthView;
    var heightView;

    var views = this._views;
    for (var id in views) {
      var view = views[id];
      var sizePolicy = view.getSizePolicy();
      if (sizePolicy.width === this.SIZE_POLICY_MATCH_PARENT && sizePolicy.height === this.SIZE_POLICY_MATCH_PARENT) {
        continue;
      }

      var pos = view.getPos();
      var size = view.getSize();

      if (sizePolicy.width !== this.SIZE_POLICY_MATCH_PARENT) {
        if (maxWidth < pos.x + size.width) {
          maxWidth = pos.x + size.width;
          widthView = view;
        }
      }

      if (sizePolicy.height !== this.SIZE_POLICY_MATCH_PARENT) {
        if (maxHeight < pos.y + size.height) {
          maxHeight= pos.y + size.height;
          heightView = view;
        }
      }
    }

    return {
      width: maxWidth,
      height: maxHeight
    };
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

  addView: function(view, referenceView) {
    var element = view.getElement();
    if (referenceView) {
      this._element.insertBefore(element, referenceView.getElement());
    } else {
      this._element.appendChild(element);
    }
    this._views[view.getId()] = view;
    this._viewsOrder.push(view.getId());
    view.setParent(this);
    view.setPage(this.getPage());
    view.setScene(this.getScene());

    view.on('sizeChanged', this._resizeWrapContentByChangedView.bind(this));
    view.on('posChanged', this._resizeWrapContentByChangedView.bind(this));
  },

  removeView: function(view) {
    var element = view.getElement();
    this._element.removeChild(element);
    this._views[view.getId()] = null;
    delete this._views[view.getId()];
    this._viewsOrder.splice(this._viewsOrder.indexOf(view.getId()), 1);
    view.setParent(null);
    this._resizeWrapContentByRemovedView(view);
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
