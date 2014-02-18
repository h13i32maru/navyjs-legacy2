Navy.Class('LoginPage', Navy.Page, {
  _token: null,

  onCreate: function($super, ev) {
    $super(ev);

    var token = localStorage.getItem('token');
    var loginName = localStorage.getItem('loginName');
    if (token && loginName) {
      Navy.Root.startLoading();
      User.isValidToken(token, function(){
        Navy.Root.stopLoading();
        User.token = token;
        Navy.Root.nextScene('MainScene', {loginName: loginName});
      }, function(){
        this.findViewById('FailLogin').setVisible(true);
        this.findViewById('FailLogin').setText('Invalid Access Token');
        Navy.Root.stopLoading();
      }.bind(this));
    }

    this.findViewById('LoginButton').on('Link', this._onLogin.bind(this));
  },

  _onLogin: function(ev) {
    Navy.Root.startLoading();
    ev.preventDefault();

    var loginName = this.findViewById('LoginName').getText();
    var password = this.findViewById('Password').getText();
    var callback = function(id, token) {
      localStorage.setItem('token', token);
      localStorage.setItem('id', id);
      localStorage.setItem('loginName', loginName);
      Navy.Root.nextScene('MainScene', {loginName: loginName});
      Navy.Root.stopLoading();
    };
    var errorCallback = function() {
      Navy.Root.stopLoading();
      this.findViewById('FailLogin').setVisible(true);
      this.findViewById('FailLogin').setText('Fail Login');
    }.bind(this);
    User.login(loginName, password, callback, errorCallback);
  }
});

/**
 * @class User
 */
Navy.Class('User', {
  $static: {
    token: null,
    id: null,
    loginName: null,

    login: function(loginName, password, callback, failCallback) {
      var url = 'https://api.github.com/authorizations';
      var data = {
        note: 'NavyJS GitHub Client',
        scopes: ['user', 'public_repo']
      };
      var xhr = new XMLHttpRequest();
      xhr.open('POST', url , true);
      xhr.onload = function() {
        var res = JSON.parse(xhr.responseText);
        if (res.token) {
          this.token = res.token;
          this.id = res.id;
          callback && callback(this.id, this.token);
        } else {
          failCallback && failCallback();
        }
      }.bind(this);
      xhr.setRequestHeader('Authorization', "Basic " + btoa(loginName + ':' + password));
      xhr.send(JSON.stringify(data));
    },

    isValidToken: function(token, callback, errorCallback) {
      var url = 'https://api.github.com/user';
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.onload = function(ev){
        if (ev.target.status === 200) {
          callback && callback();
        } else {
          errorCallback && errorCallback();
        }
      };
      xhr.setRequestHeader('Authorization', 'token ' + token);
      xhr.send();
    }
  },

  _token: null,
  _userData: null,
  _reposData: null,

  initialize: function(loginName, callback) {
    if (loginName) {
      this._userDataURL = 'https://api.github.com/users/' + loginName;
      this._reposDataURL = 'https://api.github.com/users/' + loginName + '/repos';
      this._followerURL = 'https://api.github.com/users/' + loginName + '/followers';
      this._followingURL = 'https://api.github.com/users/' + loginName + '/following';
    } else {
      this._userDataURL = 'https://api.github.com/user';
      this._reposDataURL = 'https://api.github.com/user/repos';
      this._followerURL = 'https://api.github.com/user/followers';
      this._followingURL = 'https://api.github.com/user/following';
    }

    var notify = new Navy.Notify(2, function(){
      callback && callback(this);
    }.bind(this));

    this._fetchUser(notify.pass.bind(notify));
    this._fetchRepos(notify.pass.bind(notify));
  },

  _fetch: function(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = callback;
    xhr.setRequestHeader('Authorization', 'token ' + this.$class.token);
    xhr.send();
  },

  _fetchUser: function(callback) {
    var cb = function(ev) {
      this._userData = JSON.parse(ev.target.responseText);
      callback && callback();
    }.bind(this);

    this._fetch(this._userDataURL, cb);
  },

  _fetchRepos: function(callback) {
    var cb = function(ev) {
      this._reposData = JSON.parse(ev.target.responseText);
      callback && callback();
    }.bind(this);

    this._fetch(this._reposDataURL, cb);
  },

  fetchFollower: function(callback) {
    var cb = function(ev) {
      var simpleUsers = JSON.parse(ev.target.responseText);
      callback && callback(simpleUsers);
    };

    this._fetch(this._followerURL, cb);
  },

  fetchFollowing: function(callback) {
    var cb = function(ev) {
      var simpleUsers = JSON.parse(ev.target.responseText);
      callback && callback(simpleUsers);
    };

    this._fetch(this._followingURL, cb);
  },

  getLoginName: function(){
    return this._userData.login;
  },

  getFollowingNum: function() {
    return this._userData.following;
  },

  getFollowerNum: function() {
    return this._userData.followers;
  },

  getAvatar: function(size) {
    return this._userData.avatar_url + '&s=' + size;
  },

  getRepos: function() {
    return [].concat(this._reposData);
  }
});

/**
 * @typedef {Object} SearchRepoAPI
 */
Navy.Class.instance('SearchRepoAPI', {
  search: function(keyword, callback) {
    var url = 'https://api.github.com/search/repositories?q=' + keyword;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function(ev) {
      var data = JSON.parse(ev.target.responseText);
      callback && callback(data.items);
    };
    xhr.setRequestHeader('Authorization', 'token ' + User.token);
    xhr.send();
  }
});
