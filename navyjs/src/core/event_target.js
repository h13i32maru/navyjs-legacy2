/**
 * @class Navy.EventTarget
 */
Navy.Class('Navy.EventTarget', {
  _eventCallbackMap: null,
  _eventCallbackId: 0,

  initialize: function(){
    this._eventCallbackMap = {};
  },

  on: function(eventName, callback) {
    if (!this._eventCallbackMap[eventName]) {
      this._eventCallbackMap[eventName] = [];
    }

    var eventCallbackId = this._eventCallbackId++;
    this._eventCallbackMap[eventName].push({
      callbackId: eventCallbackId,
      callback: callback
    });

    return eventCallbackId;
  },

  off: function(eventName, callbackOrId) {
    var eventCallbacks = this._eventCallbackMap[eventName];
    if (!eventCallbacks) {
      return;
    }

    if (typeof callbackOrId === 'function') {
      var callback = callbackOrId;
      for (var i = 0; i < eventCallbacks.length; i++) {
        if (callback === eventCallbacks[i].callback) {
          eventCallbacks.splice(i, 1);
          i--;
        }
      }
    } else {
      var callbackId = callbackOrId;
      for (var i = 0; i < eventCallbacks.length; i++) {
        if (callbackId === eventCallbacks[i].callbackId) {
          eventCallbacks.splice(i, 1);
          return;
        }
      }
    }
  },

  trigger: function(eventName, event, defaultCallback) {
    if (!event) {
      event = new Navy.Event(this);
    }

    var onEventName = 'on' + eventName;
    if (this[onEventName] && typeof this[onEventName] === 'function') {
      this[onEventName](event);
    }

    var eventCallbacks = this._eventCallbackMap[eventName];
    if (eventCallbacks) {
      for (var i = 0; i < eventCallbacks.length; i++) {
        if (event.isPreventedPropagation()) {
          break;
        }

        var callback = eventCallbacks[i].callback;
        callback.call(this, event);
      }
    }

    if (!event.isPreventedDefault()) {
      defaultCallback && defaultCallback.call(this, event);

      var defaultCallbacks = event.getDefaultCallbacks();
      for (var i = 0; i < defaultCallbacks.length; i++) {
        defaultCallbacks[i].call(this, event);
      }
    }
  }
});
