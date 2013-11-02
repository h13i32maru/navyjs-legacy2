/**
 * 次の画面がポップアップして表示される遷移アニメーション.
 * - page in: 次の画面が大きくなりながら表示される.
 * - page out: 現在の画面が小さくなりながら消える.
 *
 * @class Navy.Transition.PopUp
 */
Navy.Class('Navy.Transition.PopUp', Navy.Transition.Transition, {
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

    afterView && afterView._setRawStyle({webkitAnimation: '0.5s', webkitTransform: 'scale(0)'});
  },

  _addAnimationStyle: function(){
    var animIn  = '@-webkit-keyframes pop_up_in  {100% {-webkit-transform: scale(1)}}';
    var animOut = '@-webkit-keyframes pop_up_out {100% {-webkit-transform: scale(0)}}';
    var styleElm = document.createElement('style');
    styleElm.textContent = animIn + animOut;
    document.head.appendChild(styleElm);
  },

  start: function(callback) {
    if (!this._beforeView) {
      this._afterView._setRawStyle({webkitTransform: ''});
      callback && callback();
      return;
    }

    var cb = function() {
      this._afterView.removeRawEventListener('webkitAnimationEnd', cb);
      this._afterView._setRawStyle({webkitTransform: '', webkitAnimationName: 'none'});
      callback && callback();
    }.bind(this);

    this._afterView.addRawEventListener('webkitAnimationEnd', cb);
    this._afterView._setRawStyle({webkitAnimationName: 'pop_up_in'});
  },

  back: function(callback) {
    if (!this._beforeView) {
      callback && callback();
      return;
    }

    var cb = function() {
      this._afterView.setVisible(false);
      this._beforeView.setVisible(true);
      callback && callback();
    }.bind(this);

    this._afterView.addRawEventListener('webkitAnimationEnd', cb);
    this._afterView._setRawStyle({webkitAnimationName: 'pop_up_out'});
  }
});

