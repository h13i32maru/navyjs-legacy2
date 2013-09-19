#include "nutil.h"
#include <QDir>
#include <QFile>
#include <QDebug>

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

