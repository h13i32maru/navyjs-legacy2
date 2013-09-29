#include "n_util.h"
#include <QDir>
#include <QFile>
#include <QDebug>
#include <QMessageBox>
#include <QFileSystemModel>

NUtil::NUtil()
{
}

void NUtil::expand(QStringList &list, int size) {
    int s = size - list.size();
    if (s <= 0) {
        return;
    }

    for (int i = 0; i < s; i++) {
        list.append("");
    }
}

QString NUtil::selectedPath(QTreeView *treeView) {
    QFileSystemModel *model = (QFileSystemModel *)treeView->model();
    QModelIndex index = treeView->currentIndex();
    return model->filePath(index);
}

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

QStringList NUtil::recursiveEntryList(const QString &dirPath, const QString &root) {
    QDir dir(dirPath);
    dir.setFilter(QDir::NoDotAndDotDot | QDir::AllEntries);
    QStringList list = dir.entryList();
    for (int i = 0; i < list.length(); i++) {
        QFileInfo info(dir.absoluteFilePath(list[i]));
        list[i] = root + list[i];
        if (info.isDir()) {
            list.append(recursiveEntryList(info.filePath(), root + info.fileName() + "/"));
         }
    }
    return list;
}
