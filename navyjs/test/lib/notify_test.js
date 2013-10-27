buster.testCase('Navy.Notify', {
  'callback is called with call all pass': function (done) {
    var cb = done(function(){
      buster.assert.equals(count, 2);
    });

    var notify = new Navy.Notify(2, cb);
    var count = 0;

    setTimeout(function(){
      count++;
      notify.pass();
    }, 10);

    setTimeout(function(){
      count++;
      notify.pass();
    }, 50);
  },

  'callback is called when through current thread': function(done) {
    var cb = done(function(){
      count = 1;
    });

    var notify = new Navy.Notify(2, cb);
    var count = 0;
    notify.pass();
    notify.pass();
    buster.assert.equals(count, 0);
  },

  'can set count and callback to notify after instance created': function(done) {
    var cb = done(function(){
      buster.assert(true);
    });

    var notify = new Navy.Notify();
    notify.set(2, cb);
    notify.pass();
    notify.pass();
  },

  'callback is called when count is 0': function(done) {
    var cb = done(function(){
      buster.assert(true);
    });

    new Navy.Notify(0, cb);
  }
});
