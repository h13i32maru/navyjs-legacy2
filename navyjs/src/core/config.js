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
