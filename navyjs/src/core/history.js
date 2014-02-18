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
