
// file: src/wrap_text/header.txt
(function(){
'use strict';

// file: src/init.js
window.Navy = {};

(function(){
  var scriptElements = document.querySelectorAll('script');
  var selfScriptElement = scriptElements[scriptElements.length - 1];
  if (selfScriptElement.dataset.assetConfig) {
    Navy.assetConfig = JSON.parse(selfScriptElement.dataset.assetConfig);
  } else {
    window.Navy.assetConfig = {alwaysRemote: false, forceUpdate: false};
  }
})();

window.addEventListener('DOMContentLoaded', function(){
  if (Navy.UnitTest) {
    return;
  }

  Navy.AssetInstaller.initialize('./manifest.json');

  // かならずremoteを使う場合は都度サーバから取得することになる.
  Navy.AssetInstaller.setAlwaysRemote(Navy.assetConfig.alwaysRemote);

  Navy.AssetInstaller.update({
    forceUpdate: Navy.assetConfig.forceUpdate,
    onProgress: function(progress, total) {
      var progressElement = document.querySelector('#asset_installer_inner_progress');
      if (progressElement) {
        progressElement.style.width = (100 * progress / total) + '%';
      }
    },
    onComplete: function() {
      var progressElement = document.querySelector('#asset_installer_progress');
      progressElement && progressElement.parentElement.removeChild(progressElement);
      Navy.App.initialize();
    },
    onError: function(path) {
      console.error(path);
    }
  });
});

// file: src/version.js
Navy.version = '0.0.1';

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

  if (Navy.Class._getByReflection(className)) {
    throw new Error('already defined this className. ' + className);
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
    if (!obj) {
      return null;
    }
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

// file: src/lib/asset_installer.js
/**
 * @typedef {Object} Navy.AssetInstaller
 */
Navy.Class.instance('Navy.AssetInstaller', {
  $static: {
    contentType: {
      '.js': 'text/javascript',
      '.css': 'text/stylesheet',
      '.json': 'text/json',
      '.png': 'image/png',
      '.jpg': 'image/jpg',
      '.jpeg': 'image/jpg',
      '.gif': 'image/gif'
    }
  },

  _db: null,
  _manifestURL: null,
  _remoteManifest: null,
  _localManifest: null,
  _invalidAssets: null,
  _concurrency: 4,
  _alwaysRemote: false,

  _totalInvalidCount: 0,
  _doneInvalidCount: 0,

  _callbackOnProgress: null,
  _callbackOnComplete: null,
  _callbackOnError: null,

  // DBを使うか使わないかで中身が変更されるメソッド.
  _loadAsset: null,

  initialize: function(manifestURL) {
    this._localManifest = {baseUrl: '', assets: []};
    this.setManifestURL(manifestURL);

    this.setAlwaysRemote(false);
  },

  setManifestURL: function(manifestURL) {
    this._manifestURL = manifestURL;
  },

  setAlwaysRemote: function(alwaysRemote) {
    this._alwaysRemote = alwaysRemote;

    if (alwaysRemote) {
      this._loadAsset = this._loadRemoteAsset;
    } else {
      this._loadAsset = this._loadLocalAsset;
    }
  },

  update: function(options) {
    this._callbackOnProgress = options.onProgress || function(){};
    this._callbackOnComplete = options.onComplete || function(){};
    this._callbackOnError = options.onError || function(){};
    var forceUpdate = options.forceUpdate || false;

    if (this._alwaysRemote) {
      setTimeout(function(){
        this._callbackOnComplete();
      }.bind(this), 0);
      return;
    }

    if (forceUpdate) {
      this._deleteAll(this._initDB.bind(this));
    } else {
      this._initDB();
    }
  },

  loadJavaScript: function(path, scriptElement, callback) {
    this._loadAsset(path, function(path, content, contentType){
      if (contentType !== 'text/javascript') {
        throw new Error('the path is not javascript. path = ' + path);
      }

      scriptElement.textContent = content;
      callback && callback(scriptElement);
    });
  },

  loadJSON: function(path, callback) {
    this._loadAsset(path, function(path, content, contentType){
      if (contentType !== 'text/json') {
        throw new Error('the path is not json. path = ' + path);
      }

      var obj = JSON.parse(content);
      callback && callback(obj);
    });
  },

  loadCSS: function(path, styleElement, callback) {
    this._loadAsset(path, function(path, content, contentType){
      if (contentType !== 'text/stylesheet') {
        throw new Error('the path is not css. path = ' + path);
      }

      styleElement.textContent = content;
      callback && callback(styleElement);
    });
  },

  loadImage: function(path, imageElement, callback) {
    imageElement.addEventListener('load', function onload(){
      this.removeEventListener('load', onload);
      callback && callback(this);
    });

    imageElement.addEventListener('error', function onerror(){
      this.removeEventListener('error', onerror);
      throw new Error('fail loading image. path = ' + path);
    });

    this._loadAsset(path, function(path, content, contentType){
      if (contentType.indexOf('image/') !== 0) {
        throw new Error('the path is not image. path = ' + path);
      }

      imageElement.src = path;
    }, function(path){
      imageElement.src = path;
    }, 'image/*');
  },

  _loadLocalAsset: function(path, callback, errorCallback, contentType) {
    var transaction = function(tr) {
      tr.executeSql('SELECT content, contentType from asset where path = ?', [path], function(transaction, result){
        var rows = result.rows;
        if (rows.length !== 1) {
          if (errorCallback) {
            errorCallback(path);
            return;
          } else {
            throw new Error('not found the path in DB. path = ' + path);
          }
        }

        var item = rows.item(0);
        var content = item.content;
        var contentType = item.contentType;

        callback && callback(path, content, contentType);
      });
    };

    var error = function(e) {
      console.error(e);
    };

    this._db.transaction(transaction, error);
  },

  _loadRemoteAsset: function(path, callback, errorCallback, contentType) {
    var asset = {
      path: path,
      contentType: contentType || this._getContentType(path)
    };

    var loader = new Navy.AssetInstaller.Loader();
    loader.onload = function(loader, asset, responseText) {
      callback && callback(asset.path, responseText, asset.contentType);
    };
    loader.onerror = function(loader, asset) {
      if (errorCallback) {
        errorCallback(asset.path);
      } else {
        throw new Error('not found the path in remote. path = ' + path);
      }
    };
    loader.load(asset);
  },

  _initDB: function() {
    var transaction = function(tr) {
      tr.executeSql('CREATE TABLE IF NOT EXISTS asset (path TEXT PRIMARY KEY, hash TEXT, contentType TEXT, content TEXT)');
    };

    var error = function(e) {
      console.error(e);
    };

    var success = function() {
      this._loadRemoteManifest();
    }.bind(this);

    this._db = openDatabase('asset_installer', "0.1", "AssetInstaller", 5 * 1000 * 1000);
    this._db.transaction(transaction, error, success);
  },

  _loadRemoteManifest: function() {
    var xhr = new XMLHttpRequest();

    xhr.open('GET', this._manifestURL);
    xhr.onload = function(ev){
      var xhr = ev.target;
      this._remoteManifest = JSON.parse(xhr.responseText);

      this._loadLocalManifest();
    }.bind(this);

    xhr.send();
  },

  _loadLocalManifest: function() {
    var transaction = function(tr) {
      tr.executeSql('SELECT path, hash from asset', null, function(transaction, result){
        var rows = result.rows;
        for (var i = 0; i < rows.length; i++) {
          var item = rows.item(i);
          this._localManifest.assets.push({
            path: item.path,
            hash: item.hash
          });
        }
      }.bind(this));
    }.bind(this);

    var error = function(e) {
      console.error(e);
    };

    var success = function() {
      this._pickInvalidAssets();
    }.bind(this);

    this._db.transaction(transaction, error, success);
  },

  _pickInvalidAssets: function() {
    var localAssetMap = this._manifestToAssetMap(this._localManifest);
    var remoteAssetMap = this._manifestToAssetMap(this._remoteManifest);
    var invalidAssets = [];

    for (var remotePath in remoteAssetMap) {
      var remoteHash = remoteAssetMap[remotePath].hash;

      if (!localAssetMap[remotePath]) {
        invalidAssets.push({path: remotePath, hash: remoteHash});
        continue;
      }

      var localHash = localAssetMap[remotePath].hash;
      if (remoteHash !== localHash) {
        invalidAssets.push({path: remotePath, hash: remoteHash});
      }
    }

    this._invalidAssets = invalidAssets;
    this._totalInvalidCount = invalidAssets.length;
    this._doneInvalidCount = 0;

    this._startLoadingRemoteAssetsToLocal();
  },

  _startLoadingRemoteAssetsToLocal: function() {
    if (this._totalInvalidCount === 0) {
      this._callbackOnComplete();
      return
    }

    for (var i = 0; i < this._concurrency; i++) {
      var loader = new Navy.AssetInstaller.Loader();
      loader.onload = this._onLoadRemoteAssetToLocal.bind(this);
      loader.onerror = this._onLoadRemoteAssetErrorToLocal.bind(this);
      this._loadRemoteAssetToLocal(loader);
    }
  },

  _loadRemoteAssetToLocal: function(loader) {
    if (this._invalidAssets.length === 0) {
      if (this._doneInvalidCount === this._totalInvalidCount) {
        this._callbackOnComplete();
      }
      return;
    }

    var asset = this._invalidAssets.shift();
    var path = asset.path;
    asset.contentType = asset.contentType || this._getContentType(path);

    loader.load(asset);
  },

  _onLoadRemoteAssetToLocal: function(loader, asset, responseText) {
    this._saveRemoteAsset(loader, asset, responseText);
  },

  _onLoadRemoteAssetErrorToLocal: function(loader, asset) {
    console.error(asset);
    this._callbackOnError(asset.path);
  },

  _saveRemoteAsset: function(loader, asset, responseText) {
    function transaction(tr) {
      var path = asset.path;
      var hash = asset.hash;
      var contentType = asset.contentType;
      var content = responseText || null;
      tr.executeSql('INSERT OR REPLACE INTO asset (path, hash, contentType, content) VALUES (?, ?, ?, ?)', [path, hash, contentType, content]);
    }

    var error = function(e) {
      console.error(e, asset);
      this._callbackOnError(asset.path);
    }.bind(this);

    var success = function() {
      this._doneInvalidCount++;
      this._callbackOnProgress(this._doneInvalidCount, this._totalInvalidCount);
      this._loadRemoteAssetToLocal(loader);
    }.bind(this);

    this._db.transaction(transaction, error, success);
  },

  _deleteAll: function(callback) {
    var transaction = function(tr) {
      tr.executeSql('DROP TABLE IF EXISTS asset');
    };

    var error = function(e) {
      console.error(e);
    };

    var success = function() {
      callback && callback();
    }.bind(this);

    var db = openDatabase('asset_installer', "0.1", "AssetInstaller", 5 * 1000 * 1000);
    db.transaction(transaction, error, success);
  },

  _manifestToAssetMap: function(manifest) {
    var assets = manifest.assets;
    var map = {};
    for (var i = 0; i < assets.length; i++) {
      map[assets[i].path] = assets[i];
    }

    return map;
  },

  _getContentType: function(path) {
    // TODO クエリパラメータやハッシュが付いている場合に対応.
    var pos = path.lastIndexOf('.');
    var ext = path.substr(pos).toLowerCase();
    var contentType = this.$class.contentType[ext];
    if (!contentType) {
      throw new Error('unknown file extension. ' + ext);
    }

    return contentType;
  }

});

/**
 * @class Navy.AssetInstaller.Loader
 */
Navy.Class('Navy.AssetInstaller.Loader', {
  onload: null,
  onerror: null,

  _asset: null,
  _loaderElement: null,

  load: function(asset) {
    this._asset = asset;
    var path = asset.path;
    var contentType = asset.contentType;

    if (contentType.indexOf('text/') === 0) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', path, true);
      xhr.onload = this._onLoad.bind(this);
      xhr.onerror = this._onError.bind(this);
      xhr.onabort = this._onError.bind(this);
      xhr.send();
      this._loaderElement = xhr;
    } else if (contentType.indexOf('image/') === 0) {
      var image = new Image();
      image.onload = this._onLoad.bind(this);
      image.onerror = this._onError.bind(this);
      image.onabort = this._onError.bind(this);
      image.src = path;
      this._loaderElement = image;
    } else {
      throw new Error('unknown content type. ' + contentType);
    }
  },

  _onLoad: function() {
    if (!this.onload) {
      return;
    }

    if ('responseText' in this._loaderElement) {
      // Creatorの場合、ローカルのfileを読み込んだ時はstatusに0が設定されるのでその場合は200として考える.
      var status = this._loaderElement.status || 200;
      if (status === 200) {
        var responseText = this._loaderElement.responseText;
        this.onload(this, this._asset, responseText);
      } else {
        this._onError();
      }
    } else {
      this.onload(this, this._asset);
    }
  },

  _onError: function() {
    if (!this.onerror) {
      return;
    }

    this.onerror(this, this._asset);
  }
});

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

// file: src/lib/url.js
/**
 * @typedef {Object} Navy.URL
 */
Navy.Class.instance('Navy.URL', {
  parseHash: function(url) {
    var result = {};

    var matched = url.match(/#(.*)/);
    if (!matched) {
      return result;
    }

    var hashes = matched[1].split('&');
    for (var i = 0; i < hashes.length; i++) {
      var hash = hashes[i];
      var key = hash.split('=')[0];
      var value = hash.split('=')[1];
      result[key] = value;
    }
    return result;
  },

  stringifyHash: function(hash) {
    var result = [];
    for (var key in hash) {
      result.push(key + '=' + hash[key]);
    }

    if (result.length) {
      return '#' + result.join('&');
    } else {
      return '';
    }
  }
});

// file: src/core/app.js
/**
 * @typedef {Object} Navy.App
 */
Navy.Class.instance('Navy.App', {
  _initRootBeforeCallback: null,

  initialize: function(){
    Navy.History.initialize();
    Navy.Asset.initialize();
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

// file: src/core/asset.js
/**
 * @typedef {Object} Navy.Asset
 */
Navy.Class.instance('Navy.Asset', {
  _scriptFileMap: null,

  initialize: function(){
    this._scriptFileMap = {};
  },

  loadLayout: function(layoutFile, callback) {
    Navy.AssetInstaller.loadJSON(layoutFile, callback);
  },

  loadJSON: function(jsonFile, callback) {
    Navy.AssetInstaller.loadJSON(jsonFile, callback);
  },

  loadScript: function(scriptFile, callback) {
    if (this._scriptFileMap[scriptFile]) {
      setTimeout(callback, 0);
      return;
    }

    this._scriptFileMap[scriptFile] = true;
    var scriptElement = document.createElement('script');
    document.head.appendChild(scriptElement);
    Navy.AssetInstaller.loadJavaScript(scriptFile, scriptElement, callback);
  },

  loadImage: function(imageElement, imageFile, callback) {
    Navy.AssetInstaller.loadImage(imageFile, imageElement || new Image(), callback);
  },

  getClass: function(className) {
    var chain = className.split('.');
    var clazz = window;
    for (var i = 0; i < chain.length; i++) {
      clazz = clazz[chain[i]];
    }

    return clazz;
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

    Navy.Asset.loadJSON('config/app.json', function(app){
      this.app = app;
      pass();
    }.bind(this));

    Navy.Asset.loadJSON('config/scene.json', function(scene){
      this.scene = this._arrayToMap(scene);
      pass();
    }.bind(this));

    Navy.Asset.loadJSON('config/page.json', function(page){
      this.page = this._arrayToMap(page);
      pass();
    }.bind(this));
  },

  _arrayToMap: function(array) {
    var map = {};
    for (var i = 0; i < array.length; i++) {
      map[array[i].id] = array[i];
    }
    return map;
  }
});

// file: src/core/event.js
/**
 * @class Navy.Event
 */
Navy.Class('Navy.Event', {
  target: null,
  data: null,

  _defaultCallbacks: null,
  _preventedDefault: false,
  _preventedPropagation: false,

  initialize: function(eventTarget, data) {
    this.target = eventTarget;
    this.data = data;
    this._defaultCallbacks = [];
  },

  addDefaultCallback: function(callback) {
    this._defaultCallbacks.push(callback);
  },

  getDefaultCallbacks: function() {
    return [].concat(this._defaultCallbacks);
  },

  preventDefault: function() {
    this._preventedDefault = true;
  },

  isPreventedDefault: function() {
    return this._preventedDefault;
  },

  preventPropagation: function() {
    this._preventedPropagation = true;
  },

  isPreventedPropagation: function() {
    return this._preventedPropagation;
  }
});

// file: src/core/event_target.js
/**
 * @class Navy.EventTarget
 */
Navy.Class('Navy.EventTarget', {
  _eventCallbackMap: null,
  _eventCallbackId: 0,

  initialize: function(){
    this._eventCallbackMap = {};
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

  trigger: function(eventName, data, event, defaultCallback) {
    if (!event) {
      event = new Navy.Event(this, data);
    }

    var onEventName = 'on' + eventName;
    if (this[onEventName] && typeof this[onEventName] === 'function') {
      this[onEventName](event);
    }

    var eventCallbacks = this._eventCallbackMap[eventName];
    if (eventCallbacks) {
      for (var i = 0; i < eventCallbacks.length; i++) {
        if (event.isPreventedPropagation()) {
          break;
        }

        var callback = eventCallbacks[i].callback;
        callback.call(this, event);
      }
    }

    if (!event.isPreventedDefault()) {
      defaultCallback && defaultCallback.call(this, event);

      var defaultCallbacks = event.getDefaultCallbacks();
      for (var i = 0; i < defaultCallbacks.length; i++) {
        defaultCallbacks[i].call(this, event);
      }
    }
  }
});

// file: src/core/history.js
/**
 * @typedef {Object} Navy.History
 */
Navy.Class.instance('Navy.History', {
  HASH_KEY: 'history',

  _hashChangeEventBySelf: false,

  initialize: function() {
    /*
     * 同じ画面をurl hash付きでリロードするとそのままurl hashが引き継がれてしまうので.
     * url hashの値を初期化しておく.
     */
    this._changeHash(0, true);

    /*
     * pushState/popStateは現状不要 & Android(4.1) Browserでも動くということなので
     * hash changeイベントにしておく. 将来的には変更するかも.
     */
    window.addEventListener('hashchange', this._onHashChange.bind(this));
  },

  forwarded: function() {
    this._changeHash(1);
  },

  backed: function() {
    this._hashChangeEventBySelf = true;
    window.history.back();
  },

  _changeHash: function(delta, isAbsolute) {
    this._hashChangeEventBySelf = true;

    var hash = Navy.URL.parseHash(location.href);
    var history = parseInt(hash[this.HASH_KEY], 10);

    if (isAbsolute) {
      history = delta;
    } else {
      history += delta;
    }

    hash[this.HASH_KEY] = history;
    hash = Navy.URL.stringifyHash(hash);
    location.assign(hash);
  },

  _back: function(data) {
    var currentScene = Navy.Root.getCurrentScene();
    if (currentScene.getPageStackCount() >= 2) {
      currentScene.backPage(data);
      return;
    }

    if (Navy.Root.getSceneStackCount() >= 2) {
      Navy.Root.backScene(data);
    }
  },

  _onHashChange: function(domEvent) {
    // 自身で変更したhashイベントの場合は処理をしない.
    // 処理してしまうと二回戻るなどの不都合がうまれる.
    if (this._hashChangeEventBySelf) {
      this._hashChangeEventBySelf = false;
      return;
    }
    this._hashChangeEventBySelf = false;

    /*
     * back keyでhashが変更された場合、Root#backScene/Scene#backPageからbacked()メソッドは実行されてほしくない.
     * 実行されてしまうとhashがさらに変更されてしまうからである.
     * そこでトリッキーだけど、backed()メソッドを一時的に空にして、処理が終わってからbacked()を元に戻す.
     */
    var origBackedFunc = this.backed;
    this.backed = function(){};

    var oldHash = Navy.URL.parseHash(domEvent.oldURL);
    var newHash = Navy.URL.parseHash(domEvent.newURL);

    var oldHistory = parseInt(oldHash[this.HASH_KEY], 10);
    var newHistory = parseInt(newHash[this.HASH_KEY], 10);

    // 戻る処理
    if (oldHistory > newHistory) {
      this._back();
    }

    this.backed = origBackedFunc;
  }
});

// file: src/view/view.js
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

  _loadExtraAsset: function($super, layout, callback) {
    if (layout && layout.extra.src) {
      this.setSrc(layout.extra.src, function(){
        $super(layout, callback);
      });
    } else {
      $super(layout, callback);
    }
  },

  _calcWrapContentSize: function() {
    var border = this.getBorderSize();
    var padding = this.getPaddingSize();
    return {
      width: this._imgElm.width + border.left + border.right + padding.left + padding.right,
      height: this._imgElm.height + border.top + border.bottom + padding.top + padding.bottom
    };
  },

  _onLoadImage: function(src, width, height){
    this.trigger('SizeChanged');
  },

  setSrc: function(src, callback) {
    this._layout.extra.src = src;
    Navy.Asset.loadImage(this._imgElm, src, function(src, width, height){
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
    this._textElement.style.lineHeight = 'normal';
    this._element.appendChild(this._textElement);
  },

  _applyExtraLayout: function($super, layout, callback) {
    if (!layout.extra) {
      return;
    }

    this.setFontSize(layout.extra.fontSize);
    this.setFontColor(layout.extra.fontColor);
    this.setTextAlign(layout.extra.textAlign);

    $super(layout, callback);
  },

  _loadExtraAsset: function($super, layout, callback) {
    this.setText(layout.extra.text);

    $super(layout, callback);
  },

  _calcWrapContentSize: function() {
    var border = this.getBorderSize();
    var padding = this.getPaddingSize();
    return {
      width: this._textElement.offsetWidth + border.left + border.right + padding.left + padding.right,
      height: this._textElement.offsetHeight + border.top + border.bottom + padding.top + padding.bottom
    };
  },

  setSize: function($super, size) {
    $super(size);
    this._element.style.lineHeight = this._element.clientHeight + 'px';
  },

  setText: function(text) {
    this._layout.extra.text = text;
    this._textElement.textContent = text;

    if (this._layout.sizePolicy.width === this.SIZE_POLICY_WRAP_CONTENT || this._layout.sizePolicy.height === this.SIZE_POLICY_WRAP_CONTENT) {
      this._updateSizeWithWrapContentSize();
      this.trigger('SizeChanged');
    }
  },

  getText: function() {
    return this._layout.extra.text;
  },

  setFontSize: function(fontSize) {
    this._layout.extra.fontSize = fontSize;
    this._element.style.fontSize = fontSize + 'px';

    if (this._layout.sizePolicy.width === this.SIZE_POLICY_WRAP_CONTENT || this._layout.sizePolicy.height === this.SIZE_POLICY_WRAP_CONTENT) {
      this._updateSizeWithWrapContentSize();
      this.trigger('SizeChanged');
    }
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
  },

  setTextAlign: function(textAlign) {
    this._layout.extra.textAlign = textAlign;

    if (textAlign) {
      this._element.style.textAlign = textAlign.horizontal;
      this._textElement.style.verticalAlign = textAlign.vertical;
    }
  },

  getTextAlign: function() {
    return this._cloneObject(this._layout.extra.textAlign);
  }
});

// file: src/view/text_edit.js
/**
 * @class Navy.View.TextEdit
 */
Navy.Class('Navy.View.TextEdit', Navy.View.View, {
  _textElement: null,

  /**
   *
   * @param $super
   * @param {TextEditLayout} layout
   * @param {function} callback
   */
  initialize: function($super, layout, callback) {
    $super(layout, callback);
  },

  _createExtraElement: function($super, layout) {
    $super(layout);

    this._textElement = document.createElement('input');
    this._textElement.style.cssText = '-webkit-user-select:auto; width: 100%; height:100%; box-sizing:border-box; border:none;';
    this._element.appendChild(this._textElement);
  },

  _loadExtraAsset: function($super, layout, callback) {
    this.setText(layout.extra.text);

    $super(layout, callback);
  },

  _calcWrapContentSize: function() {
    return {
      width: this._textElement.offsetWidth,
      height: this._textElement.offsetHeight
    };
  },

  _applyExtraLayout: function($super, layout, callback) {
    if (!layout.extra) {
      return;
    }

    this.setFontSize(layout.extra.fontSize);
    this.setFontColor(layout.extra.fontColor);
    this.setPlaceholder(layout.extra.placeholder);
    this.setTextType(layout.extra.textType);

    $super(layout, callback);
  },

  setText: function(text) {
    this._layout.extra.text = text;
    this._textElement.value = text;

    if (this._layout.sizePolicy.width === this.SIZE_POLICY_WRAP_CONTENT || this._layout.sizePolicy.height === this.SIZE_POLICY_WRAP_CONTENT) {
      this._updateSizeWithWrapContentSize();
      this.trigger('SizeChanged');
    }
  },

  getText: function() {
    return this._textElement.value;
  },

  setFontSize: function(fontSize) {
    this._layout.extra.fontSize = fontSize;
    this._textElement.style.fontSize = fontSize + 'px';

    if (this._layout.sizePolicy.width === this.SIZE_POLICY_WRAP_CONTENT || this._layout.sizePolicy.height === this.SIZE_POLICY_WRAP_CONTENT) {
      this._updateSizeWithWrapContentSize();
      this.trigger('SizeChanged');
    }
  },

  getFontSize: function() {
    return this._layout.extra.fontSize;
  },

  setFontColor: function(fontColor) {
    this._layout.extra.fontColor = fontColor;
    this._textElement.style.color = fontColor;
  },

  getFontColor: function() {
    return this._layout.extra.fontColor;
  },

  getPlaceholder: function() {
    return this._layout.extra.placeHolder;
  },

  setPlaceholder: function(placeholder) {
    this._textElement.placeholder = placeholder;
    this._layout.extra.placeholder = placeholder;
  },

  setTextType: function(textType) {
    this._layout.extra.textType = textType;
    this._textElement.type = textType;
  },

  getTextType: function() {
    return this._layout.extra.textType;
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

  _loadExtraAsset: function($super, layout, callback) {
    if (layout && layout.extra.contentLayoutFile) {
      this._layout.extra.contentLayoutFile = layout.extra.contentLayoutFile;
      Navy.Asset.loadLayout(layout.extra.contentLayoutFile, function(contentLayout){
        this._contentLayouts = contentLayout.layouts;
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
      var ViewClass = Navy.Asset.getClass(contentLayout.class);
      var view = new ViewClass(contentLayout, pass);
      this.addView(view);
    }
  },

  _onLoadContentLayout: function(contentLayouts) {
    var notify = new Navy.Notify(contentLayouts.length, this._initCallback);
    var pass = notify.pass.bind(notify);

    for (var i = 0; i < contentLayouts.length; i++) {
      var contentLayout = contentLayouts[i];
      var ViewClass = Navy.Asset.getClass(contentLayout.class);
      var view = new ViewClass(contentLayout, pass);
      this.addView(view);
    }
  },

  /**
   *
   * @param ev
   * @private
   */
  _resizeWrapContentByChangedView: function(ev) {
    if (this._layout.sizePolicy.width !== this.SIZE_POLICY_WRAP_CONTENT && this._layout.sizePolicy.height !== this.SIZE_POLICY_WRAP_CONTENT) {
      return;
    }

    var view = ev.target;
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

    var border = this.getBorderSize();
    var padding = this.getPaddingSize();
    return {
      width: maxWidth + border.left + border.right + padding.left + padding.right,
      height: maxHeight + border.top + border.bottom + padding.top + padding.bottom
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

    view.on('SizeChanged', this._resizeWrapContentByChangedView.bind(this));
    view.on('PosChanged', this._resizeWrapContentByChangedView.bind(this));
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

  _loadExtraAsset: function($super, layout, callback) {
    $super(layout, callback);
  },

  _applyExtraLayout: function($super, layout, callback) {
    function cb() {
      var size = this._imageView.getSize();
      this._textView.setSizePolicy({width: this.SIZE_POLICY_FIXED, height: this.SIZE_POLICY_FIXED});
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

    var imageLayout = {};
    imageLayout.id = 'image';
    imageLayout.visible = true;
    imageLayout.pos = {x: 0, y: 0};
    imageLayout.sizePolicy = {width: this.SIZE_POLICY_WRAP_CONTENT, height: this.SIZE_POLICY_WRAP_CONTENT};
    imageLayout.extra = this._cloneObject(layout.extra);
    imageLayout.extra.src = layout.extra.normal.src;
    this._imageView = new Navy.View.Image(imageLayout, pass);
    this.addView(this._imageView);

    var textLayout = {};
    textLayout.id = 'text';
    textLayout.visible = true;
    textLayout.pos = {x:0, y:0};
    textLayout.sizePolicy = {width: this.SIZE_POLICY_WRAP_CONTENT, height: this.SIZE_POLICY_WRAP_CONTENT};
    textLayout.extra = this._cloneObject(layout.extra);
    this._textView = new Navy.View.Text(textLayout, pass);
    this.addView(this._textView);
  },

  _onTouchStart: function(/* ev */) {
    if (!this._layout.extra.active.src) {
      return;
    }

    this._imageView.setSrc(this._layout.extra.active.src);
  },

  _onTouchEnd: function(/* ev */) {
    if (!this._layout.extra.normal.src) {
      return;
    }

    setTimeout(function(){
      this._imageView.setSrc(this._layout.extra.normal.src);
    }.bind(this), 100);
  }
});

// file: src/view_group/list_view.js
Navy.Class('Navy.ViewGroup.ListView', Navy.ViewGroup.ViewGroup, {
  initialize: function($super, layout, callback) {
    $super(layout, callback);
  },

  _applyExtraLayout: function($super, layout, callback) {
    $super(layout, callback);

    this._element.style.overflowY = 'scroll';
    this._element.style.overflowX = 'hidden';
    this._element.style.webkitOverflowScrolling = 'touch'; // for ios

    if (this._layout.extra.mock) {
      var items = [];
      for (var i = 0; i < 30; i++) {
        items.push({});
      }
      this.setItems(items);
    }
  },

  clear: function() {
    for (var viewId in this._views) {
      var view = this._views[viewId];
      this.removeView(view);
    }
  },

  setItems: function(items, callback) {
    this.clear();
    this.insertItems(items, 0, callback);
  },

  addItems: function(items, callback) {
    this.insertItems(items, this._viewsOrder.length, callback);
  },

  insertItems: function(items, index, callback) {
    // 範囲チェック
    if (index < 0 || index > this._viewsOrder.length) {
      throw new Error('out of range. index = ' + index);
    }

    // 一番最後のindexを指定した場合はaddになる. そうでない場合は指定したindexに挿入.
    if (index === this._viewsOrder.length) {
      var referenceView = null;
    } else {
      var viewId = this._viewsOrder[index];
      var referenceView = this.findViewById(viewId);
    }

    var notify = new Navy.Notify(items.length, function(){
      var link = this._cloneObject(this._layout.extra.itemLink || '');
      var margin = this._layout.extra.itemLayoutMargin + 'px';
      for (var i = 0; i < items.length; i++) {
        var view = viewGroups[i];
        var item = items[i];

        if (link) {
          view.setLink(link);
        }

        var callbackResult = false;
        if (callback) {
          callbackResult = callback(item, view, i, currentViewCount + i);
        }

        // undefinedの場合はtrueとして扱いたいので===で比較している.
        if (callbackResult === false) {
          // itemのキーをviewのidと解釈して値を設定する.
          for (var key in item) {
            var childView = view.findViewById(key);
            if (!childView) { continue; }

            if (childView.setText) {
              childView.setText(item[key]);
            } else if (childView.setSrc) {
              childView.setSrc(item[key]);
            }
          }
        }

        view.getElement().style.position = 'relative';
        view.getElement().style.marginBottom = margin;
        view.setVisible(true);
      }
    }.bind(this));
    var pass = notify.pass.bind(notify);

    var currentViewCount = this._viewsOrder.length;
    var viewGroups = [];
    for (var i = 0; i < items.length; i++) {
      var layout = {
        id: 'item' + (currentViewCount + i),
        visible: false,
        sizePolicy: {width: 'wrapContent', height: 'wrapContent'},
        pos: {x: 0, y:0},
        extra: {
          contentLayoutFile: this._layout.extra.itemLayoutFile
        }
      };

      var viewGroup = new Navy.ViewGroup.ViewGroup(layout, pass);
      this.addView(viewGroup, referenceView);
      viewGroups.push(viewGroup);
    }
  }
});

// file: src/view_group/tab.js
Navy.Class('Navy.ViewGroup.Tab', Navy.ViewGroup.ViewGroup, {
  _tabLabels: null,
  _tabContents: null,

  _applyExtraLayout: function($super, layout, callback){
    $super(layout, callback);

    this.removeAllViews();

    this._tabLabels = [];
    this._tabContents = [];

    var contents = layout.extra.contents;

    var notify = new Navy.Notify(contents.length * 2, function(){
      this._adjustPosition();
      $super(layout, callback)
    }.bind(this));

    var pass = notify.pass.bind(notify);

    for (var i = 0; i < contents.length; i++) {
      // tab label
      var labelLayout = this._generateTabLabelLayout(i);
      var tabLabel = new Navy.ViewGroup.Button(labelLayout, pass);
      this.addView(tabLabel);
      this._tabLabels.push(tabLabel);

      // tab content
      var contentLayout = this._generateTabContentLayout(i);
      var tabContent = new Navy.ViewGroup.ViewGroup(contentLayout, pass);
      this.addView(tabContent);
      this._tabContents.push(tabContent);

      // tapした時の表示切り替え
      tabLabel.on('Tap', this._onTapTabLabel.bind(this, tabContent));
    }
  },

  _generateTabLabelLayout: function(index) {
    var contents = this._layout.extra.contents;
    var content = contents[index];

    var extra = this._cloneObject(this._layout.extra.label);
    extra.text = content.label;

    var layout = {
      id: '$tab_label' + index,
      visible: true,
      sizePolicy: {width: 'wrapContent', height: 'wrapContent'},
      pos: {x: 0, y: 0},
      extra: extra
    };

    return layout;
  },

  _generateTabContentLayout: function(index) {
    var contents = this._layout.extra.contents;
    var content = contents[index];

    var layout = {
      id: content.id,
      visible: index === 0, // はじめのviewだけ表示する
      sizePolicy: {width: 'wrapContent', height: 'wrapContent'},
      pos: {x: 0, y:0},
      extra: {
        contentLayoutFile: content.layoutFile
      }
    };

    return layout;
  },

  _adjustPosition: function() {
    var tabLabelSize = this._tabLabels[0].getSize();

    var labelWidth = Math.floor(this.getSize().width / this._tabLabels.length);
    var margin = (labelWidth - tabLabelSize.width) / 2;
    for (var i = 0; i < this._tabLabels.length; i++) {
      var tabLabel = this._tabLabels[i];
      var pos = tabLabel.getPos();
      var x = labelWidth * i + margin;
      pos.x = x;
      tabLabel.setPos(pos);
    }

    var height = tabLabelSize.height;
    for (var i = 0; i < this._tabContents.length; i++) {
      var tabContent = this._tabContents[i];
      var pos = tabContent.getPos();
      pos.y = height;
      tabContent.setPos(pos);
    }
  },

  _onTapTabLabel: function(tabContent, ev){
    var contents = this._layout.extra.contents;
    for (var i = 0; i < contents.length; i++) {
      var tabContentId = contents[i].id;
      this.findViewById(tabContentId).setVisible(false);
    }
    tabContent.setVisible(true);
  }
});

// file: src/view_screen/page.js
/**
 * @class Navy.Page
 * @eventNames Create, ResumeBefore, ResumeAfter, PauseBefore, PauseAfter, Destroy
 */
Navy.Class('Navy.Page', Navy.ViewGroup.ViewGroup, {
  initialize: function($super, layout, callback) {
    $super(layout, callback);
  },

  setLayout: function($super, layout, callback) {
    // シーン、ページの場合はsize, posは固定値でよい
    layout.visible = true;
    layout.pos = {x:0, y:0};
    layout.sizePolicy = {width: this.SIZE_POLICY_FIXED, height: this.SIZE_POLICY_FIXED};
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
  },

  onResumeBefore: function(){
  },

  onResumeAfter: function(){
  },

  onPauseBefore: function(){
  },

  onPauseAfter: function(){
  },

  onDestroy: function(){
  }
});

// file: src/view_screen/root.js
/**
 * @typedef {Object} Navy.Root
 */
Navy.Class.instance('Navy.Root', Navy.ViewGroup.ViewGroup, {
  _sceneStack: null,
  _loadingElement: null,
  _loadingCount: 0,

  /**
   * @param $super
   */
  initialize: function($super) {
    $super();

    this._id = '$root';
    this._layout = {
      visible: true,
      sizePolicy: {width: this.SIZE_POLICY_FIXED, height: this.SIZE_POLICY_FIXED},
      size: {width: Navy.Config.app.size.width, height: Navy.Config.app.size.height},
      pos: {x: 0, y: 0}
    };

    this._initDocument();
    this._initLoading();
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

  getSceneStackCount: function() {
    return this._sceneStack.length;
  },

  getCurrentPage: function() {
    var scene = this.getCurrentScene();
    return scene.getCurrentPage();
  },

  // fixme: callbackを実装する.
  linkScene: function(id, data) {
    if (id === '$back') {
      this.backScene(data);
    } else {
      this.nextScene(id, data);
    }
  },

  nextScene: function(sceneName, data) {
    this.lockView();
    this._createScene(sceneName, function(scene){
      this._addScene(scene, data);
    }.bind(this));
  },

  backScene: function(data) {
    if (this._sceneStack.length >= 2) {
      this.lockView();

      Navy.History.backed();

      var prevStackObj = this._getPrevStack();
      prevStackObj.scene.trigger('ResumeBefore', data);

      var currentStackObj = this._getCurrentStack();
      currentStackObj.scene.trigger('PauseBefore');
      currentStackObj.transition.back(this._onTransitionBackEnd.bind(this));
    }
  },

  startLoading: function() {
    if (this._loadingCount === 0) {
      document.body.appendChild(this._loadingElement);
      this._loadingElement.addEventListener('touchstart', this._preventDOMEvent, true);
    }

    this._loadingCount++;
  },

  stopLoading: function() {
    if (this._loadingCount === 0) {
      return;
    }

    this._loadingCount--;
    if (this._loadingCount === 0) {
      document.body.removeChild(this._loadingElement);
      this._loadingElement.removeEventListener('touchstart', this._preventDOMEvent, true);
    }
  },

  _initDocument: function(){
    var title = document.createElement('title');
    title.textContent = Navy.Config.app.name;
    document.head.appendChild(title);

    var link = document.createElement('link');
    link.rel = 'apple-touch-icon';
    link.href = Navy.Config.app.touchIcon;
    document.head.appendChild(link);

    var style = '';
    style += '* {margin:0; padding:0; -webkit-user-select: none; -webkit-user-drag:none; box-sizing: border-box;}';
    style += 'html {width:100%; height:100%}';
    style += 'body {background-color:#000; font-family: {fontFamily}}'.replace('{fontFamily}', Navy.Config.app.fontFamily);

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

  _initLoading: function() {
    var width = Navy.Config.app.size.width;
    var height = Navy.Config.app.size.height;

    var elm = document.createElement('div');
    elm.style.cssText = 'position: absolute; top:0; left:0; background: rgba(0,0,0,0.5)';
    elm.style.width = width + 'px';
    elm.style.height = height + 'px';

    this._loadingElement = elm;

    if (Navy.Config.app.loading.src) {
      var img = document.createElement('img');
      Navy.Asset.loadImage(img, Navy.Config.app.loading.src, function(img){
        var imgWidth = width * 0.15;
        img.width = imgWidth;
        img.style.left = (width/2 -  img.width/ 2) + 'px';
        img.style.top = (height/2 - img.height/2) + 'px';
        img.style.position = 'absolute';
        img.style.cssText += '-webkit-animation-name: navy_loading; -webkit-animation-duration: 1s; -webkit-animation-timing-function: linear; -webkit-animation-iteration-count: infinite;';
        elm.appendChild(img);
        var style = document.createElement('style');
        style.textContent = '@-webkit-keyframes navy_loading { 0% { -webkit-transform: rotate(0deg); }  100% { -webkit-transform: rotate(360deg); }';
        document.head.appendChild(style);
      });
    }
  },

  _createScene: function(sceneName, callback) {
    var layout = this._cloneObject(Navy.Config.scene[sceneName]);
    Navy.Asset.loadScript(layout.classFile, this._onLoadScript.bind(this, layout, callback));
  },

  _onLoadScript: function(layout, callback) {
    var SceneClass = Navy.Asset.getClass(layout.class);
    var scene = new SceneClass(layout, callback);

    // addViewしてしまうとsceneが見えてしまうので遷移アニメーションが開始するまで非表示にしておく.
    scene.setVisible(false);
    this.addView(scene);
  },

  _addScene: function(scene, data) {
    scene.trigger('Create', data);
    scene.trigger('ResumeBefore');

    var currentStackObj = this._getCurrentStack();
    if (currentStackObj) {
      var beforeScene = currentStackObj.scene;
      beforeScene.trigger('PauseBefore');
    }

    // TODO: 組み込みだけじゃんくてカスタムのTransitionにも対応する.
    var TransitionClass = Navy.Asset.getClass(scene.getLayout().extra.transition.class);
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
      prevStackObj.scene.trigger('PauseAfter');
    }

    var currentStackObj = this._getCurrentStack();
    if (currentStackObj) {
      currentStackObj.scene.trigger('ResumeAfter');
    }
    this.unlockView();
  },

  _onTransitionBackEnd: function(){
    var prevStackObj = this._getPrevStack();
    if (prevStackObj) {
      prevStackObj.scene.trigger('ResumeAfter');
    }

    var currentStackObj = this._getCurrentStack();
    if (currentStackObj) {
      currentStackObj.scene.trigger('PauseAfter');
      currentStackObj.scene.trigger('Destroy');

      this._removeCurrentScene();
    }
    this.unlockView();
  }
});

// file: src/view_screen/scene.js
/**
 * @class Navy.Scene
 * @eventNames Create, ResumeBefore, ResumeAfter, PauseBefore, PauseAfter, Destroy
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
      this.nextPage(layout.extra.page, null, callback.bind(null, this));
    }.bind(this));
  },

  setLayout: function($super, layout, callback) {
    // シーン、ページの場合はsize, posは固定値でよい
    layout.visible = true;
    layout.pos = {x:0, y:0};
    layout.sizePolicy = {width: this.SIZE_POLICY_FIXED, height: this.SIZE_POLICY_FIXED};
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

  getPageStackCount: function() {
    return this._pageStack.length;
  },

  // fixme: callbackを実装する.
  linkPage: function(id, data) {
    if (id === '$back') {
      this.backPage(data);
    } else {
      this.nextPage(id, data);
    }
  },

  nextPage: function(pageName, data, callback) {
    Navy.Root.lockView();

    Navy.History.forwarded();

    this._createPage(pageName, function(page){
      this._addPage(page, data);
      callback && callback(page);
    }.bind(this));
  },

  backPage: function(data) {
    if (this._pageStack.length >= 2) {
      Navy.Root.lockView();

      Navy.History.backed();

      var currentStackObj = this._getCurrentStack();
      var prevStackObj = this._getPrevStack();

      currentStackObj.page.trigger('PauseBefore');
      prevStackObj.page.trigger('ResumeBefore', data);

      var transition = currentStackObj.transition;
      transition.back(this._onTransitionBackEnd.bind(this));
    }
  },

  onCreate: function(ev) {
    this._lifeCycleState = this.LIFE_CYCLE_STATE_CREATE;

    ev.addDefaultCallback(function(){
      var page = this.getCurrentPage();
      page.trigger('Create', ev.data);
    });
  },

  onResumeBefore: function(ev){
    this._lifeCycleState = this.LIFE_CYCLE_STATE_PAUSE_BEFORE;

    ev.addDefaultCallback(function(){
      var page = this.getCurrentPage();
      page.trigger('ResumeBefore', ev.data);
    });
  },

  onResumeAfter: function(ev){
    this._lifeCycleState = this.LIFE_CYCLE_STATE_PAUSE_AFTER;

    ev.addDefaultCallback(function(){
      var page = this.getCurrentPage();
      page.trigger('ResumeAfter', ev.data);
    });
  },

  onPauseBefore: function(ev){
    this._lifeCycleState = this.LIFE_CYCLE_STATE_PAUSE_BEFORE;

    ev.addDefaultCallback(function(){
      var page = this.getCurrentPage();
      page.trigger('PauseBefore', ev.data);
    });
  },

  onPauseAfter: function(ev){
    this._lifeCycleState = this.LIFE_CYCLE_STATE_PAUSE_AFTER;

    ev.addDefaultCallback(function(){
      var page = this.getCurrentPage();
      page.trigger('PauseAfter', ev.data);
    });
  },

  onDestroy: function(ev){
    this._lifeCycleState = this.LIFE_CYCLE_STATE_DESTROY;

    ev.addDefaultCallback(function(){
      // TODO: いきなりsceneが終わる場合もあるのですべてのスタックを綺麗にする必要ありそう.
      var page = this.getCurrentPage();
      page.trigger('Destroy', ev.data);
    });
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
    var layout = this._cloneObject(Navy.Config.page[pageName]);
    Navy.Asset.loadScript(layout.classFile, this._onLoadScript.bind(this, layout, callback));
  },

  _createPageByLayout: function(layout, callback) {
    var PageClass = Navy.Asset.getClass(layout.class);
    var page = new PageClass(layout, callback);
    this.addView(page, this._sceneFixedFirstView);
  },

  _onLoadScript: function(layout, callback) {
    var PageClass = Navy.Asset.getClass(layout.class);
    var page = new PageClass(layout, callback);

    // addViewしてしまうとpageが見えてしまうので遷移アニメーションが開始するまで非表示にしておく.
    page.setVisible(false);
    this.addView(page, this._sceneFixedFirstView);
  },

  _addPage: function(page, data) {
    this._lifeCycleState >= this.LIFE_CYCLE_STATE_CREATE && page.trigger('Create', data);
    this._lifeCycleState >= this.LIFE_CYCLE_STATE_RESUME_BEFORE && page.trigger('ResumeBefore');

    var currentStackObj = this._getCurrentStack();
    if (currentStackObj) {
      var beforePage = currentStackObj.page;
      beforePage.trigger('PauseBefore');
    }

    // TODO: 組み込みだけじゃんくてカスタムのTransitionにも対応する.
    var TransitionClass = Navy.Asset.getClass(page.getLayout().extra.transition.class);
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
      prevStackObj.page.trigger('PauseAfter');
    }

    var currentStackObj = this._getCurrentStack();
    if (currentStackObj) {
      this._lifeCycleState >= this.LIFE_CYCLE_STATE_RESUME_AFTER && currentStackObj.page.trigger('ResumeAfter');
    }

    Navy.Root.unlockView();
  },

  _onTransitionBackEnd: function(){
    var prevStackObj = this._getPrevStack();
    if (prevStackObj) {
      prevStackObj.page.trigger('ResumeAfter');
    }

    var currentStackObj = this._getCurrentStack();
    if (currentStackObj) {
      currentStackObj.page.trigger('PauseAfter');
      currentStackObj.page.trigger('Destroy');

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
    afterView._setRawStyle({webkitAnimation: '0.5s', opacity: 0});
    afterView.setVisible(true);
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

    afterView._setRawStyle({webkitAnimation: '0.5s', webkitTransform: 'scale(0)'});
    afterView.setVisible(true);
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
    afterView.setVisible(true);
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
    afterView.setVisible(true);
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
    afterView.setVisible(true);
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
    afterView.setVisible(true);
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
    afterView.setVisible(true);
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
