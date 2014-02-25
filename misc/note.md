# Mac OSXアプリのアイコンの作り方
- ディレクトリ``myapp.iconset``を作る
- 複数サイズのiconをディレクトリに保存
    - icon_512x512.png
    - icon_512x512@2x.png
    - など
- ``iconutil -c icns myapp.iconset``を実行
- 完成

# Qtで作ったアプリにアイコンを設定する
- resource/nc.iconsを作成する
- resource/info.plistのひな形を用意する
- Qtのプロジェクトファイル``navy-creator.pro``に二行追加する
    - ICON = resource/nc.icns
    - QMAKE_INFO_PLIST = resource/info.plist
- ビルドして完成
- 参考
    - 現在QtCreatorではinfo.plistが作られないバグが有る。
    - 通常はICONを設定すれば良いだけだが、QMAKE_INFO_PLISTも設定しないとアイコンが設定されない
    - http://qt-project.org/doc/qt-5/appicon.html#setting-the-application-icon-on-mac-os-x
    - http://qt-project.org/forums/viewthread/24811/

# Qtで作ったアプリのdmg形式にして配布する
- Releaseモードでビルドする
- Framework、Pluginのコピーとリンク先を変更する
    - ``~/Qt5.2.1/5.2.1/clang_64/bin/macdeployqt build/5.2.1-release/NavyCreator.app``
- dmgようのディレクトリを作成して必要な物をコピーする
    - mkdir NavyCreator
    - cp build/5.2.1-relase/NavyCreator.app NavyCreator/
    - ln -s /Applications NavyCreator/
- dmgを作成する
    - hdiutil create -srcfolder NavyCreator -fs HFS+ -volname NavyCreator NavyCreator-0.0.1.dmg
- 参考
    - http://mattintosh.blog.so-net.ne.jp/2012-11-24
    - http://qt-project.org/doc/qt-5/macosx-deployment.html#the-mac-deployment-tool
    - http://qz.tsugumi.org/usage_hdiutil.html#l10
    - http://digital-sushi.org/entry/how-to-create-a-disk-image-installer-for-apple-mac-os-x/

# バージョンアップ時の手順
- jsのバージョンを編集
    - navyjs/src/version.js
    - creator/src/resource/misc/version.js
- creatorのバージョンを編集
    - creator/src/resource/info.plist
    - creator/src/window/n_about_dialog.cpp
- ビルドして完成
