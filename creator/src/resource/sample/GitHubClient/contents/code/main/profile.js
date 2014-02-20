Navy.Class('ProfilePage', Navy.Page, {
  _user: null,
  _icon: '',

  onCreate: function($super, ev) {
    $super(ev);

    this._user = ev.data.user;
    this._user.addPrimaryCallback(this._onPrimary.bind(this));

    /*
     * eventタブ以外(0番目以外)にタブが変わった時に初めて追加データを取得する.
     * こうすることで遷移時の通信量を減らして快適にする.
     */
    var id = this.findViewById('Tab').on('ChangedTab', function(ev){
      var tab = ev.target;
      if (tab.getCurrentTabIndex() !== 0) {
        this._user.fetchSecondary();
        this._user.addSecondaryCallback(this._onSecondary.bind(this));
        tab.off('ChangedTab', id);
      }
    }.bind(this));
  },

  onResumeBefore: function($super, ev) {
    $super(ev);

    // ヘッダーのユーザ名を設定する
    var scene = this.getScene();
    scene.findViewById('UserName').setText(this._user.getUserName());

    // ヘッダーのアイコンを設定する. ただしまだiconの取得できていない場合があるのでそれを考慮する.
    if (this._icon) {
      this.getScene().findViewById('Icon').setSrc(this._icon);
    }
  },

  onPauseBefore: function($super, ev) {
    $super(ev);

    // このページが表示になるときにヘッダのアイコンもデフォルト画像に戻しておく.
    this.getScene().findViewById('Icon').setSrc('image/icon_mini.png');
  },

  _onPrimary: function() {
    Navy.Root.startLoading();

    // icon
    this._icon = this._user.getIcon();
    this.getScene().findViewById('Icon').setSrc(this._icon);

    var isSelf = this._user.isSelf();
    var onTapUser = this._onTapUser.bind(this);

    // event
    var eventsListView = this.findViewById('Event.ListView');
    var events = this._user.events;
    eventsListView.setItems(events, function(event, viewGroup) {
      var typeToMessage = {
        ForkEvent: 'forked repository',
        WatchEvent: 'starred',
        CreateEvent: 'created repository'
      };

      viewGroup.findViewById('Name').setText(event.actor.login);
      viewGroup.findViewById('Text').setText(User.createEventText(event));
      viewGroup.findViewById('Time').setText(new Date(event.created_at).toString());
      viewGroup.findViewById('Icon').setSrc(event.actor.avatar_url + '&s=80');

      if (isSelf) {
        viewGroup.on('Tap', onTapUser);
      }
    }.bind(this), Navy.Root.stopLoading.bind(Navy.Root));
  },

  _onSecondary: function() {
    Navy.Root.startLoading();

    var notify = new Navy.Notify(3, Navy.Root.stopLoading.bind(Navy.Root));
    var pass = notify.pass.bind(notify);
    var onTapUser = this._onTapUser.bind(this);

    // repository
    var repositoryListView = this.findViewById('Repository.ListView');
    var repos = this._user.repos;
    repositoryListView.setItems(repos, function(repo, viewGroup){
      viewGroup.findViewById('Name').setText(repo.name);
      viewGroup.findViewById('Description').setText(repo.description);
      viewGroup.findViewById('Lang').setText(repo.language);
      viewGroup.findViewById('Fork').setText(repo.forks_count);
      viewGroup.findViewById('Star').setText(repo.stargazers_count);
    }, pass);

    // follower
    var followerListView = this.findViewById('Follower.ListView');
    var followers = this._user.followers;
    followerListView.setItems(followers, function(follower, viewGroup){
      viewGroup.findViewById('Icon').setSrc(follower.avatar_url + '&s=80');
      viewGroup.findViewById('Name').setText(follower.login);
      viewGroup.on('Tap', onTapUser);
    }, pass);

    // following
    var followingListView = this.findViewById('Following.ListView');
    var followings = this._user.following;
    followingListView.setItems(followings, function(following, viewGroup){
      viewGroup.findViewById('Icon').setSrc(following.avatar_url + '&=80');
      viewGroup.findViewById('Name').setText(following.login);
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
