
// file: src/wrap_text/header.txt
(function(){
'use strict';

// file: src/init.js
window.Navy = {};

window.addEventListener('DOMContentLoaded', function(){
  if (Navy.UnitTest) {
    return;
  }

  Navy.App.initialize();
});

// file: src/lib/class.js
Navy.Class = function(var_args){
  var className;
  var protoObj;
  var superClass;

  switch (arguments.length) {
  case 2:
    superClass = Navy.Class._RootClass;
    className = arguments[0];
    protoObj = arguments[1];
    break;
  case 3:
    if (typeof arguments[1] === 'function') {
      superClass = arguments[1];
    } else {
      superClass = arguments[1].constructor;
    }
    className = arguments[0];
    protoObj = arguments[2];
    break;
  default:
    throw new Error('arguments of Navy.Class is 2 or 3.');
  }

  var _class = Navy.Class._create(className, superClass, protoObj);
  Navy.Class._setByReflection(className, _class);
  return _class;
};

Navy.Class.instance = function instance(var_args) {
  var _class = Navy.Class.apply(Navy, arguments);
  _class.__manualInitialize__ = true;
  var obj = new _class();
  var className = arguments[0];
  Navy.Class._setByReflection(className, obj);

  return obj;
};

/**
 * スーパークラスを指定せずにクラスを生成したときのクラス.
 */
Navy.Class._RootClass = function _RootClass() {};
Navy.Class._RootClass.prototype.initialize = function() {};

Navy.Class._getByReflection = function _getByReflection(propertyName) {
  var names = propertyName.split('.');

  var obj = window;
  for (var i = 0; i < names.length; i++) {
    obj = obj[names[i]];
  }

  return obj;
};

Navy.Class._setByReflection = function _setByReflection(propertyName, value) {
  var names = propertyName.split('.');

  var obj = window;
  for (var i = 0; i < names.length - 1; i++) {
    if (!(names[i] in obj)) {
      obj[names[i]] = {};
    }

    obj = obj[names[i]];
  }

  obj[names[i]] = value;
};

Navy.Class._create = function _create(className, superClass, protoObj){
  var name = className.replace(/[.]/g, '$');
  var Constructor = new Function("return function " +  name + " () { if (typeof this.initialize === 'function' && !this.constructor.__manualInitialize__) { this.initialize.apply(this, arguments); } }")();

  function EmptySuperClass(){}
  EmptySuperClass.prototype = superClass.prototype;
  var superObj = new EmptySuperClass();
  var superObjForWrap = new EmptySuperClass();

  Constructor.prototype = superObj;

  var key;
  var value;

  if (protoObj.$static) {
    for (key in protoObj.$static) {
      var value = protoObj.$static[key];
      if (typeof value === 'function') {
        if (Navy.Class._argumentNames(value)[0] === '$super') {
          value = Navy.Class._wrapFunction(superClass, key, value);
        }
      }
      Constructor[key] = value;
    }

    delete protoObj.$static;
  }

  for (key in protoObj) {
    value = protoObj[key];

    if (typeof value === 'object' && value !== null) {
      if (key !== '$static') {
        throw new Error('object property must be primitive type. property = ' + key);
      }
    }

    if (typeof value === 'function') {
      if (Navy.Class._argumentNames(value)[0] === '$super') {
        value = Navy.Class._wrapFunction(superObjForWrap, key, value);
      }
    }
    Constructor.prototype[key] = value;
  }

  Constructor.prototype.constructor = Constructor;
  Constructor.prototype.$className = className;
  Constructor.prototype.$class = Constructor;

  return Constructor;
};

/**
 * 関数の仮引数名のリストを取得する.
 * @param {function} func 対象とする関数.
 * @return {string[]} 仮引数名の配列.
 */
Navy.Class._argumentNames = function _argumentNames(func) {
  var names = func.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
    .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
    .replace(/\s+/g, '').split(',');
  return names.length == 1 && !names[0] ? [] : names;
};

/**
 * 引数にスーパークラスの関数が渡されるように元の関数をラップして返す。
 * @param {Object} superObj スーパークラスのオブジェクト.
 * @param {string} funcname ラップする関数の名前.
 * @param {function} func ラップする関数.
 * @return {function} ラップした関数.
 */
Navy.Class._wrapFunction = function _wrapFunction(superObj, funcname, func) {
  if (typeof superObj[funcname] !== 'function') {
    throw new Error('override method must be function. function = ' + funcname);
  }

  return function() {
    var _this = this;
    var $super = function() { return superObj[funcname].apply(_this, arguments); };
    var arg = [$super].concat(Array.prototype.slice.call(arguments, 0));
    return func.apply(this, arg);
  };
};

// file: src/lib/notify.js
/**
 * @class Navy.Notify
 */
Navy.Class('Navy.Notify', {
  _count: null,
  _callback: null,

  initialize: function(count, callback) {
    if (arguments.length === 2) {
      this.set(count, callback);
    }
  },

  pass: function(){
    this._count--;

    if (this._count === 0) {
      this._execCallback();
    }
  },

  set: function(count, callback) {
    this._count = count;
    this._callback = callback;

    if (count === 0) {
      this._execCallback();
    }
  },

  _execCallback: function(){
    setTimeout(this._callback, 0);
  }
});

// file: src/core/app.js
Navy.Class.instance('Navy.App', {
  _initRootBeforeCallback: null,

  initialize: function(){
    Navy.Resource.initialize();
    Navy.Config.initialize(this._onInitConfig.bind(this));
  },

  setInitRootBeforeCallback: function(callback) {
    this._initRootBeforeCallback = callback;
  },

  _onInitConfig: function(){
    this._initRootBeforeCallback && this._initRootBeforeCallback();

    Navy.Root.initialize();
  }
});

// file: src/core/config.js
Navy.Class.instance('Navy.Config', {
  app: null,
  scene: null,
  page: null,

  initialize: function(callback) {
    var notify = new Navy.Notify(3, callback);
    var pass = notify.pass.bind(notify);
    this._loadAppJSON(pass);
    this._loadSceneJSON(pass);
    this._loadPageJSON(pass);
  },

  _loadAppJSON: function(callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'config/app.json');
    xhr.onload = function(ev){
      var xhr = ev.target;
      this.app = JSON.parse(xhr.responseText);
      callback();
    }.bind(this);
    xhr.send();
  },

  _loadSceneJSON: function(callback){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'config/scene.json');
    xhr.onload = function(ev){
      var xhr = ev.target;

      // 配列をハッシュに変換してアクセスしやすくする.
      var sceneList = JSON.parse(xhr.responseText);
      var scene = {};
      for (var i = 0; i < sceneList.length; i++) {
        scene[sceneList[i].id] = sceneList[i];
      }
      this.scene = scene;

      callback();
    }.bind(this);
    xhr.send();
  },

  _loadPageJSON: function(callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'config/page.json');
    xhr.onload = function(ev){
      var xhr = ev.target;

      // 配列をハッシュに変換してアクセスしやすくする.
      var pageList = JSON.parse(xhr.responseText);
      var page = {};
      for (var i = 0; i < pageList.length; i++) {
        page[pageList[i].id] = pageList[i];
      }
      this.page = page;

      callback();
    }.bind(this);
    xhr.send();
  }
});

