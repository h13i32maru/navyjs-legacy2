var CreatorPage = Navy.Class(Navy.Page, {
  CLASSNAME: 'CreatorPage',

  onCreate: function($super) {
    $super();

    Navy.Resource.loadLayout(this._layout.extra.contentLayoutFile, function(layout){
      for (var i = 0; i < layout.length; i++) {
        Native.addLayer({
          id: layout[i].id,
          class: layout[i].class,
          width: layout[i].size.width,
          height: layout[i].size.height,
          x: layout[i].pos.x,
          y: layout[i].pos.y
        }, layout.length);
      }
    });

    Native.changedLayersToJS.connect(function(layerIds){
      for (var i = 0; i < layerIds.length; i++) {
        var id = layerIds[i];
        var view = this._views[id];
        this.removeView(view);
        this.addView(view);
      }
    }.bind(this));
  }

});
