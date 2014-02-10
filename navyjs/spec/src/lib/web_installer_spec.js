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
  });

  it('can be updated if disabled database.', function(done){
    Navy.WebInstaller.setEnableDatabase(false);

    Navy.WebInstaller.update({
      onProgress: function(){
        throw new Error('onProgress should not be called');
      },
      onComplete: function(){
        expect(true).toBeTruthy();
        done();
      }
    });
  });

  it('can load remote resource.', function(done){
    Navy.WebInstaller.setEnableDatabase(false);
    expect(Navy.WebInstaller._loadResource).toBe(Navy.WebInstaller._loadRemoteResource);

    Navy.WebInstaller.loadJSON('/base/fixture/config/config1.json', function(obj){
      expect(obj).toEqual({prop1: 'dummy config1'});
      Navy.WebInstaller.setEnableDatabase(true);
      done();
    });
  });

  describe('exceptions', function(){
    it('throws not javascript exception.', function(done){
      window.onerror = function(errorMsg){
        window.onerror = null;
        expect(errorMsg).toContain('the path is not javascript');
        expect(errorMsg).toContain('config1.json');
        done();
      };
      var scriptElement = document.createElement('script');
      Navy.WebInstaller.loadJavaScript('/base/fixture/config/config1.json', scriptElement, function(scriptElement){});
    });

    it('throws not json exception.', function(done){
      window.onerror = function(errorMsg){
        window.onerror = null;
        expect(errorMsg).toContain('the path is not json');
        expect(errorMsg).toContain('code1.js');
        done();
      };
      Navy.WebInstaller.loadJSON('/base/fixture/code/code1.js', function(obj){});
    });

    it('throws not css exception.', function(done){
      window.onerror = function(errorMsg){
        window.onerror = null;
        expect(errorMsg).toContain('the path is not css');
        expect(errorMsg).toContain('code1.js');
        done();
      };

      var styleElement = document.createElement('style');
      Navy.WebInstaller.loadCSS('/base/fixture/code/code1.js', styleElement, function(styleElement){});
    });

    it('throws not image exception.', function(done){
      window.onerror = function(errorMsg){
        window.onerror = null;
        expect(errorMsg).toContain('the path is not image');
        expect(errorMsg).toContain('code1.js');
        done();
      };

      var imageElement = new Image();
      Navy.WebInstaller.loadImage('/base/fixture/code/code1.js', imageElement, function(){});
    });

    it('throws not exists image.', function(done){
      window.onerror = function(errorMsg){
        window.onerror = null;
        expect(errorMsg).toContain('fail loading image');
        expect(errorMsg).toContain('not_exists_image.png');
        done();
      };

      var imageElement = new Image();
      Navy.WebInstaller.loadImage('/not_exists_image.png', imageElement, function(){});
    });

    it('throws not found path in DB exception.', function(done){
      window.onerror = function(errorMsg){
        window.onerror = null;
        expect(errorMsg).toContain('not found the path in DB');
        expect(errorMsg).toContain('not_exists_json.json');
        done();
      };

      Navy.WebInstaller.loadJSON('/not_exists_json.json', function(){});
    });

    it('throws not found path in remote exception.', function(done){
      window.onerror = function(errorMsg){
        window.onerror = null;
        expect(errorMsg).toContain('not found the path in remote');
        expect(errorMsg).toContain('not_exists_json.json');
        done();
      };

      Navy.WebInstaller.setEnableDatabase(false);
      Navy.WebInstaller.loadJSON('/not_exists_json.json', function(){});
    });
  });
});
