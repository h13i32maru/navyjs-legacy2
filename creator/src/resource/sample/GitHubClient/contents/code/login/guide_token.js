Navy.Class('GuideTokenPage', Navy.Page, {
  onCreate: function($super, ev) {
    $super(ev);

    /*
     * ios: mobile-app化した状態でsafariでURLを開くにはaタグ(_blank)で開くしかない.
     * window.open()だとmobile-appの中で開いてしまう.
     * androidではwindow.openでも外部ブラウザで開いてくれる.
     */
    var view = this.findViewById('Go');
    var elm = view.getElement();
    var a = document.createElement('a');
    a.href = 'https://github.com/settings/applications#personal-access-tokens';
    a.target = '_blank';
    a.style.cssText = 'position:absolute; width:100%; height:100%';
    elm.appendChild(a);
  }
});
