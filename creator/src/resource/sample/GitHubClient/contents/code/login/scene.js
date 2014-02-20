// スクリプトをロードする. ここ何か良い方法を考える.
Navy.Root.startLoading();
var notify = new Navy.Notify(3, Navy.Root.stopLoading.bind(Navy.Root));
var pass = notify.pass.bind(notify);

Navy.Asset.loadScript('code/model/git_hub_api.js', pass);
Navy.Asset.loadScript('code/model/user.js', pass);
Navy.Asset.loadScript('code/model/search_api.js', pass);
// --

Navy.Class('LoginScene', Navy.Scene, {
});
