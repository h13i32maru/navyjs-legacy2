#!/usr/bin/env node

var QResourceBuilder = {
  _filePaths: [],
  _ignoreDirNames: ['creator', 'navy'],

  build: function(rootDir) {
    var fs = require('fs');
    var projectDirs = fs.readdirSync(rootDir);

    // サンプルアプリのディレクトリを読み取る.
    for (var i = 0; i < projectDirs.length; i++) {
      var path = rootDir + '/' + projectDirs[i];
      var stat = fs.statSync(path);
      if (stat.isDirectory()) {
        this._readProjectDir(path);
      }
    }

    this._cleanFilePaths(require('path').dirname(rootDir), this._filePaths);
    var xml = this._createXML(this._filePaths);
    return xml;
  },

  _readProjectDir: function(projectDir) {
    this._filePaths.push(projectDir + '/project.ncproject');
    this._filePaths.push(projectDir + '/contents/manifest.json');

    var fs = require('fs');
    var contentsDir = projectDir + '/contents';
    var files = fs.readdirSync(contentsDir);
    for (var i = 0; i < files.length; i++) {
      // 特定のディレクトリは読み込まない.
      if (this._ignoreDirNames.indexOf(files[i]) != -1) {
        continue;
      }

      // ディレクトリの中身を再帰的に走査する.
      var path = contentsDir + '/' + files[i];
      var stat = fs.statSync(path);
      if (stat.isDirectory()) {
        this._recursiveRead(path);
      }
    }
  },

  _recursiveRead: function(dirPath) {
    var fs = require('fs');
    var files = fs.readdirSync(dirPath);
    for (var i = 0; i < files.length; i++) {
      var path = dirPath + '/' + files[i];
      var stat = fs.statSync(path);
      if (stat.isDirectory()) {
        this._recursiveRead(path);
      } else {
        this._filePaths.push(path);
      }
    }
  },

  _cleanFilePaths: function(rootDir, filePaths) {
    var regexp = new RegExp('^' + rootDir + '/+');
    for (var i = 0; i < filePaths.length; i++) {
      filePaths[i] = filePaths[i].replace(regexp, '').replace(/\/+/, '/');
    }
  },

  _createXML: function(filePaths) {
    var nodes = [];
    for (var i = 0; i < filePaths.length; i++) {
      nodes.push('<file>' + filePaths[i] + '</file>');
    }

    var xml = '<RCC><qresource prefix="/">\n' + nodes.join('\n') + '\n</qresource></RCC>';
    return xml;
  }
};

function printHelp() {
  var name = require('path').basename(process.argv[1]);
  console.log(name + ' repo/creator/src/resource/sample');
}

var rootDir = null;

// parse command line arguments
var argv = process.argv;
for (var i = 2; i < argv.length; i++) {
  switch (argv[i]) {
  case '--help':
    // fall down
  case '-h':
    printHelp();
    process.exit(0);
    break;
  default:
    rootDir = argv[i];
    break;
  }
}

var xml = QResourceBuilder.build(rootDir);
console.log(xml);

