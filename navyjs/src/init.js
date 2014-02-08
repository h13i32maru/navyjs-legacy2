window.Navy = {};

window.addEventListener('DOMContentLoaded', function(){
  if (Navy.UnitTest) {
    return;
  }

  var hash = Navy.Lib.URL.parseHash(location.href);

  Navy.WebInstaller.initialize('./manifest.json');
  if (hash['web_installer_db'] === 'false') {
    Navy.WebInstaller.setEnableDatabase(false);
  }
  Navy.WebInstaller.update({
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
