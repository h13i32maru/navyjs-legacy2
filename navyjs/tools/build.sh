#!/bin/bash

self_dir=$(cd $(dirname $0);pwd)
js_dir=$(dirname $self_dir)
root_dir=$(dirname $js_dir)

cd $root_dir/navyjs/

files="\
    src/wrap_text/header.txt\
    src/init.js\
    src/version.js\
    src/lib/class.js\
    src/lib/*.js\
    src/core/*.js\
    src/view/view.js\
    src/view/*.js\
    src/view_group/view_group.js\
    src/view_group/*.js\
    src/view_screen/*.js\
    src/transition/transition.js\
    src/transition/*.js\
    src/gesture/gesture.js\
    src/gesture/*.js\
    src/wrap_text/footer.txt\
    "

rm -f build/navy.js build/navy.min.js
mkdir -p build
for file in $files
do
    if [ -f build/navy.js ]
    then
        grep "^// file: $file" build/navy.js > /dev/null 2>&1
        if [ $? -eq 0 ]
        then
            continue
        fi
    fi
    echo "$file"
    echo -e "\n// file: $file" >> build/navy.js
    cat ${file} >> build/navy.js
done

$root_dir/node_modules/.bin/uglifyjs build/navy.js --mangle --reserved '$super' --output build/navy.min.js
echo "build/navy.js"
echo "build/navy.min.js"

mkdir -p $root_dir/creator/src/resource/template/contents/navy
cp build/navy* $root_dir/creator/src/resource/template/contents/navy/
