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
