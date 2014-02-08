describe('Navy.WebInstaller installs web resource to WebSQL:', function(){

  it('updates local resources by using manifest.', function(done){
    Navy.WebInstaller.initialize('/base/fixture/manifest.json');

    var totalUpdatingCount;
    var updatingCount = 0;
    var options = {
      forceUpdate: true,
      onProgress: function(count, total) {
        updatingCount++;
        totalUpdatingCount = total;
      },
      onComplete: function() {
        expect(updatingCount).toBe(totalUpdatingCount);
        done();
      },
      onError: function(path) {
        throw new Error('fail updating path. ' + path);
      }
    };

    Navy.WebInstaller.update(options);
  });

});
