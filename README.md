# NavyJS & NavyCreator
- モバイル向けのWebアプリケーションフレームワーク & IDE
- http://navyjs.org/

## NavyJSのビルド & テスト [![Build Status](https://travis-ci.org/h13i32maru/navyjs.png?branch=master)](https://travis-ci.org/h13i32maru/navyjs)

```sh
# リポジトリ直下に移動して作業を行う.
cd /path/to/navyjs

# 必要なnode_modulesをインストールする.
npm install

# ビルドコマンドを実行
./navyjs/tools/build.sh

# ビルド完了
ls ./navyjs/build

# テスト開始
./navyjs/spec/run.sh
```

## NavyCreatorのビルド
- Qt Creatorをインストール
  - http://qt-project.org/downloads
  - Qt 5.2.1以上, Qt Creator 3.0.1以上
- ``creator/src/navy-creator.pro``をQt Creatorで開く
- ビルド -> 実行
