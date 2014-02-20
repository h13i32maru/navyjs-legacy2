/**
 * @class User
 */
Navy.Class('User', {
  $static: {
    createEventText: function(event) {
      var text;
      switch (event.type) {
      case 'ForkEvent':
        text = event.actor.login + ' forked repository ' + event.repo.name;
        break;
      case 'WatchEvent':
        text = event.actor.login + ' starred ' + event.repo.name;
        break;
      case 'CreateEvent':
        text = event.actor.login + ' created repository ' + event.repo.name;
        break;
      case 'IssueCommentEvent':
        if (event.payload.issue.pull_request.html_url) {
          text = event.actor.login + ' commented on pull request ' + event.payload.issue.number + ' on ' + event.repo.name;
        } else {
          text = event.actor.login + ' commented on issue ' + event.payload.issue.number + ' on ' + event.repo.name;
        }
        break;
      case 'PullRequestEvent':
        text = event.actor.login + ' ' + event.payload.action + ' pull request ' + event.payload.number + ' on ' + event.repo.name;
        break;
      case 'IssuesEvent':
        text = event.actor.login + ' ' + event.payload.action + ' issue ' + event.payload.issue.number + ' on ' + event.repo.name;
        break;
      case 'PushEvent':
        text = event.actor.login + ' pushed to ' + event.payload.ref + ' at ' + event.repo.name;
        break;
      case 'MemberEvent':
        text = event.actor.login + ' ' + event.payload.action + ' ' + event.payload.member.login + ' as a collaborator to ' + event.repo.name;
        break;
      case 'FollowEvent':
        text = event.actor.login + ' started following ' + event.payload.target.login;
        break;
      case 'PublicEvent':
        text = event.actor.login + ' open sourced repository ' + event.repo.name;
        break;
      case 'DeleteEvent':
        text = event.actor.login + ' deleted branch ' + event.payload.ref + ' at ' + event.repo.name;
        break;
      case 'CommitCommentEvent':
        text = event.actor.login + ' commented on ' + event.repo.name;
        break;
      case 'GollumEvent':
        text = event.actor.login + ' updated the wiki in ' + event.repo.name;
        break;
      case 'ReleaseEvent':
        text = event.actor.login + ' created tag ' + event.payload.release.tag_name + ' at ' + event.repo.name;
        break;
      case 'PullRequestReviewCommentEvent':
        text = event.actor.login + ' commented on ' + event.repo.name;
        break;
      case 'GistEvent':
        text = event.actor.login + ' ' + event.payload.action + ' Gist ' + event.payload.gist.id;
        break;
      default:
        text = 'sorry unknown news.';
        break;
      }

      return text;
    }
  },

  URL: 'https://api.github.com/users/',

  userData: null,
  repos: null,
  followers: null,
  following: null,
  events: null,

  _userName: '',
  _self: false,

  _donePrimary: false,
  _primaryCallbacks: null,

  _doneSecondary: false,
  _secondaryCallbacks: null,

  initialize: function(userName) {
    this._userName = userName;
    this._self = (userName === GitHubAPI.getUserName());
    this._primaryCallbacks = [];
    this._secondaryCallbacks = [];

    this.fetchPrimary();
  },

  getUserName: function() {
    return this._userName;
  },

  getIcon: function(size) {
    size = size || '80';
    return this.userData.avatar_url + '&s=' + size;
  },

  isSelf: function() {
    return this._self;
  },

  fetchPrimary: function() {
    if (this._donePrimary) {
      return;
    }

    var notify = new Navy.Notify(2, this._onDonePrimary.bind(this));
    var pass = notify.pass.bind(notify);
    this._fetch('', 'userData', pass);
    if (this._self) {
      this._fetch('/received_events', 'events', pass);
    } else {
      this._fetch('/events', 'events', pass);
    }
  },

  addPrimaryCallback: function(callback) {
    if (this._donePrimary) {
      setTimeout(callback, 0);
    } else {
      this._primaryCallbacks.push(callback);
    }
  },

  fetchSecondary: function() {
    if (this._doneSecondary) {
      return;
    }

    var notify = new Navy.Notify(3, this._onDoneSecondary.bind(this));
    var pass = notify.pass.bind(notify);

    this._fetch('/repos', 'repos', pass);
    this._fetch('/followers', 'followers', pass);
    this._fetch('/following', 'following', pass);
  },

  addSecondaryCallback: function(callback) {
    if (this._doneSecondary) {
      setTimeout(callback, 0);
    } else {
      this._secondaryCallbacks.push(callback);
    }
  },

  _onDonePrimary: function() {
    this._donePrimary = true;

    for (var i = 0; i < this._primaryCallbacks.length; i++) {
      this._primaryCallbacks[i]();
    }
  },

  _onDoneSecondary: function() {
    this._doneSecondary = true;

    for (var i = 0; i < this._secondaryCallbacks.length; i++) {
      this._secondaryCallbacks[i]();
    }
  },

  _fetch: function(suffix, propName, callback) {
    var url = this.URL + this._userName + suffix;
    GitHubAPI.fetch(url, function(err, data){
      if (err) {
        console.error('fail fetching.', url);
      } else {
        this[propName] = data;
        callback && callback();
      }
    }.bind(this));
  }
});
