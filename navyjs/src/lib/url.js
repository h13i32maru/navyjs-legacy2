/**
 * @typedef {Object} Navy.URL
 */
Navy.Class.instance('Navy.URL', {
  parseHash: function(url) {
    var result = {};

    var matched = url.match(/#(.*)/);
    if (!matched) {
      return result;
    }

    var hashes = matched[1].split('&');
    for (var i = 0; i < hashes.length; i++) {
      var hash = hashes[i];
      var key = hash.split('=')[0];
      var value = hash.split('=')[1];
      result[key] = value;
    }
    return result;
  },

  stringifyHash: function(hash) {
    var result = [];
    for (var key in hash) {
      result.push(key + '=' + hash[key]);
    }

    if (result.length) {
      return '#' + result.join('&');
    } else {
      return '';
    }
  }
});
