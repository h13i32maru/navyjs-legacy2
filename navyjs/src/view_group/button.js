/**
 * @class Navy.ViewGroup.Button
 */
Navy.Class('Navy.ViewGroup.Button', Navy.ViewGroup.ViewGroup, {
  _imageView: null,
  _textView: null,
  _state: null,

  initialize: function($super, layout, callback) {
    $super(layout, callback);
  },

  _createExtraElement: function($super, layout) {
    $super(layout);

    this._element.addEventListener('touchstart', this._onTouchStart.bind(this));
    this._element.addEventListener('touchend', this._onTouchEnd.bind(this));
  },

  _loadExtraAsset: function($super, layout, callback) {
    $super(layout, callback);
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

    this.setState('_onTouchStartActive');
  },

  _onTouchEnd: function(/* ev */) {
    if (!this._layout.extra.normal.src) {
      return;
    }

    setTimeout(function(){
      // タップのイベントで外部から状態を変更された場合は、normalに戻さず、その状態を維持する.
      // 例えばタップされたdisabledにするような場合、touch start -> active -> touch end -> disabled -> normal
      // としてしまうと、外部からdisabledに設定したはずなのに強制的にnormalに戻ってしまうのはダメ.
      if (this._state === '_onTouchStartActive') {
        this.setState('normal');
      }
    }.bind(this), 100);
  },

  setState: function(state) {
    switch (state) {
    case 'normal':
      this._imageView.setSrc(this._layout.extra.normal.src);
      break;
    case 'active':
      this._imageView.setSrc(this._layout.extra.active.src);
      break;
    case 'disabled':
      this._imageView.setSrc(this._layout.extra.disabled.src);
      break;
    case '_onTouchStartActive':
      this._imageView.setSrc(this._layout.extra.active.src);
      break;
    default:
      throw new Error('unknown state. ' + state);
      break;
    }
    this._state = state;
  },

  getState: function() {
    return this._state;
  }
});
