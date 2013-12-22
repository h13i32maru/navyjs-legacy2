Navy.Class('Page1', Navy.Page, {
  onCreate: function($super) {
    $super();

    var listView = this.findViewById('list_view');
    var items = [];
    for (var i = 0; i < 30; i++) {
      items.push({id: i, name: 'name' + i});
    }

    listView.setItems(items, function(item, viewGroup){
      viewGroup.findViewById('name').setText(item.name.toUpperCase());
    });
  }
});
