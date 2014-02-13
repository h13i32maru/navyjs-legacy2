Navy.Class('Page1', Navy.Page, {
  onCreate: function($super, ev) {
    $super(ev);

    var items = [];
    for (var i = 0; i < 30; i++) {
      items.push({id: i, name: 'name' + i});
    }

    var listView = this.findViewById('tab1.list_view');
    listView.setItems(items, function(item, viewGroup){
      viewGroup.findViewById('name').setText(item.name.toUpperCase());
    });

    var listView = this.findViewById('tab3.list_view');
    listView.setItems(items, function(item, viewGroup){
      viewGroup.findViewById('name').setText(item.name.toUpperCase());
    });
  }
});
