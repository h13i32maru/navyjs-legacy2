/**
 * @class Navy.Transition.TurnOver
 */
Navy.Class('Navy.Transition.TurnOver', Navy.Transition.Transition, {
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

    beforeView._setRawStyle({webkitAnimation: '0.25s', webkitAnimationTimingFunction: 'linear', webkitTransform: 'rotateY(0)'});
    afterView._setRawStyle({webkitAnimation: '0.25s', webkitAnimationTimingFunction: 'linear',webkitTransform: 'rotateY(-90deg)'});
  },

  _addAnimationStyle: function(){
    var animIn  = '\
      @-webkit-keyframes turn_over_in_before_view {100% {-webkit-transform: rotateY(90deg)} }\
      @-webkit-keyframes turn_over_in_after_view {100% {-webkit-transform: rotateY(0)} }';

    var animOut = '\
      @-webkit-keyframes turn_over_out_before_view {100% {-webkit-transform: rotateY(0)} }\
      @-webkit-keyframes turn_over_out_after_view {100% {-webkit-transform: rotateY(-90deg)} }';

    var styleElm = document.createElement('style');
    styleElm.textContent = animIn + animOut;
    document.head.appendChild(styleElm);
  },

  start: function(callback) {
    if (!this._beforeView) {
      this._afterView._setRawStyle({webkitTransform: 'none'});
      callback && callback();
      return;
    }

    var cb1 = function(){
      this._beforeView.setVisible(false);
      this._beforeView.removeRawEventListener('webkitAnimationEnd', cb1);
      this._beforeView._setRawStyle({webkitTransform: 'none', webkitAnimationName: 'none'});

      this._afterView.setVisible(true);
      this._afterView.addRawEventListener('webkitAnimationEnd', cb2);
      this._afterView._setRawStyle({webkitAnimationName: 'turn_over_in_after_view'});
    }.bind(this);

    var cb2 = function(){
      this._afterView.removeRawEventListener('webkitAnimationEnd', cb2);
      this._afterView._setRawStyle({webkitTransform: 'none', webkitAnimationName: 'none'});
      callback && callback();
    }.bind(this);

    this._afterView.setVisible(false);
    this._beforeView.addRawEventListener('webkitAnimationEnd', cb1);
    this._beforeView._setRawStyle({webkitAnimationName: 'turn_over_in_before_view'});
  },

  back: function(callback) {
    if (!this._beforeView) {
      callback && callback();
      return;
    }

    var cb1 = function(){
      this._afterView.setVisible(false);
      this._afterView.removeRawEventListener('webkitAnimationEnd', cb1);
      this._afterView._setRawStyle({webkitTransform: 'none', webkitAnimationName: 'none'});

      this._beforeView._setRawStyle({webkitAnimation: '0.25s', webkitAnimationTimingFunction: 'linear', webkitTransform: 'rotateY(90deg)'});
      this._beforeView.setVisible(true);
      this._beforeView.addRawEventListener('webkitAnimationEnd', cb2);
      this._beforeView._setRawStyle({webkitAnimationName: 'turn_over_out_before_view'});
    }.bind(this);

    var cb2 = function(){
      this._beforeView.removeRawEventListener('webkitAnimationEnd', cb2);
      this._beforeView._setRawStyle({webkitTransform: 'none', webkitAnimationName: 'none'});
      callback && callback();
    }.bind(this);

    this._afterView.addRawEventListener('webkitAnimationEnd', cb1);
    this._afterView._setRawStyle({webkitAnimation: '0.25s', webkitAnimationTimingFunction: 'linear', webkitTransform: 'rotateY(0)'});
    this._afterView._setRawStyle({webkitAnimationName: 'turn_over_out_after_view'});
  }
});
