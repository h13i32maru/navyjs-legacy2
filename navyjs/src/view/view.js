Navy.Class('Navy.View.View', {
  SIZE_POLICY_FIXED: 'fixed',
  SIZE_POLICY_WRAP_CONTENT: 'wrapContent',

  _id: null,
  _page: null,
  _scene: null,
  _layout: null,
  _element: null,
  _parentView: null,

  /**
   *
   * @param {function} callback
   * @param {ViewLayout} layout
   */
  initialize: function(layout, callback) {
    if (layout) {
      this._id = layout.id;
    }

    this._layout = layout;

    this._createElement(layout);
    this._createExtraElement(layout);

    this._execLink = this._execLink.bind(this);

    this.setLayout(layout, callback);
  },

  setLayout: function(layout, callback) {
    if (!layout) {
      return;
    }

    this._layout = layout;

    var notify = new Navy.Notify(2, function(){
      this._applyLayout(layout);
      this._applyExtraLayout(layout);
      callback && callback(this);
    }.bind(this));

    var pass = notify.pass.bind(notify);

    this._loadResource(layout, pass);
    this._loadExtraResource(layout, pass);
  },

  _createElement: function(layout) {
    this._element = document.createElement('div');
  },

  _applyLayout: function(layout) {
    this._element.style.position = 'absolute';

    this.setVisible(layout.visible);
    this.setPos(layout.pos);
    this.setSizePolicy(layout.sizePolicy);
    this.setSize(layout.size);
    this.setBackgroundColor(layout.backgroundColor);
    this.setLink(layout.link);
  },

  _loadResource: function(layout, callback) {
    callback && setTimeout(callback, 0);
  },

  _createExtraElement: function(layout) {
    // pass
  },

  _applyExtraLayout: function(layout) {
    // pass
  },

  _loadExtraResource: function(layout, callback) {
    callback && setTimeout(callback, 0);
  },

  _setRawStyle: function(style) {
    var cssText = '';
    for (var key in style) {
      var value = style[key];
      if (value !== undefined) {
        var propertyName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        if (propertyName.indexOf('webkit') === 0) {
          propertyName = '-' + propertyName;
        }

        if (value === '') {
          this._element.style[key] = '';
        } else {
          cssText += propertyName + ':' + value + ';';
        }
      }
    }

    this._element.style.cssText += cssText;
  },

  _execLink: function(ev) {
    var type = this._layout.link.type;
    var id = this._layout.link.id;

    switch (type) {
    case 'page':
      this.getScene().linkPage(id);
      break;
    case 'scene':
      Navy.Root.linkScene(id);
      break;
    }
  },

  addRawEventListener: function(eventName, callback) {
    this._element.addEventListener(eventName, callback);
  },

  removeRawEventListener: function(eventName, callback) {
    this._element.removeEventListener(eventName, callback);
  },

  getId: function(){
    return this._id;
  },

  setPage: function(page) {
    this._page = page;
  },

  getPage: function() {
    return this._page;
  },

  setScene: function(scene) {
    this._scene = scene;
  },

  getScene: function() {
    return this._scene;
  },

  getElement: function(){
    return this._element;
  },

  setParent: function(parentView) {
    this._parentView = parentView;
  },

  getParent: function() {
    return this._parentView;
  },

  destroy: function() {
    this._parentView.removeView(this);

    var names = Object.getOwnPropertyNames(this);
    for (var i = 0; i < names.length; i++) {
      this[names[i]] = null;
    }
  },

  toJSON: function() {
    return this._layout;
  },

  _cloneObject: function(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  /*
   * Viewのレイアウトに関するメソッド群
   */

  isVisible: function() {
    if (!this._layout.visible) {
      return false;
    }

    for (var parent = this.getParent(); parent; parent = parent.getParent()) {
      if (!parent.isVisible()) {
        return false;
      }
    }

    return true;
  },

  setVisible: function(visible) {
    this._layout.visible = visible;

    if (visible) {
      this.setSizePolicy(this._layout.sizePolicy);
    } else {
      this._element.style.display = 'none';
    }
  },

  setBackgroundColor: function(backgroundColor) {
    this._layout.backgroundColor = backgroundColor;
    this._element.style.backgroundColor = backgroundColor;
  },

  getBackgroundColor: function() {
    return this._layout.backgroundColor;
  },

  setSizePolicy: function(sizePolicy) {
    if (!this.isVisible()) {
      return;
    }

    switch(sizePolicy) {
    case this.SIZE_POLICY_FIXED:
      this._element.style.display = 'block';
      break;
    case this.SIZE_POLICY_WRAP_CONTENT:
      this._element.style.display = 'inline';
      break;
    default:
      throw new Error('unknown size policy. ' + this._layout.sizePolicy);
    }

    this._layout.sizePolicy = sizePolicy;
  },

  getSizePolicy: function() {
    return this._layout.sizePolicy;
  },

  getSize: function() {
    switch (this._layout.sizePolicy) {
    case this.SIZE_POLICY_WRAP_CONTENT:
      if (!this.isVisible()) {
        return {width: -1, height: -1};
      }

      // FIXME: view groupの場合clientではサイズがとれずscrollでとれる. 調査必要.
      if (this._element.clientWidth || this._element.clientHeight) {
        return {width: this._element.clientWidth, height: this._element.clientHeight};
      } else {
        return {width: this._element.scrollWidth, height: this._element.scrollHeight};
      }
    case this.SIZE_POLICY_FIXED:
      return {width: this._layout.size.width, height: this._layout.size.height};
    default:
      throw new Error('unknown size policy. ' + this._layout.sizePolicy);
    }
  },

  setSize: function(size) {
    if (!size) {
      return;
    }

    if (!this._layout.size) {
      this._layout.size = {};
    }

    var cssText = '';

    if (typeof size.width === 'number') {
      this._layout.size.width = size.width;
      cssText += 'width:' + size.width + 'px;';
    }

    if (typeof size.height === 'number') {
      this._layout.size.height = size.height;
      cssText += 'height:' + size.height + 'px;';
    }

    this._element.style.cssText += cssText;
  },

  setPos: function(pos) {
    var cssText = '';

    if (typeof pos.x === 'number') {
      var x = parseInt(pos.x, 10);
      this._layout.pos.x = x;
      cssText += 'left:' + x + 'px;';
    }

    if (typeof pos.y === 'number') {
      var y = parseInt(pos.y, 10);
      this._layout.pos.y = y;
      cssText += 'top:' + y + 'px;';
    }

    if (typeof pos.z === 'number') {
      var z = parseInt(pos.z, 10);
      this._layout.pos.z = z;
      cssText += 'z-index:' + z + ';';
    }

    this._element.style.cssText += cssText;
  },

  addPos: function(deltaPos) {
    var x = this._layout.pos.x + (deltaPos.x || 0);
    var y = this._layout.pos.y + (deltaPos.y || 0);
    this.setPos({x: x, y: y});
  },

  getPos: function() {
    return this._cloneObject(this._layout.pos);
  },

  setLink: function(link) {
    this._layout.link = link;

    if (link) {
      this._element.addEventListener('touchend', this._execLink);
    } else {
      this._element.removeEventListener('touchend', this._execLink);
    }
  },

  getLink: function() {
    return this._cloneObject(this._layout.link);
  }
});
