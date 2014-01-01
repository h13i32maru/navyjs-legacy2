/**
 * @class Navy.Page
 * @eventNames Create, ResumeBefore, ResumeAfter, PauseBefore, PauseAfter, Destroy
 */
Navy.Class('Navy.Page', Navy.ViewGroup.ViewGroup, {
  initialize: function($super, layout, callback) {
    $super(layout, callback);
  },

  setLayout: function($super, layout, callback) {
    // シーン、ページの場合はsize, posは固定値でよい
    layout.visible = true;
    layout.pos = {x:0, y:0};
    layout.sizePolicy = {width: this.SIZE_POLICY_FIXED, height: this.SIZE_POLICY_FIXED};
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
  },

  onResumeBefore: function(){
  },

  onResumeAfter: function(){
  },

  onPauseBefore: function(){
  },

  onPauseAfter: function(){
  },

  onDestroy: function(){
  }
});
