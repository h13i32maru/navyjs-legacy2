Navy.Class('SearchRepoScene', Navy.Scene, {
  onCreate: function($super, ev) {
    $super(ev);

    var search = this.findViewById('Search');
    var gesture = new Navy.Gesture.Tap(search.getElement(), this._onTapSearch.bind(this));
    gesture.start();
  },

  _onTapSearch: function() {
    var text = this.findViewById('SearchText').getText();
    if (!text) {
      return;
    }
    Navy.Root.startLoading();
    SearchRepoAPI.search(text, this._onSearch.bind(this));
  },

  _onSearch: function(repos) {
    this.findViewById('Repos').setItems(repos, function(repo, view, index){
      view.findViewById('Name').setText(repo.name);
      view.on('Link', function(ev){
        ev.data.loginName = repo.owner.login;
      });

      if (repos.length - 1 === index) {
        Navy.Root.stopLoading();
      }
    });
    console.log(repos);
  }
});
