/**
 * @typedef {Object} Navy.WebInstaller
 */
Navy.Class.instance('Navy.WebInstaller', {
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
  _manifestUrl: null,
  _remoteManifest: null,
  _localManifest: null,
  _invalidResources: null,
  _concurrency: 4,

  _totalInvalidCount: 0,
  _doneInvalidCount: 0,

  _callbackOnProgress: null,
  _callbackOnComplete: null,
  _callbackOnError: null,
  _forceUpdate: false,

  initialize: function(manifestUrl) {
    this._localManifest = {baseUrl: '', resources: []};
    this._manifestUrl = manifestUrl;
  },

  update: function(options) {
    this._callbackOnProgress = options.onProgress || function(){};
    this._callbackOnComplete = options.onComplete || function(){};
    this._callbackOnError = options.onError || function(){};
    this._forceUpdate = options.forceUpdate || false;

    this._initDB();
  },

  loadJavaScript: function(path, scriptElement, callback) {
    this._loadLocalResource(path, function(path, content, contentType){
      if (contentType !== 'text/javascript') {
        throw new Error('the path is not javascript. path = ' + path);
      }

      scriptElement.textContent = content;
      callback && callback(scriptElement);
    });
  },

  loadJSON: function(path, callback) {
    this._loadLocalResource(path, function(path, content, contentType){
      if (contentType !== 'text/json') {
        throw new Error('the path is not json. path = ' + path);
      }

      var obj = JSON.parse(content);
      callback && callback(obj);
    });
  },

  loadCSS: function(path, styleElement, callback) {
    this._loadLocalResource(path, function(path, content, contentType){
      if (contentType !== 'text/css') {
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

    this._loadLocalResource(path, function(path, content, contentType){
      if (contentType.indexOf('image/') !== 0) {
        throw new Error('the path is not image. path = ' + path);
      }

      imageElement.src = path;
    }, function(path){
      imageElement.src = path;
    });
  },

  _loadLocalResource: function(path, callback, errorCallback) {
    var transaction = function(tr) {
      tr.executeSql('SELECT content, contentType from resource where path = ?', [path], function(transaction, result){
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

  _initDB: function() {
    var transaction = function(tr) {
      tr.executeSql('CREATE TABLE IF NOT EXISTS resource (path TEXT PRIMARY KEY, md5 TEXT, contentType TEXT, content TEXT)');
    };

    var error = function(e) {
      console.error(e);
    };

    var success = function() {
      this._loadRemoteManifest();
    }.bind(this);

    this._db = openDatabase('web_installer', "0.1", "WebInstaller", 5 * 1000 * 1000);
    this._db.transaction(transaction, error, success);
  },

  _loadRemoteManifest: function() {
    var xhr = new XMLHttpRequest();

    xhr.open('GET', this._manifestUrl);
    xhr.onload = function(ev){
      var xhr = ev.target;
      this._remoteManifest = JSON.parse(xhr.responseText);

      this._loadLocalManifest();
    }.bind(this);

    xhr.send();
  },

  _loadLocalManifest: function() {
    var transaction = function(tr) {
      tr.executeSql('SELECT path, md5 from resource', null, function(transaction, result){
        var rows = result.rows;
        for (var i = 0; i < rows.length; i++) {
          var item = rows.item(i);
          this._localManifest.resources.push({
            path: item.path,
            md5: item.md5
          });
        }
      }.bind(this));
    }.bind(this);

    var error = function(e) {
      this._pickInvalidResources();
      console.error(e);
    };

    var success = function() {
      this._pickInvalidResources();
    }.bind(this);

    this._db.transaction(transaction, error, success);
  },

  _pickInvalidResources: function() {
    var localResourceMap = this._manifestToResourceMap(this._localManifest);
    var remoteResourceMap = this._manifestToResourceMap(this._remoteManifest);
    var invalidResources = [];

    for (var remotePath in remoteResourceMap) {
      var remoteMD5 = remoteResourceMap[remotePath].md5;

      if (this._forceUpdate) {
        invalidResources.push({path: remotePath, md5: remoteMD5});
        continue;
      }

      if (!localResourceMap[remotePath]) {
        invalidResources.push({path: remotePath, md5: remoteMD5});
        continue;
      }

      var localMD5 = localResourceMap[remotePath].md5;
      if (remoteMD5 !== localMD5) {
        invalidResources.push({path: remotePath, md5: remoteMD5});
      }
    }

    this._invalidResources = invalidResources;
    this._totalInvalidCount = invalidResources.length;
    this._doneInvalidCount = 0;

    this._startLoadingRemoteResources();
  },

  _startLoadingRemoteResources: function() {
    if (this._totalInvalidCount === 0) {
      this._callbackOnComplete();
      return
    }

    for (var i = 0; i < this._concurrency; i++) {
      var loader = new Navy.WebInstaller.Loader();
      loader.onload = this._onLoadRemoteResource.bind(this);
      loader.onerror = this._onLoadRemoteResourceError.bind(this);
      this._loadRemoteResource(loader);
    }
  },

  _loadRemoteResource: function(loader) {
    if (this._invalidResources.length === 0) {
      if (this._doneInvalidCount === this._totalInvalidCount) {
        this._callbackOnComplete();
      }
      return;
    }

    var resource = this._invalidResources.shift();
    var path = resource.path;
    resource.contentType = resource.contentType || this._getContentType(path);

    loader.load(resource);
  },

  _onLoadRemoteResource: function(loader, resource, responseText) {
    this._saveRemoteResource(loader, resource, responseText);
  },

  _onLoadRemoteResourceError: function(loader, resource) {
    console.error(resource);
    this._callbackOnError(resource.path);
  },

  _saveRemoteResource: function(loader, resource, responseText) {
    function transaction(tr) {
      var path = resource.path;
      var md5 = resource.md5;
      var contentType = resource.contentType;
      var content = responseText || null;
      tr.executeSql('INSERT OR REPLACE INTO resource (path, md5, contentType, content) VALUES (?, ?, ?, ?)', [path, md5, contentType, content]);
    }

    var error = function(e) {
      console.error(e, resource);
      this._callbackOnError(resource.path);
    }.bind(this);

    var success = function() {
      this._doneInvalidCount++;
      this._callbackOnProgress(this._doneInvalidCount, this._totalInvalidCount);
      this._loadRemoteResource(loader);
    }.bind(this);

    this._db.transaction(transaction, error, success);
  },

  _manifestToResourceMap: function(manifest) {
    var resources = manifest.resources;
    var map = {};
    for (var i = 0; i < resources.length; i++) {
      map[resources[i].path] = resources[i];
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
 * @class Navy.WebInstaller.Loader
 */
Navy.Class('Navy.WebInstaller.Loader', {
  onload: null,
  onerror: null,

  _resource: null,
  _loaderElement: null,

  load: function(resource) {
    this._resource = resource;
    var path = resource.path;
    var contentType = resource.contentType;

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
      var responseText = this._loaderElement.responseText;
      this.onload(this, this._resource, responseText);
    } else {
      this.onload(this, this._resource);
    }
  },

  _onError: function() {
    if (!this.onerror) {
      return;
    }

    this.onerror(this, this._resource);
  }
});
