/**
 * @class Include.Include
 */
Navy.Class('Include.Include', {
  initialize: function(targetObject) {
    for (var name in this) {
      if (targetObject[name]) {
        continue;
      }

      targetObject[name] = this[name];
    }
  }
});
