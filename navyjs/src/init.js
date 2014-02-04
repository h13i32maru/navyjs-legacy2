window.Navy = {};

window.addEventListener('DOMContentLoaded', function(){
  if (Navy.UnitTest) {
    return;
  }

  Navy.App.initialize();

  Navy.WebInstaller.initialize('./manifest.json');
  Navy.WebInstaller.update();
});
