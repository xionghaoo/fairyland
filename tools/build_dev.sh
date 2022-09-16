#!/bin/bash

echo "测试环境打包"

# 参数说明：
# $1: 文件
# $2: key
# $3: value regex
# $4: newValue
update_line() {
  echo "update $2"
  content=$(cat $1)
  re="$2 = '($3)'"
  if [[ ${content} =~ $re ]]; then
    last_value=${BASH_REMATCH[1]}
  fi
  cat $1 | sed -e "s/$2 = '${last_value}'/$2 = '$4'/" > tmp
  cat tmp > $1
}

update_line ../vue.config.js "process.env.NODE_ENV" "[a-z]+" "development"

rm ./tmp

cd ../
npm run dist