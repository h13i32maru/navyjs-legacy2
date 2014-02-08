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
        expect(updatingCount).toBe(5);
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

  it('can load javascript.', function(done){
    var scriptElement = document.createElement('script');
    Navy.WebInstaller.loadJavaScript('/base/fixture/code/code1.js', scriptElement, function(scriptElement){
      expect(scriptElement.textContent).toBe('// dummy code1\n');
      done();
    });
  });

  it('can load json.', function(done){
    Navy.WebInstaller.loadJSON('/base/fixture/layout/layout1.json', function(obj){
      expect(obj).toEqual({prop1: 'dummy layout1'});
      done();
    });
  });

  it('can load image.', function(done){
    var imageElement = new Image();
    Navy.WebInstaller.loadImage('/base/fixture/image/image1.png', imageElement, function(imageElement){
      var src = imageElement.src;
      expect(src).toContain('/base/fixture/image/image1.png');
      expect(imageElement.complete).toBeTruthy();
      done();
    });
  });

  it('can load css.', function(done){
    var styleElement = document.createElement('style');
    Navy.WebInstaller.loadCSS('/base/fixture/css/style1.css', styleElement, function(styleElement){
      expect(styleElement.textContent).toBe('/* dummy style1 */\n');
      done();
    })
  })
});
