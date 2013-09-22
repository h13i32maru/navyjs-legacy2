var CreatorPage = Navy.Class(Navy.Page, {
  CLASSNAME: 'CreatorPage',

  _selectedBox: null,
  _selectedView: null,

  onCreate: function($super) {
    document.body.style.background = '#666';

    window.CreatorPageInstance = this;
    $super();

    this._selectedBox = document.createElement('div');
    this._selectedBox.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; border:solid 1px red; background-color: rgba(0,0,0,0.3)';

    Navy.Resource.loadLayout(this._layout.extra.contentLayoutFile, function(layout){
      Native.setViewsFromJS(JSON.stringify(layout));
    });

    Native.changedViewsOrderToJS.connect(function(viewIds){
      for (var i = 0; i < viewIds.length; i++) {
        var id = viewIds[i];
        var view = this._views[id];
        this.removeView(view);
        this.addView(view);
      }
    }.bind(this));

    Native.changedSelectedViewToJS.connect(function(viewId){
      var parentNode = this._selectedBox.parentNode;
      if (parentNode) {
        parentNode.removeChild(this._selectedBox);
      }

      var view = this._views[viewId];
      var elm = view.getElement();
      elm.appendChild(this._selectedBox);
      this._selectedView = view;

      Native.setCurrentViewFromJS(JSON.stringify(view._layout));
    }.bind(this));

    Native.changedViewPropertyToJS.connect(function(layout){
      if (!this._selectedView) {
        return;
      }

      this._selectedView.setLayout(layout);
    }.bind(this));
  }
});

/**
 * @typedef {{
 *   setViewsFromJS: function,
 *   setCurrentViewFromJS: function,
 *   changedViewsOrderToJS: {connect: function},
 *   changedSelectedViewToJS: {connect: function},
 *   changedViewPropertyToJS: {connect: function}
 * }}
 */
Native;
