/**
 * @class Navy.View.View
 * @eventNames link, sizeChanged, posChanged
 */
Navy.Class('Navy.View.View', Navy.EventTarget, {
  SIZE_POLICY_FIXED: 'fixed',
  SIZE_POLICY_WRAP_CONTENT: 'wrapContent',
  SIZE_POLICY_MATCH_PARENT: 'matchParent',

  _id: null,
  _page: null,
  _scene: null,
  _layout: null,
  _element: null,
  _parentView: null,

  _tapGesture: null,

  /**
   *
   * @param {function} $super
   * @param {function} callback
   * @param {ViewLayout} layout
   */
  initialize: function($super, layout, callback) {
    $super();

    this._preventDOMEvent = this._preventDOMEvent.bind(this);

    if (layout) {
      this._id = layout.id;
    }

    this._layout = layout;

    this._createElement(layout);
    this._createExtraElement(layout);

    this.setLayout(layout, callback);
  },

  setLayout: function(layout, callback) {
    if (!layout) {
      return;
    }

    function onLoadAsset() {
      var notify = new Navy.Notify(2, onApplyLayout.bind(this));
      var pass = notify.pass.bind(notify);
      this._applyLayout(layout, pass);
      this._applyExtraLayout(layout, pass);
    }

    function onApplyLayout() {
      this._updateSizeWithWrapContentSize();
      callback && callback(this);
    }

    this._layout = layout;
    var notify = new Navy.Notify(2, onLoadAsset.bind(this));
    var pass = notify.pass.bind(notify);
    this._loadAsset(layout, pass);
    this._loadExtraAsset(layout, pass);
  },

  getLayout: function() {
    return this._cloneObject(this._layout);
  },

  lockView: function() {
    this._element.addEventListener('touchstart', this._preventDOMEvent, true);
  },

  unlockView: function() {
    this._element.removeEventListener('touchstart', this._preventDOMEvent, true);
  },

  _preventDOMEvent: function(ev) {
    ev.stopPropagation();
    ev.preventDefault();
  },

  _createElement: function(layout) {
    this._element = document.createElement('div');
    this._element.style.visibility = 'hidden';

    this._tapGesture = new Navy.Gesture.Tap(this._element, this._onTap.bind(this));
    this._tapGesture.start();
  },

  _applyLayout: function(layout, callback) {
    this._element.style.position = 'absolute';

    this.setVisible(layout.visible);
    this.setPos(layout.pos);
    this.setSizePolicy(layout.sizePolicy, true);
    this.setSize(layout.size);
    this.setBackgroundColor(layout.backgroundColor);
    this.setBorder(layout.border);
    this.setPadding(layout.padding);
    this.setLink(layout.link);

    this._setRawStyle({overflow:'hidden'});

    callback && setTimeout(callback, 0);
  },

  _loadAsset: function(layout, callback) {
    callback && setTimeout(callback, 0);
  },

  /**
   * @forOverride
   * @param layout
   * @private
   */
  _createExtraElement: function(layout) {
  },

  /**
   * @forOverride
   * @param layout
   * @param callback
   * @private
   */
  _applyExtraLayout: function(layout, callback) {
    callback && setTimeout(callback, 0);
  },

  /**
   * @forOverride
   * @param layout
   * @param callback
   * @private
   */
  _loadExtraAsset: function(layout, callback) {
    callback && setTimeout(callback, 0);
  },

  /**
   * @forOverride
   * @private
   */
  _calcWrapContentSize: function() {
    return {width: 0, height: 0};
  },

  _updateSizeWithWrapContentSize: function() {
    var changed = false;
    var size;

    if (this._layout.sizePolicy.width === this.SIZE_POLICY_WRAP_CONTENT || this._layout.sizePolicy.height === this.SIZE_POLICY_WRAP_CONTENT) {
      size = this._calcWrapContentSize();
    }

    if (this._layout.sizePolicy.width === this.SIZE_POLICY_WRAP_CONTENT) {
      this._element.style.width = size.width + 'px';
      changed = true;
    }

    if (this._layout.sizePolicy.height === this.SIZE_POLICY_WRAP_CONTENT) {
      this._element.style.height = size.height + 'px';
      changed = true
    }

    if (changed) {
      this.trigger('SizeChanged');
    }
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

  _onTap: function(/* domEvent */) {
    this.trigger('Tap', null, null, this._onTapDefault.bind(this));
  },

  _onTapDefault: function(/* ev */) {
    if (!this._layout.link || !this._layout.link.id) {
      return;
    }

    var linkId = this._layout.link.id;
    this.trigger('Link', {linkId: linkId}, null, this._onLinkDefault.bind(this));
  },

  _onLinkDefault: function(ev) {
    var linkId = ev.data.linkId;

    var tmp = linkId.split('/');
    var type = tmp[0];
    var id = tmp[1];

    switch (type) {
    case 'page':
      this.getScene().linkPage(id, ev.data);
      break;
    case 'scene':
      Navy.Root.linkScene(id, ev.data);
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
      this._element.style.visibility = '';
    } else {
      this._element.style.visibility = 'hidden';
    }
  },

  isDisplay: function() {
    return this._element.style.display !== 'none';
  },

  setDisplay: function(display) {
    if (display) {
      this._element.style.display = '';
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

  setBorder: function(border) {
    this._layout.border = border;
    this._element.style.border = border;
  },

  getBorder: function() {
    return this._layout.border;
  },

  getBorderSize: function() {
    var size = {left: 0, top: 0, right: 0, bottom: 0};
    var style = this._element.style;

    if (style.borderLeftStyle !== 'hidden' && style.borderLeftStyle !== 'none') {
      size.left = parseInt(style.borderLeftWidth, 10) || 0;
    }

    if (style.borderRightStyle !== 'hidden' && style.borderRightStyle !== 'none') {
      size.right = parseInt(style.borderRightWidth, 10) || 0;
    }

    if (style.borderTopStyle !== 'hidden' && style.borderTopStyle !== 'none') {
      size.top = parseInt(style.borderTopWidth, 10) || 0;
    }

    if (style.borderBottomStyle !== 'hidden' && style.borderBottomStyle !== 'none') {
      size.bottom = parseInt(style.borderBottomWidth, 10) || 0;
    }

    return size;
  },

  setPadding: function(padding) {
    this._layout.padding = padding;
    this._element.style.padding = padding;
  },

  getPadding: function() {
    return this._layout.padding;
  },

  getPaddingSize: function() {
    var size = {};
    var style = this._element.style;
    size.left = parseInt(style.paddingLeft, 10) || 0;
    size.top = parseInt(style.paddingTop, 10) || 0;
    size.right = parseInt(style.paddingRight, 10) || 0;
    size.bottom = parseInt(style.paddingBottom, 10) || 0;

    return size;
  },

  setSizePolicy: function(sizePolicy, disableUpdateSizeWithWrapContentSize) {
    this._layout.sizePolicy = sizePolicy;

    switch (sizePolicy.width) {
    case this.SIZE_POLICY_FIXED:
      break;
    case this.SIZE_POLICY_WRAP_CONTENT:
      if (!disableUpdateSizeWithWrapContentSize) {
        this._updateSizeWithWrapContentSize();
      }
      break;
    case this.SIZE_POLICY_MATCH_PARENT:
      this._element.style.width = '100%';
      break;
    default:
      throw new Error('unknown size policy width. ' + this._layout.sizePolicy.width);
    }

    switch (sizePolicy.height) {
    case this.SIZE_POLICY_FIXED:
      break;
    case this.SIZE_POLICY_WRAP_CONTENT:
      if (!disableUpdateSizeWithWrapContentSize) {
        this._updateSizeWithWrapContentSize();
      }
      break;
    case this.SIZE_POLICY_MATCH_PARENT:
      this._element.style.height = '100%';
      break;
    default:
      throw new Error('unknown size policy height. ' + this._layout.sizePolicy.height);
    }
  },

  getSizePolicy: function() {
    return this._cloneObject(this._layout.sizePolicy);
  },

  getSize: function() {
    var width, height;

    switch (this._layout.sizePolicy.width) {
    case this.SIZE_POLICY_FIXED:
      width = this._layout.size.width;
      break;
    case this.SIZE_POLICY_WRAP_CONTENT:
      width = this._element.offsetWidth;
      break;
    case this.SIZE_POLICY_MATCH_PARENT:
      width = this._element.offsetWidth;
      break;
    default:
      throw new Error('unknown size policy width. ' + this._layout.sizePolicy.width);
    }

    switch (this._layout.sizePolicy.height) {
    case this.SIZE_POLICY_FIXED:
      height = this._layout.size.height;
      break;
    case this.SIZE_POLICY_WRAP_CONTENT:
      height = this._element.offsetHeight;
      break;
    case this.SIZE_POLICY_MATCH_PARENT:
      height = this._element.offsetHeight;
      break;
    default:
      throw new Error('unknown size policy height. ' + this._layout.sizePolicy.height);
    }

    return {width: width, height: height};
  },

  setSize: function(size) {
    if (!size) {
      return;
    }

    if (!this._layout.size) {
      this._layout.size = {};
    }

    if (this._layout.sizePolicy.width === this.SIZE_POLICY_FIXED) {
      if (typeof size.width === 'number') {
        this._layout.size.width = size.width;
        this._element.style.width = size.width + 'px';
      }
    }

    if (this._layout.sizePolicy.height === this.SIZE_POLICY_FIXED) {
      if (typeof size.height === 'number') {
        this._layout.size.height = size.height;
        this._element.style.height = size.height + 'px';
      }
    }

    // TODO: Eventオブジェクト作る.
    this.trigger('SizeChanged');
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

    // TODO: Eventオブジェクト作る.
    this.trigger('PosChanged');
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
  },

  getLink: function() {
    return this._cloneObject(this._layout.link);
  }
});
