window.Navy = {};

window.addEventListener('DOMContentLoaded', function(){
  if (Navy.UnitTest) {
    return;
  }

  Navy.App.initialize();

  Navy.WebInstaller.initialize();
  Navy.WebInstaller.update('./manifest.json');
});
