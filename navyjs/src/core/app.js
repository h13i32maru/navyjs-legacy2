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
