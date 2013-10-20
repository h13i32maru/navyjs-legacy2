Navy.Class.instance('Navy.Root', Navy.ViewGroup.ViewGroup, {
  _sceneStack: null,

  /**
   * @param $super
   */
  initialize: function($super) {
    $super();

    this._id = '$root';
    this._layout = {visible: true};

    this._initDocument();
    var rootElm = document.createElement('div');
    rootElm.style.cssText = 'position:absolute; width:100%; height:100%; overflow:hidden;';
    document.body.appendChild(rootElm);
    this._element = rootElm;

    this._sceneStack = [];
    var startSceneName = Navy.Config.app.start.scene;
    this.nextScene(startSceneName);
  },

  getCurrentScene: function() {
    var currentStackObj = this._getCurrentStack();
    return currentStackObj.scene;
  },

  getCurrentPage: function() {
    var scene = this.getCurrentScene();
    return scene.getCurrentPage();
  },

  // fixme: callbackを実装する.
  linkScene: function(id) {
    if (id === '$back') {
      this.backScene();
    } else {
      this.nextScene(id);
    }
  },

  nextScene: function(sceneName) {
    this._createScene(sceneName, this._addScene.bind(this));
  },

  backScene: function() {
    if (this._sceneStack.length >= 2) {
      var prevStackObj = this._getPrevStack();
      prevStackObj.scene.onResumeBefore();

      var currentStackObj = this._getCurrentStack();
      currentStackObj.scene.onPauseBefore();
      currentStackObj.transition.back(this._onTransitionBackEnd.bind(this));
    }
  },

  _initDocument: function(){
    var style = '* {margin:0; padding:0; -webkit-user-select: none; -webkit-user-drag:none;} html {width:100%; height:100%} body {background-color:#000;}';
    var styleElm = document.createElement('style');
    styleElm.textContent = style;
    document.head.appendChild(styleElm);

    var width = Navy.Config.app.size.width;
    var height = Navy.Config.app.size.height;

    var screenWidth = window.innerWidth;
    var screenHeight = window.innerHeight;
    var scaleWidth = screenWidth / width;
    var scaleHeight = screenHeight / height;
    var scale = Math.min(scaleWidth, scaleHeight);
    var left = (screenWidth - scale * width) / 2;
    var top = (screenHeight - scale * height) / 2;
    document.body.style.position = 'absolute';
    document.body.style.zoom = scale;
    document.body.style.width = width + 'px';
    document.body.style.height = height + 'px';

    // zoomがleft,topにも影響するので補正しておく必要がある
    // FIXME: Google Chrome, Android Browser, Android Chrome, Mobile Safariでどうなっているか最新のバージョンで確かめる必要あり.
    document.body.style.left = (left / scale) + 'px';
    document.body.style.top = (top / scale) + 'px';
  },

  _createScene: function(sceneName, callback) {
    var layout = Navy.Config.scene[sceneName];
    Navy.Resource.loadScript(layout.classFile, this._onLoadScript.bind(this, layout, callback));
  },

  _onLoadScript: function(layout, callback) {
    var _class = Navy.Resource.getClass(layout.class);
    new _class(layout, callback);
  },

  _addScene: function(scene) {
    scene.onCreate();
    scene.onResumeBefore();

    var currentStackObj = this._getCurrentStack();
    if (currentStackObj) {
      var beforeScene = currentStackObj.scene;
      beforeScene.onPauseBefore();
    }

    var transition = new Navy.Transition.Fade(beforeScene, scene);
    this._sceneStack.push({
      scene: scene,
      transition: transition
    });
    this.addView(scene);
    transition.start(this._onTransitionStartEnd.bind(this));
  },

  _removeCurrentScene: function() {
    var stackObj = this._sceneStack.pop();
    stackObj.scene.destroy();
  },

  _getCurrentStack: function() {
    if (this._sceneStack.length >= 1) {
      return this._sceneStack[this._sceneStack.length - 1];
    } else {
      return null;
    }
  },

  _getPrevStack: function(){
    if (this._sceneStack.length >= 2) {
      return this._sceneStack[this._sceneStack.length - 2];
    } else {
      return null;
    }
  },

  _onTransitionStartEnd: function(){
    var prevStackObj = this._getPrevStack();
    if (prevStackObj) {
      prevStackObj.scene.onPauseAfter();
    }

    var currentStackObj = this._getCurrentStack();
    if (currentStackObj) {
      currentStackObj.scene.onResumeAfter();
    }
  },

  _onTransitionBackEnd: function(){
    var prevStackObj = this._getPrevStack();
    if (prevStackObj) {
      prevStackObj.scene.onResumeAfter();
    }

    var currentStackObj = this._getCurrentStack();
    if (currentStackObj) {
      currentStackObj.scene.onPauseAfter();
      currentStackObj.scene.onDestroy();

      this._removeCurrentScene();
    }
  }
});
