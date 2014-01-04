Navy.Class('ProfilePage', Navy.Page, {
  onCreate: function($super, ev) {
    $super(ev);

    Navy.Root.startLoading();
    new User(ev.data.loginName, function(user){
      this._setUser(user);
      Navy.Root.stopLoading();
    }.bind(this));
  },

  _setUser: function(user) {
    this.findViewById('Avatar').setSrc(user.getAvatar(160));
    this.findViewById('LoginName').setText(user.getLoginName());
    this.findViewById('FollowerNum').setText(user.getFollowerNum());
    this.findViewById('FollowingNum').setText(user.getFollowingNum());

    this.findViewById('Repos').setItems(user.getRepos(), function(repo, view){
      console.log(repo);
      view.findViewById('Name').setText(repo.name);
      view.findViewById('Lang').setText(repo.language);
      view.findViewById('StarCount').setText(repo.stargazers_count);
      view.findViewById('WatchCount').setText(repo.watchers_count);
      view.findViewById('Description').setText(repo.description);
    });
    console.log(user.getRepos());

    this.findViewById('FollowerNum').on('Link', function(ev){
      ev.data.type = 'Follower';
      ev.data.user = user;
    });

    this.findViewById('FollowingNum').on('Link', function(ev){
      ev.data.type = 'Following';
      ev.data.user = user;
    });
  }
});
