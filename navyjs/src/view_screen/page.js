/**
 * @class Navy.Page
 * @eventNames create, resumeBefore, resumeAfter, pauseBefore, pauseAfter, destroy
 */
Navy.Class('Navy.Page', Navy.ViewGroup.ViewGroup, {
  initialize: function($super, layout, callback) {
    $super(layout, callback);
  },

  setLayout: function($super, layout, callback) {
    // シーン、ページの場合はsize, posは固定値でよい
    layout.visible = true;
    layout.pos = {x:0, y:0};
    layout.sizePolicy = this.SIZE_POLICY_FIXED;
    layout.size = {width: Navy.Config.app.size.width, height: Navy.Config.app.size.height};

    $super(layout, callback);
  },

  setPage: function($super, page) {
    // ignore
  },

  getPage: function() {
    return this;
  },

  onCreate: function() {
    console.log('onCreate', this.$className);

    // TODO: eventオブジェクトをちゃんと生成する.(他のライフサイクルも同じく)
    this.trigger('create', this, null);
  },

  onResumeBefore: function(){
    console.log('onResumeBefore', this.$className);

    this.trigger('resumeBefore', this, null);
  },

  onResumeAfter: function(){
    console.log('onResumeAfter', this.$className);

    this.trigger('resumeAfter', this, null);
  },

  onPauseBefore: function(){
    console.log('onPauseBefore', this.$className);

    this.trigger('pauseBefore', this, null);
  },

  onPauseAfter: function(){
    console.log('onPauseAfter', this.$className);

    this.trigger('pauseAfter', this, null);
  },

  onDestroy: function(){
    console.log('onDestroy', this.$className);

    this.trigger('destroy', this, null);
  }
});
