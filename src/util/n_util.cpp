#include "n_util.h"
#include <QDir>
#include <QFile>
#include <QDebug>
#include <QMessageBox>
#include <QFileSystemModel>

NUtil::NUtil()
{
}

/**
 * リストのサイズを指定したサイズに拡張する.
 * @param list 対象のリスト.
 * @param size 拡張するサイズ.
 */
void NUtil::expand(QStringList &list, int size) {
    int s = size - list.size();
    if (s <= 0) {
        return;
    }

    for (int i = 0; i < s; i++) {
        list.append("");
    }
}

/**
 * widgetの子要素を再帰的に取得する.
 * @param widget 対象のwidget.
 * @return 子要素のリスト.
 */
QWidgetList NUtil::recursiveWidgetChildren(const QWidget *widget) {
    QObjectList tmp = widget->children();
    QWidgetList list;
    for (int i = 0; i < tmp.length(); i++) {
        if (tmp[i]->isWidgetType()) {
            QWidget *w = (QWidget *)tmp[i];
            list.append(w);
            list.append(recursiveWidgetChildren(w));
        }
    }

    return list;
}

/**
 * @obsolete
 */
QString NUtil::selectedPath(QTreeView *treeView) {
    QFileSystemModel *model = (QFileSystemModel *)treeView->model();
    QModelIndex index = treeView->currentIndex();
    return model->filePath(index);
}

/**
 * ファイルのパスを生成する
 */
QString NUtil::createFilePath(const QString &parentPath, QString fileName, const QString &ext) {
    if (fileName.isEmpty()){
        return "";
    }

    if (fileName.contains(QDir::separator())) {
        QMessageBox::critical(NULL, tr("file name error"), tr("contains directory separator.") + "\n" + fileName);
        return "";
    }

    if (!ext.isEmpty() && QFileInfo(fileName).suffix() != ext) {
        fileName += "." + ext;
    }

    QFileInfo parentInfo(parentPath);
    QDir parentDir;
    if (parentInfo.isDir()) {
        parentDir.setPath(parentPath);
    } else {
        parentDir.setPath(parentInfo.dir().absolutePath());
    }

    QString filePath = parentDir.absoluteFilePath(fileName);

    return filePath;
}

/**
 * 指定されたパスにファイルを作成する
 * @param parentPath ファイルを作成するパス. ファイルのパスを指定した場合はそのファイルと同じディレクトリにファイルを作成する.
 * @param fileName 作成するファイルの名前
 * @param ext 拡張子を必ず指定したものにしたい場合に指定する.(例えば"js"を指定すればfileNameの末尾が".js"でなければかならず".js"をつけてファイルを作成する)
 * @return ファイルの作成に成功した場合はそのファイルのパス. 失敗した場合は空文字.
 */
QString NUtil::newFile(const QString &parentPath, QString fileName, const QString &ext) {
    if (fileName.isEmpty()){
        return "";
    }

    if (fileName.contains(QDir::separator())) {
        QMessageBox::critical(NULL, tr("file name error"), tr("contains directory separator.") + "\n" + fileName);
        return "";
    }

    if (!ext.isEmpty() && QFileInfo(fileName).suffix() != ext) {
        fileName += "." + ext;
    }

    QFileInfo parentInfo(parentPath);
    QDir parentDir;
    if (parentInfo.isDir()) {
        parentDir.setPath(parentPath);
    } else {
        parentDir.setPath(parentInfo.dir().absolutePath());
    }

    QString filePath = parentDir.absoluteFilePath(fileName);

    if (QFile::exists(filePath)) {
        QMessageBox::critical(NULL, tr("file exists"), tr("file exits.") + "\n" + filePath);
        return "";
    }

    QFile file(filePath);
    if (!file.open(QFile::WriteOnly | QFile::Text)) {
        qDebug() << "fail file open. " + filePath;
        return "";
    }

    return filePath;
}

/**
 * 指定したディレクトリを作成する.
 * @param parentPath ディレクトリを作成するパス. ファイルのパスを指定した場合はそのファイルと同じディレクトリにディレクトリを作成する.
 * @param dirName 作成するディレクトリの名前
 * @return ディレクトリの作成に成功した場合はそのディレクトリのパス. 失敗した場合は空文字.
 */
