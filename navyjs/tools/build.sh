#!/bin/bash

cd navyjs/

files="\
    src/wrap_text/header.txt\
    src/init.js\
    src/lib/*.js\
    src/core/*.js\
    src/view/view.js\
    src/view/*.js\
    src/view_group/view_group.js\
    src/view_group/*.js\
    src/view_screen/*.js\
    src/transition/transition.js\
    src/transition/*.js\
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

uglifyjs --version >/dev/null 2>&1
if [ $? -eq 0 ]
then
    uglifyjs_command="uglifyjs"
else
    # for travis ci
    uglifyjs_command="../node_modules/.bin/uglifyjs"
fi

${uglifyjs_command} build/navy.js --mangle --reserved '$super' --output build/navy.min.js
echo "build/navy.js"
echo "build/navy.min.js"
