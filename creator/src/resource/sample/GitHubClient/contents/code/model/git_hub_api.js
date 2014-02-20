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
    this.fetch(this.LOGIN_URL, function(error, data){
      if (error) {
        console.error('fail login.');
        callback && callback(error);
      } else {
        this._userData = data;
        callback && callback();
      }
    }.bind(this));
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
