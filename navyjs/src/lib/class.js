Navy.Class = function(var_args){
  var className;
  var protoObj;
  var superClass;

  switch (arguments.length) {
  case 2:
    superClass = Navy.Class._RootClass;
    className = arguments[0];
    protoObj = arguments[1];
    break;
  case 3:
    if (typeof arguments[1] === 'function') {
      superClass = arguments[1];
    } else {
      superClass = arguments[1].constructor;
    }
    className = arguments[0];
    protoObj = arguments[2];
    break;
  default:
    throw new Error('arguments of Navy.Class is 2 or 3.');
  }

  var _class = Navy.Class._create(className, superClass, protoObj);
  Navy.Class._setByReflection(className, _class);
  return _class;
};

Navy.Class.instance = function instance(var_args) {
  var _class = Navy.Class.apply(Navy, arguments);
  _class.__manualInitialize__ = true;
  var obj = new _class();
  var className = arguments[0];
  Navy.Class._setByReflection(className, obj);

  return obj;
};

/**
 * スーパークラスを指定せずにクラスを生成したときのクラス.
 */
Navy.Class._RootClass = function _RootClass() {};
Navy.Class._RootClass.prototype.initialize = function() {};

Navy.Class._getByReflection = function _getByReflection(propertyName) {
  var names = propertyName.split('.');

  var obj = window;
  for (var i = 0; i < names.length; i++) {
    obj = obj[names[i]];
  }

  return obj;
};

Navy.Class._setByReflection = function _setByReflection(propertyName, value) {
  var names = propertyName.split('.');

  var obj = window;
  for (var i = 0; i < names.length - 1; i++) {
    if (!(names[i] in obj)) {
      obj[names[i]] = {};
    }

    obj = obj[names[i]];
  }

  obj[names[i]] = value;
};

Navy.Class._create = function _create(className, superClass, protoObj){
  var name = className.replace(/[.]/g, '$');
  var Constructor = new Function("return function " +  name + " () { if (typeof this.initialize === 'function' && !this.constructor.__manualInitialize__) { this.initialize.apply(this, arguments); } }")();

  function EmptySuperClass(){}
  EmptySuperClass.prototype = superClass.prototype;
  var superObj = new EmptySuperClass();
  var superObjForWrap = new EmptySuperClass();

  Constructor.prototype = superObj;

  var key;
  var value;

  if (protoObj.$static) {
    for (key in protoObj.$static) {
      var value = protoObj.$static[key];
      if (typeof value === 'function') {
        if (Navy.Class._argumentNames(value)[0] === '$super') {
          value = Navy.Class._wrapFunction(superClass, key, value);
        }
      }
      Constructor[key] = value;
    }

    delete protoObj.$static;
  }

  for (key in protoObj) {
    value = protoObj[key];

    if (typeof value === 'object' && value !== null) {
      if (key !== '$static') {
        throw new Error('object property must be primitive type. property = ' + key);
      }
    }

    if (typeof value === 'function') {
      if (Navy.Class._argumentNames(value)[0] === '$super') {
        value = Navy.Class._wrapFunction(superObjForWrap, key, value);
      }
    }
    Constructor.prototype[key] = value;
  }

  Constructor.prototype.constructor = Constructor;
  Constructor.prototype.$className = className;
  Constructor.prototype.$class = Constructor;

  return Constructor;
};

/**
 * 関数の仮引数名のリストを取得する.
 * @param {function} func 対象とする関数.
 * @return {string[]} 仮引数名の配列.
 */
Navy.Class._argumentNames = function _argumentNames(func) {
  var names = func.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
    .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
    .replace(/\s+/g, '').split(',');
  return names.length == 1 && !names[0] ? [] : names;
};

/**
 * 引数にスーパークラスの関数が渡されるように元の関数をラップして返す。
 * @param {Object} superObj スーパークラスのオブジェクト.
 * @param {string} funcname ラップする関数の名前.
 * @param {function} func ラップする関数.
 * @return {function} ラップした関数.
 */
Navy.Class._wrapFunction = function _wrapFunction(superObj, funcname, func) {
  if (typeof superObj[funcname] !== 'function') {
    throw new Error('override method must be function. function = ' + funcname);
  }

  return function() {
    var _this = this;
    var $super = function() { return superObj[funcname].apply(_this, arguments); };
    var arg = [$super].concat(Array.prototype.slice.call(arguments, 0));
    return func.apply(this, arg);
  };
};
