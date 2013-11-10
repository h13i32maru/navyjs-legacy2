#!/bin/bash

self_dir=$(cd $(dirname $0);pwd)
js_dir=$(dirname $self_dir)
root_dir=$(dirname $js_dir)

$root_dir/navyjs/tools/build.sh

$root_dir/node_modules/.bin/buster-server &
server_pid=$!
sleep 1

$root_dir/node_modules/.bin/phantomjs $root_dir/node_modules/buster/script/phantom.js http://localhost:1111/capture &
phantom_pid=$!
sleep 1

$root_dir/node_modules/.bin/buster-test -c $root_dir/navyjs/test/buster.js
status=$?

kill $phantom_pid
kill $server_pid

exit $status
