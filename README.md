# NavyJS [![Build Status](https://travis-ci.org/h13i32maru/navyjs.png?branch=master)](https://travis-ci.org/h13i32maru/navyjs)
モバイルWebアプリケーション用のフレームワーク。以下の機能を提供することを目指しています。
- レイアウト
  - JSONで記述されたレイアウトファイルから動的にHTMLを生成
  - レイアウトファイルにはNavyJSが提供するView(テキスト、ボタン、リストなど)の座標やサイズを記述
  - ユーザ定義のViewを組み込むプラグインの仕組み
- 画面管理
  - シングルURLアプリケーション
  - 画面スタックはページとシーンによって管理
  - 画面遷移時のデータ送受信
- 動的データバインディグ
  - データとViewの間で双方向の動的データバインディングを提供
- Webインストール
  - JavaScriptファイル、レイアウトファイルをWebSQLDatabaseに保存して通信を抑制
  - WebSQLDatabaseに保存されたファイルの動的な更新

## NavyJSのビルド & テスト

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
./navyjs/test/run.sh
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
