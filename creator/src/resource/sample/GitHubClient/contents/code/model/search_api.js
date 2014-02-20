/**
 * @typedef {Object} SearchAPI
 */
Navy.Class.instance('SearchAPI', {
  URL: 'https://api.github.com/search/',

  userData: null,
  repos: null,

  search: function(keyword, callback) {
    var notify = new Navy.Notify(2, callback);
    var pass = notify.pass.bind(notify);

    this._fetch('repositories?q=' + keyword, 'repos', pass);
    this._fetch('users?q=' + keyword, 'userData', pass);
  },

  _fetch: function(suffix, propName, callback) {
    var url = this.URL + suffix;
    GitHubAPI.fetch(url, function(error, data){
      if (!error) {
        this[propName] = data;
        callback && callback();
      } else {
        console.error('fail fetching.', url);
      }
    }.bind(this));
  }
});
