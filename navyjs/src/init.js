window.Navy = {};

(function(){
  var scriptElements = document.querySelectorAll('script');
  var selfScriptElement = scriptElements[scriptElements.length - 1];
  if (selfScriptElement.dataset.assetConfig) {
    Navy.assetConfig = JSON.parse(selfScriptElement.dataset.assetConfig);
  } else {
    window.Navy.assetConfig = {alwaysRemote: false, forceUpdate: false};
  }
})();

window.addEventListener('DOMContentLoaded', function(){
  if (Navy.UnitTest) {
    return;
  }

  Navy.AssetInstaller.initialize('./manifest.json');

  // かならずremoteを使う場合は都度サーバから取得することになる.
  Navy.AssetInstaller.setAlwaysRemote(Navy.assetConfig.alwaysRemote);

  Navy.AssetInstaller.update({
    forceUpdate: Navy.assetConfig.forceUpdate,
    onProgress: function(progress, total) {
      var progressElement = document.querySelector('#asset_installer_inner_progress');
      if (progressElement) {
        progressElement.style.width = (100 * progress / total) + '%';
      }
    },
    onComplete: function() {
      var progressElement = document.querySelector('#asset_installer_progress');
      progressElement && progressElement.parentElement.removeChild(progressElement);
      Navy.App.initialize();
    },
    onError: function(path) {
      console.error(path);
    }
  });

  // PCで見ている場合にtouchがエミュレートされていなければ警告を出すようにする
  if (!('ontouchstart' in window.document.body)) {
    (function(){
      var touched = false;
      var ontouchstart = function(){
        touched = true;
      };
      var onclick = function(){
        if (touched) {
          document.body.removeEventListener('touchstart', ontouchstart);
          document.body.removeEventListener('click', onclick);
        } else {
          alert('Please emulate touch by Chrome Devtools.\nTool -> Developer Tool -> Emulation -> Sensors -> Emulate touch screen.');
        }
      };

      document.body.addEventListener('touchstart', ontouchstart);
      document.body.addEventListener('click', onclick);
    })();
  }
});
