var config = module.exports;

config['NavyJS Tests'] = {
rootPath: '../',
  environment: 'browser', // or "node"
  sources: [
    'build/navy.js'
  ],
  tests: [
    'test/test_env.js',
    'test/lib/class_test.js'
  ]
};
