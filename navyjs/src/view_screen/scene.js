Navy.Class('Navy.Scene', Navy.ViewGroup.ViewGroup, {
  _pageStack: null,

  initialize: function($super, layout, callback){
    this._pageStack = [];

    $super(layout, function(){
      var views = this._views;
      for (var name in views) {
        views[name].setPos({z: 100});
      }
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
      var stackObj = this._pageStack[this._pageStack.length - 1];
      var transition = stackObj.transition;
      transition.back(this._onTransitionBackEnd.bind(this));
    }
  },

  onCreate: function() {
    console.log('onCreate', this.$className);
  },

  onResumeBefore: function(){
    console.log('onResumeBefore', this.$className);
  },

  onResumeAfter: function(){
    console.log('onResumeAfter', this.$className);
  },

  onPauseBefore: function(){
    console.log('onPauseBefore', this.$className);
  },

  onPauseAfter: function(){
    console.log('onPauseAfter', this.$className);
  },

  onDestroy: function(){
    console.log('onDestroy', this.$className);
  },

  // 不要？
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

  // 不要？
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

  _createPage: function(pageName, callback) {
    var layout = Navy.Config.page[pageName];
    Navy.Resource.loadScript(layout.classFile, this._onLoadScript.bind(this, layout, callback));
  },

  _createPageByLayout: function(layout, callback) {
    var _class = Navy.Resource.getClass(layout.class);
    new _class(layout, callback);
  },

  _onLoadScript: function(layout, callback) {
    var _class = Navy.Resource.getClass(layout.class);
    new _class(layout, callback);
  },

  _addPage: function(page) {
    page.onCreate();
    page.onResumeBefore();

    var currentStackObj = this._getCurrentStack();
    if (currentStackObj) {
      var beforePage = currentStackObj.page;
      beforePage.onPauseBefore();
    }

    var transition = new Navy.Transition.SlideOver(beforePage, page);
    this._pageStack.push({
      page: page,
      transition: transition
    });
    this.addView(page);
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
      currentStackObj.page.onResumeAfter();
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
