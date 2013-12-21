Navy.Class('Navy.ViewGroup.ListView', Navy.ViewGroup.ViewGroup, {
  initialize: function($super, layout, callback) {
    $super(layout, callback);
  },

  _applyExtraLayout: function($super, layout, callback) {
    $super(layout, callback);

    this._element.style.overflow = 'scroll';
  },

  setItems: function(items) {
    var notify = new Navy.Notify(items.length, function(){
      var margin = this._layout.extra.itemLayoutMargin + 'px';
      for (var i = 0; i < items.length; i++) {
        var viewId = this._viewsOrder[i];
        var view = this.findViewById(viewId);
        view.getElement().style.position = 'relative';
        view.getElement().style.marginBottom = margin;
        view.setVisible(true);
      }
    }.bind(this));
    var pass = notify.pass.bind(notify);

    for (var i = 0; i < items.length; i++) {
      var layout = {
        id: 'item' + i,
        visible: false,
        sizePolicy: {width: 'wrapContent', height: 'wrapContent'},
        pos: {x: 0, y:0},
        extra: {
          contentLayoutFile: this._layout.extra.itemLayoutFile
        }
      };

      var viewGroup = new Navy.ViewGroup.ViewGroup(layout, pass);
      this.addView(viewGroup);
    }
  }
});
