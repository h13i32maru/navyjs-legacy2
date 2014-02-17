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