// file: src/core/resource.js
Navy.Class.instance('Navy.Resource', {
  _layouts: null,
  _scripts: null,
  _images: null,

  initialize: function(){
    this._layouts = {};
    this._scripts = {};
    this._images = {};
  },

  loadLayout: function(layoutFile, callback) {
    if (this._layouts[layoutFile]) {
      var layoutText = this._layouts[layoutFile];
      var layout = JSON.parse(layoutText);
      callback && setTimeout(callback.bind(null, layout), 0);
      return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', layoutFile);
    xhr.onload = function(ev){
      var xhr = ev.target;
      var layoutText = xhr.responseText;
      this._layouts[layoutFile] = layoutText;
      var layout = JSON.parse(layoutText);
      callback(layout);
    }.bind(this);
    xhr.send();
  },

  loadScript: function(scriptFile, callback) {
    if (this._scripts[scriptFile]) {
      callback && setTimeout(callback, 0);
      return;
    }

    var scriptElm = document.createElement('script');
    scriptElm.onload = function(){
      this._scripts[scriptFile] = true;
      callback();
    }.bind(this);
    scriptElm.src = scriptFile;
    document.head.appendChild(scriptElm);
  },

  loadImage: function(imageFile, callback) {
    if (this._images[imageFile]) {
      var width = this._images[imageFile].width;
      var height = this._images[imageFile].height;
      callback && setTimeout(callback.bind(null, imageFile, width, height), 0);
      return;
    }

    var image = new Image();
    image.onload = function(){
      this._images[imageFile] = {width: image.width, height: image.height};
      callback(imageFile, image.width, image.height);
    }.bind(this);
    image.src = imageFile;
  },

  getClass: function(className) {
    var chain = className.split('.');
    var _class = window;
    for (var i = 0; i < chain.length; i++) {
      _class = _class[chain[i]];
    }

    return _class;
  }
});

// file: src/view/view.js
/**
 * @class Navy.View.View
 * @eventNames link, sizeChanged, posChanged
 */
Navy.Class('Navy.View.View', {
  SIZE_POLICY_FIXED: 'fixed',
  SIZE_POLICY_WRAP_CONTENT: 'wrapContent',
  SIZE_POLICY_MATCH_PARENT: 'matchParent',

  _id: null,
  _page: null,
  _scene: null,
  _layout: null,
  _element: null,
  _parentView: null,

  _eventCallbackMap: null,
  _eventCallbackId: 0,

  _linkGesture: null,

  /**
   *
   * @param {function} callback
   * @param {ViewLayout} layout
   */
  initialize: function(layout, callback) {
    this._eventCallbackMap = {};
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

    function onLoadResource() {
      var notify = new Navy.Notify(2, onApplyLayout.bind(this));
      var pass = notify.pass.bind(notify);
      this._applyLayout(layout, pass);
      this._applyExtraLayout(layout, pass);
    }

    function onApplyLayout() {
      this._updateSizeWithWrapContentSize();
      this._element.style.visibility = '';
      callback && callback(this);
    }

    this._layout = layout;
    var notify = new Navy.Notify(2, onLoadResource.bind(this));
    var pass = notify.pass.bind(notify);
    this._loadResource(layout, pass);
    this._loadExtraResource(layout, pass);
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

    this._linkGesture = new Navy.Gesture.Tap(this._element, this._onLink.bind(this));
  },

  _applyLayout: function(layout, callback) {
    this._element.style.position = 'absolute';

    this.setVisible(layout.visible);
    this.setPos(layout.pos);
    this.setSizePolicy(layout.sizePolicy, true);
    this.setSize(layout.size);
    this.setBackgroundColor(layout.backgroundColor);
    this.setLink(layout.link);

    this._setRawStyle({overflow:'hidden'});

    callback && setTimeout(callback, 0);
  },

  _loadResource: function(layout, callback) {
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
  _loadExtraResource: function(layout, callback) {
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
    if (this._layout.sizePolicy !== this.SIZE_POLICY_WRAP_CONTENT) {
      return;
    }

    var size = this._calcWrapContentSize();
    this._element.style.width = size.width + 'px';
    this._element.style.height = size.height + 'px';

    this.trigger('sizeChanged', this, null);
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

  _onLink: function(ev) {
    // TODO: Navy.Eventオブジェクトを作る.
    this.trigger('link', this, ev);

    // TODO: evがpreventDefault的なことをされていれば遷移しないようにする.
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

  on: function(eventName, callback) {
    if (!this._eventCallbackMap[eventName]) {
      this._eventCallbackMap[eventName] = [];
    }

    var eventCallbackId = this._eventCallbackId++;
    this._eventCallbackMap[eventName].push({
      callbackId: eventCallbackId,
      callback: callback
    });

    return eventCallbackId;
  },

  off: function(eventName, callbackOrId) {
    var eventCallbacks = this._eventCallbackMap[eventName];
    if (!eventCallbacks) {
      return;
    }

    if (typeof callbackOrId === 'function') {
      var callback = callbackOrId;
      for (var i = 0; i < eventCallbacks.length; i++) {
        if (callback === eventCallbacks[i].callback) {
          eventCallbacks.splice(i, 1);
          i--;
        }
      }

    } else {
      var callbackId = callbackOrId;
      for (var i = 0; i < eventCallbacks.length; i++) {
        if (callbackId === eventCallbacks[i].callbackId) {
          eventCallbacks.splice(i, 1);
          return;
        }
      }
    }
  },

  trigger: function(eventName, view, event) {
    var eventCallbacks = this._eventCallbackMap[eventName];
    if (!eventCallbacks) {
      return;
    }

    for (var i = 0; i < eventCallbacks.length; i++) {
      var callback = eventCallbacks[i].callback;
      callback(view, event);

      // TODO: preventDefault, stopPropagation, stopNext的なのを実装
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
      this._element.style.display = 'block';
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

  setSizePolicy: function(sizePolicy, disableUpdateSizeWithWrapContentSize) {
    this._layout.sizePolicy = sizePolicy;

    switch (sizePolicy) {
    case this.SIZE_POLICY_FIXED:
      break;
    case this.SIZE_POLICY_WRAP_CONTENT:
      if (!disableUpdateSizeWithWrapContentSize) {
        this._updateSizeWithWrapContentSize();
      }
      break;
    case this.SIZE_POLICY_MATCH_PARENT:
      this._element.style.cssText += 'width: 100%; height: 100%';
      break;
    default:
      throw new Error('unknown size policy. ' + this._layout.sizePolicy);
    }
  },

  getSizePolicy: function() {
    return this._layout.sizePolicy;
  },

  getSize: function() {
    switch (this._layout.sizePolicy) {
    case this.SIZE_POLICY_FIXED:
      return {width: this._layout.size.width, height: this._layout.size.height};
    case this.SIZE_POLICY_WRAP_CONTENT:
      return {width: this._element.clientWidth, height: this._element.clientHeight};
    case this.SIZE_POLICY_MATCH_PARENT:
      return {width: this._element.clientWidth, height: this._element.clientHeight};
    default:
      throw new Error('unknown size policy. ' + this._layout.sizePolicy);
    }
  },

  setSize: function(size) {
    if (!size) {
      return;
    }

    if (this._layout.sizePolicy !== this.SIZE_POLICY_FIXED) {
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

    // TODO: Eventオブジェクト作る.
    this.trigger('sizeChanged', this, null);
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
    this.trigger('posChanged', this, null);
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
      this._linkGesture.start();
    } else {
      this._linkGesture.stop();
    }
  },

  getLink: function() {
    return this._cloneObject(this._layout.link);
  }
});

// file: src/view/image.js
/**
 * @class Navy.View.Image
 */
Navy.Class('Navy.View.Image', Navy.View.View, {
  _imgElm: null,

  initialize: function($super, layout, callback) {
    $super(layout, callback);
  },

  _createExtraElement: function($super, layout) {
    $super(layout);

    var imgElm = document.createElement('img');
    this._element.appendChild(imgElm);
    this._imgElm = imgElm;
  },

  _applyExtraLayout: function($super, layout, callback) {
    $super(layout, callback);
  },

  _loadExtraResource: function($super, layout, callback) {
    if (layout && layout.extra.src) {
      this.setSrc(layout.extra.src, function(){
        $super(layout, callback);
      });
    } else {
      $super(layout, callback);
    }
  },

  _calcWrapContentSize: function() {
    return {
      width: this._imgElm.width,
      height: this._imgElm.height
    };
  },

  _onLoadImage: function(src, width, height){
    this._imgElm.src = src;
    this.trigger('sizeChanged', this, null);
  },

  setSrc: function(src, callback) {
    this._layout.extra.src = src;
    Navy.Resource.loadImage(src, function(src, width, height){
      this._onLoadImage(src, width, height);
      callback && callback();
    }.bind(this));
  },

  getSrc: function() {
    return this._layout.src;
  }
});

// file: src/view/text.js
/**
 * @class Navy.View.Text
 */
Navy.Class('Navy.View.Text', Navy.View.View, {
  _textElement: null,

  /**
   *
   * @param $super
   * @param {TextLayout} layout
   * @param {function} callback
   */
  initialize: function($super, layout, callback) {
    $super(layout, callback);
  },

  _createExtraElement: function($super, layout) {
    $super(layout);

    this._textElement = document.createElement('span');
    // inlineだとdivとの間に隙間ができてY方向でぴったり揃わないのでinline-blockにする.
    this._textElement.style.display = 'inline-block';
    this._element.appendChild(this._textElement);
  },

  _applyExtraLayout: function($super, layout, callback) {
    if (!layout.extra) {
      return;
    }

    this.setFontSize(layout.extra.fontSize);
    this.setFontColor(layout.extra.fontColor);

    $super(layout, callback);
  },

  _loadExtraResource: function($super, layout, callback) {
    this.setText(layout.extra.text);

    $super(layout, callback);
  },

  _calcWrapContentSize: function() {
    return {
      width: this._textElement.offsetWidth,
      height: this._textElement.offsetHeight
    };
  },

  setText: function(text) {
    this._layout.extra.text = text;
    this._textElement.textContent = text;
    this.trigger('sizeChanged', this, null);
  },

  getText: function() {
    return this._layout.extra.text;
  },

  setFontSize: function(fontSize) {
    this._layout.extra.fontSize = fontSize;
    this._element.style.fontSize = fontSize + 'px';
    this.trigger('sizeChanged', this, null);
  },

  getFontSize: function() {
    return this._layout.extra.fontSize;
  },

  setFontColor: function(fontColor) {
    this._layout.extra.fontColor = fontColor;
    this._element.style.color = fontColor;
  },

  getFontColor: function() {
    return this._layout.extra.fontColor;
  }
});

// file: src/view_group/view_group.js
/**
 * @class Navy.ViewGroup.ViewGroup
 */
Navy.Class('Navy.ViewGroup.ViewGroup', Navy.View.View, {
  _views: null,
  _viewsOrder: null,
  _initCallback: null,
  _contentLayouts: null,

  /**
   * @param $super
   * @param {ViewGroupLayout} layout
   * @param callback
   */
  initialize: function($super, layout, callback) {
    this._views = {};
    this._viewsOrder = [];

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

  _calcWrapContentSize: function() {
    var maxWidth = 0;
    var maxHeight = 0;

    var views = this._views;
    for (var id in views) {
      var view = views[id];
      if (view.getSizePolicy() === this.SIZE_POLICY_MATCH_PARENT) {
        continue;
      }

      var pos = view.getPos();
      var size = view.getSize();

      maxWidth = Math.max(maxWidth, pos.x + size.width);
      maxHeight = Math.max(maxHeight, pos.y + size.height);
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

    // TODO: sizePolicyがwrapContentの時のみonするように変更する.
    // TODO: 無駄にupdateが呼ばれていてパフォーマンス悪い.
    view.on('sizeChanged', this._updateSizeWithWrapContentSize.bind(this));
    view.on('posChanged', this._updateSizeWithWrapContentSize.bind(this));
  },

  removeView: function(view) {
    var element = view.getElement();
    this._element.removeChild(element);
    this._views[view.getId()] = null;
    delete this._views[view.getId()];
    this._viewsOrder.splice(this._viewsOrder.indexOf(view.getId()), 1);
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

// file: src/view_group/button.js
/**
 * @class Navy.ViewGroup.Button
 */
Navy.Class('Navy.ViewGroup.Button', Navy.ViewGroup.ViewGroup, {
  _imageView: null,
  _textView: null,

  initialize: function($super, layout, callback) {
    $super(layout, callback);
  },

  _createExtraElement: function($super, layout) {
    $super(layout);

    this._element.addEventListener('touchstart', this._onTouchStart.bind(this));
    this._element.addEventListener('touchend', this._onTouchEnd.bind(this));
  },

  _loadExtraResource: function($super, layout, callback) {
    function cb() {
      $super(layout, callback);
    }

    var notify = new Navy.Notify(3, cb);
    var pass = notify.pass.bind(notify);
    Navy.Resource.loadImage(layout.extra.normal.src, pass);
    Navy.Resource.loadImage(layout.extra.active.src, pass);
    Navy.Resource.loadImage(layout.extra.disabled.src, pass);
  },

  _applyExtraLayout: function($super, layout, callback) {
    function cb() {
      var size = this._imageView.getSize();
      this._textView.setSizePolicy(this.SIZE_POLICY_FIXED);
      this._textView.setSize(size);

      // TODO: TextViewのextraで設定できるようにする
      this._textView.getElement().style.lineHeight = size.height + 'px';
      this._textView.getElement().style.textAlign = 'center';

      $super(layout, callback);
    }

    if (this._imageView) {
      this.removeView(this._imageView);
    }

    if (this._textView) {
      this.removeView(this._textView);
    }

    var notify = new Navy.Notify(2, cb.bind(this));
    var pass = notify.pass.bind(notify);

    var imageLayout = this._cloneObject(layout);
    imageLayout.id = 'image';
    imageLayout.extra.src = layout.extra.normal.src;
    this._imageView = new Navy.View.Image(imageLayout, pass);
    this.addView(this._imageView);

    var textLayout = this._cloneObject(layout);
    textLayout.id = 'text';
    this._textView = new Navy.View.Text(textLayout, pass);
    this.addView(this._textView);
  },

  _onTouchStart: function(/* ev */) {
    this._imageView.setSrc(this._layout.extra.active.src);
  },

  _onTouchEnd: function(/* ev */) {
    setTimeout(function(){
      this._imageView.setSrc(this._layout.extra.normal.src);
    }.bind(this), 400);
  }
});

// file: src/view_screen/page.js
/**
 * @class Navy.Page
 * @eventNames create, resumeBefore, resumeAfter, pauseBefore, pauseAfter, destroy
 */
Navy.Class('Navy.Page', Navy.ViewGroup.ViewGroup, {
  initialize: function($super, layout, callback) {
    $super(layout, callback);
  },

  setLayout: function($super, layout, callback) {
    // シーン、ページの場合はsize, posは固定値でよい
    layout.visible = true;
    layout.pos = {x:0, y:0};
    layout.sizePolicy = this.SIZE_POLICY_FIXED;
    layout.size = {width: Navy.Config.app.size.width, height: Navy.Config.app.size.height};

    $super(layout, callback);
  },

  setPage: function($super, page) {
    // ignore
  },

  getPage: function() {
    return this;
  },

  onCreate: function() {
    console.log('onCreate', this.$className);

    // TODO: eventオブジェクトをちゃんと生成する.(他のライフサイクルも同じく)
    this.trigger('create', this, null);
  },

  onResumeBefore: function(){
    console.log('onResumeBefore', this.$className);

    this.trigger('resumeBefore', this, null);
  },

  onResumeAfter: function(){
    console.log('onResumeAfter', this.$className);

    this.trigger('resumeAfter', this, null);
  },

  onPauseBefore: function(){
    console.log('onPauseBefore', this.$className);

    this.trigger('pauseBefore', this, null);
  },

  onPauseAfter: function(){
    console.log('onPauseAfter', this.$className);

    this.trigger('pauseAfter', this, null);
  },

  onDestroy: function(){
    console.log('onDestroy', this.$className);

    this.trigger('destroy', this, null);
  }
});

// file: src/view_screen/root.js
Navy.Class.instance('Navy.Root', Navy.ViewGroup.ViewGroup, {
  _sceneStack: null,

  /**
   * @param $super
   */
  initialize: function($super) {
    $super();

    this._id = '$root';
    this._layout = {visible: true};

    this._initDocument();
    var rootElm = document.createElement('div');
    rootElm.style.cssText = 'position:absolute; width:100%; height:100%; overflow:hidden;';
    document.body.appendChild(rootElm);
    this._element = rootElm;

    this._sceneStack = [];
    var startSceneName = Navy.Config.app.start.scene;
    this.nextScene(startSceneName);
  },

  getCurrentScene: function() {
    var currentStackObj = this._getCurrentStack();
    return currentStackObj.scene;
  },

  getCurrentPage: function() {
    var scene = this.getCurrentScene();
    return scene.getCurrentPage();
  },

  // fixme: callbackを実装する.
  linkScene: function(id) {
    if (id === '$back') {
      this.backScene();
    } else {
      this.nextScene(id);
    }
  },

  nextScene: function(sceneName) {
    this.lockView();
    this._createScene(sceneName, this._addScene.bind(this));
  },

  backScene: function() {
    if (this._sceneStack.length >= 2) {
      this.lockView();
      var prevStackObj = this._getPrevStack();
      prevStackObj.scene.onResumeBefore();

      var currentStackObj = this._getCurrentStack();
      currentStackObj.scene.onPauseBefore();
      currentStackObj.transition.back(this._onTransitionBackEnd.bind(this));
    }
  },

  _initDocument: function(){
    var style = '* {margin:0; padding:0; -webkit-user-select: none; -webkit-user-drag:none;} html {width:100%; height:100%} body {background-color:#000;}';
    var styleElm = document.createElement('style');
    styleElm.textContent = style;
    document.head.appendChild(styleElm);

    var width = Navy.Config.app.size.width;
    var height = Navy.Config.app.size.height;

    var screenWidth = window.innerWidth;
    var screenHeight = window.innerHeight;
    var scaleWidth = screenWidth / width;
    var scaleHeight = screenHeight / height;
    var scale = Math.min(scaleWidth, scaleHeight);
    var left = (screenWidth - scale * width) / 2;
    var top = (screenHeight - scale * height) / 2;
    document.body.style.position = 'absolute';
    document.body.style.zoom = scale;
    document.body.style.width = width + 'px';
    document.body.style.height = height + 'px';

    // zoomがleft,topにも影響するので補正しておく必要がある
    // FIXME: Google Chrome, Android Browser, Android Chrome, Mobile Safariでどうなっているか最新のバージョンで確かめる必要あり.
    document.body.style.left = (left / scale) + 'px';
    document.body.style.top = (top / scale) + 'px';
  },

  _createScene: function(sceneName, callback) {
    var layout = Navy.Config.scene[sceneName];
    Navy.Resource.loadScript(layout.classFile, this._onLoadScript.bind(this, layout, callback));
  },

  _onLoadScript: function(layout, callback) {
    var SceneClass = Navy.Resource.getClass(layout.class);
    var scene = new SceneClass(layout, callback);
    this.addView(scene);
  },

  _addScene: function(scene) {
    scene.onCreate();
    scene.onResumeBefore();

    var currentStackObj = this._getCurrentStack();
    if (currentStackObj) {
      var beforeScene = currentStackObj.scene;
      beforeScene.onPauseBefore();
    }

    // TODO: 組み込みだけじゃんくてカスタムのTransitionにも対応する.
    var TransitionClass = Navy.Resource.getClass(scene.getLayout().extra.transition.class);
    var transition = new TransitionClass(beforeScene, scene);
    this._sceneStack.push({
      scene: scene,
      transition: transition
    });
    transition.start(this._onTransitionStartEnd.bind(this));
  },

  _removeCurrentScene: function() {
    var stackObj = this._sceneStack.pop();
    stackObj.scene.destroy();
  },

  _getCurrentStack: function() {
    if (this._sceneStack.length >= 1) {
      return this._sceneStack[this._sceneStack.length - 1];
    } else {
      return null;
    }
  },

  _getPrevStack: function(){
    if (this._sceneStack.length >= 2) {
      return this._sceneStack[this._sceneStack.length - 2];
    } else {
      return null;
    }
  },

  _onTransitionStartEnd: function(){
    var prevStackObj = this._getPrevStack();
    if (prevStackObj) {
      prevStackObj.scene.onPauseAfter();
    }

    var currentStackObj = this._getCurrentStack();
    if (currentStackObj) {
      currentStackObj.scene.onResumeAfter();
    }
    this.unlockView();
  },

  _onTransitionBackEnd: function(){
    var prevStackObj = this._getPrevStack();
    if (prevStackObj) {
      prevStackObj.scene.onResumeAfter();
    }

    var currentStackObj = this._getCurrentStack();
    if (currentStackObj) {
      currentStackObj.scene.onPauseAfter();
      currentStackObj.scene.onDestroy();

      this._removeCurrentScene();
    }
    this.unlockView();
  }
});

// file: src/view_screen/scene.js
/**
 * @class Navy.Scene
 * @eventNames create, resumeBefore, resumeAfter, pauseBefore, pauseAfter, destroy
 */
Navy.Class('Navy.Scene', Navy.ViewGroup.ViewGroup, {
  LIFE_CYCLE_STATE_CREATE: 1,
  LIFE_CYCLE_STATE_RESUME_BEFORE: 2,
  LIFE_CYCLE_STATE_RESUME_AFTER: 3,
  LIFE_CYCLE_STATE_PAUSE_BEFORE: 4,
  LIFE_CYCLE_STATE_PAUSE_AFTER: 5,
  LIFE_CYCLE_STATE_DESTROY: 6,

  _lifeCycleState: 0,
  _pageStack: null,
  _sceneFixedFirstView: null,

  initialize: function($super, layout, callback){
    this._pageStack = [];

    $super(layout, function(){
      var viewId = this._viewsOrder[0];
      this._sceneFixedFirstView = this._views[viewId];
      this.nextPage(layout.extra.page, callback.bind(null, this));
    }.bind(this));
  },

  setLayout: function($super, layout, callback) {
    // シーン、ページの場合はsize, posは固定値でよい
    layout.visible = true;
    layout.pos = {x:0, y:0};
    layout.sizePolicy = this.SIZE_POLICY_FIXED;
    layout.size = {width: Navy.Config.app.size.width, height: Navy.Config.app.size.height};

    $super(layout, callback);
  },

  setPage: function(page) {
    // ignore
  },

  getPage: function() {
    return null;
  },

  setScene: function(scene) {
    // ignore
  },

  getScene: function() {
    return this;
  },

  getCurrentPage: function() {
    var currentStackObj = this._getCurrentStack();
    return currentStackObj.page;
  },

  // fixme: callbackを実装する.
  linkPage: function(id) {
    if (id === '$back') {
      this.backPage();
    } else {
      this.nextPage(id);
    }
  },

  nextPage: function(pageName, callback) {
    Navy.Root.lockView();

    this._createPage(pageName, function(page){
      this._addPage(page);
      callback && callback(page);
    }.bind(this));
  },

  backPage: function() {
    if (this._pageStack.length >= 2) {
      Navy.Root.lockView();

      var currentStackObj = this._getCurrentStack();
      var prevStackObj = this._getPrevStack();

      currentStackObj.page.onPauseBefore();
      prevStackObj.page.onResumeBefore();

      var transition = currentStackObj.transition;
      transition.back(this._onTransitionBackEnd.bind(this));
    }
  },

  onCreate: function() {
    this._lifeCycleState = this.LIFE_CYCLE_STATE_CREATE;
    console.log('onCreate', this.$className);

    // TODO: eventオブジェクトをちゃんと生成する.(他のライフサイクルも同じく)
    this.trigger('create', this, null);

    var page = this.getCurrentPage();
    page.onCreate();
  },

  onResumeBefore: function(){
    this._lifeCycleState = this.LIFE_CYCLE_STATE_PAUSE_BEFORE;
    console.log('onResumeBefore', this.$className);

    this.trigger('resumeBefore', this, null);

    var page = this.getCurrentPage();
    page.onResumeBefore();
  },

  onResumeAfter: function(){
    this._lifeCycleState = this.LIFE_CYCLE_STATE_PAUSE_AFTER;
    console.log('onResumeAfter', this.$className);

    this.trigger('resumeAfter', this, null);

    var page = this.getCurrentPage();
    page.onResumeAfter();
  },

  onPauseBefore: function(){
    this._lifeCycleState = this.LIFE_CYCLE_STATE_PAUSE_BEFORE;
    console.log('onPauseBefore', this.$className);

    this.trigger('pauseBefore', this, null);

    var page = this.getCurrentPage();
    page.onPauseBefore();
  },

  onPauseAfter: function(){
    this._lifeCycleState = this.LIFE_CYCLE_STATE_PAUSE_AFTER;
    console.log('onPauseAfter', this.$className);

    this.trigger('pauseAfter', this, null);

    var page = this.getCurrentPage();
    page.onPauseAfter();
  },

  onDestroy: function(){
    this._lifeCycleState = this.LIFE_CYCLE_STATE_DESTROY;
    console.log('onDestroy', this.$className);

    this.trigger('destroy', this, null);

    // TODO: いきなりsceneが終わる場合もあるのですべてのスタックを綺麗にする必要ありそう.
    var page = this.getCurrentPage();
    page.onDestroy();
  },

  // fixme: 不要？
  /*
  _getBottomPageLayout: function(layout) {
    var bottomLayout = {
      class: 'Navy.Page',
      id: '$bottom',
      pos: {x:0, y:0},
      size: {width: layout.size.width, height: layout.size.height},
      extra: {
        contentLayoutFile: layout.extra.contentBottomLayoutFile
      }
    };

    return bottomLayout;
  },
  */

  // fixme: 不要？
  /*
  _getTopPageLayout: function(layout) {
    var topLayout = {
      class: 'Navy.Page',
      id: '$top',
      pos: {x:0, y:0, z:100},
      size: {width: layout.size.width, height: layout.size.height},
      extra: {
        contentLayoutFile: layout.extra.contentTopLayoutFile
      }
    };

    return topLayout;
  },
  */

  _createPage: function(pageName, callback) {
    var layout = Navy.Config.page[pageName];
    Navy.Resource.loadScript(layout.classFile, this._onLoadScript.bind(this, layout, callback));
  },

  _createPageByLayout: function(layout, callback) {
    var PageClass = Navy.Resource.getClass(layout.class);
    var page = new PageClass(layout, callback);
    this.addView(page, this._sceneFixedFirstView);
  },

  _onLoadScript: function(layout, callback) {
    var PageClass = Navy.Resource.getClass(layout.class);
    var page = new PageClass(layout, callback);
    this.addView(page, this._sceneFixedFirstView);
  },

  _addPage: function(page) {
    this._lifeCycleState >= this.LIFE_CYCLE_STATE_CREATE && page.onCreate();
    this._lifeCycleState >= this.LIFE_CYCLE_STATE_RESUME_BEFORE && page.onResumeBefore();

    var currentStackObj = this._getCurrentStack();
    if (currentStackObj) {
      var beforePage = currentStackObj.page;
      beforePage.onPauseBefore();
    }

    // TODO: 組み込みだけじゃんくてカスタムのTransitionにも対応する.
    var TransitionClass = Navy.Resource.getClass(page.getLayout().extra.transition.class);
    var transition = new TransitionClass(beforePage, page);
    this._pageStack.push({
      page: page,
      transition: transition
    });
    transition.start(this._onTransitionStartEnd.bind(this));
  },

  _getCurrentStack: function() {
    if (this._pageStack.length >= 1) {
      return this._pageStack[this._pageStack.length - 1];
    } else {
      return null;
    }
  },

  _getPrevStack: function(){
    if (this._pageStack.length >= 2) {
      return this._pageStack[this._pageStack.length - 2];
    } else {
      return null;
    }
  },

  _onTransitionStartEnd: function(){
    var prevStackObj = this._getPrevStack();
    if (prevStackObj) {
      prevStackObj.page.onPauseAfter();
    }

    var currentStackObj = this._getCurrentStack();
    if (currentStackObj) {
      this._lifeCycleState >= this.LIFE_CYCLE_STATE_RESUME_AFTER && currentStackObj.page.onResumeAfter();
    }

    Navy.Root.unlockView();
  },

  _onTransitionBackEnd: function(){
    var prevStackObj = this._getPrevStack();
    if (prevStackObj) {
      prevStackObj.page.onResumeAfter();
    }

    var currentStackObj = this._getCurrentStack();
    if (currentStackObj) {
      currentStackObj.page.onPauseAfter();
      currentStackObj.page.onDestroy();

      var stackObj = this._pageStack.pop();
      stackObj.page.destroy();
    }

    Navy.Root.unlockView();
  }
});

// file: src/transition/transition.js
Navy.Class('Navy.Transition.Transition', {
  initialize: function(beforeView, afterView){
  },

  start: function(callback) {
  },

  back: function(callback) {
  }
});

// file: src/transition/fade.js
Navy.Class('Navy.Transition.Fade', Navy.Transition.Transition, {
  $static: {
    initAnimationStyle: false
  },

  _beforeView: null,
  _afterView: null,

  initialize: function(beforeView, afterView){
    this._beforeView = beforeView;
    this._afterView = afterView;

    if (!this.$class.initAnimationStyle) {
      this._addAnimationStyle();
      this.$class.initAnimationStyle = true;
    }

    beforeView && beforeView._setRawStyle({webkitAnimation: '0.5s'});
    afterView && afterView._setRawStyle({webkitAnimation: '0.5s', opacity: 0});
  },

  _addAnimationStyle: function(){
    var animIn  = '@-webkit-keyframes fade_in  {100% {opacity: 1}}';
    var animOut = '@-webkit-keyframes fade_out {100% {opacity: 0}}';
    var styleElm = document.createElement('style');
    styleElm.textContent = animIn + animOut;
    document.head.appendChild(styleElm);
  },

  start: function(callback) {
    if (!this._beforeView) {
      this._afterView._setRawStyle({opacity: ''});
      callback && callback();
      return;
    }

    var cb1 = function(){
      this._beforeView.setVisible(false);
      this._beforeView._setRawStyle({webkitAnimationName: ''});
      this._beforeView.removeRawEventListener('webkitAnimationEnd', cb1);

      this._afterView.addRawEventListener('webkitAnimationEnd', cb2);
      this._afterView._setRawStyle({opacity:0, webkitAnimationName: 'fade_in'});
    }.bind(this);

    var cb2 = function(){
      this._afterView.removeRawEventListener('webkitAnimationEnd', cb2);
      this._afterView._setRawStyle({opacity: '', webkitAnimationName: 'none'});
      callback && callback();
    }.bind(this);

    this._beforeView.addRawEventListener('webkitAnimationEnd', cb1);
    this._beforeView._setRawStyle({webkitAnimationName: 'fade_out'});
  },

  back: function(callback) {
    if (!this._beforeView) {
      callback && callback();
      return;
    }

    var cb1 = function(){
      this._afterView.setVisible(false);
      this._afterView.removeRawEventListener('webkitAnimationEnd', cb1);
      this._afterView._setRawStyle({webkitAnimationName: 'none'});

      this._beforeView.addRawEventListener('webkitAnimationEnd', cb2);
      this._beforeView._setRawStyle({opacity: 0, webkitAnimationName: 'fade_in'});
      this._beforeView.setVisible(true);
    }.bind(this);

    var cb2 = function(){
      this._beforeView.removeRawEventListener('webkitAnimationEnd', cb2);
      this._beforeView._setRawStyle({opacity: '', webkitAnimationName: 'none'});
      callback && callback();
    }.bind(this);

    this._afterView.addRawEventListener('webkitAnimationEnd', cb1);
    this._afterView._setRawStyle({webkitAnimationName: 'fade_out'});
  }
});


// file: src/transition/pop_up.js
/**
 * 次の画面がポップアップして表示される遷移アニメーション.
 * - page in: 次の画面が大きくなりながら表示される.
 * - page out: 現在の画面が小さくなりながら消える.
 *
 * @class Navy.Transition.PopUp
 */
Navy.Class('Navy.Transition.PopUp', Navy.Transition.Transition, {
  $static: {
    initAnimationStyle: false
  },

  _beforeView: null,
  _afterView: null,

  initialize: function(beforeView, afterView){
    this._beforeView = beforeView;
    this._afterView = afterView;

    if (!this.$class.initAnimationStyle) {
      this._addAnimationStyle();
      this.$class.initAnimationStyle = true;
    }

    afterView && afterView._setRawStyle({webkitAnimation: '0.5s', webkitTransform: 'scale(0)'});
  },

  _addAnimationStyle: function(){
    var animIn  = '@-webkit-keyframes pop_up_in  {100% {-webkit-transform: scale(1)}}';
    var animOut = '@-webkit-keyframes pop_up_out {100% {-webkit-transform: scale(0)}}';
    var styleElm = document.createElement('style');
    styleElm.textContent = animIn + animOut;
    document.head.appendChild(styleElm);
  },

  start: function(callback) {
    if (!this._beforeView) {
      this._afterView._setRawStyle({webkitTransform: ''});
      callback && callback();
      return;
    }

    var cb = function() {
      this._afterView.removeRawEventListener('webkitAnimationEnd', cb);
      this._afterView._setRawStyle({webkitTransform: '', webkitAnimationName: 'none'});
      callback && callback();
    }.bind(this);

    this._afterView.addRawEventListener('webkitAnimationEnd', cb);
    this._afterView._setRawStyle({webkitAnimationName: 'pop_up_in'});
  },

  back: function(callback) {
    if (!this._beforeView) {
      callback && callback();
      return;
    }

    var cb = function() {
      this._afterView.setVisible(false);
      this._beforeView.setVisible(true);
      callback && callback();
    }.bind(this);

    this._afterView.addRawEventListener('webkitAnimationEnd', cb);
    this._afterView._setRawStyle({webkitAnimationName: 'pop_up_out'});
  }
});


// file: src/transition/slide_down.js
/**
 * @class Navy.Transition.SlideDown
 */
Navy.Class('Navy.Transition.SlideDown', Navy.Transition.Transition, {
  $static: {
    initAnimationStyle: false
  },

  _beforeView: null,
  _afterView: null,

  initialize: function(beforeView, afterView){
    this._beforeView = beforeView;
    this._afterView = afterView;

    if (!this.$class.initAnimationStyle) {
      this._addAnimationStyle();
      this.$class.initAnimationStyle = true;
    }

    var height = Navy.Config.app.size.height;
    afterView._setRawStyle({webkitAnimation: '0.5s', webkitTransform: 'translateY(-' + height + 'px)'});
  },

  _addAnimationStyle: function(){
    var height = Navy.Config.app.size.height;
    var animIn  = '@-webkit-keyframes slide_up_in  {100% {-webkit-transform: translateY(0)}}';
    var animOut = '@-webkit-keyframes slide_up_out {100% {-webkit-transform: translateY(-%height%px)}}'.replace('%height%', height);
    var styleElm = document.createElement('style');
    styleElm.textContent = animIn + animOut;
    document.head.appendChild(styleElm);
  },

  start: function(callback) {
    if (!this._beforeView) {
      this._afterView._setRawStyle({webkitTransform: 'none'});
      callback && callback();
      return;
    }

    var cb = function(){
      this._beforeView.setVisible(false);
      this._afterView.removeRawEventListener('webkitAnimationEnd', cb);
      this._afterView._setRawStyle({webkitTransform: 'none', webkitAnimationName: 'none'});
      callback && callback();
    }.bind(this);

    this._afterView.addRawEventListener('webkitAnimationEnd', cb);
    this._afterView._setRawStyle({webkitAnimationName: 'slide_up_in'});
  },

  back: function(callback) {
    if (!this._beforeView) {
      callback && callback();
      return;
    }

    var cb = function(){
      this._afterView.removeRawEventListener('webkitAnimationEnd', cb);
      callback && callback();
    }.bind(this);

    this._beforeView.setVisible(true);
    this._afterView.addRawEventListener('webkitAnimationEnd', cb);
    this._afterView._setRawStyle({webkitAnimationName: 'slide_up_out'});
  }
});

// file: src/transition/slide_left.js
/**
 * @class Navy.Transition.SlideLeft
 */
Navy.Class('Navy.Transition.SlideLeft', Navy.Transition.Transition, {
  $static: {
    initAnimationStyle: false
  },

  _beforeView: null,
  _afterView: null,

  initialize: function(beforeView, afterView){
    this._beforeView = beforeView;
    this._afterView = afterView;

    if (!this.$class.initAnimationStyle) {
      this._addAnimationStyle();
      this.$class.initAnimationStyle = true;
    }

    var width = Navy.Config.app.size.width;
    afterView._setRawStyle({webkitAnimation: '0.5s', webkitTransform: 'translateX(-' + width + 'px)'});
  },

  _addAnimationStyle: function(){
    var width = Navy.Config.app.size.width;
    var animIn  = '@-webkit-keyframes slide_left_in  {100% {-webkit-transform: translateX(0)}}';
    var animOut = '@-webkit-keyframes slide_left_out {100% {-webkit-transform: translateX(-%width%px)}}'.replace('%width%', width);
    var styleElm = document.createElement('style');
    styleElm.textContent = animIn + animOut;
    document.head.appendChild(styleElm);
  },

  start: function(callback) {
    if (!this._beforeView) {
      this._afterView._setRawStyle({webkitTransform: 'none'});
      callback && callback();
      return;
    }

    var cb = function(){
      this._beforeView.setVisible(false);
      this._afterView.removeRawEventListener('webkitAnimationEnd', cb);
      this._afterView._setRawStyle({webkitTransform: 'none', webkitAnimationName: 'none'});
      callback && callback();
    }.bind(this);

    this._afterView.addRawEventListener('webkitAnimationEnd', cb);
    this._afterView._setRawStyle({webkitAnimationName: 'slide_left_in'});
  },

  back: function(callback) {
    if (!this._beforeView) {
      callback && callback();
      return;
    }

    var cb = function(){
      this._afterView.removeRawEventListener('webkitAnimationEnd', cb);
      callback && callback();
    }.bind(this);

    this._beforeView.setVisible(true);
    this._afterView.addRawEventListener('webkitAnimationEnd', cb);
    this._afterView._setRawStyle({webkitAnimationName: 'slide_left_out'});
  }
});

// file: src/transition/slide_right.js
/**
 * @class Navy.Transition.SlideRight
 */
Navy.Class('Navy.Transition.SlideRight', Navy.Transition.Transition, {
  $static: {
    initAnimationStyle: false
  },

  _beforeView: null,
  _afterView: null,

  initialize: function(beforeView, afterView){
    this._beforeView = beforeView;
    this._afterView = afterView;

    if (!this.$class.initAnimationStyle) {
      this._addAnimationStyle();
      this.$class.initAnimationStyle = true;
    }

    var width = Navy.Config.app.size.width;
    afterView._setRawStyle({webkitAnimation: '0.5s', webkitTransform: 'translateX(' + width + 'px)'});
  },

  _addAnimationStyle: function(){
    var width = Navy.Config.app.size.width;
    var animIn  = '@-webkit-keyframes slide_right_in  {100% {-webkit-transform: translateX(0)}}';
    var animOut = '@-webkit-keyframes slide_right_out {100% {-webkit-transform: translateX(%width%px)}}'.replace('%width%', width);
    var styleElm = document.createElement('style');
    styleElm.textContent = animIn + animOut;
    document.head.appendChild(styleElm);
  },

  start: function(callback) {
    if (!this._beforeView) {
      this._afterView._setRawStyle({webkitTransform: 'none'});
      callback && callback();
      return;
    }

    var cb = function(){
      this._beforeView.setVisible(false);
      this._afterView.removeRawEventListener('webkitAnimationEnd', cb);
      this._afterView._setRawStyle({webkitTransform: 'none', webkitAnimationName: 'none'});
      callback && callback();
    }.bind(this);

    this._afterView.addRawEventListener('webkitAnimationEnd', cb);
    this._afterView._setRawStyle({webkitAnimationName: 'slide_right_in'});
  },

  back: function(callback) {
    if (!this._beforeView) {
      callback && callback();
      return;
    }

    var cb = function(){
      this._afterView.removeRawEventListener('webkitAnimationEnd', cb);
      callback && callback();
    }.bind(this);

    this._beforeView.setVisible(true);
    this._afterView.addRawEventListener('webkitAnimationEnd', cb);
    this._afterView._setRawStyle({webkitAnimationName: 'slide_right_out'});
  }
});

// file: src/transition/slide_up.js
/**
 * @class Navy.Transition.SlideUp
 */
Navy.Class('Navy.Transition.SlideUp', Navy.Transition.Transition, {
  $static: {
    initAnimationStyle: false
  },

  _beforeView: null,
  _afterView: null,

  initialize: function(beforeView, afterView){
    this._beforeView = beforeView;
    this._afterView = afterView;

    if (!this.$class.initAnimationStyle) {
      this._addAnimationStyle();
      this.$class.initAnimationStyle = true;
    }

    var height = Navy.Config.app.size.height;
    afterView._setRawStyle({webkitAnimation: '0.5s', webkitTransform: 'translateY(' + height + 'px)'});
  },

  _addAnimationStyle: function(){
    var height = Navy.Config.app.size.height;
    var animIn  = '@-webkit-keyframes slide_up_in  {100% {-webkit-transform: translateY(0)}}';
    var animOut = '@-webkit-keyframes slide_up_out {100% {-webkit-transform: translateY(%height%px)}}'.replace('%height%', height);
    var styleElm = document.createElement('style');
    styleElm.textContent = animIn + animOut;
    document.head.appendChild(styleElm);
  },

  start: function(callback) {
    if (!this._beforeView) {
      this._afterView._setRawStyle({webkitTransform: 'none'});
      callback && callback();
      return;
    }

    var cb = function(){
      this._beforeView.setVisible(false);
      this._afterView.removeRawEventListener('webkitAnimationEnd', cb);
      this._afterView._setRawStyle({webkitTransform: 'none', webkitAnimationName: 'none'});
      callback && callback();
    }.bind(this);

    this._afterView.addRawEventListener('webkitAnimationEnd', cb);
    this._afterView._setRawStyle({webkitAnimationName: 'slide_up_in'});
  },

  back: function(callback) {
    if (!this._beforeView) {
      callback && callback();
      return;
    }

    var cb = function(){
      this._afterView.removeRawEventListener('webkitAnimationEnd', cb);
      callback && callback();
    }.bind(this);

    this._beforeView.setVisible(true);
    this._afterView.addRawEventListener('webkitAnimationEnd', cb);
    this._afterView._setRawStyle({webkitAnimationName: 'slide_up_out'});
  }
});

// file: src/transition/turn_over.js
/**
 * @class Navy.Transition.TurnOver
 */
Navy.Class('Navy.Transition.TurnOver', Navy.Transition.Transition, {
  $static: {
    initAnimationStyle: false
  },

  _beforeView: null,
  _afterView: null,

  initialize: function(beforeView, afterView){
    this._beforeView = beforeView;
    this._afterView = afterView;

    if (!this.$class.initAnimationStyle) {
      this._addAnimationStyle();
      this.$class.initAnimationStyle = true;
    }

    beforeView._setRawStyle({webkitAnimation: '0.25s', webkitAnimationTimingFunction: 'linear', webkitTransform: 'rotateY(0)'});
    afterView._setRawStyle({webkitAnimation: '0.25s', webkitAnimationTimingFunction: 'linear',webkitTransform: 'rotateY(-90deg)'});
  },

  _addAnimationStyle: function(){
    var animIn  = '\
      @-webkit-keyframes turn_over_in_before_view {100% {-webkit-transform: rotateY(90deg)} }\
      @-webkit-keyframes turn_over_in_after_view {100% {-webkit-transform: rotateY(0)} }';

    var animOut = '\
      @-webkit-keyframes turn_over_out_before_view {100% {-webkit-transform: rotateY(0)} }\
      @-webkit-keyframes turn_over_out_after_view {100% {-webkit-transform: rotateY(-90deg)} }';

    var styleElm = document.createElement('style');
    styleElm.textContent = animIn + animOut;
    document.head.appendChild(styleElm);
  },

  start: function(callback) {
    if (!this._beforeView) {
      this._afterView._setRawStyle({webkitTransform: 'none'});
      callback && callback();
      return;
    }

    var cb1 = function(){
      this._beforeView.setVisible(false);
      this._beforeView.removeRawEventListener('webkitAnimationEnd', cb1);
      this._beforeView._setRawStyle({webkitTransform: 'none', webkitAnimationName: 'none'});

      this._afterView.setVisible(true);
      this._afterView.addRawEventListener('webkitAnimationEnd', cb2);
      this._afterView._setRawStyle({webkitAnimationName: 'turn_over_in_after_view'});
    }.bind(this);

    var cb2 = function(){
      this._afterView.removeRawEventListener('webkitAnimationEnd', cb2);
      this._afterView._setRawStyle({webkitTransform: 'none', webkitAnimationName: 'none'});
      callback && callback();
    }.bind(this);

    this._afterView.setVisible(false);
    this._beforeView.addRawEventListener('webkitAnimationEnd', cb1);
    this._beforeView._setRawStyle({webkitAnimationName: 'turn_over_in_before_view'});
  },

  back: function(callback) {
    if (!this._beforeView) {
      callback && callback();
      return;
    }

    var cb1 = function(){
      this._afterView.setVisible(false);
      this._afterView.removeRawEventListener('webkitAnimationEnd', cb1);
      this._afterView._setRawStyle({webkitTransform: 'none', webkitAnimationName: 'none'});

      this._beforeView._setRawStyle({webkitAnimation: '0.25s', webkitAnimationTimingFunction: 'linear', webkitTransform: 'rotateY(90deg)'});
      this._beforeView.setVisible(true);
      this._beforeView.addRawEventListener('webkitAnimationEnd', cb2);
      this._beforeView._setRawStyle({webkitAnimationName: 'turn_over_out_before_view'});
    }.bind(this);

    var cb2 = function(){
      this._beforeView.removeRawEventListener('webkitAnimationEnd', cb2);
      this._beforeView._setRawStyle({webkitTransform: 'none', webkitAnimationName: 'none'});
      callback && callback();
    }.bind(this);

    this._afterView.addRawEventListener('webkitAnimationEnd', cb1);
    this._afterView._setRawStyle({webkitAnimation: '0.25s', webkitAnimationTimingFunction: 'linear', webkitTransform: 'rotateY(0)'});
    this._afterView._setRawStyle({webkitAnimationName: 'turn_over_out_after_view'});
  }
});

// file: src/gesture/gesture.js
/**
 * @class Navy.Gesture.Gesture
 */
Navy.Class('Navy.Gesture.Gesture', {
  isStart: false,

  initialize: function(element, callback) {
    this._element = element;
    this._callback = callback;
  },

  start: function() {
  },

  stop: function() {
  }
});

// file: src/gesture/tap.js
/**
 * @class Navy.Gesture.Tap
 */
Navy.Class('Navy.Gesture.Tap', Navy.Gesture.Gesture, {
  TAP_ALLOW_DISTANCE: 350,
  _trigger: false,
  _startX: null,
  _startY: null,

  initialize: function($super, element, callback) {
    $super(element, callback);

    this._touchstart = this._touchstart.bind(this);
    this._touchmove = this._touchmove.bind(this);
    this._touchend = this._touchend.bind(this);
  },

  /**
   * @param {function} [$super]
   */
  start: function($super) {
    $super();
    this._element.addEventListener('touchstart', this._touchstart);
  },

  /**
   * @param {function} [$super]
   */
  stop: function($super) {
    $super();
    this._element.removeEventListener('touchstart', this._touchstart);
  },

  _touchstart: function(ev) {
    if (ev.touches.length > 1) {
      return;
    }

    this._trigger = true;
    this._startX = ev.changedTouches[0].clientX;
    this._startY = ev.changedTouches[0].clientY;

    this._element.addEventListener('touchmove', this._touchmove);
    this._element.addEventListener('touchend', this._touchend);
  },

  _touchmove: function(ev) {
    this._judgeTapAllowDistance(ev);
  },

  _touchend: function(ev) {
    this._element.removeEventListener('touchmove', this._touchmove);
    this._element.removeEventListener('touchend', this._touchend);

    this._judgeTapAllowDistance(ev);

    this._trigger && this._callback(ev);
  },

  _judgeTapAllowDistance: function(ev) {
    var x0 = this._startX;
    var y0 = this._startY;
    var x1 = ev.changedTouches[0].clientX;
    var y1 = ev.changedTouches[0].clientY;

    var delta = Math.pow(Math.abs(x0 - x1), 2) + Math.pow(Math.abs(y0 - y1), 2);
    if (delta >= this.TAP_ALLOW_DISTANCE) {
      this._trigger = false;
    }
  }
});

// file: src/wrap_text/footer.txt
})();