QString NUtil::newDir(const QString &parentPath, const QString &dirName) {
    if (dirName.isEmpty()) {
        return "";
    }

    if (dirName.contains(QDir::separator())) {
        QMessageBox::critical(NULL, tr("directory name error"), tr("contains directory separator.\n") + dirName);
        return "";
    }

    QFileInfo parentInfo(parentPath);
    QDir parentDir;
    if (parentInfo.isDir()) {
        parentDir.setPath(parentPath);
    } else {
        parentDir.setPath(parentInfo.dir().absolutePath());
    }

    QString dirPath = parentDir.absoluteFilePath(dirName);

    if (QFile::exists(dirPath)) {
        QMessageBox::critical(NULL, tr("directory exists"), tr("directory exits.") + "\n" + dirPath);
        return "";
    }

    bool ret =  parentDir.mkdir(dirName);
    return ret ? dirPath : "";
}

/**
 * 指定したパスに指定したファイルをインポートする.
 * @param parentPath ファイルをインポートするパス. ファイルのパスを指定した場合はそのファイルと同じディレクトリにファイルを作成する.
 * @param filePath インポート対象のファイルパス.
 * @return インポートに成功したらインポート後のファイルパス. 失敗した場合は空文字.
 */
QString NUtil::importFile(const QString &parentPath, const QString &filePath) {
    if (filePath.isEmpty()) {
        return "";
    }

    QFileInfo parentInfo(parentPath);
    QDir parentDir(parentPath);
    if (parentInfo.isFile()) {
        parentDir = parentInfo.dir();
    }

    QString dstName = QFileInfo(filePath).fileName();
    QString dstPath = parentDir.absoluteFilePath(dstName);
    QFileInfo dstInfo(dstPath);

    if (dstInfo.exists()) {
        QMessageBox::critical(NULL, tr("file exists"), tr("file exits.") + "\n" + dstPath);
        return "";
    }

    bool ret = QFile::copy(filePath, dstPath);
    if (ret) {
        return dstPath;
    } else {
        QMessageBox::critical(NULL, tr("fail import"), tr("fail import.") + "\n" + dstPath);
        return "";
    }
}

/**
 * ファイル、ディレクトリを削除する.
 * @param path 削除対象のパス. ディレクトリ、ファイルのどちらを指定することもできる.
 * @return 削除に成功したらtrue.
 */
bool NUtil::deletePath(const QString &path) {
    int ret = QMessageBox::question(NULL, tr("delete file"), tr("do you delete this file?") + "\n" + path);
    if (ret != QMessageBox::Yes) {
        return false;
    }

    QFileInfo pathInfo(path);
    if (pathInfo.isDir()) {
        return QDir(path).removeRecursively();
    } else {
        return QFile(path).remove();
    }
}

/**
 * 指定したファイル、ディレクトリの名前を変更する. 変更されたファイルは元と同じディレクトリに保存される.
 * @param srcPath 変更対象のパス. ファイル、ディレクトリのどちらも指定することができる.
 * @param newName 変更後のファイル名.
 * @param ext newNameがext拡張子で終わっていなければextを拡張子としてつける.
 * @return 名前変更に成功したら成功後のパス. 失敗したら空文字.
 */
QString NUtil::renamePath(const QString &srcPath, QString newName, const QString &ext) {
    if (newName.isEmpty()) {
        return "";
    }

    if (newName.contains(QDir::separator())) {
        QMessageBox::critical(NULL, tr("new name error"), tr("contains directory separator.") + "\n" + newName);
        return "";
    }

    QFileInfo srcInfo(srcPath);
    QDir parentDir = srcInfo.dir();
    if (srcInfo.isFile()) {
        if (!ext.isEmpty() && QFileInfo(newName).suffix() != ext) {
            newName += "." + ext;
        }
    }

    QString newPath = parentDir.absoluteFilePath(newName);
    if (QFile::exists(newPath)) {
        QMessageBox::critical(NULL, tr("file exists"), tr("file exits.") + "\n" + newPath);
        return "";
    }

    bool ret = parentDir.rename(srcInfo.fileName(), newName);
    return ret ? parentDir.absoluteFilePath(newName) : "";
}

/**
 * 指定したファイル、ディレクトリのコピーする. コピーされたファイルは元と同じディレクトリに保存される.
 * @param srcPath コピー対象のパス. ファイル、ディレクトリのどちらも指定することができる.
 * @param newName コピー先の名前.
 * @param ext newNameがext拡張子で終わっていなければextを拡張子としてつける.
 * @return コピーに成功したら成功後のパス. 失敗したら空文字.
 */
