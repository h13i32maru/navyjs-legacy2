
// file: src/wrap_text/header.txt
(function(){
'use strict';

// file: src/init.js
window.Navy = {};

window.addEventListener('DOMContentLoaded', function(){
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
      this._callback();
    }
  },

  set: function(count, callback) {
    if (count === 0) {
      callback();
    } else {
      this._count = count;
      this._callback = callback;
    }
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

// file: src/view/image.js
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

  _applyExtraLayout: function($super, layout) {
    // pass
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

  _onLoadImage: function(src, width, height){
    this._imgElm.src = src;

    if (this._layout.sizePolicy == this.SIZE_POLICY_WRAP_CONTENT) {
      this.setSize({width: width, height: height});
    }
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
    this._element.appendChild(this._textElement);
  },

  _applyExtraLayout: function($super, layout) {
    $super(layout);

    if (!layout.extra) {
      return;
    }

    this.setFontSize(layout.extra.fontSize);
  },

  _loadExtraResource: function($super, layout, callback) {
    this.setText(layout.extra.text);

    $super(layout, callback);
  },

  setText: function(text) {
    this._layout.extra.text = text;
    this._textElement.textContent = text;
  },

  getText: function() {
    return this._layout.extra.text;
  },

  setFontSize: function(fontSize) {
    this._layout.extra.fontSize = fontSize;
    this._element.style.fontSize = fontSize + 'px';
  },

  getFontSize: function() {
    return this._layout.extra.fontSize;
  }
});

// file: src/view_group/view_group.js
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

// file: src/view_screen/page.js
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
  },

  onResumeBefore: function(){
    console.log('onResumeBefore', this.$className);
  },

  onResumeAfter: function(){
    console.log('onResumeAfter', this.$className);
  },

  onPauseBefore: function(){
    console.log('onPauseBefore', this.$className);
  },

  onPauseAfter: function(){
    console.log('onPauseAfter', this.$className);
  },

  onDestroy: function(){
    console.log('onDestroy', this.$className);
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
    this._createScene(sceneName, this._addScene.bind(this));
  },

  backScene: function() {
    if (this._sceneStack.length >= 2) {
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
    var _class = Navy.Resource.getClass(layout.class);
    new _class(layout, callback);
  },

  _addScene: function(scene) {
    scene.onCreate();
    scene.onResumeBefore();

    var currentStackObj = this._getCurrentStack();
    if (currentStackObj) {
      var beforeScene = currentStackObj.scene;
      beforeScene.onPauseBefore();
    }

    var transition = new Navy.Transition.Fade(beforeScene, scene);
    this._sceneStack.push({
      scene: scene,
      transition: transition
    });
    this.addView(scene);
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
  }
});

// file: src/view_screen/scene.js
Navy.Class('Navy.Scene', Navy.ViewGroup.ViewGroup, {
  _pageStack: null,

  initialize: function($super, layout, callback){
    this._pageStack = [];

    $super(layout, function(){
      var views = this._views;
      for (var name in views) {
        views[name].setPos({z: 100});
      }
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
    this._createPage(pageName, function(page){
      this._addPage(page);
      callback && callback(page);
    }.bind(this));
  },

  backPage: function() {
    if (this._pageStack.length >= 2) {
      var stackObj = this._pageStack[this._pageStack.length - 1];
      var transition = stackObj.transition;
      transition.back(this._onTransitionBackEnd.bind(this));
    }
  },

  onCreate: function() {
    console.log('onCreate', this.$className);
  },

  onResumeBefore: function(){
    console.log('onResumeBefore', this.$className);
  },

  onResumeAfter: function(){
    console.log('onResumeAfter', this.$className);
  },

  onPauseBefore: function(){
    console.log('onPauseBefore', this.$className);
  },

  onPauseAfter: function(){
    console.log('onPauseAfter', this.$className);
  },

  onDestroy: function(){
    console.log('onDestroy', this.$className);
  },

  // 不要？
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

  // 不要？
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

  _createPage: function(pageName, callback) {
    var layout = Navy.Config.page[pageName];
    Navy.Resource.loadScript(layout.classFile, this._onLoadScript.bind(this, layout, callback));
  },

  _createPageByLayout: function(layout, callback) {
    var _class = Navy.Resource.getClass(layout.class);
    new _class(layout, callback);
  },

  _onLoadScript: function(layout, callback) {
    var _class = Navy.Resource.getClass(layout.class);
    new _class(layout, callback);
  },

  _addPage: function(page) {
    page.onCreate();
    page.onResumeBefore();

    var currentStackObj = this._getCurrentStack();
    if (currentStackObj) {
      var beforePage = currentStackObj.page;
      beforePage.onPauseBefore();
    }

    var transition = new Navy.Transition.SlideOver(beforePage, page);
    this._pageStack.push({
      page: page,
      transition: transition
    });
    this.addView(page);
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
      currentStackObj.page.onResumeAfter();
    }
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


// file: src/transition/slide_over.js
Navy.Class('Navy.Transition.SlideOver', Navy.Transition.Transition, {
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
    var animIn  = '@-webkit-keyframes slide_over_in  {100% {-webkit-transform: translateX(0)}}';
    var animOut = '@-webkit-keyframes slide_over_out {100% {-webkit-transform: translateX(%width%px)}}'.replace('%width%', width);
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
    this._afterView._setRawStyle({webkitAnimationName: 'slide_over_in'});
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
    this._afterView._setRawStyle({webkitAnimationName: 'slide_over_out'});
  }
});

// file: src/wrap_text/footer.txt
})();