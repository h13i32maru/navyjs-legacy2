window.Navy = {};

window.addEventListener('DOMContentLoaded', function(){
  if (Navy.UnitTest) {
    return;
  }

  var hash = Navy.URL.parseHash(location.href);

  Navy.AssetInstaller.initialize('./manifest.json');
  if (hash['web_installer_db'] === 'false') {
    Navy.AssetInstaller.setEnableDatabase(false);
  }
  Navy.AssetInstaller.update({
    forceUpdate: true,
    onProgress: function(progress, total) {
      var progressElement = document.querySelector('#web_installer_inner_progress');
      if (progressElement) {
        progressElement.style.width = (100 * progress / total) + '%';
      }
    },
    onComplete: function() {
      var progressElement = document.querySelector('#web_installer_progress');
      progressElement && progressElement.parentElement.removeChild(progressElement);
      Navy.App.initialize();
    },
    onError: function(path) {
      console.error(path);
    }
  });
});
