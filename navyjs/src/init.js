window.Navy = {};

window.addEventListener('DOMContentLoaded', function(){
  if (Navy.UnitTest) {
    return;
  }

  Navy.WebInstaller.initialize('./manifest.json');
  Navy.WebInstaller.update({
    forceUpdate: true,
    onProgress: function(progress, total) {
      console.log(progress, total);
    },
    onComplete: function() {
      console.log('complete');
      Navy.App.initialize();
    },
    onError: function(path) {
      console.error(path);
    }
  });
});
