
// file: src/wrap_text/header.txt
(function(){
'use strict';

// file: src/init.js
window.Navy = {
  View: {},
  ViewGroup: {},
  Transition: {}
};

window.addEventListener('DOMContentLoaded', function(){
  Navy.App.initialize();
});

// file: src/lib/class.js
Navy.Class = function(){
  var protoObj;
  var superClass;
  switch (arguments.length) {
  case 1:
    superClass = Navy.Class._RootClass;
    protoObj = arguments[0];
    break;
  case 2:
    if (typeof arguments[0] === 'function') {
      superClass = arguments[0];
    } else {
      superClass = arguments[0].constructor;
    }
    protoObj = arguments[1];
    break;
  default:
    throw new Error('arguments of Navy.Class is 1 or 2.');
  }

  return Navy.Class._create(superClass, protoObj);
};

Navy.Class.instance = function instance(var_args) {
  var _class = Navy.Class.apply(Navy, arguments);
  _class.__manualInitialize__ = true;
  var obj = new _class();
  return obj;
};

/**
 * スーパークラスを指定せずにクラスを生成したときのクラス.
 */
Navy.Class._RootClass = function _RootClass() {};
Navy.Class._RootClass.prototype.initialize = function() {};

Navy.Class._create = function _create(superClass, protoObj){
  var name = protoObj.CLASSNAME || 'Constructor';
  name = name.replace(/[.]/g, '$');
  var Constructor = new Function("return function " +  name + " () { if (typeof this.initialize === 'function' && !this.constructor.__manualInitialize__) { this.initialize.apply(this, arguments); } }")();

  function EmptySuperClass(){}
  EmptySuperClass.prototype = superClass.prototype;
  var superObj = new EmptySuperClass();
  var superObjForWrap = new EmptySuperClass();

  Constructor.prototype = superObj;

  var key;
  var value;
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
Navy.Notify = Navy.Class({
  CLASSNAME: 'Navy.Notify',

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
Navy.App = Navy.Class.instance({
  CLASSNAME: 'Navy.App',

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
Navy.Config = Navy.Class.instance({
  CLASSNAME: 'Navy.Config',

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
Navy.Resource = Navy.Class.instance({
  CLASSNAME: 'Navy.Resource',

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
Navy.View.View = Navy.Class({
  CLASSNAME: 'Navy.View.View',

  _layout: null,
  _element: null,
  _parentView: null,

  /**
   *
   * @param {function} callback
   * @param {ViewLayout} layout
   */
  initialize: function(layout, callback) {
    this._layout = layout;
    this._element = document.createElement('div');

    this.setLayout(layout, callback);
  },

  setLayout: function(layout, callback) {
    if (!layout) {
      return;
    }

    var style = {
      position: 'absolute',
      left: layout.pos.x + 'px',
      top: layout.pos.y + 'px',
      zIndex: layout.pos.z,
      width: layout.size.width + 'px',
      height: layout.size.height + 'px',
      backgroundColor: layout.backgroundColor
    };
    this.setRawStyle(style);

    callback && setTimeout(callback.bind(null, this), 0);
  },

  setRawStyle: function(style) {
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

  addRawEventListener: function(eventName, callback) {
    this._element.addEventListener(eventName, callback);
  },

  removeRawEventListener: function(eventName, callback) {
    this._element.removeEventListener(eventName, callback);
  },

  getId: function(){
    return this._layout.id;
  },

  getElement: function(){
    return this._element;
  },

  setParent: function(parentView) {
    this._parentView = parentView;
  },

  show: function() {
    this._element.style.display = '';
  },

  hide: function() {
    this._element.style.display = 'none';
  },

  setSize: function(size) {
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
      this._layout.pos.x = pos.x;
      cssText += 'left:' + pos.x + 'px;';
    }

    if (typeof pos.y === 'number') {
      this._layout.pos.y = pos.y;
      cssText += 'top:' + pos.y + 'px;';
    }

    if (typeof pos.z === 'number') {
      this._layout.pos.z = pos.z;
      cssText += 'z-index:' + pos.z + ';';
    }

    this._element.style.cssText += cssText;
  },

  addPos: function(deltaPos) {
    var x = this._layout.pos.x + (deltaPos.x || 0);
    var y = this._layout.pos.y + (deltaPos.y || 0);
    this.setPos({x: x, y: y});
  },

  getPos: function() {
    return {x: this._layout.pos.x, y: this._layout.pos.y, z: this._layout.pos.z};
  },

  destroy: function() {
    this._parentView.removeView(this);
    this._element = null;
  },

  toJSON: function() {
    return this._layout;
  }
});

// file: src/view/image.js
Navy.View.Image = Navy.Class(Navy.View.View, {
  CLASSNAME: 'Navy.View.Image',

  _imgElm: null,
  _autoSize: false,

  initialize: function($super, layout, callback) {
    $super(layout, callback);
  },

  setLayout: function($super, layout, callback) {
    $super(layout);

    if (!this._imgElm) {
      var imgElm = document.createElement('img');
      this._element.appendChild(imgElm);
      this._imgElm = imgElm;
    }

    if (layout) {
      if (layout.size.width === null || layout.size.height === null) {
        this._autoSize = true;
      }
    }

    if (layout && layout.extra.src) {
      Navy.Resource.loadImage(layout.extra.src, function(src, width, height){
        this._onLoadImage(src, width, height);
        callback && callback(this);
      }.bind(this));
    } else {
      this._layout.extra.src = null;
      this._imgElm.src = '';
      callback && setTimeout(callback, 0);
    }
  },

  _onLoadImage: function(src, width, height){
    this._layout.extra.src = src;
    this._imgElm.src = src;

    if (this._autoSize) {
      this.setSize({width: width, height: height});
    }
  }
});

// file: src/view/text.js
Navy.View.Text = Navy.Class(Navy.View.View, {
  CLASSNAME: 'Navy.View.Text',

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

  setLayout: function($super, layout, callback) {
    $super(layout);

    if (!layout) {
      return;
    }

    if (!this._textElement) {
      this._textElement = document.createElement('span');
      this._element.appendChild(this._textElement);
    }


    if (layout.extra) {
      this._layout.extra.text = layout.extra.text;
      this._textElement.textContent = layout.extra.text;
    }

    callback && setTimeout(callback.bind(null, this), 0);
  }
});

// file: src/view_group/view_group.js
Navy.ViewGroup.ViewGroup = Navy.Class(Navy.View.View, {
  CLASSNAME: 'Navy.ViewGroup.ViewGroup',

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

  setLayout: function($super, layout, callback) {
    $super(layout);

    if (layout && layout.extra.contentLayoutFile) {
      this._layout.extra.contentLayoutFile = layout.extra.contentLayoutFile;
      callback = callback || function(){};
      this._initCallback = callback.bind(null, this);
      Navy.Resource.loadLayout(layout.extra.contentLayoutFile, this._onLoadContentLayout.bind(this));
    } else {
      // rootは_layoutがnull
      this._layout && (this._layout.extra.contentLayoutFile = null);
      callback && setTimeout(callback.bind(null, this), 0);
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

  findViewByElement: function(element) {
    var views = this._views;
    for (var viewId in views) {
      var view = views[viewId];
      if (view.getElement() === element) {
        return view;
      }
    }

    return null;
  },

  addView: function(view) {
    var element = view.getElement();
    this._element.appendChild(element);
    this._views[view.getId()] = view;
    view.setParent(this);
  },

  removeView: function(view) {
    var element = view.getElement();
    this._element.removeChild(element);
    this._views[view.getId()] = null;
    delete this._views[view.getId()];
    view.setParent(null);
  }
});

// file: src/view_screen/page.js
Navy.Page = Navy.Class(Navy.ViewGroup.ViewGroup, {
  CLASSNAME: 'Navy.Page',

  initialize: function($super, layout, callback) {
    // シーン、ページの場合はsize, posは固定値でよい
    layout.pos = {x:0, y:0};
    layout.size = {width: Navy.Config.app.size.width, height: Navy.Config.app.size.height};

    $super(layout, callback);
  },

  onCreate: function() {
    console.log('onCreate', this.CLASSNAME);
  },

  onResumeBefore: function(){
    console.log('onResumeBefore', this.CLASSNAME);
  },

  onResumeAfter: function(){
    console.log('onResumeAfter', this.CLASSNAME);
  },

  onPauseBefore: function(){
    console.log('onPauseBefore', this.CLASSNAME);
  },

  onPauseAfter: function(){
    console.log('onPauseAfter', this.CLASSNAME);
  },

  onDestroy: function(){
    console.log('onDestroy', this.CLASSNAME);
  }
});

// file: src/view_screen/root.js
Navy.Root = Navy.Class.instance(Navy.ViewGroup.ViewGroup, {
  CLASSNAME: 'Navy.Root',

  _sceneStack: null,

  /**
   * @param $super
   */
  initialize: function($super) {
    $super();

    this._initDocument();

    var parentElm = document.body;

    this._sceneStack = [];

    var rootElm = document.createElement('div');
    rootElm.style.cssText = 'position:absolute; width:100%; height:100%; overflow:hidden;';
    parentElm.appendChild(rootElm);

    this._element = rootElm;

    var startSceneName = Navy.Config.app.start.scene;
    this.nextScene(startSceneName);
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
    document.body.style.left = left + 'px';
    document.body.style.top = top + 'px';
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
Navy.Scene = Navy.Class(Navy.ViewGroup.ViewGroup, {
  CLASSNAME: 'Navy.Scene',

  _pageStack: null,

  initialize: function($super, layout, callback){
    this._pageStack = [];

    // シーン、ページの場合はsize, posは固定値でよい
    layout.pos = {x:0, y:0};
    layout.size = {width: Navy.Config.app.size.width, height: Navy.Config.app.size.height};

    $super(layout, function(){
      var views = this._views;
      for (var name in views) {
        views[name].setPos({z: 100});
      }
      this.nextPage(layout.extra.page, callback.bind(null, this));

      //FIXME: remove debug code
      views[name].addRawEventListener('touchend', function(ev){
        ev.stopPropagation();
        Navy.Root.nextScene('Scene1');
      });
    }.bind(this));

    //FIXME: remove debug code
    var cb = function(){
      if (this._pageStack.length < 5) {
        this.nextPage('Page' + (Date.now() % 2 + 1));
      } else {
        this._element.removeEventListener('touchend', cb);
        this._element.addEventListener('touchend', function cb(){
          this.backPage();
        }.bind(this));
      }
    }.bind(this);
    this._element.addEventListener('touchend', cb);
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
    console.log('onCreate', this.CLASSNAME);
  },

  onResumeBefore: function(){
    console.log('onResumeBefore', this.CLASSNAME);
  },

  onResumeAfter: function(){
    console.log('onResumeAfter', this.CLASSNAME);
  },

  onPauseBefore: function(){
    console.log('onPauseBefore', this.CLASSNAME);
  },

  onPauseAfter: function(){
    console.log('onPauseAfter', this.CLASSNAME);
  },

  onDestroy: function(){
    console.log('onDestroy', this.CLASSNAME);
  },

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
Navy.Transition.Transition = Navy.Class({
  CLASSNAME: 'Navy.Transition.Transition',

  initialize: function(beforeView, afterView){
  },

  start: function(callback) {
  },

  back: function(callback) {
  }
});

// file: src/transition/fade.js
Navy.Transition.Fade = Navy.Class(Navy.Transition.Transition, {
  CLASSNAME: 'Navy.Transition.Fade',

  $static: {
    initAnimationStyle: false
  },

  _beforeView: null,
  _afterView: null,

  initialize: function(beforeView, afterView){
    this._beforeView = beforeView;
    this._afterView = afterView;

    if (!this.$static.initAnimationStyle) {
      this._addAnimationStyle();
      this.$static.initAnimationStyle = true;
    }

    beforeView && beforeView.setRawStyle({webkitAnimation: '0.5s'});
    afterView && afterView.setRawStyle({webkitAnimation: '0.5s', opacity: 0});
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
      this._afterView.setRawStyle({opacity: ''});
      callback && callback();
      return;
    }

    var cb1 = function(){
      this._beforeView.hide();
      this._beforeView.setRawStyle({webkitAnimationName: ''});
      this._beforeView.removeRawEventListener('webkitAnimationEnd', cb1);

      this._afterView.addRawEventListener('webkitAnimationEnd', cb2);
      this._afterView.setRawStyle({opacity:0, webkitAnimationName: 'fade_in'});
    }.bind(this);

    var cb2 = function(){
      this._afterView.removeRawEventListener('webkitAnimationEnd', cb2);
      this._afterView.setRawStyle({opacity: '', webkitAnimationName: 'none'});
      callback && callback();
    }.bind(this);

    this._beforeView.addRawEventListener('webkitAnimationEnd', cb1);
    this._beforeView.setRawStyle({webkitAnimationName: 'fade_out'});
  },

  back: function(callback) {
    if (!this._beforeView) {
      callback && callback();
      return;
    }

    var cb1 = function(){
      this._afterView.hide();
      this._afterView.removeRawEventListener('webkitAnimationEnd', cb1);
      this._afterView.setRawStyle({webkitAnimationName: 'none'});

      this._beforeView.addRawEventListener('webkitAnimationEnd', cb2);
      this._beforeView.setRawStyle({opacity: 0, webkitAnimationName: 'fade_in'});
      this._beforeView.show();
    }.bind(this);

    var cb2 = function(){
      this._beforeView.removeRawEventListener('webkitAnimationEnd', cb2);
      this._beforeView.setRawStyle({opacity: '', webkitAnimationName: 'none'});
      callback && callback();
    }.bind(this);

    this._afterView.addRawEventListener('webkitAnimationEnd', cb1);
    this._afterView.setRawStyle({webkitAnimationName: 'fade_out'});
  }
});


// file: src/transition/slide_over.js
Navy.Transition.SlideOver = Navy.Class(Navy.Transition.Transition, {
  CLASSNAME: 'Navy.Transition.SlideOver',

  $static: {
    initAnimationStyle: false
  },

  _beforeView: null,
  _afterView: null,

  initialize: function(beforeView, afterView){
    this._beforeView = beforeView;
    this._afterView = afterView;

    if (!this.$static.initAnimationStyle) {
      this._addAnimationStyle();
      this.$static.initAnimationStyle = true;
    }

    var width = Navy.Config.app.size.width;
    afterView.setRawStyle({webkitAnimation: '0.5s', webkitTransform: 'translateX(' + width + 'px)'});
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
      this._afterView.setRawStyle({webkitTransform: 'none'});
      callback && callback();
      return;
    }

    var cb = function(){
      this._beforeView.hide();
      this._afterView.removeRawEventListener('webkitAnimationEnd', cb);
      this._afterView.setRawStyle({webkitTransform: 'none', webkitAnimationName: 'none'});
      callback && callback();
    }.bind(this);

    this._afterView.addRawEventListener('webkitAnimationEnd', cb);
    this._afterView.setRawStyle({webkitAnimationName: 'slide_over_in'});
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

    this._beforeView.show();
    this._afterView.addRawEventListener('webkitAnimationEnd', cb);
    this._afterView.setRawStyle({webkitAnimationName: 'slide_over_out'});
  }
});

// file: src/wrap_text/footer.txt
})();
