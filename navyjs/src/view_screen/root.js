Navy.Class.instance('Navy.Root', Navy.ViewGroup.ViewGroup, {
  _sceneStack: null,
  _loadingElement: null,
  _loadingCount: 0,

  /**
   * @param $super
   */
  initialize: function($super) {
    $super();

    this._id = '$root';
    this._layout = {
      visible: true,
      sizePolicy: {width: this.SIZE_POLICY_FIXED, height: this.SIZE_POLICY_FIXED},
      size: {width: Navy.Config.app.size.width, height: Navy.Config.app.size.height},
      pos: {x: 0, y: 0}
    };

    this._initDocument();
    this._initLoading();
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
  linkScene: function(id, data) {
    if (id === '$back') {
      this.backScene(data);
    } else {
      this.nextScene(id, data);
    }
  },

  nextScene: function(sceneName, data) {
    this.lockView();
    this._createScene(sceneName, function(scene){
      this._addScene(scene, data);
    }.bind(this));
  },

  backScene: function(data) {
    if (this._sceneStack.length >= 2) {
      this.lockView();
      var prevStackObj = this._getPrevStack();
      prevStackObj.scene.trigger('ResumeBefore', data);

      var currentStackObj = this._getCurrentStack();
      currentStackObj.scene.trigger('PauseBefore');
      currentStackObj.transition.back(this._onTransitionBackEnd.bind(this));
    }
  },

  startLoading: function() {
    if (this._loadingCount === 0) {
      document.body.appendChild(this._loadingElement);
      this._loadingElement.addEventListener('touchstart', this._preventDOMEvent, true);
    }

    this._loadingCount++;
  },

  stopLoading: function() {
    if (this._loadingCount === 0) {
      return;
    }

    this._loadingCount--;
    if (this._loadingCount === 0) {
      document.body.removeChild(this._loadingElement);
      this._loadingElement.removeEventListener('touchstart', this._preventDOMEvent, true);
    }
  },

  _initDocument: function(){
    var title = document.createElement('title');
    title.textContent = Navy.Config.app.name;
    document.head.appendChild(title);

    var link = document.createElement('link');
    link.rel = 'apple-touch-icon';
    link.href = Navy.Config.app.touchIcon;
    document.head.appendChild(link);

    var style = '';
    style += '* {margin:0; padding:0; -webkit-user-select: none; -webkit-user-drag:none; box-sizing: border-box;}';
    style += 'html {width:100%; height:100%}';
    style += 'body {background-color:#000; font-family: {fontFamily}}'.replace('{fontFamily}', Navy.Config.app.fontFamily);

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

  _initLoading: function() {
    var width = Navy.Config.app.size.width;
    var height = Navy.Config.app.size.height;

    var elm = document.createElement('div');
    elm.style.cssText = 'position: absolute; top:0; left:0; background: rgba(0,0,0,0.8)';
    elm.style.width = width + 'px';
    elm.style.height = height + 'px';

    var imgWidth = width * 0.15;
    var img = document.createElement('img');
    img.onload = function() {
      this.style.left = (width/2 -  this.width/ 2) + 'px';
      this.style.top = (height/2 - this.height/2) + 'px';
      this.onload = null;
    };

    // TODO: パスを検討する.
    img.src = 'image/loading.png';
    img.style.position = 'absolute';
    img.width = imgWidth;
    img.style.cssText += '-webkit-animation-name: navy_loading; -webkit-animation-duration: 1s; -webkit-animation-timing-function: linear; -webkit-animation-iteration-count: infinite;';
    elm.appendChild(img);

    this._loadingElement = elm;

    var style = document.createElement('style');
    style.textContent = '@-webkit-keyframes navy_loading { 0% { -webkit-transform: rotate(0deg); }  100% { -webkit-transform: rotate(360deg); }';
    document.head.appendChild(style);
  },

  _createScene: function(sceneName, callback) {
    var layout = this._cloneObject(Navy.Config.scene[sceneName]);
    Navy.Resource.loadScript(layout.classFile, this._onLoadScript.bind(this, layout, callback));
  },

  _onLoadScript: function(layout, callback) {
    var SceneClass = Navy.Resource.getClass(layout.class);
    var scene = new SceneClass(layout, callback);

    // addViewしてしまうとsceneが見えてしまうので遷移アニメーションが開始するまで非表示にしておく.
    scene.setVisible(false);
    this.addView(scene);
  },

  _addScene: function(scene, data) {
    scene.trigger('Create', data);
    scene.trigger('ResumeBefore');

    var currentStackObj = this._getCurrentStack();
    if (currentStackObj) {
      var beforeScene = currentStackObj.scene;
      beforeScene.trigger('PauseBefore');
    }

    // TODO: 組み込みだけじゃんくてカスタムのTransitionにも対応する.
    var TransitionClass = Navy.Resource.getClass(scene.getLayout().extra.transition.class);
    var transition = new TransitionClass(beforeScene, scene);
    this._sceneStack.push({
      scene: scene,
      transition: transition
    });
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
      prevStackObj.scene.trigger('PauseAfter');
    }

    var currentStackObj = this._getCurrentStack();
    if (currentStackObj) {
      currentStackObj.scene.trigger('ResumeAfter');
    }
    this.unlockView();
  },

  _onTransitionBackEnd: function(){
    var prevStackObj = this._getPrevStack();
    if (prevStackObj) {
      prevStackObj.scene.trigger('ResumeAfter');
    }

    var currentStackObj = this._getCurrentStack();
    if (currentStackObj) {
      currentStackObj.scene.trigger('PauseAfter');
      currentStackObj.scene.trigger('Destroy');

      this._removeCurrentScene();
    }
    this.unlockView();
  }
});
