Navy.Class('MainScene', Navy.Scene, {
  onCreate: function($super, ev) {
    $super(ev);

    var user = new User(ev.data.loginName, function(){
      this.findViewById('Avatar').setSrc(user.getAvatar(60));
      this.findViewById('Name').setText(user.getLoginName());
    }.bind(this));
  },

  onResumeBefore: function($super, ev) {
    if (ev.data && ev.data.loginName) {
      this.nextPage('ProfilePage', {loginName: ev.data.loginName});
    }
  }
});
