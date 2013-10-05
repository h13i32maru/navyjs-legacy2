#ifndef N_UTIL_H
#define N_UTIL_H

#include <QStringList>
#include <QTreeView>
#include <QMap>

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
    static QString importFile(const QString &parentPath, const QString &filePath);
    static bool deletePath(const QString &path);
    static QString renamePath(const QString &srcPath, QString newName, const QString &ext = "");
    static QString copyPath(const QString &srcPath, QString newName, const QString &ext = "");
    static bool copyDir(const QString &srcPath, const QString &dstPath);
    static QStringList recursiveEntryList(const QString &dirPath, const QString &root);
    static bool createFileFromTemplate(const QString &templateFilePath, const QString &distFilePath, const QMap<QString, QString> &replaceMap);
    static bool createFileFromTemplate(const QString &templateFilePath, const QString &distFilePath);
};

#endif // N_UTIL_H