QString NUtil::copyPath(const QString &srcPath, QString newName, const QString &ext) {
    if (newName.isEmpty()) {
        return "";
    }

    if (newName.contains(QDir::separator())) {
        QMessageBox::critical(NULL, tr("copy name error"), tr("contains directory separator.") + "\n" + newName);
        return "";
    }

    QFileInfo srcInfo(srcPath);
    QDir parentDir = srcInfo.dir();

    if (srcInfo.isFile()) {
        if (!ext.isEmpty() && QFileInfo(newName).suffix() != ext) {
            newName += "." + ext;
        }
    }

    QString newPath = parentDir.absoluteFilePath(newName);
    if (QFile::exists(newPath)) {
        QMessageBox::critical(NULL, tr("file exists"), tr("file exits.") + "\n" + newPath);
        return "";
    }

    if (srcInfo.isDir()) {
        bool ret = copyDir(srcPath, newPath);
        return ret ? newPath : "";
    } else {
        bool ret = QFile::copy(srcPath, newPath);
        return ret ? newPath : "";
    }
}

/**
 * 指定したディレクトリを再帰的にコピーする.
 * @param srcPath コピー元のディレクトリパス.
 * @param dstPath コピー先のディレクトリパス.
 * @return 成功したらtrue.
 */
bool NUtil::copyDir(const QString &srcPath, const QString &dstPath)
{
    QDir parentDstDir(QFileInfo(dstPath).path());
    if (!parentDstDir.mkdir(QFileInfo(dstPath).fileName()))
        return false;

    QDir srcDir(srcPath);
    foreach(const QFileInfo &info, srcDir.entryInfoList(QDir::Dirs | QDir::Files | QDir::NoDotAndDotDot)) {
        QString srcItemPath = srcPath + "/" + info.fileName();
        QString dstItemPath = dstPath + "/" + info.fileName();
        if (info.isDir()) {
            if (!copyDir(srcItemPath, dstItemPath)) {
                return false;
            }
        } else if (info.isFile()) {
            if (!QFile::copy(srcItemPath, dstItemPath)) {
                return false;
            }
            QFile::setPermissions(dstItemPath, QFile::WriteOwner | QFile::permissions(dstItemPath));
        } else {
            qDebug() << "Unhandled item" << info.filePath() << "in cpDir";
        }
    }
    return true;
}

/**
 * ディレクトリ内のエントリ(ファイル、ディレクトリ)を再帰的に取得する.
 * @param dirPath 対象のディレクトリパス.
 * @param root 取得したエントリの先頭ディレクトリを指定する.
 * @return エントリリスト.
 */
QStringList NUtil::recursiveEntryList(const QString &dirPath, const QString &root) {
    QDir dir(dirPath);
    dir.setFilter(QDir::NoDotAndDotDot | QDir::AllEntries);
    QStringList list = dir.entryList();
    QStringList tmp;
    for (int i = 0; i < list.length(); i++) {
        QFileInfo info(dir.absoluteFilePath(list[i]));
        list[i] = root + list[i];
        if (info.isDir()) {
            tmp.append(recursiveEntryList(info.filePath(), root + info.fileName() + "/"));
         }
    }
    list.append(tmp);
    return list;
}

/**
 * テンプレートからファイルを作成する.
 * @param templateFilePath テンプレートファイルのパス.
 * @param distFilePath 作成先のファイルパス.
 * @param replaceMap テンプレート内で置き換える文字の名前と値のマップ.
 * @return 作成に成功したらtrue.
 */
bool NUtil::createFileFromTemplate(const QString &templateFilePath, const QString &distFilePath, const QMap<QString, QString> &replaceMap) {
    QFile templateFile(templateFilePath);
    if (!templateFile.open(QFile::ReadOnly | QFile::Text)){
        return false;
    }
    QString templateStr = templateFile.readAll();

    foreach (const QString &key, replaceMap.keys()) {
        templateStr.replace(key, replaceMap[key]);
    }

    QFile file(distFilePath);
    QDir::root().mkpath(QFileInfo(distFilePath).dir().absolutePath());
    if (!file.open(QFile::WriteOnly | QFile::Text)) {
        return false;
    }
    file.write(templateStr.toUtf8());

    return true;
}

/**
 * テンプレートからファイルを作成する.
 * @param templateFilePath テンプレートファイルのパス.
 * @param distFilePath 作成先のファイルパス.
 * @return 作成に成功したらtrue.
 */
bool NUtil::createFileFromTemplate(const QString &templateFilePath, const QString &distFilePath) {
    QMap<QString, QString> empty;
    return createFileFromTemplate(templateFilePath, distFilePath, empty);
}
