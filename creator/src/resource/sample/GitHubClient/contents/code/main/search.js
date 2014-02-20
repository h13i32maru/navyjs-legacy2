Navy.Class('SearchPage', Navy.Page, {
  onCreate: function($super, ev) {
    $super(ev);

    // TODO: enterイベントを実装する
    this.findViewById('SearchEdit').getElement().addEventListener('keydown', function(domEv){
      if (domEv.keyIdentifier === 'Enter' || domEv.keyCode === 13) {
        domEv.target.blur();
        this._Search();
      }
    }.bind(this));
  },

  onResumeBefore: function($super, ev) {
    $super(ev);

    this.getScene().findViewById('Search').setVisible(false);
  },

  onPauseAfter: function($super, ev) {
    $super(ev);

    this.getScene().findViewById('Search').setVisible(true);
  },

  _Search: function() {
    var keyword = this.findViewById('SearchEdit').getText();
    if (!keyword) {
      return;
    }

    SearchAPI.search(keyword, this._onSearch.bind(this));
  },

  _onSearch: function() {
    Navy.Root.startLoading();

    var notify = new Navy.Notify(2, Navy.Root.stopLoading.bind(Navy.Root));
    var pass = notify.pass.bind(notify);
    var onTapUser = this._onTapUser.bind(this);

    // repository
    var reposListView = this.findViewById('Repo.ListView');
    var repos = SearchAPI.repos.items;
    reposListView.setItems(repos, function(repo, viewGroup){
      viewGroup.findViewById('RepoName').setText(repo.name);
      viewGroup.findViewById('Name').setText(repo.owner.login);
      viewGroup.findViewById('Description').setText(repo.description);
      viewGroup.findViewById('Lang').setText(repo.language);
      viewGroup.findViewById('Fork').setText(repo.forks_count);
      viewGroup.findViewById('Star').setText(repo.stargazers_count);
      viewGroup.on('Tap', onTapUser);
    }.bind(this), pass);

    // user
    var userListView = this.findViewById('User.ListView');
    var userData = SearchAPI.userData.items;
    userListView.setItems(userData, function(userData, viewGroup){
      if (userData.gravatar_id) {
        console.log(userData.gravatar_id);
        viewGroup.findViewById('Icon').setSrc(userData.avatar_url + '&s=80');
      }
      viewGroup.findViewById('Name').setText(userData.login);
      viewGroup.on('Tap', onTapUser);
    }, pass);
  },

  _onTapUser: function(ev) {
    var viewGroup = ev.target;
    var userName = viewGroup.findViewById('Name').getText();
    var scene = ev.target.getScene();
    var user = new User(userName);
    scene.nextPage('ProfilePage', {user: user});
  }
});
