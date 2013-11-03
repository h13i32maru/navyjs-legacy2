# NavyJS [![Build Status](https://travis-ci.org/h13i32maru/navyjs.png?branch=master)](https://travis-ci.org/h13i32maru/navyjs)
モバイルWebアプリケーション用のフレームワーク。以下の機能を提供することを目指しています。
- レイアウト
  - JSONで記述されたレイアウトファイルから動的にHTMLを生成
  - レイアウトファイルにはNavyJSが提供するView(テキスト、ボタン、リストなど)の座標やサイズを記述
  - ユーザ定義のViewを組み込みのViewと同じように扱える
- 画面管理
  - シングルURLアプリケーション
  - 画面スタックはページとシーンによって管理
  - 画面遷移時のデータ送受信
- 動的データバインディグ
  - データとViewの間で双方向の動的データバインディングを提供
- Webインストール
  - JavaScriptファイル、レイアウトファイルをWebDBに保存して通信を抑制
  - WebDBに保存されたファイルの動的な更新

## NavyJSのビルド

```sh
# uglifyjsをインストール
npm install -g uglify-js

# uglifyjsのパスを通す
export PATH=/path/to/npm/bin/:$PATH

# ビルドコマンドを実行
./navyjs/tools/build.sh

# ビルド完了
ls ./navyjs/build
```

## NavyJSのテスト
```sh
# 事前にNavyJSをビルドしておく

# busterをインストール
npm install -g buster

# phantomjsをインストール
npm install -g phantomjs

# buster-serverを起動
buster-server

# phantomjsをbuster-serverに接続
phantomjs /path/to/npm/lib/node_modules/buster/script/phantom.js http://localhost:1111/capture

# buster-testを開始
buster-test -c navyjs/test/buster.js
```

# NavyCreator
NavyJSを使用したアプリケーションを作成するための開発環境。以下の機能を提供することを目指しています(現在はMacのみ)
- プロジェクトの管理
  - NavyJSで作成するアプリケーションをプロジェクトとして管理
- レイアウト作成
  - GUIを使ったViewの配置で画面レイアウトを作成
- コードエディタ
  - 簡易的なJavaScriptコードエディタ
- 画像ビューワ
  - アプリケーションで使用する画像のビューワ
- アプリケーションの実行
  - Webサーバ無しにブラウザ(Google Chrome)だけを使ったアプリケーションの実行

## NavyCreatorのビルド
- Qt Creatorをインストール
  - http://qt-project.org/downloads
  - Qt 5.1.1以上, Qt Creator 2.8.1以上
- ``creator/src/navy-creator.pro``をQt Creatorで開く
- ビルド -> 実行
