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
  _enableDatabase: null,

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

    this.setEnableDatabase(true);
  },

  setManifestURL: function(manifestURL) {
    this._manifestURL = manifestURL;
  },

  setEnableDatabase: function(enable) {
    this._enableDatabase = enable;

    // DBを使う場合はローカルから、使わない場合はリモートからリソースを取得する.
    if (enable) {
      this._loadAsset = this._loadLocalAsset;
    } else {
      this._loadAsset = this._loadRemoteAsset;
    }
  },

  update: function(options) {
    this._callbackOnProgress = options.onProgress || function(){};
    this._callbackOnComplete = options.onComplete || function(){};
    this._callbackOnError = options.onError || function(){};
    var forceUpdate = options.forceUpdate || false;

    if (!this._enableDatabase) {
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
