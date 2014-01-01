/**
 * @class Navy.Event
 */
Navy.Class('Navy.Event', {
  target: null,
  data: null,

  _defaultCallbacks: null,
  _preventedDefault: false,
  _preventedPropagation: false,

  initialize: function(eventTarget, data) {
    this.target = eventTarget;
    this.data = data;
    this._defaultCallbacks = [];
  },

  addDefaultCallback: function(callback) {
    this._defaultCallbacks.push(callback);
  },

  getDefaultCallbacks: function() {
    return [].concat(this._defaultCallbacks);
  },

  preventDefault: function() {
    this._preventedDefault = true;
  },

  isPreventedDefault: function() {
    return this._preventedDefault;
  },

  preventPropagation: function() {
    this._preventedPropagation = true;
  },

  isPreventedPropagation: function() {
    return this._preventedPropagation;
  }
});
