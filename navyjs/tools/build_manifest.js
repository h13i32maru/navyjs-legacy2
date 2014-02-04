var ManifestBuilder = {
  _resources: [],

  build: function(rootDir, enableFormat) {
    var fs = require('fs');
    var files = fs.readdirSync(rootDir);

    for (var i = 0; i < files.length; i++) {
      var path = rootDir + '/' + files[i];
      var stat = fs.statSync(path);
      if (stat.isDirectory()) {
        this._collectResourcesPath(path);
      }
    }

    this._generateResourcesMD5();
    this._formatResourcesPath(rootDir);
    this._writeManifestFile(rootDir + '/' + 'manifest.json', enableFormat);
  },

  _collectResourcesPath: function(dir) {
    var fs = require('fs');
    var files = fs.readdirSync(dir);
    for (var i = 0; i < files.length; i++) {
      var path = dir + '/' + files[i];
      var stat = fs.statSync(path);
      if (stat.isDirectory()) {
        this._collectResourcesPath(path);
      } else {
        this._resources.push({
          path: path
        });
      }
    }
  },

  _generateResourcesMD5: function() {
    var crypto = require('crypto');
    var fs = require('fs');
    var resources = this._resources;

    for (var i = 0; i < resources.length; i++) {
      var path = resources[i].path;
      var md5 = crypto.createHash('md5');
      md5.update(fs.readFileSync(path));
      resources[i].md5 = md5.digest('hex');
    }
  },

  _formatResourcesPath: function(rootDir) {
    var resources = this._resources;
    var regexp = new RegExp('^' + rootDir + '/+');

    for (var i = 0; i < resources.length; i++) {
      resources[i].path = resources[i].path.replace(regexp, '');
    }
  },

  _writeManifestFile: function(path, enableFormat) {
    var fs = require('fs');

    var data = JSON.stringify({
      baseUrl: '',
      resources: this._resources
    }, null, enableFormat ? 2 : 0);

    fs.writeFileSync(path, data);
  }
};

function printHelp() {
  var name = require('path').basename(process.argv[1]);
  console.log('node ' + name + ' [--format] rootDir');
}

var rootDir = null;
var enableFormat = false;

// parse command line arguments
var argv = process.argv;
for (var i = 2; i < argv.length; i++) {
  switch (argv[i]) {
  case '--help':
    // fall through
  case '-h':
    printHelp();
    process.exit(0);
    break;
  case '--format':
    enableFormat = true;
    break;
  default:
    rootDir = argv[i];
    break;
  }
}

ManifestBuilder.build(rootDir, enableFormat);
