/**
 * @class Navy.ViewGroup.Button
 */
Navy.Class('Navy.ViewGroup.Button', Navy.ViewGroup.ViewGroup, {
  _imageView: null,
  _textView: null,

  initialize: function($super, layout, callback) {
    $super(layout, callback);
  },

  _createExtraElement: function($super, layout) {
    $super(layout);
  },

  _applyExtraLayout: function($super, layout) {
    $super(layout);
  },

  _loadExtraResource: function($super, layout, callback) {
    var cb = function() {
      this.addView(this._imageView);
      this.addView(this._textView);
      $super(layout, callback);

      this.getPage().onResumeBefore = function() {
        var imageSize = this._imageView.getSize();
        var textSize = this._textView.getSize();

        var pos = {
          x: imageSize.width / 2 - textSize.width / 2,
          y: imageSize.height / 2 - textSize.height / 2
        };

        this._textView.setPos(pos);
      }.bind(this);
    }.bind(this);

    var notify = new Navy.Notify(4, cb);
    var pass = notify.pass.bind(notify);

    var textLayout = this._cloneObject(layout);
    this._textView = new Navy.View.Text(textLayout, pass);

    var imageLayout = this._cloneObject(layout);
    imageLayout.extra.src = layout.extra.normal.src;
    this._imageView = new Navy.View.Image(imageLayout, pass);

    Navy.Resource.loadImage(layout.extra.active.src, pass);
    Navy.Resource.loadImage(layout.extra.disabled.src, pass);
  }
});
