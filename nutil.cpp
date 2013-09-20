#include "nutil.h"
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

bool NUtil::newFile(const QString &parentPath, QString fileName, const QString &ext) {
    if (fileName.isEmpty()){
        return false;
    }

    if (fileName.contains(QDir::separator())) {
        QMessageBox::critical(NULL, tr("file name error"), tr("contains directory separator.") + "\n" + fileName);
        return false;
    }

    if (!ext.isEmpty() && fileName.lastIndexOf(ext) == -1) {
        fileName += ext;
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
        return false;
    }

    QFile file(filePath);
    if (!file.open(QFile::WriteOnly | QFile::Text)) {
        qDebug() << "fail file open. " + filePath;
        return false;
    }

    return true;
}

bool NUtil::newDir(const QString &parentPath, const QString &dirName) {
    if (dirName.isEmpty()) {
        return false;
    }

    if (dirName.contains(QDir::separator())) {
        QMessageBox::critical(NULL, tr("directory name error"), tr("contains directory separator.\n") + dirName);
        return false;
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
        return false;
    }

    return parentDir.mkdir(dirName);
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

bool NUtil::renamePath(const QString &srcPath, QString newName, const QString &ext) {
    if (newName.isEmpty()) {
        return false;
    }

    if (newName.contains(QDir::separator())) {
        QMessageBox::critical(NULL, tr("new name error"), tr("contains directory separator.") + "\n" + newName);
        return false;
    }

    QFileInfo srcInfo(srcPath);
    QDir parentDir = srcInfo.dir();
    if (srcInfo.isFile()) {
        if (!ext.isEmpty() && newName.lastIndexOf(ext) == -1) {
            newName += ext;
        }
    }

    QString newPath = parentDir.absoluteFilePath(newName);
    if (QFile::exists(newPath)) {
        QMessageBox::critical(NULL, tr("file exists"), tr("file exits.") + "\n" + newPath);
        return false;
    }

    return parentDir.rename(srcInfo.fileName(), newName);
}

bool NUtil::copyPath(const QString &srcPath, QString newName, const QString &ext) {
    if (newName.isEmpty()) {
        return false;
    }

    if (newName.contains(QDir::separator())) {
        QMessageBox::critical(NULL, tr("copy name error"), tr("contains directory separator.") + "\n" + newName);
        return false;
    }

    QFileInfo srcInfo(srcPath);
    QDir parentDir = srcInfo.dir();

    if (srcInfo.isFile()) {
        if (!ext.isEmpty() && newName.lastIndexOf(ext) == -1) {
            newName += ext;
        }
    }

    QString newPath = parentDir.absoluteFilePath(newName);
    if (QFile::exists(newPath)) {
        QMessageBox::critical(NULL, tr("file exists"), tr("file exits.") + "\n" + newPath);
        return false;
    }

    if (srcInfo.isDir()) {
        return copyDir(srcPath, newPath);
    } else {
        return QFile::copy(srcPath, newPath);
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

