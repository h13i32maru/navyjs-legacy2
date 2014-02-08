describe("Navy.Notify waits for some callbacks:", function(){

  it('callback is called with call all pass', function (done) {
    var cb = function(){
      expect(count).toBe(2);
      done();
    };

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
  });

  it('callback is called when through current thread', function() {
    var cb = function(){
      count = 1;
    };

    var notify = new Navy.Notify(2, cb);
    var count = 0;
    notify.pass();
    notify.pass();
    expect(count).toBe(0);
  });

  it('can set count and callback to notify after instance created', function(done) {
    var cb = function(){
      expect(true).toBeTruthy();
      done();
    };

    var notify = new Navy.Notify();
    notify.set(2, cb);
    notify.pass();
    notify.pass();
  });

  it('callback is called when count is 0', function(done) {
    var cb = function(){
      expect(true).toBeTruthy();
      done();
    };

    new Navy.Notify(0, cb);
  });
});
