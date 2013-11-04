Navy.Class('Navy.View.Image', Navy.View.View, {
  _imgElm: null,

  initialize: function($super, layout, callback) {
    $super(layout, callback);
  },

  _createExtraElement: function($super, layout) {
    $super(layout);

    var imgElm = document.createElement('img');
    this._element.appendChild(imgElm);
    this._imgElm = imgElm;
  },

  _applyExtraLayout: function($super, layout, callback) {
    $super(layout, callback);
  },

  _loadExtraResource: function($super, layout, callback) {
    if (layout && layout.extra.src) {
      this.setSrc(layout.extra.src, function(){
        $super(layout, callback);
      });
    } else {
      $super(layout, callback);
    }
  },

  _calcWrapContentSize: function() {
    return {
      width: this._imgElm.width,
      height: this._imgElm.height
    };
  },

  _onLoadImage: function(src, width, height){
    this._imgElm.src = src;
    this.trigger('sizeChanged', this, null);
  },

  setSrc: function(src, callback) {
    this._layout.extra.src = src;
    Navy.Resource.loadImage(src, function(src, width, height){
      this._onLoadImage(src, width, height);
      callback && callback();
    }.bind(this));
  },

  getSrc: function() {
    return this._layout.src;
  }
});
