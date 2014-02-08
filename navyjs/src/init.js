window.Navy = {};

window.addEventListener('DOMContentLoaded', function(){
  if (Navy.UnitTest) {
    return;
  }

  Navy.WebInstaller.initialize('./manifest.json');
  Navy.WebInstaller.update({
    forceUpdate: true,
    onProgress: function(progress, total) {
      var progressElement = document.querySelector('#web_installer_inner_progress');
      progressElement.style.width = (100 * progress / total) + '%';
    },
    onComplete: function() {
      var progressElement = document.querySelector('#web_installer_progress');
      progressElement.parentElement.removeChild(progressElement);
      Navy.App.initialize();
    },
    onError: function(path) {
      console.error(path);
    }
  });
});
