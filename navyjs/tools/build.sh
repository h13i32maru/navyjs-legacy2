#!/bin/bash

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
    cat $file >> build/navy.js
done

uglifyjs build/navy.js --mangle --reserved '$super' --output build/navy.min.js
