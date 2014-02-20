
Navy.Class('LoginPage', Navy.Page, {
  TOKEN_KEY: 'token',

  onCreate: function($super, ev) {
    $super(ev);

    this.findViewById('LoginButton').on('Tap', this._onTapLoginButton.bind(this));

    // すでにtokenが保存されている場合は自動でログインする
    var token = localStorage.getItem(this.TOKEN_KEY);
    if (token) {
      this.findViewById('TokenEdit').setText(token);
      this.findViewById('LoginButton').trigger('Tap');
    }

    this.findViewById('GetTokenButton').on('Tap', function(){
      window.open('https://github.com/settings/applications#personal-access-tokens');
    });
  },

  _onTapLoginButton: function(/* ev */) {
    var token = this.findViewById('TokenEdit').getText().trim();
    if (!token) {
      return;
    }

    GitHubAPI.setToken(token);
    GitHubAPI.login(this._onLogin.bind(this));
  },

  _onLogin: function(err) {
    if (err) {
      console.error('fail login.');
      return;
    }

    // ログインが成功したので、トークンを保存しておく.
    var token = GitHubAPI.getToken();
    localStorage.setItem(this.TOKEN_KEY, token);

    // ユーザを生成してシーン移動する.
    // 先にユーザを作成しておくのは遷移中に通信を走らせて時間を節約させたいので.
    var userName = GitHubAPI.getUserName();
    var user = new User(userName);
    Navy.Root.nextScene('MainScene', {user: user});
  }
});
