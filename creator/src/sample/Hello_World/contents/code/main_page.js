Navy.Class('MainPage', Navy.Page, {
  _count: 0,

  onCreate: function($super, ev) {
    $super(ev);

    var buttonView = this.findViewById('TapButton');
    buttonView.on('Tap', function(){
      this._count++;
      var countView = this.findViewById('Count');
      countView.setText(this._count);
    }.bind(this));
  }
});
