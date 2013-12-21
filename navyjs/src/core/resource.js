Navy.Class.instance('Navy.Resource', {
  _layouts: null,
  _scripts: null,
  _images: null,
  _loadingLayouts: null,

  initialize: function(){
    this._layouts = {};
    this._scripts = {};
    this._images = {};
    this._loadingLayouts = {};
  },

  loadLayout: function(layoutFile, callback) {
    // 既にローディング済みの場合はキャッシュから読み出す.
    if (this._layouts[layoutFile]) {
      var layoutText = this._layouts[layoutFile];
      var layout = JSON.parse(layoutText);
      callback && setTimeout(callback.bind(null, layout), 0);
      return;
    }

    // 現在ローディング中の場合は無駄なXHRを発行しない
    if (this._loadingLayouts[layoutFile]) {
      this._loadingLayouts[layoutFile].push(callback);
      return;
    }

    this._loadingLayouts[layoutFile] = [callback];

    var xhr = new XMLHttpRequest();
    xhr.open('GET', layoutFile);
    xhr.onload = function(ev){
      var xhr = ev.target;
      var layoutText = xhr.responseText;
      this._layouts[layoutFile] = layoutText;
      var callbacks = this._loadingLayouts[layoutFile];
      this._loadingLayouts[layoutFile] = null;

      for (var i = 0; i < callbacks.length; i++) {
        var layout = JSON.parse(layoutText);
        callbacks[i](layout);
      }
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
