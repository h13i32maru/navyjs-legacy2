/**
 * @class Navy.Gesture.Tap
 */
Navy.Class('Navy.Gesture.Tap', Navy.Gesture.Gesture, {
  TAP_ALLOW_DISTANCE: 350,
  _trigger: false,
  _startX: null,
  _startY: null,

  initialize: function($super, element, callback) {
    $super(element, callback);

    this._touchstart = this._touchstart.bind(this);
    this._touchmove = this._touchmove.bind(this);
    this._touchend = this._touchend.bind(this);
  },

  /**
   * @param {function} [$super]
   */
  start: function($super) {
    $super();
    this._element.addEventListener('touchstart', this._touchstart);
  },

  /**
   * @param {function} [$super]
   */
  stop: function($super) {
    $super();
    this._element.removeEventListener('touchstart', this._touchstart);
  },

  _touchstart: function(ev) {
    if (ev.touches.length > 1) {
      return;
    }

    this._trigger = true;
    this._startX = ev.changedTouches[0].clientX;
    this._startY = ev.changedTouches[0].clientY;

    this._element.addEventListener('touchmove', this._touchmove);
    this._element.addEventListener('touchend', this._touchend);
  },

  _touchmove: function(ev) {
    this._judgeTapAllowDistance(ev);
  },

  _touchend: function(ev) {
    this._element.removeEventListener('touchmove', this._touchmove);
    this._element.removeEventListener('touchend', this._touchend);

    this._judgeTapAllowDistance(ev);

    this._trigger && this._callback(ev);
  },

  _judgeTapAllowDistance: function(ev) {
    var x0 = this._startX;
    var y0 = this._startY;
    var x1 = ev.changedTouches[0].clientX;
    var y1 = ev.changedTouches[0].clientY;

    var delta = Math.pow(Math.abs(x0 - x1), 2) + Math.pow(Math.abs(y0 - y1), 2);
    if (delta >= this.TAP_ALLOW_DISTANCE) {
      this._trigger = false;
    }
  }
});
