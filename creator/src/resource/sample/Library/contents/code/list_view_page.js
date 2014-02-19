Navy.Class('ListViewPage', Navy.Page, {
  onCreate: function($super, ev) {
    var items = [];
    for (var i = 0; i < 30; i++) {
      items.push({color: this._color()});
    }

    var listView = this.findViewById('ListView1');
    listView.setItems(items, function(item, view, index){
      view.findViewById('Text3').setText('Item' + index);
      view.findViewById('View2').setBackgroundColor(item.color);
    })
  },

  _color: function() {
    return '#' + Math.floor(Math.random() * 0x1000000).toString(16);
  }
});
