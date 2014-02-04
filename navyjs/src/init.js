window.Navy = {};

window.addEventListener('DOMContentLoaded', function(){
  if (Navy.UnitTest) {
    return;
  }

  Navy.App.initialize();

  Navy.WebInstaller.initialize('./manifest.json');
  Navy.WebInstaller.update({
    onProgress: function(progress, total) {
      console.log(progress, total);
    },
    onComplete: function() {
      console.log('complete');
    },
    onError: function(path) {
      console.error(path);
    }
  });
});
