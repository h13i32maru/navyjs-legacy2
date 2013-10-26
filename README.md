# NavyJS
- モバイルWebアプリケーションフレームワーク
- ビルド方法
  - uglifyjsをインストール ``npm install -g uglifyjs``
  - uglifyjsのパスを通す ``export PATH=/usr/local/share/npm/bin/:$PATH``
  - ビルドコマンドを実行 ``./navyjs/tools/build.sh``
  - ビルド完了 ``ls ./navyjs/build``
- テスト方法
  - 事前にNavyJSをビルドしておく
  - busterをインストール ``npm install -g buster``
  - phantomjsをインストール ``npm install -g phantomjs``
  - buster-serverを起動 ``buster-server``
  - phantomjsをbuster-serverに接続 ``phantomjs /usr/local/share/npm/lib/node_modules/buster/script/phantom.js http://localhost:1111/capture``
  - buster-testを開始 ``buster-test -c navyjs/test/buster.js``

# NavyCreator
- NavyJSを使ってアプリケーションを作成するための開発環境
- ビルド方法
  - Qt Creatorをインストール
      - http://qt-project.org/downloads
      - Qt 5.1.1以上, Qt Creator 2.8.1以上
  - ``creator/src/navy-creator.pro``をQt Creatorで開く
  - ビルド -> 実行
