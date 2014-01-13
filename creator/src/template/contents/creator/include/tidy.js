/**
 * @typedef {Object} Include.Tidy
 */
Navy.Class.instance('Include.Tidy', Include.Include, {

  _alignSelectedViewsFromNative: function(type) {
    /*
     * 位置揃えのアルゴリズムは一番目のviewの起点(anchor)から各viewがどれだけ移動すればよいかを求めれば良い.
     *
     * 例えば下揃えの場合:
     * 起点は一番目のviewの下辺座標(= 上辺座標 + 高さ * 1)となる.
     * そして各viewはこの起点から自身の高さだけずれることになる.
     *
     * 同じように中央揃えの場合:
     * 起点は[上辺座標 + 高さ * 0.5]となり、各viewはこの起点から自身の高さ * 0.5だけずれる.
     */

    var groupingViews = this._selectedGroupingViews;

    if (type.indexOf('ROOT_') === 0) {
      // Rootを起点とする場合はanchorViewを選択されたものじゃなくてRoot固定にして、typeをちょっといじる.
      var anchorView = Navy.Root;
      type = type.substr(5);
    } else {
      var anchorView = groupingViews[0];
    }

    if (type === 'TOP' || type === 'V_CENTER' || type === 'BOTTOM') {
      switch(type) {
      case 'TOP':
        var delta = 0;
        break;
      case 'V_CENTER':
        var delta = 0.5;
        break;
      case 'BOTTOM':
        var delta = 1;
        break;
      }

      var anchor = anchorView.getPos().y + parseInt(anchorView.getSize().height * delta, 10);
      for (var i = 0; i < groupingViews.length; i++) {
        var view = groupingViews[i];
        if (view === anchorView) {
          continue;
        }
        var pos = view.getPos();
        var size = view.getSize();
        var y = anchor - parseInt(size.height * delta, 10);
        view.setPos({x: pos.x, y: y});
      }
    }

    if (type === 'LEFT' || type === 'H_CENTER' || type === 'RIGHT') {
      switch(type) {
      case 'LEFT':
        var delta = 0;
        break;
      case 'H_CENTER':
        var delta = 0.5;
        break;
      case 'RIGHT':
        var delta = 1;
        break;
      }

      var anchor = anchorView.getPos().x + parseInt(anchorView.getSize().width * delta, 10);
      for (var i = 0; i < groupingViews.length; i++) {
        var view = groupingViews[i];
        if (view === anchorView) {
          continue;
        }
        var pos = view.getPos();
        var size = view.getSize();
        var x = anchor - parseInt(size.width * delta, 10);
        view.setPos({x: x, y: pos.y});
      }
    }

    Native.changedLayoutContentFromJS();
  },

  _arrangeSelectedViewsFromNative: function(type) {
    var groupingViews = this._selectedGroupingViews;

    if (groupingViews.length <= 1) {
      return;
    }

    if (type === 'H_CLOSELY') {
      this._sortViewsByX(groupingViews);
      var x = groupingViews[0].getPos().x + groupingViews[0].getSize().width;
      for (var i = 1; i < groupingViews.length; i++) {
        var view = groupingViews[i];
        var pos = view.getPos();
        var size = view.getSize();
        view.setPos({x: x, y: pos.y});
        x = x + size.width;
      }
    }

    if (type === 'V_CLOSELY') {
      this._sortViewsByY(groupingViews);
      var y = groupingViews[0].getPos().y + groupingViews[0].getSize().height;
      for (var i = 1; i < groupingViews.length; i++) {
        var view = groupingViews[i];
        var pos = view.getPos();
        var size = view.getSize();
        view.setPos({x: pos.x, y: y});
        y = y + size.height;
      }
    }

    if (type === 'H_EVEN') {
      this._sortViewsByX(groupingViews);
      var startView = groupingViews[0];
      var endView = groupingViews[groupingViews.length - 1];
      var totalSpace = (endView.getPos().x + endView.getSize().width) - startView.getPos().x;
      for (var i = 0; i < groupingViews.length; i++) {
        totalSpace -= groupingViews[i].getSize().width;
      }

      if (totalSpace <= 0) {
        return;
      }

      var space = totalSpace / (groupingViews.length - 1);

      var x = groupingViews[0].getPos().x + groupingViews[0].getSize().width + space;
      for (var i = 1; i < groupingViews.length; i++) {
        var view = groupingViews[i];
        var pos = view.getPos();
        var size = view.getSize();
        view.setPos({x: x, y: pos.y});
        x = x + size.width + space;
      }
    }

    if (type === 'V_EVEN') {
      this._sortViewsByY(groupingViews);
      var startView = groupingViews[0];
      var endView = groupingViews[groupingViews.length - 1];
      var totalSpace = (endView.getPos().y + endView.getSize().height) - startView.getPos().y;
      for (var i = 0; i < groupingViews.length; i++) {
        totalSpace -= groupingViews[i].getSize().height;
      }

      if (totalSpace <= 0) {
        return;
      }

      var space = totalSpace / (groupingViews.length - 1);

      var y = groupingViews[0].getPos().y + groupingViews[0].getSize().height + space;
      for (var i = 1; i < groupingViews.length; i++) {
        var view = groupingViews[i];
        var pos = view.getPos();
        var size = view.getSize();
        view.setPos({x: pos.x, y: y});
        y = y + size.height + space;
      }
    }

    Native.changedLayoutContentFromJS();
  },

  _sortViewsByX: function(views) {
    views.sort(function(view1, view2){
      return view1.getPos().x - view2.getPos().x;
    });
  },

  _sortViewsByY: function(views) {
    views.sort(function(view1, view2){
      return view1.getPos().y - view2.getPos().y;
    });
  }
 });
