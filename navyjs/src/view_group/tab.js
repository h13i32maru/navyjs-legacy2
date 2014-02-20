Navy.Class('Navy.ViewGroup.Tab', Navy.ViewGroup.ViewGroup, {
  _tabLabels: null,
  _tabContents: null,
  _currentTabContent: null,
  _currentTabIndex: -1,

  getCurrentTabIndex: function() {
    return this._currentTabIndex;
  },

  getCurrentTabContent: function() {
    return this._currentTabContent;
  },

  changeTabByIndex: function(index) {
    var tabContentId = this._layout.extra.contents[index].id;
    var tabContent = this.findViewById(tabContentId);
    this.changeTabByTabContent(tabContent);
  },

  changeTabByTabContent: function(tabContent) {
    if (tabContent === this._currentTabContent) {
      return;
    }

    var contents = this._layout.extra.contents;
    for (var i = 0; i < contents.length; i++) {
      var _tabContentId = contents[i].id;
      var _tabContent = this.findViewById(_tabContentId);

      _tabContent.setVisible(_tabContent === tabContent);
      if (_tabContent === tabContent) {
        this._currentTabContent = tabContent;
        this._currentTabIndex = i;
      }
    }

    this.trigger('ChangedTab');
  },

  _applyExtraLayout: function($super, layout, callback){
    $super(layout, callback);

    this.setVisible(false);

    this.removeAllViews();

    this._tabLabels = [];
    this._tabContents = [];

    var contents = layout.extra.contents;

    var notify = new Navy.Notify(contents.length * 2, function(){
      this._adjustPositionAndSize();
      this.setVisible(true);
      $super(layout, callback);
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
      visible: true,
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

    this.changeTabByIndex(0);
  },

  _onTapTabLabel: function(tabContent, ev){
    this.changeTabByTabContent(tabContent);
  }
});
