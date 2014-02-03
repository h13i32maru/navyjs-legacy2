#!/bin/bash

self_dir=$(cd $(dirname $0);pwd)
js_dir=$(dirname $self_dir)
root_dir=$(dirname $js_dir)

$root_dir/navyjs/tools/build.sh

$root_dir/node_modules/karma/bin/karma start $root_dir/navyjs/spec/karma.conf.js
status=$?

exit $status
