/**
 * @typedef {Object}
 */
buster;

/**
 * @param {string} name
 * @param {Object} tests
 */
buster.testCase = function(name, tests){};

/**
 * @param {boolean} actual
 * @param {string} [message]
 */
buster.assert = function(actual, message) {};

/**
 * @param {boolean} actual
 * @param {string} [message]
 */
buster.assert.isTrue = function(actual, message) {};

/**
 * @param {boolean} actual
 * @param {string} [message]
 */
buster.assert.isFalse = function(actual, message) {};

/**
 * @param {*} actual
 * @param {*} expected
 * @param {string} [message]
 */
buster.assert.equals = function(actual, expected, message) {};

/**
 * @param {*} actual
 * @param {*} expected
 * @param {string} [message]
 */
buster.assert.same = function(actual, expected, message) {};

/**
 * @param {boolean} actual
 * @param {string} [message]
 */
buster.refute = function(actual, message) {};

/**
 * @param {*} actual
 * @param {*} expected
 * @param {string} [message]
 */
buster.refute.equals = function(actual, expected, message) {};

/**
 * @param {*} actual
 * @param {string} [message]
 */
buster.refute.defined = function(actual, message) {};
