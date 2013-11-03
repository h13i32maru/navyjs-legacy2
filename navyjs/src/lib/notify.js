/**
 * @class Navy.Notify
 */
Navy.Class('Navy.Notify', {
  _count: null,
  _callback: null,

  initialize: function(count, callback) {
    if (arguments.length === 2) {
      this.set(count, callback);
    }
  },

  pass: function(){
    this._count--;

    if (this._count === 0) {
      this._execCallback();
    }
  },

  set: function(count, callback) {
    this._count = count;
    this._callback = callback;

    if (count === 0) {
      this._execCallback();
    }
  },

  _execCallback: function(){
    setTimeout(this._callback, 0);
  }
});
