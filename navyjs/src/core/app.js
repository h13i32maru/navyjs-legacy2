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
