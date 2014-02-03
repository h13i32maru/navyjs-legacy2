#!/bin/bash

self_dir=$(cd $(dirname $0);pwd)
js_dir=$(dirname $self_dir)
root_dir=$(dirname $js_dir)

cd $root_dir/node_modules/karma-jasmine/
mv lib lib_1.0
mkdir lib
cd lib
wget https://raw.github.com/r-park/karma-jasmine2-test/master/lib/adapter.js
wget https://raw.github.com/r-park/karma-jasmine2-test/master/lib/boot.js
wget https://raw.github.com/r-park/karma-jasmine2-test/master/lib/index.js
wget https://raw.github.com/r-park/karma-jasmine2-test/master/lib/jasmine.js
