/**
 * @class GitHubAPI
 */
Navy.Class.instance('GitHubAPI', {
  LOGIN_URL: 'https://api.github.com/user',

  _token: null,
  _userData: null,

  initialize: function() {
  },

  setToken: function(token) {
    this._token = token
  },

  getToken: function() {
    return this._token;
  },

  login: function(callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', this.LOGIN_URL, true);
    xhr.onload = function(ev){
      if (ev.target.status === 200) {
        this._userData = JSON.parse(ev.target.responseText);
        callback && callback();
      } else {
        callback && callback('error');
      }
    }.bind(this);
    xhr.setRequestHeader('Authorization', 'token ' + this._token);
    xhr.send();
  },

  getUserName: function(){
    if (this._userData) {
      return this._userData.login;
    } else {
      return null;
    }
  },

  fetch: function(url, callback) {
    // 本当はここでView関連を触りたいくないので何か考える.
    Navy.Root.startLoading();

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = this._onFetch.bind(this, callback);
    xhr.setRequestHeader('Authorization', 'token ' + this._token);
    xhr.send();
  },

  _onFetch: function(callback, domEv) {
    var xhr = domEv.target;
    if (xhr.status === 200) {
      var data = JSON.parse(xhr.responseText);
      callback && callback('', data);
    } else {
      callback && callback('error');
    }

    Navy.Root.stopLoading();
  }
});
