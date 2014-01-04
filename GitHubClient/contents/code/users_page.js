Navy.Class('UsersPage', Navy.Page, {
  onCreate: function($super, ev) {
    $super(ev);

    var user = ev.data.user;
    this.findViewById('Type').setText(ev.data.type + '@' + user.getLoginName());

    if (ev.data.type === 'Follower') {
      Navy.Root.startLoading();
      user.fetchFollower(this._setUsersList.bind(this));
    } else {
      Navy.Root.startLoading();
      user.fetchFollowing(this._setUsersList.bind(this));
    }
  },

  _setUsersList: function(simpleUsers) {
    this.findViewById('UsersList').setItems(simpleUsers, function(simpleUser, view, index){
      view.findViewById('Avatar').setSrc(simpleUser.avatar_url + '&s=80');
      view.findViewById('Name').setText(simpleUser.login);
      view.on('Link', function(ev){
        ev.data.loginName = simpleUser.login;
      });

      if (index === simpleUsers.length - 1) {
        Navy.Root.stopLoading();
      }
    });
  }
});
