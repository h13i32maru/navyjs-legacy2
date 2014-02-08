/**
 * @typedef {Object} Navy.Lib.URL
 */
Navy.Class.instance('Navy.Lib.URL', {
  parseHash: function(url) {
    var result = {};

    var matched = url.match(/#(.*)/);
    if (!matched) {
      return result;
    }

    var hashes = matched[1].split('&');
    for (var i = 0; i < hashes.length; i++) {
      var hash = hashes[0];
      var key = hash.split('=')[0];
      var value = hash.split('=')[1];
      result[key] = value;
    }
    return result;
  }
});
