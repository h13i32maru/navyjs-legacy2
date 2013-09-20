#ifndef NUTIL_H
#define NUTIL_H

#include <QStringList>
#include <QTreeView>

class NUtil
{
public:
    NUtil();
    static void expand(QStringList &list, int size);
    static QString tr(const char *s) { return QObject::tr(s); }

    // file util
    static QString selectedPath(QTreeView *treeView);
    static QString newFile(const QString &parentPath, QString fileName, const QString &ext = "");
    static QString newDir(const QString &parentPath, const QString &dirName);
    static bool deletePath(const QString &path);
    static QString renamePath(const QString &srcPath, QString newName, const QString &ext = "");
    static QString copyPath(const QString &srcPath, QString newName, const QString &ext = "");
    static bool copyDir(const QString &srcPath, const QString &dstPath);
};

#endif // NUTIL_H
