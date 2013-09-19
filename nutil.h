#ifndef NUTIL_H
#define NUTIL_H

#include <QStringList>

class NUtil
{
public:
    NUtil();
    static void expand(QStringList &list, int size);
    static bool copyDir(const QString &srcPath, const QString &dstPath);
};

#endif // NUTIL_H
