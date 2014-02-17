/**
 * @typedef {Object} Navy.History
 */
Navy.Class.instance('Navy.History', {
  HASH_KEY: 'history',

  initialize: function() {
    this._historyCallbacks = [];

    /*
     * 同じ画面をurl hash付きでリロードするとそのままurl hashが引き継がれてしまうので.
     * url hashの値を初期化しておく.
     */
    var hash = Navy.URL.parseHash(location.href);
    hash[this.HASH_KEY] = -1;
    location.href = Navy.URL.stringifyHash(hash);

    /*
     * pushState/popStateは現状不要 & Android(4.1) Browserでも動くということなので
     * hash changeイベントにしておく. 将来的には変更するかも.
     */
    window.addEventListener('hashchange', this._onHashChange.bind(this));
  },

  forwarded: function() {
    var hash = Navy.URL.parseHash(location.href);
    var history = parseInt(hash[this.HASH_KEY], 10);
    history++;
    hash[this.HASH_KEY] = history;
    hash = Navy.URL.stringifyHash(hash);
    location.href = hash;
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
    var oldHash = Navy.URL.parseHash(domEvent.oldURL);
    var newHash = Navy.URL.parseHash(domEvent.newURL);

    var oldHistory = parseInt(oldHash[this.HASH_KEY], 10);
    var newHistory = parseInt(newHash[this.HASH_KEY], 10);

    // hashの初期化が行われたということで無視する
    if (newHistory === -1) {
      return;
    }

    // 進む処理なので無視する
    if (oldHistory < newHistory) {
      return;
    }

    // 戻る処理
    if (oldHistory > newHistory) {
      this._back();
    }
  }
});
