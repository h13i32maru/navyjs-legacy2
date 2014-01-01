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

    this._element.addEventListener('touchstart', this._onTouchStart.bind(this));
    this._element.addEventListener('touchend', this._onTouchEnd.bind(this));
  },

  _loadExtraResource: function($super, layout, callback) {
    function cb() {
      $super(layout, callback);
    }

    var notify = new Navy.Notify(3, cb);
    var pass = notify.pass.bind(notify);

    if (layout.extra.normal.src) {
      Navy.Resource.loadImage(layout.extra.normal.src, pass);
    } else {
      pass();
    }

    if (layout.extra.active.src) {
      Navy.Resource.loadImage(layout.extra.active.src, pass);
    } else {
      pass();
    }

    if (layout.extra.disabled.src) {
      Navy.Resource.loadImage(layout.extra.disabled.src, pass);
    } else {
      pass();
    }
  },

  _applyExtraLayout: function($super, layout, callback) {
    function cb() {
      var size = this._imageView.getSize();
      this._textView.setSizePolicy({width: this.SIZE_POLICY_FIXED, height: this.SIZE_POLICY_FIXED});
      this._textView.setSize(size);

      // TODO: TextViewのextraで設定できるようにする
      this._textView.getElement().style.lineHeight = size.height + 'px';
      this._textView.getElement().style.textAlign = 'center';

      $super(layout, callback);
    }

    if (this._imageView) {
      this.removeView(this._imageView);
    }

    if (this._textView) {
      this.removeView(this._textView);
    }

    var notify = new Navy.Notify(2, cb.bind(this));
    var pass = notify.pass.bind(notify);

    var imageLayout = {};
    imageLayout.id = 'image';
    imageLayout.visible = true;
    imageLayout.pos = {x: 0, y: 0};
    imageLayout.sizePolicy = {width: this.SIZE_POLICY_WRAP_CONTENT, height: this.SIZE_POLICY_WRAP_CONTENT};
    imageLayout.extra = this._cloneObject(layout.extra);
    imageLayout.extra.src = layout.extra.normal.src;
    this._imageView = new Navy.View.Image(imageLayout, pass);
    this.addView(this._imageView);

    var textLayout = {};
    textLayout.id = 'text';
    textLayout.visible = true;
    textLayout.pos = {x:0, y:0};
    textLayout.sizePolicy = {width: this.SIZE_POLICY_WRAP_CONTENT, height: this.SIZE_POLICY_WRAP_CONTENT};
    textLayout.extra = this._cloneObject(layout.extra);
    this._textView = new Navy.View.Text(textLayout, pass);
    this.addView(this._textView);
  },

  _onTouchStart: function(/* ev */) {
    if (!this._layout.extra.active.src) {
      return;
    }

    this._imageView.setSrc(this._layout.extra.active.src);
  },

  _onTouchEnd: function(/* ev */) {
    if (!this._layout.extra.normal.src) {
      return;
    }

    setTimeout(function(){
      this._imageView.setSrc(this._layout.extra.normal.src);
    }.bind(this), 400);
  }
});
