describe('Navy.WebInstaller installs web resource to WebSQL:', function(){

  it('updates local resources by using manifest.', function(done){
    Navy.WebInstaller.initialize('/base/fixture/manifest1.json');

    var totalUpdatingCount;
    var updatingCount = 0;
    var options = {
      forceUpdate: true,
      onProgress: function(count, total) {
        updatingCount++;
        totalUpdatingCount = total;
      },
      onComplete: function() {
        expect(updatingCount).toBe(4);
        expect(updatingCount).toBe(totalUpdatingCount);
        done();
      },
      onError: function(path) {
        throw new Error('fail updating path. ' + path);
      }
    };

    Navy.WebInstaller.update(options);
  });

  it('only update invalid resources.', function(done){
    Navy.WebInstaller.setManifestURL('/base/fixture/manifest2.json');

    var totalUpdatingCount;
    var updatingCount = 0;
    var options = {
      onProgress: function(count, total) {
        updatingCount++;
        totalUpdatingCount = total;
      },
      onComplete: function() {
        expect(updatingCount).toBe(2);
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
