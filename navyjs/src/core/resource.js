/**
 * @typedef {Object} Navy.Resource
 */
Navy.Class.instance('Navy.Resource', {
  initialize: function(){
  },

  loadLayout: function(layoutFile, callback) {
    Navy.WebInstaller.loadJSON(layoutFile, callback);
  },

  loadScript: function(scriptFile, callback) {
    var scriptElement = document.createElement('script');
    document.head.appendChild(scriptElement);
    Navy.WebInstaller.loadJavaScript(scriptFile, scriptElement, callback);
  },

  loadImage: function(imageElement, imageFile, callback) {
    Navy.WebInstaller.loadImage(imageFile, imageElement || new Image(), callback);
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
