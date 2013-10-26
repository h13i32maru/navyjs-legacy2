# NavyJS
- モバイルWebアプリケーションフレームワーク
- ビルド方法
  - uglifyjsをインストール
      - https://github.com/mishoo/UglifyJS2
      - uglifyjsのパスを通す
  - 以下のコマンドを実行

```sh
./navyjs/tools/build.sh
ls navyjs/build/
```

# NavyCreator
- NavyJSを使ってアプリケーションを作成するための開発環境
- ビルド方法
  - Qt Creatorをインストール
      - http://qt-project.org/downloads
      - Qt 5.1.1以上, Qt Creator 2.8.1以上
  - ``creator/src/navy-creator.pro``をQt Creatorで開く
  - ビルド -> 実行
