Navy.Class('InstallPage', Navy.Page, {
  onCreate: function($super, ev) {
    if (navigator.userAgent.indexOf('Android') !== -1) {
      this.findViewById('iOS').setVisible(false);
    } else {
      this.findViewById('Android').setVisible(false);
    }
  }
});
