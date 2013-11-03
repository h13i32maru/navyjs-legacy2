/**
 * @class Navy.Scene
 * @eventNames create, resumeBefore, resumeAfter, pauseBefore, pauseAfter, destroy
 */
Navy.Class('Navy.Scene', Navy.ViewGroup.ViewGroup, {
  LIFE_CYCLE_STATE_CREATE: 1,
  LIFE_CYCLE_STATE_RESUME_BEFORE: 2,
  LIFE_CYCLE_STATE_RESUME_AFTER: 3,
  LIFE_CYCLE_STATE_PAUSE_BEFORE: 4,
  LIFE_CYCLE_STATE_PAUSE_AFTER: 5,
  LIFE_CYCLE_STATE_DESTROY: 6,

  _lifeCycleState: 0,
  _pageStack: null,
  _sceneFixedFirstView: null,

  initialize: function($super, layout, callback){
    this._pageStack = [];

    $super(layout, function(){
      var viewId = this._viewsOrder[0];
      this._sceneFixedFirstView = this._views[viewId];
      this.nextPage(layout.extra.page, callback.bind(null, this));
    }.bind(this));
  },

  setLayout: function($super, layout, callback) {
    // シーン、ページの場合はsize, posは固定値でよい
    layout.visible = true;
    layout.pos = {x:0, y:0};
    layout.sizePolicy = this.SIZE_POLICY_FIXED;
    layout.size = {width: Navy.Config.app.size.width, height: Navy.Config.app.size.height};

    $super(layout, callback);
  },

  setPage: function(page) {
    // ignore
  },

  getPage: function() {
    return null;
  },

  setScene: function(scene) {
    // ignore
  },

  getScene: function() {
    return this;
  },

  getCurrentPage: function() {
    var currentStackObj = this._getCurrentStack();
    return currentStackObj.page;
  },

  // fixme: callbackを実装する.
  linkPage: function(id) {
    if (id === '$back') {
      this.backPage();
    } else {
      this.nextPage(id);
    }
  },

  nextPage: function(pageName, callback) {
    this._createPage(pageName, function(page){
      this._addPage(page);
      callback && callback(page);
    }.bind(this));
  },

  backPage: function() {
    if (this._pageStack.length >= 2) {
      var currentStackObj = this._getCurrentStack();
      var prevStackObj = this._getPrevStack();

      currentStackObj.page.onPauseBefore();
      prevStackObj.page.onResumeBefore();

      var transition = currentStackObj.transition;
      transition.back(this._onTransitionBackEnd.bind(this));
    }
  },

  onCreate: function() {
    this._lifeCycleState = this.LIFE_CYCLE_STATE_CREATE;
    console.log('onCreate', this.$className);

    // TODO: eventオブジェクトをちゃんと生成する.(他のライフサイクルも同じく)
    this.trigger('create', this, null);

    var page = this.getCurrentPage();
    page.onCreate();
  },

  onResumeBefore: function(){
    this._lifeCycleState = this.LIFE_CYCLE_STATE_PAUSE_BEFORE;
    console.log('onResumeBefore', this.$className);

    this.trigger('resumeBefore', this, null);

    var page = this.getCurrentPage();
    page.onResumeBefore();
  },

  onResumeAfter: function(){
    this._lifeCycleState = this.LIFE_CYCLE_STATE_PAUSE_AFTER;
    console.log('onResumeAfter', this.$className);

    this.trigger('resumeAfter', this, null);

    var page = this.getCurrentPage();
    page.onResumeAfter();
  },

  onPauseBefore: function(){
    this._lifeCycleState = this.LIFE_CYCLE_STATE_PAUSE_BEFORE;
    console.log('onPauseBefore', this.$className);

    this.trigger('pauseBefore', this, null);

    var page = this.getCurrentPage();
    page.onPauseBefore();
  },

  onPauseAfter: function(){
    this._lifeCycleState = this.LIFE_CYCLE_STATE_PAUSE_AFTER;
    console.log('onPauseAfter', this.$className);

    this.trigger('pauseAfter', this, null);

    var page = this.getCurrentPage();
    page.onPauseAfter();
  },

  onDestroy: function(){
    this._lifeCycleState = this.LIFE_CYCLE_STATE_DESTROY;
    console.log('onDestroy', this.$className);

    this.trigger('destroy', this, null);

    // TODO: いきなりsceneが終わる場合もあるのですべてのスタックを綺麗にする必要ありそう.
    var page = this.getCurrentPage();
    page.onDestroy();
  },

  // fixme: 不要？
  /*
  _getBottomPageLayout: function(layout) {
    var bottomLayout = {
      class: 'Navy.Page',
      id: '$bottom',
      pos: {x:0, y:0},
      size: {width: layout.size.width, height: layout.size.height},
      extra: {
        contentLayoutFile: layout.extra.contentBottomLayoutFile
      }
    };

    return bottomLayout;
  },
  */

  // fixme: 不要？
  /*
  _getTopPageLayout: function(layout) {
    var topLayout = {
      class: 'Navy.Page',
      id: '$top',
      pos: {x:0, y:0, z:100},
      size: {width: layout.size.width, height: layout.size.height},
      extra: {
        contentLayoutFile: layout.extra.contentTopLayoutFile
      }
    };

    return topLayout;
  },
  */

  _createPage: function(pageName, callback) {
    var layout = Navy.Config.page[pageName];
    Navy.Resource.loadScript(layout.classFile, this._onLoadScript.bind(this, layout, callback));
  },

  _createPageByLayout: function(layout, callback) {
    var _class = Navy.Resource.getClass(layout.class);
    new _class(layout, callback);
  },

  _onLoadScript: function(layout, callback) {
    var PageClass = Navy.Resource.getClass(layout.class);
    new PageClass(layout, callback);
  },

  _addPage: function(page) {
    this.addView(page, this._sceneFixedFirstView);
    this._lifeCycleState >= this.LIFE_CYCLE_STATE_CREATE && page.onCreate();
    this._lifeCycleState >= this.LIFE_CYCLE_STATE_RESUME_BEFORE && page.onResumeBefore();

    var currentStackObj = this._getCurrentStack();
    if (currentStackObj) {
      var beforePage = currentStackObj.page;
      beforePage.onPauseBefore();
    }

    // TODO: 組み込みだけじゃんくてカスタムのTransitionにも対応する.
    var TransitionClass = Navy.Resource.getClass(page.getLayout().extra.transition.class);
    var transition = new TransitionClass(beforePage, page);
    this._pageStack.push({
      page: page,
      transition: transition
    });
    transition.start(this._onTransitionStartEnd.bind(this));
  },

  _getCurrentStack: function() {
    if (this._pageStack.length >= 1) {
      return this._pageStack[this._pageStack.length - 1];
    } else {
      return null;
    }
  },

  _getPrevStack: function(){
    if (this._pageStack.length >= 2) {
      return this._pageStack[this._pageStack.length - 2];
    } else {
      return null;
    }
  },

  _onTransitionStartEnd: function(){
    var prevStackObj = this._getPrevStack();
    if (prevStackObj) {
      prevStackObj.page.onPauseAfter();
    }

    var currentStackObj = this._getCurrentStack();
    if (currentStackObj) {
      this._lifeCycleState >= this.LIFE_CYCLE_STATE_RESUME_AFTER && currentStackObj.page.onResumeAfter();
    }
  },

  _onTransitionBackEnd: function(){
    var prevStackObj = this._getPrevStack();
    if (prevStackObj) {
      prevStackObj.page.onResumeAfter();
    }

    var currentStackObj = this._getCurrentStack();
    if (currentStackObj) {
      currentStackObj.page.onPauseAfter();
      currentStackObj.page.onDestroy();

      var stackObj = this._pageStack.pop();
      stackObj.page.destroy();
    }
  }
});
