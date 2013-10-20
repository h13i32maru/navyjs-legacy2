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
      this._callback();
    }
  },

  set: function(count, callback) {
    if (count === 0) {
      callback();
    } else {
      this._count = count;
      this._callback = callback;
    }
  }
});
