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

      this.getPage().onResumeAfter = function() {
        debugger;
        console.log(this._textView.getSize());
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
