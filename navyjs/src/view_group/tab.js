Navy.Class('Navy.ViewGroup.Tab', Navy.ViewGroup.ViewGroup, {
  _tabLabels: null,
  _tabContents: null,

  _applyExtraLayout: function($super, layout, callback){
    $super(layout, callback);

    this.removeAllViews();

    this._tabLabels = [];
    this._tabContents = [];

    var contents = layout.extra.contents;

    var notify = new Navy.Notify(contents.length * 2, function(){
      this._adjustPositionAndSize();
      $super(layout, callback)
    }.bind(this));

    var pass = notify.pass.bind(notify);

    for (var i = 0; i < contents.length; i++) {
      // tab label
      var labelLayout = this._generateTabLabelLayout(i);
      var tabLabel = new Navy.ViewGroup.Button(labelLayout, pass);
      this.addView(tabLabel);
      this._tabLabels.push(tabLabel);

      // tab content
      var contentLayout = this._generateTabContentLayout(i);
      var tabContent = new Navy.ViewGroup.ViewGroup(contentLayout, pass);
      this.addView(tabContent);
      this._tabContents.push(tabContent);

      // tapした時の表示切り替え
      tabLabel.on('Tap', this._onTapTabLabel.bind(this, tabContent));
    }
  },

  _generateTabLabelLayout: function(index) {
    var contents = this._layout.extra.contents;
    var content = contents[index];

    var extra = this._cloneObject(this._layout.extra.label);
    extra.text = content.label;

    var layout = {
      id: '$tab_label' + index,
      visible: true,
      sizePolicy: {width: 'wrapContent', height: 'wrapContent'},
      pos: {x: 0, y: 0},
      extra: extra
    };

    return layout;
  },

  _generateTabContentLayout: function(index) {
    var contents = this._layout.extra.contents;
    var content = contents[index];

    var layout = {
      id: content.id,
      visible: index === 0, // はじめのviewだけ表示する
      sizePolicy: {width: 'matchParent', height: 'fixed'},
      size: {width: 0, height: 0},
      pos: {x: 0, y:0},
      extra: {
        contentLayoutFile: content.layoutFile
      }
    };

    return layout;
  },

  _adjustPositionAndSize: function() {
    var tabLabelSize = this._tabLabels[0].getSize();

    var labelWidth = Math.floor(this.getSize().width / this._tabLabels.length);
    var margin = (labelWidth - tabLabelSize.width) / 2;
    for (var i = 0; i < this._tabLabels.length; i++) {
      var tabLabel = this._tabLabels[i];
      var pos = tabLabel.getPos();
      var x = labelWidth * i + margin;
      pos.x = x;
      tabLabel.setPos(pos);
    }

    var y = tabLabelSize.height;
    var height = this.getSize().height - tabLabelSize.height;
    for (var i = 0; i < this._tabContents.length; i++) {
      var tabContent = this._tabContents[i];

      var pos = tabContent.getPos();
      pos.y = y;
      tabContent.setPos(pos);

      var size = tabContent.getSize();
      size.height = height;
      tabContent.setSize(size)
    }
  },

  _onTapTabLabel: function(tabContent, ev){
    var contents = this._layout.extra.contents;
    for (var i = 0; i < contents.length; i++) {
      var tabContentId = contents[i].id;
      this.findViewById(tabContentId).setVisible(false);
    }
    tabContent.setVisible(true);
  }
});
