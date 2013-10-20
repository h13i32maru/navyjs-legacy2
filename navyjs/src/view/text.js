Navy.Class('Navy.View.Text', Navy.View.View, {
  _textElement: null,

  /**
   *
   * @param $super
   * @param {TextLayout} layout
   * @param {function} callback
   */
  initialize: function($super, layout, callback) {
    $super(layout, callback);
  },

  _createExtraElement: function($super, layout) {
    $super(layout);

    this._textElement = document.createElement('span');
    this._element.appendChild(this._textElement);
  },

  _applyExtraLayout: function($super, layout) {
    $super(layout);

    if (!layout.extra) {
      return;
    }

    this.setFontSize(layout.extra.fontSize);
  },

  _loadExtraResource: function($super, layout, callback) {
    this.setText(layout.extra.text);

    $super(layout, callback);
  },

  setText: function(text) {
    this._layout.extra.text = text;
    this._textElement.textContent = text;
  },

  getText: function() {
    return this._layout.extra.text;
  },

  setFontSize: function(fontSize) {
    this._layout.extra.fontSize = fontSize;
    this._element.style.fontSize = fontSize + 'px';
  },

  getFontSize: function() {
    return this._layout.extra.fontSize;
  }
});
