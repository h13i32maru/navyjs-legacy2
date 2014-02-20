Navy.Class('Navy.ViewGroup.ListView', Navy.ViewGroup.ViewGroup, {
  initialize: function($super, layout, callback) {
    $super(layout, callback);
  },

  _applyExtraLayout: function($super, layout, callback) {
    $super(layout, callback);

    // android: 要素が何もない状態でもスクロールバーが表示されてしまうので、最初はhiddenにしておく.
    // 要素が1つ以上になったらscrollを設定する.
    this._element.style.overflowY = 'hidden';
    this._element.style.overflowX = 'hidden';
    this._element.style.webkitOverflowScrolling = 'touch'; // for ios

    if (this._layout.extra.mock) {
      var items = [];
      for (var i = 0; i < 30; i++) {
        items.push({});
      }
      this.setItems(items);
    }
  },

  clear: function() {
    for (var viewId in this._views) {
      var view = this._views[viewId];
      this.removeView(view);
    }

    this._element.style.overflowY = 'hidden';
  },

  setItems: function(items, callback, completeCallback) {
    this.clear();
    this.insertItems(items, 0, callback, completeCallback);
  },

  addItems: function(items, callback, completeCallback) {
    this.insertItems(items, this._viewsOrder.length, callback, completeCallback);
  },

  insertItems: function(items, index, callback, completeCallback) {
    // 範囲チェック
    if (index < 0 || index > this._viewsOrder.length) {
      throw new Error('out of range. index = ' + index);
    }

    // 一番最後のindexを指定した場合はaddになる. そうでない場合は指定したindexに挿入.
    if (index === this._viewsOrder.length) {
      var referenceView = null;
    } else {
      var viewId = this._viewsOrder[index];
      var referenceView = this.findViewById(viewId);
    }

    var notify = new Navy.Notify(items.length, function(){
      var link = this._cloneObject(this._layout.extra.itemLink || '');
      var margin = this._layout.extra.itemLayoutMargin + 'px';
      for (var i = 0; i < items.length; i++) {
        var view = viewGroups[i];
        var item = items[i];

        if (link) {
          view.setLink(link);
        }

        var callbackResult = false;
        if (callback) {
          callbackResult = callback(item, view, i, currentViewCount + i);
        }

        // undefinedの場合はtrueとして扱いたいので===で比較している.
        if (callbackResult === false) {
          // itemのキーをviewのidと解釈して値を設定する.
          for (var key in item) {
            var childView = view.findViewById(key);
            if (!childView) { continue; }

            if (childView.setText) {
              childView.setText(item[key]);
            } else if (childView.setSrc) {
              childView.setSrc(item[key]);
            }
          }
        }

        view.getElement().style.position = 'relative';
        view.getElement().style.marginBottom = margin;
        view.setVisible(true);
      }

      completeCallback && completeCallback();
    }.bind(this));
    var pass = notify.pass.bind(notify);

    var currentViewCount = this._viewsOrder.length;
    var viewGroups = [];
    for (var i = 0; i < items.length; i++) {
      var layout = {
        id: 'item' + (currentViewCount + i),
        visible: false,
        sizePolicy: {width: 'matchParent', height: 'wrapContent'},
        pos: {x: 0, y:0},
        extra: {
          contentLayoutFile: this._layout.extra.itemLayoutFile
        }
      };

      var viewGroup = new Navy.ViewGroup.ViewGroup(layout, pass);
      this.addView(viewGroup, referenceView);
      viewGroups.push(viewGroup);
    }

    if (items.length > 0) {
      this._element.style.overflowY = 'scroll';
    }
  }
});
