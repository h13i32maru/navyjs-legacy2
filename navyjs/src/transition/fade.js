Navy.Class('Navy.Transition.Fade', Navy.Transition.Transition, {
  $static: {
    initAnimationStyle: false
  },

  _beforeView: null,
  _afterView: null,

  initialize: function(beforeView, afterView){
    this._beforeView = beforeView;
    this._afterView = afterView;

    if (!this.$class.initAnimationStyle) {
      this._addAnimationStyle();
      this.$class.initAnimationStyle = true;
    }

    beforeView && beforeView._setRawStyle({webkitAnimation: '0.5s'});
    afterView && afterView._setRawStyle({webkitAnimation: '0.5s', opacity: 0});
  },

  _addAnimationStyle: function(){
    var animIn  = '@-webkit-keyframes fade_in  {100% {opacity: 1}}';
    var animOut = '@-webkit-keyframes fade_out {100% {opacity: 0}}';
    var styleElm = document.createElement('style');
    styleElm.textContent = animIn + animOut;
    document.head.appendChild(styleElm);
  },

  start: function(callback) {
    if (!this._beforeView) {
      this._afterView._setRawStyle({opacity: ''});
      callback && callback();
      return;
    }

    var cb1 = function(){
      this._beforeView.setVisible(false);
      this._beforeView._setRawStyle({webkitAnimationName: ''});
      this._beforeView.removeRawEventListener('webkitAnimationEnd', cb1);

      this._afterView.addRawEventListener('webkitAnimationEnd', cb2);
      this._afterView._setRawStyle({opacity:0, webkitAnimationName: 'fade_in'});
    }.bind(this);

    var cb2 = function(){
      this._afterView.removeRawEventListener('webkitAnimationEnd', cb2);
      this._afterView._setRawStyle({opacity: '', webkitAnimationName: 'none'});
      callback && callback();
    }.bind(this);

    this._beforeView.addRawEventListener('webkitAnimationEnd', cb1);
    this._beforeView._setRawStyle({webkitAnimationName: 'fade_out'});
  },

  back: function(callback) {
    if (!this._beforeView) {
      callback && callback();
      return;
    }

    var cb1 = function(){
      this._afterView.setVisible(false);
      this._afterView.removeRawEventListener('webkitAnimationEnd', cb1);
      this._afterView._setRawStyle({webkitAnimationName: 'none'});

      this._beforeView.addRawEventListener('webkitAnimationEnd', cb2);
      this._beforeView._setRawStyle({opacity: 0, webkitAnimationName: 'fade_in'});
      this._beforeView.setVisible(true);
    }.bind(this);

    var cb2 = function(){
      this._beforeView.removeRawEventListener('webkitAnimationEnd', cb2);
      this._beforeView._setRawStyle({opacity: '', webkitAnimationName: 'none'});
      callback && callback();
    }.bind(this);

    this._afterView.addRawEventListener('webkitAnimationEnd', cb1);
    this._afterView._setRawStyle({webkitAnimationName: 'fade_out'});
  }
});

