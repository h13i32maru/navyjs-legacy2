var ManifestBuilder = {
  _assets: [],
  _ignoreDirNames: ['creator', 'navy'],

  build: function(rootDir, enableFormat) {
    var fs = require('fs');
    var files = fs.readdirSync(rootDir);

    for (var i = 0; i < files.length; i++) {
      if (this._ignoreDirNames.indexOf(files[i]) != -1) {
        continue;
      }

      var path = rootDir + '/' + files[i];
      var stat = fs.statSync(path);
      if (stat.isDirectory()) {
        this._collectAssetsPath(path);
      }
    }

    this._generateAssetsMD5();
    this._formatAssetsPath(rootDir);
    this._writeManifestFile(rootDir + '/' + 'manifest.json', enableFormat);
  },

  _collectAssetsPath: function(dir) {
    var fs = require('fs');
    var files = fs.readdirSync(dir);
    for (var i = 0; i < files.length; i++) {
      var path = dir + '/' + files[i];
      var stat = fs.statSync(path);
      if (stat.isDirectory()) {
        this._collectAssetsPath(path);
      } else {
        this._assets.push({
          path: path
        });
      }
    }
  },

  _generateAssetsMD5: function() {
    var crypto = require('crypto');
    var fs = require('fs');
    var assets = this._assets;

    for (var i = 0; i < assets.length; i++) {
      var path = assets[i].path;
      var md5 = crypto.createHash('md5');
      md5.update(fs.readFileSync(path));
      assets[i].hash = md5.digest('hex');
    }
  },

  _formatAssetsPath: function(rootDir) {
    var assets = this._assets;
    var regexp = new RegExp('^' + rootDir + '/+');

    for (var i = 0; i < assets.length; i++) {
      assets[i].path = assets[i].path.replace(regexp, '');
    }
  },

  _writeManifestFile: function(path, enableFormat) {
    var fs = require('fs');

    var data = JSON.stringify({
      baseUrl: '',
      assets: this._assets
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
